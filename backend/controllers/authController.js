import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { createSendToken } from '../utils/jwt.js';
import { sendSMS } from '../utils/sms.js';
import crypto from 'crypto';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 */
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    phone
  });

  createSendToken(newUser, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

/**
 * @desc    Logout user
 * @route   GET /api/auth/logout
 */
export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

/**
 * @desc    Send OTP for phone login/verification
 * @route   POST /api/auth/send-otp
 */
export const sendOTP = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ 
      phone, 
      name: `User_${phone.slice(-4)}`,
      email: `${phone}@yumora.com`, // Temporary email
      password: crypto.randomBytes(8).toString('hex') // Random password
    });
  }

  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendSMS(phone, `Your Yumora verification code is: ${otp}. Valid for 5 minutes.`);

  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully'
  });
});

/**
 * @desc    Verify OTP and login
 * @route   POST /api/auth/verify-otp
 */
export const verifyOTP = asyncHandler(async (req, res, next) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ 
    phone, 
    otp, 
    otpExpires: { $gt: Date.now() } 
  });

  if (!user) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});
