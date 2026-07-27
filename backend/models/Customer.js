import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Please tell us your name!']
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
    sparse: true 
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
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
  savedAddresses: [{
    label: String, // e.g., 'Home', 'Work'
    address: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    }
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }]
}, {
  timestamps: true
});

// Custom validation to ensure either email or phone is provided
customerSchema.pre('validate', function() {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'You must provide either an email or a phone number');
    this.invalidate('phone', 'You must provide either an email or a phone number');
  }
});

// Hash password before saving
customerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  if(this.password) {
     this.password = await bcrypt.hash(this.password, 12);
  }
});

// Update passwordChangedAt when password is changed
customerSchema.pre('save', function() {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

// Instance method to check password
customerSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  if(!userPassword || !candidatePassword) return false;
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
customerSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
customerSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
