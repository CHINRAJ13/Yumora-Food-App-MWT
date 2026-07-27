import Admin from '../models/Admin.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { createSendToken } from '../utils/jwt.js';

export const loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin || !(await admin.correctPassword(password, admin.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (admin.status === 'suspended') {
    return next(new AppError('Your admin account has been suspended.', 403));
  }

  createSendToken(admin, 200, res, 'admin');
});
