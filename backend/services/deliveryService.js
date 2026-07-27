import Order from '../models/Order.js';

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

  order.status = 'Delivered';
  order.deliveredAt = new Date();
  await order.save();
  return order;
};

/**
 * Get delivery stats for a specific rider
 */
export const getDeliveryStatsService = async (riderId) => {
  const totalDeliveries = await Order.countDocuments({
    deliveryPersonId: riderId,
    status: 'Delivered'
  });

  const earnings = await Order.aggregate([
    {
      $match: {
        deliveryPersonId: riderId,
        status: 'Delivered'
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$totalAmount' },
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
    deliveryPersonId: riderId,
    status: 'Delivered',
    deliveredAt: { $gte: today }
  });

  const todayEarnings = await Order.aggregate([
    {
      $match: {
        deliveryPersonId: riderId,
        status: 'Delivered',
        deliveredAt: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]);

  // Delivery fee is ~15% of order total (simulated)
  const DELIVERY_FEE_PERCENT = 0.15;

  return {
    totalDeliveries,
    totalEarnings: Math.round((earnings[0]?.totalEarnings || 0) * DELIVERY_FEE_PERCENT),
    avgDeliveryTime: earnings[0]?.avgDeliveryTime
      ? Math.round(earnings[0].avgDeliveryTime / 60000) // Convert ms to minutes
      : 0,
    todayDeliveries,
    todayEarnings: Math.round((todayEarnings[0]?.total || 0) * DELIVERY_FEE_PERCENT)
  };
};
