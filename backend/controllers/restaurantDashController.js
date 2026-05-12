import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import {
  getMyRestaurant,
  getRestaurantOrders,
  getActiveOrders,
  updateOrderByRestaurant,
  getRestaurantStats,
  updateRestaurantMenu,
  toggleRestaurantStatus,
  updateRestaurantProfile
} from '../services/restaurantDashService.js';
import { emitOrderUpdate, emitNewAvailableOrder } from '../socket.js';

/**
 * @desc    Get my restaurant profile
 * @route   GET /api/restaurant-dash/profile
 * @access  Restaurant
 */
export const getProfile = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  sendResponse(res, 200, 'Restaurant profile retrieved', restaurant);
});

/**
 * @desc    Get all orders for my restaurant
 * @route   GET /api/restaurant-dash/orders
 * @access  Restaurant
 */
export const getOrders = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  const { status } = req.query;
  const orders = await getRestaurantOrders(restaurant.id, status);
  sendResponse(res, 200, 'Restaurant orders retrieved', orders);
});

/**
 * @desc    Get active orders for my restaurant
 * @route   GET /api/restaurant-dash/orders/active
 * @access  Restaurant
 */
export const getActive = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  const orders = await getActiveOrders(restaurant.id);
  sendResponse(res, 200, 'Active orders retrieved', orders);
});

/**
 * @desc    Update order status (Preparing / Ready for Pickup / Cancelled)
 * @route   PATCH /api/restaurant-dash/orders/:id/status
 * @access  Restaurant
 */
export const updateStatus = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  const { status } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }

  const order = await updateOrderByRestaurant(req.params.id, restaurant.id, status);

  // Emit real-time update
  emitOrderUpdate(order._id.toString(), status, order);

  // Notify delivery riders when ready for pickup
  if (status === 'Ready for Pickup') {
    emitNewAvailableOrder(order);
  }

  sendResponse(res, 200, `Order marked as ${status}`, order);
});

/**
 * @desc    Get restaurant stats & revenue
 * @route   GET /api/restaurant-dash/stats
 * @access  Restaurant
 */
export const getStats = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  const stats = await getRestaurantStats(restaurant.id);
  sendResponse(res, 200, 'Restaurant stats retrieved', { ...stats, restaurant });
});

/**
 * @desc    Get restaurant menu
 * @route   GET /api/restaurant-dash/menu
 * @access  Restaurant
 */
export const getMenu = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  sendResponse(res, 200, 'Menu retrieved', restaurant.menu);
});

/**
 * @desc    Update restaurant menu
 * @route   PUT /api/restaurant-dash/menu
 * @access  Restaurant
 */
export const updateMenu = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  const { menu } = req.body;
  
  if (!menu || !Array.isArray(menu)) {
    return next(new AppError('Menu must be an array', 400));
  }

  const updated = await updateRestaurantMenu(restaurant.id, menu);
  sendResponse(res, 200, 'Menu updated successfully', updated.menu);
});

/**
 * @desc    Toggle restaurant online/offline
 * @route   PATCH /api/restaurant-dash/toggle-status
 * @access  Restaurant
 */
export const toggleStatus = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  const updated = await toggleRestaurantStatus(restaurant.id);
  sendResponse(res, 200, `Restaurant is now ${updated.acceptsOrders ? 'Online' : 'Offline'}`, {
    acceptsOrders: updated.acceptsOrders
  });
});

/**
 * @desc    Update restaurant profile info & banner
 * @route   PATCH /api/restaurant-dash/profile
 * @access  Restaurant
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const restaurant = await getMyRestaurant(req.user._id);
  
  const allowedFields = ['name', 'cuisines', 'deliveryTime', 'priceForTwo', 'distance', 'isVeg'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'cuisines' && typeof req.body[field] === 'string') {
        updateData[field] = req.body[field].split(',').map(c => c.trim());
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  // Handle banner image update
  if (req.file) {
    updateData.image = req.file.path;
  }

  const updatedRestaurant = await updateRestaurantProfile(restaurant.id, updateData);
  
  sendResponse(res, 200, 'Profile updated successfully', updatedRestaurant);
});
