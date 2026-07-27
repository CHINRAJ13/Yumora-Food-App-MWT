import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const deliveryPartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'Please provide your email']
  },
  phone: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    minlength: 8,
    required: [true, 'Please provide a password'],
    select: false
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
  aadharNumber: { type: String },
  aadharImage: { type: String },
  rcImage: { type: String, required: true },
  panImage: { type: String, required: true },
  panNumber: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  selfieImage: { type: String, required: true },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  availability: { type: Boolean, default: false },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true
});

deliveryPartnerSchema.index({ location: '2dsphere' });

// Hash password before saving
deliveryPartnerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Update passwordChangedAt when password is changed
deliveryPartnerSchema.pre('save', function() {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

// Instance method to check password
deliveryPartnerSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
deliveryPartnerSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
deliveryPartnerSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
export default DeliveryPartner;
