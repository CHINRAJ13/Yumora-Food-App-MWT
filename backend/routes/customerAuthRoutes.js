import express from 'express';
import { registerCustomer, loginEmail, sendOTP, verifyOTP } from '../controllers/customerAuthController.js';

const router = express.Router();

router.post('/register', registerCustomer);
router.post('/login-email', loginEmail);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

export default router;
