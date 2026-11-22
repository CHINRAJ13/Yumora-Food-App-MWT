import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import Order from '../models/Order.js';
import PayoutRequest from '../models/PayoutRequest.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { processPayoutService } from '../services/walletService.js';

/**
 * @desc    Get aggregate financial overview metrics for admin
 * @route   GET /api/admin/payments/overview
 * @access  Private (Admin - monitor_payments)
 */
export const getPaymentOverview = asyncHandler(async (req, res, next) => {
  // 1. GMV & Revenue from Delivered orders
  const deliveredStats = await Order.aggregate([
    { $match: { status: 'Delivered' } },
    {
      $group: {
        _id: null,
        totalGMV: { $sum: '$totalAmount' },
        platformProfit: {
          $sum: {
            $ifNull: [
              '$settlement.platformProfit',
              {
                $add: [
                  5,
                  { $multiply: [{ $ifNull: ['$pricing.foodSubtotal', '$totalAmount'] }, 0.10] }
                ]
              }
            ]
          }
        },
        restaurantPayouts: {
          $sum: {
            $ifNull: [
              '$settlement.restaurantAmount',
              { $multiply: [{ $ifNull: ['$pricing.foodSubtotal', '$totalAmount'] }, 0.90] }
            ]
          }
        },
        deliveryPayouts: {
          $sum: {
            $ifNull: [
              '$settlement.deliveryPartnerAmount',
              { $ifNull: ['$pricing.deliveryFee', 30] }
            ]
          }
        }
      }
    }
  ]);

  // 2. All-time payment success & transaction counts
  const paymentStatusCounts = await Order.aggregate([
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  let successfulPayments = 0;
  let successfulPaymentsAmount = 0;
  let pendingPayments = 0;
  let failedPayments = 0;

  paymentStatusCounts.forEach((group) => {
    if (group._id === 'Success') {
      successfulPayments = group.count;
      successfulPaymentsAmount = group.totalAmount;
    } else if (group._id === 'Pending') {
      pendingPayments = group.count;
    } else if (group._id === 'Failed') {
      failedPayments = group.count;
    }
  });

  // 3. Refund aggregations
  const refundStats = await Order.aggregate([
    {
      $match: {
        $or: [
          { status: 'Cancelled' },
          { 'refund.status': { $in: ['processed', 'pending', 'failed'] } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalRefundedAmount: {
          $sum: {
            $cond: [
              { $eq: ['$refund.status', 'processed'] },
              { $ifNull: ['$refund.amount', '$totalAmount'] },
              0
            ]
          }
        },
        totalRefundsCount: { $sum: 1 },
        processedCount: {
          $sum: { $cond: [{ $eq: ['$refund.status', 'processed'] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$refund.status', 'pending'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$refund.status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);

  // 4. Payout requests aggregations
  const payoutStats = await PayoutRequest.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  let pendingPayoutAmount = 0;
  let pendingPayoutCount = 0;
  let approvedPayoutAmount = 0;
  let approvedPayoutCount = 0;

  payoutStats.forEach((p) => {
    if (p._id === 'pending') {
      pendingPayoutAmount = p.totalAmount;
      pendingPayoutCount = p.count;
    } else if (p._id === 'approved') {
      approvedPayoutAmount = p.totalAmount;
      approvedPayoutCount = p.count;
    }
  });

  const overview = {
    gmv: deliveredStats[0]?.totalGMV || 0,
    platformProfit: Math.round(deliveredStats[0]?.platformProfit || 0),
    restaurantPayouts: Math.round(deliveredStats[0]?.restaurantPayouts || 0),
    deliveryPayouts: Math.round(deliveredStats[0]?.deliveryPayouts || 0),
    successfulPayments,
    successfulPaymentsAmount,
    pendingPayments,
    failedPayments,
    refunds: {
      totalRefundedAmount: refundStats[0]?.totalRefundedAmount || 0,
      totalRefundsCount: refundStats[0]?.totalRefundsCount || 0,
      processedCount: refundStats[0]?.processedCount || 0,
      pendingCount: refundStats[0]?.pendingCount || 0,
      failedCount: refundStats[0]?.failedCount || 0
    },
    payouts: {
      pendingAmount: pendingPayoutAmount,
      pendingCount: pendingPayoutCount,
      approvedAmount: approvedPayoutAmount,
      approvedCount: approvedPayoutCount
    }
  };

  sendResponse(res, 200, 'Payment overview metrics retrieved', overview);
});

/**
 * @desc    Get paginated and searchable list of customer payment transactions
 * @route   GET /api/admin/payments/transactions
 * @access  Private (Admin - monitor_payments)
 */
export const getPaymentTransactions = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 25, search = '', paymentStatus, paymentMethod } = req.query;

  const query = {};

  if (paymentStatus && paymentStatus !== 'all') {
    query.paymentStatus = paymentStatus;
  }

  if (paymentMethod && paymentMethod !== 'all') {
    query.paymentMethod = paymentMethod;
  }

  if (search && search.trim()) {
    const s = search.trim();
    const regex = new RegExp(s, 'i');
    query.$or = [
      { paymentId: regex },
      { customerName: regex },
      { email: regex },
      { phone: regex },
      { restaurantName: regex }
    ];

    // If search is a valid Mongo ObjectId or hex substring
    if (/^[0-9a-fA-F]{24}$/.test(s)) {
      query.$or.push({ _id: s });
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .select('customerName email phone restaurantName totalAmount paymentMethod paymentId paymentStatus status pricing settlement refund createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query)
  ]);

  sendResponse(res, 200, 'Payment transactions retrieved', {
    transactions: orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  });
});

/**
 * @desc    Get all refunds and cancellations
 * @route   GET /api/admin/payments/refunds
 * @access  Private (Admin - monitor_payments)
 */
export const getPaymentRefunds = asyncHandler(async (req, res, next) => {
  const { status, search } = req.query;

  const query = {
    $or: [
      { status: 'Cancelled' },
      { 'refund.status': { $in: ['processed', 'pending', 'failed'] } }
    ]
  };

  if (status && status !== 'all') {
    query['refund.status'] = status;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$and = [
      {
        $or: [
          { 'refund.refundId': regex },
          { customerName: regex },
          { restaurantName: regex },
          { paymentId: regex }
        ]
      }
    ];
  }

  const refunds = await Order.find(query)
    .select('customerName email phone restaurantName totalAmount paymentId paymentStatus status cancellation refund createdAt')
    .sort({ 'cancellation.cancelledAt': -1, createdAt: -1 })
    .limit(100)
    .lean();

  sendResponse(res, 200, 'Refunds retrieved successfully', refunds);
});

/**
 * @desc    Get settlement splits for delivered orders
 * @route   GET /api/admin/payments/settlements
 * @access  Private (Admin - monitor_payments)
 */
export const getSettlementSplits = asyncHandler(async (req, res, next) => {
  const { search, limit = 50 } = req.query;

  const query = { status: 'Delivered' };

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { restaurantName: regex },
      { customerName: regex },
      { paymentId: regex }
    ];
  }

  const settlements = await Order.find(query)
    .select('restaurantName customerName totalAmount pricing settlement paymentId deliveryPersonName createdAt')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  sendResponse(res, 200, 'Order settlements retrieved', settlements);
});

/**
 * @desc    Get partner payout requests for admin
 * @route   GET /api/admin/payments/payouts
 * @access  Private (Admin - monitor_payments)
 */
export const getAdminPayouts = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const filter = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }

  const payouts = await PayoutRequest.find(filter).sort({ createdAt: -1 });
  sendResponse(res, 200, 'Payout requests retrieved', payouts);
});

/**
 * @desc    Process a partner payout request (Approve/Reject)
 * @route   PATCH /api/admin/payments/payouts/:id
 * @access  Private (Admin - monitor_payments)
 */
export const processAdminPayout = asyncHandler(async (req, res, next) => {
  const { status, adminComment, transactionReference } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new AppError('Status must be either approved or rejected', 400));
  }

  const payout = await processPayoutService(req.params.id, status, adminComment, transactionReference);
  sendResponse(res, 200, `Payout request marked as ${status}`, payout);
});
