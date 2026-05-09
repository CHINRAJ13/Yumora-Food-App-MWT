import express from 'express';
import {
  getProfile,
  getOrders,
  getActive,
  updateStatus,
  getStats,
  getMenu,
  updateMenu,
  toggleStatus
} from '../controllers/restaurantDashController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication + restaurant role
router.use(protect, restrictTo('restaurant'));

router.get('/profile', getProfile);
router.get('/orders', getOrders);
router.get('/orders/active', getActive);
router.patch('/orders/:id/status', updateStatus);
router.get('/stats', getStats);
router.get('/menu', getMenu);
router.put('/menu', updateMenu);
router.patch('/toggle-status', toggleStatus);

export default router;
