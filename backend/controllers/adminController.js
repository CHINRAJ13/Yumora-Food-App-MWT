import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import { emitOrderUpdate, emitNewAvailableOrder, emitOrderAccepted } from '../socket.js';

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

  // Emit real-time update to customer & admin listeners
  emitOrderUpdate(id, status, order);

  // Notify delivery riders when order becomes ready for pickup
  if (status === 'Ready for Pickup') {
    emitNewAvailableOrder(order);
  }

  sendResponse(res, 200, 'Order updated successfully', order);
});

/**
 * @desc    Assign a delivery person to an order
 * @route   PATCH /api/admin/orders/:id/assign
 * @access  Admin
 */
export const assignDeliveryPerson = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { deliveryPersonId } = req.body;

  if (!deliveryPersonId) {
    return next(new AppError('Delivery person ID is required', 400));
  }

  const deliveryPerson = await User.findById(deliveryPersonId);
  if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
    return next(new AppError('Invalid delivery person', 400));
  }

  const order = await Order.findByIdAndUpdate(
    id,
    {
      deliveryPersonId: deliveryPerson._id,
      deliveryPersonName: deliveryPerson.name,
      status: 'Out for Delivery',
      assignedAt: new Date()
    },
    { new: true }
  );

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  emitOrderAccepted(id, { _id: deliveryPerson._id, name: deliveryPerson.name });
  emitOrderUpdate(id, 'Out for Delivery', order);

  sendResponse(res, 200, 'Delivery person assigned successfully', order);
});

/**
 * @desc    Get all users with delivery role
 * @route   GET /api/admin/delivery-persons
 * @access  Admin
 */
export const getDeliveryPersons = asyncHandler(async (req, res, next) => {
  const deliveryPersons = await User.find({ role: 'delivery' }).select('name email phone');
  sendResponse(res, 200, 'Delivery persons retrieved', deliveryPersons);
});

// --- Restaurants ---
export const getAllRestaurants = asyncHandler(async (req, res, next) => {
  const restaurants = await Restaurant.find();
  sendResponse(res, 200, 'Restaurants retrieved', restaurants);
});

export const createRestaurant = asyncHandler(async (req, res, next) => {
  // If id is not provided, generate one
  if (!req.body.id) {
    req.body.id = Date.now().toString();
  }
  const restaurant = await Restaurant.create(req.body);
  sendResponse(res, 201, 'Restaurant created', restaurant);
});

export const updateRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  if (!restaurant) return next(new AppError('Restaurant not found', 404));
  sendResponse(res, 200, 'Restaurant updated', restaurant);
});

export const deleteRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findOneAndDelete({ id: req.params.id });
  if (!restaurant) return next(new AppError('Restaurant not found', 404));
  sendResponse(res, 200, 'Restaurant deleted', null);
});

// --- Users ---
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  sendResponse(res, 200, 'Users retrieved', users);
});

export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { role, restaurantId } = req.body;
  const updateData = { role };
  if (restaurantId !== undefined) updateData.restaurantId = restaurantId;

  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!user) return next(new AppError('User not found', 404));
  sendResponse(res, 200, 'User updated successfully', user);
});

// --- Categories ---
export const getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();
  sendResponse(res, 200, 'Categories retrieved', categories);
});

export const createCategory = asyncHandler(async (req, res, next) => {
  if (!req.body.id) req.body.id = Date.now().toString();
  const category = await Category.create(req.body);
  sendResponse(res, 201, 'Category created', category);
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOneAndDelete({ id: req.params.id });
  if (!category) return next(new AppError('Category not found', 404));
  sendResponse(res, 200, 'Category deleted', null);
});

// --- Banners ---
export const getAllBanners = asyncHandler(async (req, res, next) => {
  const banners = await Banner.find();
  sendResponse(res, 200, 'Banners retrieved', banners);
});

export const createBanner = asyncHandler(async (req, res, next) => {
  if (!req.body.id) req.body.id = Date.now().toString();
  const banner = await Banner.create(req.body);
  sendResponse(res, 201, 'Banner created', banner);
});

export const deleteBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findOneAndDelete({ id: req.params.id });
  if (!banner) return next(new AppError('Banner not found', 404));
  sendResponse(res, 200, 'Banner deleted', null);
});
