import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';

export const getMe = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const profileData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    type: req.userType,
    status: user.status,
    createdAt: user.createdAt,
  };

  if (req.userType === 'delivery') {
    profileData.deliveryProfile = {
      vehicleNumber: user.vehicleNumber,
      licenseNumber: user.licenseNumber,
      vehicleType: user.vehicleType,
      rating: user.rating,
      totalRatings: user.totalRatings,
      adminComment: user.adminComment,
      availability: user.availability
    };
  }

  if (req.userType === 'restaurant') {
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (restaurant) {
      profileData.restaurant = {
        id: restaurant.id,
        name: restaurant.name,
        approvalStatus: restaurant.approvalStatus,
        isActive: restaurant.isActive,
        adminComment: restaurant.adminComment
      };
    }
  }

  if (req.userType === 'admin') {
    profileData.permissions = user.permissions;
  }

  sendResponse(res, 200, 'User profile fetched', profileData);
});

export const updateMe = asyncHandler(async (req, res, next) => {
  if (req.body.password) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  const filteredBody = filterObj(req.body, 'name', 'phone');
  
  if (req.user.email && req.body.email && req.body.email !== req.user.email) {
    return next(new AppError('Email is already set and cannot be changed.', 400));
  }
  
  if (req.body.email) {
    filteredBody.email = req.body.email;
  }

  let requiresReverification = false;
  if (req.userType === 'delivery' && req.body.deliveryDetails) {
    const allowedDeliveryFields = ['vehicleNumber', 'licenseNumber', 'vehicleType'];
    const incomingDetails = req.body.deliveryDetails;

    for (const field of allowedDeliveryFields) {
      if (incomingDetails[field] !== undefined && incomingDetails[field] !== req.user[field]) {
        requiresReverification = true;
        filteredBody[field] = incomingDetails[field];
      }
    }

    if (requiresReverification) {
      filteredBody.status = 'pending';
    }
  }

  Object.assign(req.user, filteredBody);
  await req.user.save({ validateBeforeSave: true });

  const responseData = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    type: req.userType,
    status: req.user.status,
    createdAt: req.user.createdAt,
  };

  const message = requiresReverification
    ? 'Profile updated. Your delivery details are now pending admin re-verification.'
    : 'User profile updated';

  sendResponse(res, 200, message, responseData);
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
