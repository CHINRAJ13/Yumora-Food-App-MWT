import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/User.js';
import asyncHandler from './asyncHandler.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Protect routes - verify token in headers or cookies
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  // 1) Getting token from headers OR cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
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

  // 6) ROLLING SESSION: Refresh cookie if the token is older than 1 day
  const tokenAgeInDays = (Date.now() / 1000 - decoded.iat) / (24 * 60 * 60);
  if (tokenAgeInDays > 1) {
    const newToken = jwt.sign({ id: currentUser._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.cookie('jwt', newToken, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  console.log(`👤 User: ${currentUser.name} | Roles: ${currentUser.roles?.join(', ')} | Status: ${currentUser.status}`);
  req.user = currentUser;
  next();
});

/**
 * @desc    Restrict routes to specific roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array of allowed roles, e.g., ['admin', 'delivery']
    const userRoles = req.user.roles || [];
    const hasAccess = roles.some(role => userRoles.includes(role));
    if (!hasAccess) {
      console.log(`❌ Role Mismatch: User roles [${userRoles.join(', ')}] do not include any of [${roles.join(', ')}]`);
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
