import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import AppError from '../utils/AppError.js';
import { emitOrderCancelled } from '../socket.js';

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
 * Process Razorpay refund safely
 */
export const refundOrderPayment = async (order, reason) => {
  if (!order.paymentId || order.paymentStatus !== 'Success') {
    return { status: 'none', refundId: null };
  }

  const rzp = getRazorpay();
  if (!rzp) {
    console.warn('Razorpay keys not configured; recording simulated refund for test mode');
    return {
      status: 'processed',
      refundId: `rfnd_sim_${Date.now()}`
    };
  }

  try {
    const refundResponse = await rzp.payments.refund(order.paymentId, {
      amount: Math.round(order.totalAmount * 100), // paise
      notes: {
        reason: reason || 'Order cancellation',
        orderId: order._id.toString()
      }
    });

    return {
      status: 'processed',
      refundId: refundResponse.id
    };
  } catch (err) {
    console.error('Razorpay refund API call failed:', err.message);
    // If test mode or live mode failure
    return {
      status: 'failed',
      refundId: null,
      error: err.message
    };
  }
};

/**
 * Universal Order Cancellation Service
 * Handles rules for customer, restaurant, and admin
 */
export const cancelOrderService = async (orderId, user, userType, reason) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status === 'Cancelled') {
    throw new AppError('Order is already cancelled', 400);
  }

  if (order.status === 'Delivered') {
    throw new AppError('Cannot cancel an order that has already been delivered', 400);
  }

  // ─── 1. Role-based Permission Checks ───
  if (userType === 'customer') {
    // Customers can only cancel when order is still in "Placed" status (before food prep begins)
    if (order.userId?.toString() !== user._id.toString() && order.userId !== 'guest') {
      throw new AppError('You are not authorized to cancel this order', 403);
    }
    if (order.status !== 'Placed') {
      throw new AppError('Cancellation is no longer available as the restaurant has already started preparing your food.', 400);
    }
  } else if (userType === 'restaurant') {
    // Restaurants can only cancel their own orders in "Placed" or "Preparing"
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant || restaurant.id !== order.restaurantId) {
      throw new AppError('You are not authorized to cancel orders for this restaurant', 403);
    }
    if (!['Placed', 'Preparing'].includes(order.status)) {
      throw new AppError('Cannot cancel order after food is picked up or ready for delivery', 400);
    }
  } else if (userType === 'admin') {
    // Admin has full override permissions
  } else {
    throw new AppError('Unauthorized to cancel order', 403);
  }

  // ─── 2. Initiate Online Payment Refund ───
  const refundResult = await refundOrderPayment(order, reason);

  // ─── 3. Update Order Document ───
  order.status = 'Cancelled';
  order.cancellation = {
    cancelledBy: userType,
    reason: reason || (userType === 'customer' ? 'Cancelled by customer' : 'Cancelled by restaurant'),
    cancelledAt: new Date()
  };
  order.refund = {
    refundId: refundResult.refundId,
    amount: order.totalAmount,
    status: refundResult.status,
    refundedAt: refundResult.status === 'processed' ? new Date() : null
  };

  await order.save();

  // ─── 4. Broadcast Real-time Cancellation to all parties ───
  emitOrderCancelled(order._id.toString(), order);

  return order;
};
