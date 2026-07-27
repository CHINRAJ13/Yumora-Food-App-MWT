import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const restaurantOwnerSchema = new mongoose.Schema({
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
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // We can either embed restaurant info or reference it. 
  // Referencing is cleaner since the Restaurant model exists.
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }
}, {
  timestamps: true
});

// Hash password before saving
restaurantOwnerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Update passwordChangedAt when password is changed
restaurantOwnerSchema.pre('save', function() {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

// Instance method to check password
restaurantOwnerSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
restaurantOwnerSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
restaurantOwnerSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const RestaurantOwner = mongoose.model('RestaurantOwner', restaurantOwnerSchema);
export default RestaurantOwner;
