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
  rating: { type: Number, default: 0 },
  deliveryTime: { type: String, required: true },
  cuisines: [{ type: String }],
  isVeg: { type: Boolean, required: true },
  priceForTwo: { type: Number },
  distance: { type: String },
  menu: [MenuItemSchema]
}, { timestamps: true });

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
