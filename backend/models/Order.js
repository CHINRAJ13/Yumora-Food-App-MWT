import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: String,
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
  address: String,
  paymentMethod: {
    type: String,
    enum: ["cod", "upi", "card"],
    default: "cod"
  },
  paymentId: String, // Razorpay Payment ID
  paymentStatus: {
    type: String,
    enum: ["Pending", "Success", "Failed", "COD"],
    default: "Pending"
  },
  status: {
    type: String,
    enum: ["Placed", "Preparing", "Ready for Pickup", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Placed"
  },
  // Delivery person fields
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryPersonName: {
    type: String,
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
  deliveryNotes: {
    type: String,
    default: ''
  },
  location: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
