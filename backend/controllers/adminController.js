import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/stats
 * @access  Admin
 */
export const getStats = asyncHandler(async (req, res, next) => {
  const orderCount = await Order.countDocuments();
  const restaurantCount = await Restaurant.countDocuments();
  const userCount = await User.countDocuments();
  
  const revenue = await Order.aggregate([
    { $match: { status: 'Delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  sendResponse(res, 200, 'Stats retrieved successfully', {
    orderCount,
    restaurantCount,
    userCount,
    totalRevenue: revenue[0]?.total || 0
  });
});

/**
 * @desc    Get all orders for admin
 * @route   GET /api/admin/orders
 * @access  Admin
 */
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find().sort('-createdAt');
  sendResponse(res, 200, 'All orders retrieved successfully', orders);
});

/**
 * @desc    Update any order status
 * @route   PATCH /api/admin/orders/:id
 * @access  Admin
 */
export const updateOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  sendResponse(res, 200, 'Order updated successfully', order);
});
