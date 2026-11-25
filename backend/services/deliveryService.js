import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Wallet from '../models/Wallet.js';
import { settleOrderSplits, getOrCreateWallet } from './walletService.js';
import { applyStatusTimestamps } from '../utils/orderTimers.js';

/**
 * Get orders that are ready for pickup and not yet assigned to any rider
 */
export const getAvailableOrdersService = async () => {
  return await Order.find({
    status: 'Ready for Pickup',
    deliveryPersonId: null
  }).sort({ createdAt: -1 });
};

/**
 * Get active deliveries for a specific rider (assigned but not delivered)
 */
export const getMyActiveDeliveriesService = async (riderId) => {
  return await Order.find({
    deliveryPersonId: riderId,
    status: { $in: ['Out for Delivery'] }
  }).sort({ assignedAt: -1 });
};

/**
 * Get delivery history for a specific rider
 */
export const getMyDeliveryHistoryService = async (riderId) => {
  return await Order.find({
    deliveryPersonId: riderId,
    status: 'Delivered'
  }).sort({ deliveredAt: -1 });
};

/**
 * Rider accepts an available order
 */
export const acceptOrderService = async (orderId, rider) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw { statusCode: 404, message: 'Order not found' };
  }

  if (order.status !== 'Ready for Pickup') {
    throw { statusCode: 400, message: 'Order is not available for pickup' };
  }

  if (order.deliveryPersonId) {
    throw { statusCode: 400, message: 'Order is already assigned to another rider' };
  }

  order.deliveryPersonId = rider._id;
  order.deliveryPersonName = rider.name;
  order.status = 'Out for Delivery';
  order.assignedAt = new Date();

  await order.save();
  return order;
};

/**
 * Rider confirms pickup
 */
export const pickupOrderService = async (orderId, riderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw { statusCode: 404, message: 'Order not found' };
  }

  if (order.deliveryPersonId?.toString() !== riderId.toString()) {
    throw { statusCode: 403, message: 'This order is not assigned to you' };
  }

  order.pickedUpAt = new Date();
  await order.save();
  return order;
};

/**
 * Rider marks delivery as complete
 */
export const completeDeliveryService = async (orderId, riderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw { statusCode: 404, message: 'Order not found' };
  }

  if (order.deliveryPersonId?.toString() !== riderId.toString()) {
    throw { statusCode: 403, message: 'This order is not assigned to you' };
  }

  applyStatusTimestamps(order, 'Delivered');
  await order.save();

  // Perform automatic in-app wallet split settlement
  try {
    await settleOrderSplits(order._id);
  } catch (err) {
    console.error('Settlement error on completeDelivery:', err);
  }

  return order;
};

/**
 * Get delivery stats for a specific rider
 */
export const getDeliveryStatsService = async (riderId) => {
  const riderObjectId = mongoose.Types.ObjectId.isValid(riderId)
    ? new mongoose.Types.ObjectId(riderId.toString())
    : riderId;

  const totalDeliveries = await Order.countDocuments({
    deliveryPersonId: riderObjectId,
    status: 'Delivered'
  });

  const wallet = await getOrCreateWallet(riderId, 'delivery');

  const avgDeliveryAggregate = await Order.aggregate([
    {
      $match: {
        deliveryPersonId: riderObjectId,
        status: 'Delivered'
      }
    },
    {
      $group: {
        _id: null,
        avgDeliveryTime: {
          $avg: {
            $subtract: ['$deliveredAt', '$assignedAt']
          }
        }
      }
    }
  ]);

  // Today's deliveries
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDeliveries = await Order.countDocuments({
    deliveryPersonId: riderObjectId,
    status: 'Delivered',
    deliveredAt: { $gte: today }
  });

  const todayEarningsAggregate = await Order.aggregate([
    {
      $match: {
        deliveryPersonId: riderObjectId,
        status: 'Delivered',
        deliveredAt: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $gt: ['$settlement.deliveryPartnerAmount', 0] },
              '$settlement.deliveryPartnerAmount',
              {
                $cond: [
                  { $gt: ['$pricing.deliveryFee', 0] },
                  '$pricing.deliveryFee',
                  {
                    $cond: [
                      { $gt: ['$deliveryFee', 0] },
                      '$deliveryFee',
                      { $ifNull: ['$estimatedEarnings', 30] }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    }
  ]);

  return {
    totalDeliveries,
    totalEarnings: wallet.totalEarned || 0,
    balance: wallet.balance || 0,
    avgDeliveryTime: avgDeliveryAggregate[0]?.avgDeliveryTime
      ? Math.round(avgDeliveryAggregate[0].avgDeliveryTime / 60000) // Convert ms to minutes
      : 0,
    todayDeliveries,
    todayEarnings: todayEarningsAggregate[0]?.total || 0
  };
};
