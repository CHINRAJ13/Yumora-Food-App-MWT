import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true // Allow null for users who register via email only
  },
  roles: {
    type: [String],
    enum: ['user', 'admin', 'delivery', 'restaurant'],
    default: ['user']
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'active'
  },
  password: {
    type: String,
    minlength: 8,
    select: false
  },
  otp: String,
  otpExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Availability flag: true = online/available, false = offline/unavailable
  availability: { type: Boolean, default: false },
  // Delivery user rating, default 4.5 stars
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  // GeoJSON location for proximity calculations
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
  }
}, {
  timestamps: true
});

userSchema.index({ location: '2dsphere' });

// Custom validation to ensure either email or phone is provided
userSchema.pre('validate', function() {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'You must provide either an email or a phone number');
    this.invalidate('phone', 'You must provide either an email or a phone number');
  }
  // next();
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Update passwordChangedAt when password is changed
userSchema.pre('save', function() {
  if (!this.isModified('password') || this.isNew) return;

  this.passwordChangedAt = Date.now() - 1000;
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;
