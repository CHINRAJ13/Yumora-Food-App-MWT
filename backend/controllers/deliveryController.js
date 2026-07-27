import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import {
  getAvailableOrdersService,
  getMyActiveDeliveriesService,
  getMyDeliveryHistoryService,
  acceptOrderService,
  pickupOrderService,
  completeDeliveryService,
  getDeliveryStatsService
} from '../services/deliveryService.js';
import { emitOrderUpdate, emitOrderAccepted, emitTrackingStarted, emitTrackingEnded } from '../socket.js';

export const getAvailableOrders = asyncHandler(async (req, res, next) => {
  const orders = await getAvailableOrdersService();
  sendResponse(res, 200, 'Available orders retrieved', orders);
});

export const getMyActiveDeliveries = asyncHandler(async (req, res, next) => {
  const orders = await getMyActiveDeliveriesService(req.user._id);
  sendResponse(res, 200, 'Active deliveries retrieved', orders);
});

export const getMyDeliveryHistory = asyncHandler(async (req, res, next) => {
  const orders = await getMyDeliveryHistoryService(req.user._id);
  sendResponse(res, 200, 'Delivery history retrieved', orders);
});

export const getDeliveryStats = asyncHandler(async (req, res, next) => {
  const stats = await getDeliveryStatsService(req.user._id);
  sendResponse(res, 200, 'Delivery stats retrieved', stats);
});

export const acceptOrder = asyncHandler(async (req, res, next) => {
  try {
    const order = await acceptOrderService(req.params.id, req.user);

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

export const pickupOrder = asyncHandler(async (req, res, next) => {
  try {
    const order = await pickupOrderService(req.params.id, req.user._id);

    emitOrderUpdate(req.params.id, 'Out for Delivery', order);
    emitTrackingStarted(req.params.id);

    sendResponse(res, 200, 'Order picked up successfully', order);
  } catch (err) {
    return next(new AppError(err.message, err.statusCode || 500));
  }
});

export const completeOrder = asyncHandler(async (req, res, next) => {
  try {
    const order = await completeDeliveryService(req.params.id, req.user._id);

    emitOrderUpdate(req.params.id, 'Delivered', order);
    emitTrackingEnded(req.params.id);

    sendResponse(res, 200, 'Delivery completed successfully', order);
  } catch (err) {
    return next(new AppError(err.message, err.statusCode || 500));
  }
});

export const updateDeliveryStatus = asyncHandler(async (req, res, next) => {
  const { availability } = req.body;
  if (typeof availability !== 'boolean') {
    return next(new AppError('Invalid availability value', 400));
  }
  const partner = await DeliveryPartner.findByIdAndUpdate(req.user._id, { availability }, { new: true });
  if (!partner) return next(new AppError('Delivery partner not found', 404));
  sendResponse(res, 200, 'Availability updated', { availability: partner.availability });
});

export const updateDeliveryRating = asyncHandler(async (req, res, next) => {
  const { rating } = req.body;
  const { id } = req.params;
  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    return next(new AppError('Rating must be a number between 0 and 5', 400));
  }
  
  if (req.userType === 'delivery') {
    return next(new AppError('Delivery users cannot rate other delivery users', 403));
  }
  const updatedPartner = await DeliveryPartner.findByIdAndUpdate(id, { rating }, { new: true });
  if (!updatedPartner) return next(new AppError('Delivery user not found', 404));
  sendResponse(res, 200, 'Delivery rating updated', { rating: updatedPartner.rating });
});
