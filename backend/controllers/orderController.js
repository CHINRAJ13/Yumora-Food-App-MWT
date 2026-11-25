import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import * as orderService from '../services/orderService.js';
import { emitOrderUpdate, emitNewOrder } from '../socket.js';
import { calculateDeliveryQuote, getActivePricingConfig } from '../services/pricingService.js';

/**
 * @desc    Calculate distance-based delivery quote & ETA before checkout
 * @route   POST /api/orders/delivery-quote
 * @access  Public
 */
export const getDeliveryQuote = asyncHandler(async (req, res, next) => {
  const { restaurantId, customerLocation, foodSubtotal = 0 } = req.body;

  let restaurant = null;
  if (restaurantId) {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(restaurantId);
    const query = isMongoId ? { $or: [{ id: restaurantId }, { _id: restaurantId }] } : { id: restaurantId };
    restaurant = await Restaurant.findOne(query);
  }

  const config = await getActivePricingConfig();
  const quote = calculateDeliveryQuote({
    restaurant,
    customerLocation,
    foodSubtotal: Number(foodSubtotal) || 0,
    config
  });

  sendResponse(res, 200, 'Delivery quote calculated', quote);
});

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
    location,
    pricing
  } = req.body;

  // 1. Validation
  if (!items || items.length === 0) {
    return next(new AppError('No items in order', 400));
  }

  // Check if restaurant is accepting orders & load restaurant profile for distance quote
  let restaurant = null;
  const targetRestaurantId = restaurantId || items[0]?.restaurantId;
  if (targetRestaurantId) {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(targetRestaurantId);
    const query = isMongoId ? { $or: [{ id: targetRestaurantId }, { _id: targetRestaurantId }] } : { id: targetRestaurantId };
    restaurant = await Restaurant.findOne(query);
    if (restaurant && restaurant.acceptsOrders === false) {
      return next(new AppError(`${restaurant.name || 'This restaurant'} is currently offline and not accepting orders.`, 400));
    }
  }

  // Calculate pricing breakdown
  const foodSubtotal = pricing?.foodSubtotal !== undefined
    ? Number(pricing.foodSubtotal)
    : items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  const config = await getActivePricingConfig();
  const quote = calculateDeliveryQuote({
    restaurant,
    customerLocation: location,
    foodSubtotal,
    config
  });

  const packagingFee = pricing?.packagingFee !== undefined ? Number(pricing.packagingFee) : 20;
  const deliveryFee = pricing?.deliveryFee !== undefined ? Number(pricing.deliveryFee) : quote.deliveryFee;
  const baseDeliveryFee = quote.baseDeliveryFee;
  const platformFee = pricing?.platformFee !== undefined ? Number(pricing.platformFee) : 5;
  const tax = pricing?.tax !== undefined ? Number(pricing.tax) : Math.round((foodSubtotal + packagingFee) * 0.05);
  const discount = pricing?.discount !== undefined ? Number(pricing.discount) : 0;
  const finalTotal = totalAmount || Math.round(foodSubtotal + packagingFee + deliveryFee + platformFee + tax - discount);

  // Settlement Split (Platform Commission e.g. 10% on food items)
  const commissionRate = 10;
  const platformCommission = Math.round((foodSubtotal * commissionRate) / 100);
  const restaurantAmount = foodSubtotal + packagingFee - platformCommission;
  const deliveryPartnerAmount = Math.max(deliveryFee, baseDeliveryFee);
  const platformProfit = platformFee + platformCommission;

  const estimatedDeliveryMinutes = quote.estimatedDeliveryMinutes || 35;
  const targetDeliveryTime = new Date(Date.now() + estimatedDeliveryMinutes * 60000);

  // 2. Prepare Order Data (userId from auth middleware)
  const orderData = {
    userId: req.user?._id || "guest",
    customerName: req.user?.name || "Guest User",
    items,
    totalAmount: finalTotal,
    estimatedDeliveryMinutes,
    targetDeliveryTime,
    deliveryDistanceKm: quote.distanceKm,
    pricing: {
      foodSubtotal,
      packagingFee,
      deliveryFee,
      baseDeliveryFee,
      platformFee,
      tax,
      discount,
      totalAmount: finalTotal
    },
    settlement: {
      commissionRate,
      platformCommission,
      restaurantAmount,
      deliveryPartnerAmount,
      platformProfit,
      isSettled: false,
      settledAt: null
    },
    address,
    paymentMethod: paymentMethod || "online",
    paymentId,
    paymentStatus: paymentStatus || "Success",
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

/**
 * @desc    Cancel order (Customer / Restaurant / Admin)
 * @route   POST /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userType = req.userType || (req.user?.role === 'admin' ? 'admin' : 'customer');

  const { cancelOrderService } = await import('../services/cancellationService.js');
  const cancelledOrder = await cancelOrderService(id, req.user, userType, reason);

  sendResponse(res, 200, 'Order cancelled and refund processed', cancelledOrder);
});

