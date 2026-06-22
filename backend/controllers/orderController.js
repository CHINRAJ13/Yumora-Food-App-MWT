import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import * as orderService from '../services/orderService.js';
import { emitOrderUpdate, emitNewOrder } from '../socket.js';

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res, next) => {
  const {
    items,
    totalAmount,
    address,
    email,
    phone,
    paymentMethod,
    paymentId,
    paymentStatus,
    restaurantId,
    restaurantName,
    location
  } = req.body;

  // 1. Validation
  if (!items || items.length === 0) {
    return next(new AppError('No items in order', 400));
  }

  // 2. Prepare Order Data (userId from auth middleware)
  const orderData = {
    userId: req.user?._id || "guest",
    items,
    totalAmount,
    address,
    paymentMethod: paymentMethod || "cod",
    paymentId,
    paymentStatus: paymentStatus || (paymentMethod === "cod" ? "COD" : "Pending"),
    email: email || req.user?.email,
    phone: phone || req.user?.phone,
    restaurantId: restaurantId || items[0]?.restaurantId || null,
    restaurantName: restaurantName || items[0]?.restaurantName || null,
    location,
    status: "Placed"
  };

  // 3. Call Service
  const order = await orderService.createOrderService(orderData);

  // 4. Emit real-time notification to admin dashboard
  emitNewOrder(order);

  // 5. Success Response
  sendResponse(res, 201, 'Order placed successfully', order);
});

/**
 * @desc    Get all orders for a user
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getUserOrders = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id || req.params.userId;

  if (!userId) {
    return next(new AppError('User ID is required', 400));
  }

  const orders = await orderService.getUserOrdersService(userId);
  sendResponse(res, 200, 'Orders retrieved successfully', orders);
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/single/:id
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await orderService.getOrderByIdService(req.params.id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  sendResponse(res, 200, 'Order retrieved successfully', order);
});

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/update/:id
 * @access  Admin/Delivery
 */
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(new AppError('Status is required', 400));
  }

  const order = await orderService.updateOrderStatusService(id, status);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Emit real-time update
  emitOrderUpdate(id, status, order);

  sendResponse(res, 200, 'Order status updated successfully', order);
});

/**
 * @desc    Add review for an order
 * @route   POST /api/orders/:id/review
 * @access  Private
 */
export const addOrderReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError('User authentication required', 401));
  }

  const { restaurantRating, restaurantReviewText, deliveryRating, deliveryReviewText } = req.body;

  if (!restaurantRating && !deliveryRating) {
    return next(new AppError('Must provide at least one rating', 400));
  }

  const order = await orderService.addOrderReviewService(id, userId, {
    restaurantRating,
    restaurantReviewText,
    deliveryRating,
    deliveryReviewText
  });

  sendResponse(res, 200, 'Review submitted successfully', order);
});
