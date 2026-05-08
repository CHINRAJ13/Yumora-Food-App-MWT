import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply protection to all payment routes
router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;
