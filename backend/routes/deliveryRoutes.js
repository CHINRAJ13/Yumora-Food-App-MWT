import express from 'express';
import {
  getAvailableOrders,
  getMyActiveDeliveries,
  getMyDeliveryHistory,
  getDeliveryStats,
  acceptOrder,
  pickupOrder,
  completeOrder
} from '../controllers/deliveryController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication + delivery role
router.use(protect);
router.use(restrictTo('delivery'));

// Get available orders for pickup
router.get('/available', getAvailableOrders);

// Get rider's active deliveries
router.get('/my-active', getMyActiveDeliveries);

// Get rider's delivery history
router.get('/my-history', getMyDeliveryHistory);

// Get rider's stats (earnings, counts)
router.get('/stats', getDeliveryStats);

// Accept an order
router.patch('/accept/:id', acceptOrder);

// Confirm pickup
router.patch('/pickup/:id', pickupOrder);

// Complete delivery
router.patch('/complete/:id', completeOrder);

export default router;
