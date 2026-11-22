import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getMyWallet,
  requestPayout,
  getAdminPayouts,
  processPayout
} from '../controllers/walletController.js';

const router = express.Router();

// Restaurant & Delivery routes
router.get('/my-wallet', protect, restrictTo('restaurant', 'delivery'), getMyWallet);
router.post('/request-payout', protect, restrictTo('restaurant', 'delivery'), requestPayout);

// Admin Payout management routes
router.get('/admin/payouts', protect, restrictTo('admin'), getAdminPayouts);
router.patch('/admin/payouts/:id', protect, restrictTo('admin'), processPayout);

export default router;
