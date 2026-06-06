import Order from '../models/Order.js';
import { sendEmail } from '../utils/email.js';
import { sendSMS } from '../utils/sms.js';

export const createOrderService = async (orderData) => {
  const order = new Order(orderData);
  await order.save();

  // Notifications (Async)
  const deliverTime = "35-45 mins";

  if (order.email) {
    const itemDetails = order.items.map(i => `• ${i.name} x ${i.quantity}`).join("\n");
    const emailText = `Your order #${order._id.toString().substring(0, 8)} has been placed!\n\nItems:\n${itemDetails}\n\nTotal: ₹${order.totalAmount}\nDelivery Address: ${order.address}\nEst. Delivery: ${deliverTime}\n\nThank you for choosing Yumora!`;

    sendEmail(order.email, "Order Confirmed 🎉 - Yumora", emailText)
      .catch(err => console.error("Email failed:", err.message));
  }

  if (order.phone) {
    sendSMS(
      order.phone,
      `🍔 Order Confirmed! Your order #${order._id} is placed successfully.`
    ).catch(err => console.error("SMS failed:", err.message));
  }

  return order;
};

export const getUserOrdersService = async (userId) => {
  return await Order.find({ userId }).sort({ createdAt: -1 });
};

export const getOrderByIdService = async (id) => {
  return await Order.findById(id);
};

export const updateOrderStatusService = async (id, status) => {
  const order = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (order && order.phone) {
    sendSMS(
      order.phone,
      `📦 Update: Your order is now ${status}`
    ).catch(err => console.error("SMS failed:", err.message));
  }

  return order;
};
