import mongoose from 'mongoose';

const deliveryProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected'],
    default: 'pending'
  },
  adminComment: {
    type: String,
    default: null
  },
  vehicleNumber: String,
  licenseNumber: String,
  vehicleType: {
    type: String,
    enum: ['Bike', 'Scooter', 'Cycle'],
    default: 'Bike'
  },
  licenseImage: { type: String, default: null },
  insuranceDocument: { type: String, default: null },
  backgroundCheckStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
}, {
  timestamps: true
});

const DeliveryProfile = mongoose.model('DeliveryProfile', deliveryProfileSchema);
export default DeliveryProfile;
