import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  isVeg: { type: Boolean, required: true },
  isBestseller: { type: Boolean, default: false }
});

const RestaurantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  rating: { type: Number, default: 4.5 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  totalRatings: { type: Number, default: 0 },
  deliveryTime: { type: String, required: true },
  cuisines: [{ type: String }],
  isVeg: { type: Boolean, required: true },
  priceForTwo: { type: Number },
  distance: { type: String },
  menu: [MenuItemSchema],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Availability flag for restaurant: true = online/available, false = offline/unavailable
  availability: { type: Boolean, default: false },
  acceptsOrders: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected'],
    default: 'pending'
  },
  adminComment: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// 2dsphere index for geolocation queries
RestaurantSchema.index({ location: '2dsphere' });

// Ensure id is returned in JSON
RestaurantSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
export default Restaurant;
