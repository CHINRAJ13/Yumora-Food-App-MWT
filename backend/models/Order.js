import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: String,
  email: String,
  phone: String,
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
    enum: ["Placed", "Preparing", "Out for Delivery", "Delivered"],
    default: "Placed"
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
