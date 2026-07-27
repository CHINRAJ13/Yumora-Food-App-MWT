import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import AppError from '../utils/AppError.js';
import { sendEmail } from '../utils/email.js';
import { sendSMS } from '../utils/sms.js';

export const createOrderService = async (orderData) => {
  const order = new Order(orderData);
  await order.save();

  // Assign nearest online delivery rider based on restaurant location
  try {
    const restaurant = await Restaurant.findOne({ id: order.restaurantId });
    if (restaurant?.location?.coordinates?.length === 2) {
      const nearestDelivery = await DeliveryPartner.findOne({
        availability: true,
        status: { $in: ['approved', 'active'] },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: restaurant.location.coordinates
            },
            $maxDistance: 5000 // 5km radius
          }
        }
      });
      if (nearestDelivery) {
        order.deliveryPersonId = nearestDelivery._id;
        order.deliveryPersonName = nearestDelivery.name || nearestDelivery.email;
        await order.save();
      }
    }
  } catch (err) {
    console.error('Error assigning delivery rider:', err);
  }

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

export const addOrderReviewService = async (id, userId, { restaurantRating, restaurantReviewText, deliveryRating, deliveryReviewText }) => {
  const order = await Order.findOne({ _id: id, userId });
  
  if (!order) {
    throw new AppError('Order not found or unauthorized', 404);
  }
  
  if (order.status !== 'Delivered') {
    throw new AppError('Only delivered orders can be reviewed', 400);
  }

  let isUpdated = false;

  // Restaurant Review
  if (restaurantRating && (!order.restaurantReview || !order.restaurantReview.rating)) {
    order.restaurantReview = {
      rating: restaurantRating,
      review: restaurantReviewText || "",
      createdAt: new Date()
    };
    
    // Update Restaurant average rating
    const restaurant = await Restaurant.findOne({ id: order.restaurantId });
    if (restaurant) {
      const currentAvg = restaurant.rating || 0;
      const currentTotal = restaurant.totalRatings || 0;
      restaurant.rating = ((currentAvg * currentTotal) + restaurantRating) / (currentTotal + 1);
      restaurant.totalRatings = currentTotal + 1;
      await restaurant.save();
    }
    isUpdated = true;
  }

  // Delivery Review
  if (deliveryRating && (!order.deliveryReview || !order.deliveryReview.rating) && order.deliveryPersonId) {
    order.deliveryReview = {
      rating: deliveryRating,
      review: deliveryReviewText || "",
      createdAt: new Date()
    };
    
    // Update Delivery Person average rating
    const partner = await DeliveryPartner.findById(order.deliveryPersonId);
    if (partner) {
      const currentAvg = partner.rating || 0;
      const currentTotal = partner.totalRatings || 0;
      
      partner.rating = ((currentAvg * currentTotal) + deliveryRating) / (currentTotal + 1);
      partner.totalRatings = currentTotal + 1;
      await partner.save();
    }
    isUpdated = true;
  }

  if (isUpdated) {
    await order.save();
  } else {
    throw new AppError('Review already submitted or invalid payload', 400);
  }

  return order;
};
