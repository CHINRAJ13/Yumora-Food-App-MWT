import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import {
  getAvailableOrdersService,
  getMyActiveDeliveriesService,
  getMyDeliveryHistoryService,
  acceptOrderService,
  pickupOrderService,
  completeDeliveryService,
  getDeliveryStatsService
} from '../services/deliveryService.js';
import { emitOrderUpdate, emitOrderAccepted } from '../socket.js';

/**
 * @desc    Get available orders for pickup
 * @route   GET /api/delivery/available
 * @access  Delivery
 */
export const getAvailableOrders = asyncHandler(async (req, res, next) => {
  const orders = await getAvailableOrdersService();
  sendResponse(res, 200, 'Available orders retrieved', orders);
});

/**
 * @desc    Get rider's active deliveries
 * @route   GET /api/delivery/my-active
 * @access  Delivery
 */
export const getMyActiveDeliveries = asyncHandler(async (req, res, next) => {
  const orders = await getMyActiveDeliveriesService(req.user._id);
  sendResponse(res, 200, 'Active deliveries retrieved', orders);
});

/**
 * @desc    Get rider's delivery history
 * @route   GET /api/delivery/my-history
 * @access  Delivery
 */
export const getMyDeliveryHistory = asyncHandler(async (req, res, next) => {
  const orders = await getMyDeliveryHistoryService(req.user._id);
  sendResponse(res, 200, 'Delivery history retrieved', orders);
});

/**
 * @desc    Get rider's stats
 * @route   GET /api/delivery/stats
 * @access  Delivery
 */
export const getDeliveryStats = asyncHandler(async (req, res, next) => {
  const stats = await getDeliveryStatsService(req.user._id);
  sendResponse(res, 200, 'Delivery stats retrieved', stats);
});

/**
 * @desc    Accept an available order
 * @route   PATCH /api/delivery/accept/:id
 * @access  Delivery
 */
export const acceptOrder = asyncHandler(async (req, res, next) => {
  try {
    const order = await acceptOrderService(req.params.id, req.user);

    // Emit real-time events
    emitOrderAccepted(req.params.id, {
      _id: req.user._id,
      name: req.user.name
    });
    emitOrderUpdate(req.params.id, 'Out for Delivery', order);

    sendResponse(res, 200, 'Order accepted successfully', order);
  } catch (err) {
    return next(new AppError(err.message, err.statusCode || 500));
  }
});

/**
 * @desc    Confirm order pickup
 * @route   PATCH /api/delivery/pickup/:id
 * @access  Delivery
 */
export const pickupOrder = asyncHandler(async (req, res, next) => {
  try {
    const order = await pickupOrderService(req.params.id, req.user._id);

    emitOrderUpdate(req.params.id, 'Out for Delivery', order);

    sendResponse(res, 200, 'Order picked up successfully', order);
  } catch (err) {
    return next(new AppError(err.message, err.statusCode || 500));
  }
});

/**
 * @desc    Mark delivery as complete
 * @route   PATCH /api/delivery/complete/:id
 * @access  Delivery
 */
export const completeOrder = asyncHandler(async (req, res, next) => {
  try {
    const order = await completeDeliveryService(req.params.id, req.user._id);

    emitOrderUpdate(req.params.id, 'Delivered', order);

    sendResponse(res, 200, 'Delivery completed successfully', order);
  } catch (err) {
    return next(new AppError(err.message, err.statusCode || 500));
  }
});
