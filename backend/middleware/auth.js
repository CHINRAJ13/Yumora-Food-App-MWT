import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import Customer from '../models/Customer.js';
import RestaurantOwner from '../models/RestaurantOwner.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Admin from '../models/Admin.js';
import asyncHandler from './asyncHandler.js';
import AppError from '../utils/AppError.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const { id, type } = decoded;

  let currentUser;
  switch (type) {
    case 'customer':
      currentUser = await Customer.findById(id);
      break;
    case 'restaurant':
      currentUser = await RestaurantOwner.findById(id);
      break;
    case 'delivery':
      currentUser = await DeliveryPartner.findById(id);
      break;
    case 'admin':
      currentUser = await Admin.findById(id);
      break;
    default:
      // Fallback for old tokens that might not have a type (they used 'roles')
      if (decoded.roles && decoded.roles.includes('admin')) {
        currentUser = await Admin.findById(id);
        decoded.type = 'admin';
      } else {
        currentUser = await Customer.findById(id);
        decoded.type = 'customer';
      }
      break;
  }

  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  if (currentUser.status === 'pending' || currentUser.status === 'reviewing') {
    return next(new AppError('Your account is pending approval by an admin.', 403));
  }

  if (currentUser.status === 'suspended' || currentUser.status === 'rejected') {
    return next(new AppError('Your account has been suspended or rejected.', 403));
  }

  const tokenAgeInDays = (Date.now() / 1000 - decoded.iat) / (24 * 60 * 60);
  if (tokenAgeInDays > 1) {
    const newToken = jwt.sign({ id: currentUser._id, type: decoded.type }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.cookie('jwt', newToken, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
  }

  // Attach user and type to request
  req.user = currentUser;
  req.userType = decoded.type;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // If the required role is 'admin', check if userType is 'admin'
    if (roles.includes('admin') && req.userType === 'admin') {
       return next();
    }
    // Similarly for others, mapping role names to types
    if (roles.includes(req.userType)) {
      return next();
    }
    
    return next(new AppError('You do not have permission to perform this action', 403));
  };
};

export const requireAdminPermission = (permission) => {
  return (req, res, next) => {
    if (req.userType !== 'admin') {
      return next(new AppError('Access denied. Admins only.', 403));
    }
    
    if (req.user.permissions.includes('super_admin') || req.user.permissions.includes(permission)) {
      return next();
    }

    return next(new AppError('You do not have the required permissions for this action.', 403));
  };
};
