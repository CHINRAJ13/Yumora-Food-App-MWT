import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/User.js';
import asyncHandler from './asyncHandler.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Protect routes - verify token in headers or cookies
 */
export const protect = asyncHandler(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // 5) Check if user account is active
  if (currentUser.status === 'pending') {
    return next(new AppError('Your account is pending approval by an admin.', 403));
  }

  if (currentUser.status === 'suspended') {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  console.log(`👤 User: ${currentUser.name} | Role: ${currentUser.role} | Status: ${currentUser.status}`);
  req.user = currentUser;
  next();
});

/**
 * @desc    Restrict routes to specific roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'delivery']. role='user'
    if (!roles.includes(req.user.role)) {
      console.log(`❌ Role Mismatch: User role "${req.user.role}" not in allowed roles [${roles.join(', ')}]`);
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
