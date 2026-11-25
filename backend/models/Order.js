import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: String,
  customerName: {
    type: String,
    default: null
  },
  email: String,
  phone: String,
  restaurantId: {
    type: String,
    default: null
  },
  restaurantName: {
    type: String,
    default: null
  },
  items: Array,
  totalAmount: Number,
  pricing: {
    foodSubtotal: { type: Number, default: 0 },
    packagingFee: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    baseDeliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 5 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 }
  },
  settlement: {
    commissionRate: { type: Number, default: 10 }, // 10% platform commission on food
    platformCommission: { type: Number, default: 0 },
    restaurantAmount: { type: Number, default: 0 },
    deliveryPartnerAmount: { type: Number, default: 0 },
    platformProfit: { type: Number, default: 0 },
    isSettled: { type: Boolean, default: false },
    settledAt: { type: Date, default: null }
  },
  address: String,
  paymentMethod: {
    type: String,
    enum: ["card", "upi", "online", "netbanking", "cod", "razorpay"],
    default: "online"
  },
  paymentId: String, // Razorpay Payment ID
  paymentStatus: {
    type: String,
    enum: ["Pending", "Success", "Failed"],
    default: "Pending"
  },
  status: {
    type: String,
    enum: ["Placed", "Preparing", "Ready for Pickup", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Placed"
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ["customer", "restaurant", "admin", null],
      default: null
    },
    reason: {
      type: String,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  refund: {
    refundId: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["none", "pending", "processed", "failed"],
      default: "none"
    },
    refundedAt: {
      type: Date,
      default: null
    }
  },
  // Delivery person fields
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
    default: null
  },
  deliveryPersonName: {
    type: String,
    default: null
  },
  preparingAt: {
    type: Date,
    default: null
  },
  readyForPickupAt: {
    type: Date,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  pickedUpAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  estimatedDeliveryMinutes: {
    type: Number,
    default: 35
  },
  targetDeliveryTime: {
    type: Date,
    default: null
  },
  actualDeliveryMinutes: {
    type: Number,
    default: null
  },
  deliveryDistanceKm: {
    type: Number,
    default: null
  },
  deliveryNotes: {
    type: String,
    default: ''
  },
  restaurantReview: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: Date
  },
  deliveryReview: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: Date
  },
  location: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
