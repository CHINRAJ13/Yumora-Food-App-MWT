import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { applyStatusTimestamps } from '../utils/orderTimers.js';

/**
 * Get the restaurant linked to the current user
 */
export const getMyRestaurant = async (userId) => {
  const restaurant = await Restaurant.findOne({ ownerId: userId });
  if (!restaurant) {
    throw new Error('No restaurant linked to this account');
  }
  return restaurant;
};

/**
 * Get orders for a specific restaurant (with support for 'active', 'history', or exact status)
 */
export const getRestaurantOrders = async (restaurantId, status) => {
  const filter = { restaurantId };
  if (status === 'history') {
    filter.status = { $in: ['Delivered', 'Cancelled'] };
  } else if (status === 'active') {
    filter.status = { $in: ['Placed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'] };
  } else if (status && status !== 'all') {
    filter.status = status;
  }
  return await Order.find(filter).sort({ createdAt: -1 });
};

/**
 * Get active (non-completed) orders for a restaurant
 */
export const getActiveOrders = async (restaurantId) => {
  return await Order.find({
    restaurantId,
    status: { $in: ['Placed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'] }
  }).sort({ createdAt: -1 });
};

/**
 * Update order status (restaurant can only do: Preparing, Ready for Pickup, Cancelled)
 */
export const updateOrderByRestaurant = async (orderId, restaurantId, newStatus) => {
  const allowedStatuses = ['Preparing', 'Ready for Pickup', 'Cancelled'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Restaurant can only set status to: ${allowedStatuses.join(', ')}`);
  }

  const order = await Order.findOne({ _id: orderId, restaurantId });
  if (!order) {
    throw new Error('Order not found or does not belong to this restaurant');
  }

  applyStatusTimestamps(order, newStatus);
  await order.save();
  return order;
};

/**
 * Get restaurant revenue & stats
 */
export const getRestaurantStats = async (restaurantId) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total stats
  const totalOrders = await Order.countDocuments({ restaurantId });
  const deliveredOrders = await Order.countDocuments({ restaurantId, status: 'Delivered' });
  const cancelledOrders = await Order.countDocuments({ restaurantId, status: 'Cancelled' });
  const activeOrders = await Order.countDocuments({
    restaurantId,
    status: { $in: ['Placed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'] }
  });

  // Revenue aggregations (Net Restaurant Share: Food + Packing - Commission)
  const restaurantShareExpr = {
    $ifNull: [
      '$settlement.restaurantAmount',
      {
        $subtract: [
          { $add: [{ $ifNull: ['$pricing.foodSubtotal', '$totalAmount'] }, { $ifNull: ['$pricing.packagingFee', 0] }] },
          { $multiply: [{ $ifNull: ['$pricing.foodSubtotal', '$totalAmount'] }, 0.10] }
        ]
      }
    ]
  };

  const totalRevenue = await Order.aggregate([
    { $match: { restaurantId, status: 'Delivered' } },
    { $group: { _id: null, total: { $sum: restaurantShareExpr } } }
  ]);

  const todayRevenue = await Order.aggregate([
    { $match: { restaurantId, status: 'Delivered', createdAt: { $gte: startOfToday } } },
    { $group: { _id: null, total: { $sum: restaurantShareExpr }, count: { $sum: 1 } } }
  ]);

  const weeklyRevenue = await Order.aggregate([
    { $match: { restaurantId, status: 'Delivered', createdAt: { $gte: startOfWeek } } },
    { $group: { _id: null, total: { $sum: restaurantShareExpr }, count: { $sum: 1 } } }
  ]);

  const monthlyRevenue = await Order.aggregate([
    { $match: { restaurantId, status: 'Delivered', createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: restaurantShareExpr }, count: { $sum: 1 } } }
  ]);

  // Daily revenue for chart (last 7 days)
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        restaurantId,
        status: 'Delivered',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top selling items
  const topItems = await Order.aggregate([
    { $match: { restaurantId, status: 'Delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 }
  ]);

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    activeOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    todayRevenue: todayRevenue[0]?.total || 0,
    todayOrders: todayRevenue[0]?.count || 0,
    weeklyRevenue: weeklyRevenue[0]?.total || 0,
    weeklyOrders: weeklyRevenue[0]?.count || 0,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
    monthlyOrders: monthlyRevenue[0]?.count || 0,
    dailyRevenue,
    topItems
  };
};

/**
 * Update restaurant menu
 */
export const updateRestaurantMenu = async (restaurantId, menu) => {
  const restaurant = await Restaurant.findOne({ id: restaurantId });
  if (!restaurant) throw new Error('Restaurant not found');
  restaurant.menu = menu;
  await restaurant.save();
  return restaurant;
};

/**
 * Toggle restaurant online/offline status
 */
export const toggleRestaurantStatus = async (restaurantId) => {
  const restaurant = await Restaurant.findOne({ id: restaurantId });
  if (!restaurant) throw new Error('Restaurant not found');
  const updated = await Restaurant.findOneAndUpdate(
    { id: restaurantId },
    { $set: { acceptsOrders: !restaurant.acceptsOrders } },
    { returnDocument: 'after' }
  );
  return updated;
};

/**
 * Update restaurant profile data
 */
export const updateRestaurantProfile = async (restaurantId, updateData) => {
  const restaurant = await Restaurant.findOneAndUpdate(
    { id: restaurantId },
    { $set: updateData },
    { returnDocument: 'after', runValidators: true }
  );
  if (!restaurant) throw new Error('Restaurant not found');
  return restaurant;
};
