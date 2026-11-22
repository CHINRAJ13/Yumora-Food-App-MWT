import Razorpay from 'razorpay';
import crypto from 'crypto';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';

let razorpayClient = null;

const getRazorpay = () => {
  if (!razorpayClient && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payment/create-order
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return next(new AppError('Please provide an amount', 400));
  }

  const rzp = getRazorpay();
  if (!rzp) {
    return next(new AppError('Razorpay credentials not configured on server', 500));
  }

  const options = {
    amount: Math.round(amount * 100), // ₹ → paise
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
  };

  const order = await rzp.orders.create(options);

  if (!order) {
    return next(new AppError('Failed to create Razorpay order', 500));
  }

  sendResponse(res, 201, 'Order created successfully', {
    ...order,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/payment/verify
 * @access  Private
 */
export const verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Payment details missing', 400));
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) {
    return next(new AppError('Razorpay secret not configured on server', 500));
  }

  const hmac = crypto.createHmac('sha256', key_secret);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generated_signature = hmac.digest('hex');

  if (generated_signature === razorpay_signature) {
    sendResponse(res, 200, 'Payment verified successfully', {
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } else {
    return next(new AppError('Invalid payment signature', 400));
  }
});
