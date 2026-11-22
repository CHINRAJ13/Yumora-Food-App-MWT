import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import PayoutRequest from '../models/PayoutRequest.js';
import { getOrCreateWallet, requestPayoutService, processPayoutService } from '../services/walletService.js';

/**
 * @desc    Get current user's wallet and transaction history
 * @route   GET /api/wallet/my-wallet
 * @access  Private (Restaurant / Delivery)
 */
export const getMyWallet = asyncHandler(async (req, res, next) => {
  const userType = req.userType;
  if (!userType || !['restaurant', 'delivery'].includes(userType)) {
    return next(new AppError('Wallet is only accessible for restaurants and delivery partners', 403));
  }

  const wallet = await getOrCreateWallet(req.user._id, userType);
  const transactions = await WalletTransaction.find({ walletId: wallet._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const pendingPayouts = await PayoutRequest.find({ walletId: wallet._id })
    .sort({ createdAt: -1 });

  sendResponse(res, 200, 'Wallet retrieved successfully', {
    wallet,
    transactions,
    pendingPayouts
  });
});

/**
 * @desc    Request withdrawal of funds from wallet
 * @route   POST /api/wallet/request-payout
 * @access  Private (Restaurant / Delivery)
 */
export const requestPayout = asyncHandler(async (req, res, next) => {
  const userType = req.userType;
  if (!userType || !['restaurant', 'delivery'].includes(userType)) {
    return next(new AppError('Payout requests are only allowed for restaurants and delivery partners', 403));
  }

  const { amount, bankDetails } = req.body;
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid payout amount', 400));
  }

  const payout = await requestPayoutService(req.user._id, userType, Number(amount), bankDetails);
  sendResponse(res, 201, 'Payout request submitted successfully', payout);
});

/**
 * @desc    Get all payout requests (Admin only)
 * @route   GET /api/wallet/admin/payouts
 * @access  Private (Admin)
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
 * @desc    Process payout request (Approve or Reject)
 * @route   PATCH /api/wallet/admin/payouts/:id
 * @access  Private (Admin)
 */
export const processPayout = asyncHandler(async (req, res, next) => {
  const { status, adminComment, transactionReference } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new AppError('Status must be either approved or rejected', 400));
  }

  const payout = await processPayoutService(req.params.id, status, adminComment, transactionReference);
  sendResponse(res, 200, `Payout request ${status}`, payout);
});
