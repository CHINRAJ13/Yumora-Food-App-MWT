import Customer from '../models/Customer.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { createSendToken } from '../utils/jwt.js';
import { sendSMS } from '../utils/sms.js';

export const registerCustomer = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  if (!email && !phone) {
    return next(new AppError('Please provide an email or phone number', 400));
  }
  const customer = await Customer.create({ name, email, phone, password });
  createSendToken(customer, 201, res, 'customer');
});

export const loginEmail = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  const customer = await Customer.findOne({ email }).select('+password');
  if (!customer || !(await customer.correctPassword(password, customer.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(customer, 200, res, 'customer');
});

export const sendOTP = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;
  if (!phone) return next(new AppError('Phone number is required', 400));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  let customer = await Customer.findOne({ phone });
  
  if (!customer) {
    customer = await Customer.create({
      phone,
      name: `User_${phone.slice(-4)}`
    });
  }

  customer.otp = otp;
  customer.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await customer.save({ validateBeforeSave: false });

  await sendSMS(phone, `Your Yumora verification code is: ${otp}. Valid for 5 minutes.`);

  res.status(200).json({ status: 'success', message: 'OTP sent successfully' });
});

export const verifyOTP = asyncHandler(async (req, res, next) => {
  const { phone, otp } = req.body;
  const customer = await Customer.findOne({ phone, otp, otpExpires: { $gt: Date.now() } });

  if (!customer) return next(new AppError('Invalid or expired OTP', 400));

  customer.otp = undefined;
  customer.otpExpires = undefined;
  await customer.save({ validateBeforeSave: false });

  createSendToken(customer, 200, res, 'customer');
});
