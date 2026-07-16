import User from '../models/User.js';
import DeliveryProfile from '../models/DeliveryProfile.js';
import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Build comprehensive profile response with role-specific data
  const profileData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    status: user.status,
    availability: user.availability,
    createdAt: user.createdAt,
  };

  // Add delivery-specific fields from DeliveryProfile collection
  if (user.roles.includes('delivery')) {
    const deliveryProfile = await DeliveryProfile.findOne({ userId: user._id });
    if (deliveryProfile) {
      profileData.deliveryProfile = {
        status: deliveryProfile.status,
        vehicleNumber: deliveryProfile.vehicleNumber,
        licenseNumber: deliveryProfile.licenseNumber,
        vehicleType: deliveryProfile.vehicleType,
        rating: deliveryProfile.rating,
        totalRatings: deliveryProfile.totalRatings,
        adminComment: deliveryProfile.adminComment
      };
    }
  }

  // Add restaurant-specific fields from Restaurant collection
  if (user.roles.includes('restaurant')) {
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

  sendResponse(res, 200, 'User profile fetched', profileData);
});

/**
 * @desc    Update current user profile
 * @route   PATCH /api/users/updateMe
 * @access  Private
 */
export const updateMe = asyncHandler(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filter allowed general fields (name is always allowed)
  const filteredBody = filterObj(req.body, 'name');

  // 3) Conditionally allow email and phone updates ONLY if they are not already set
  // Email logic
  if (!req.user.email && req.body.email) {
    filteredBody.email = req.body.email;
  } else if (req.user.email && req.body.email && req.body.email !== req.user.email) {
    return next(new AppError('Email is already set and cannot be changed.', 400));
  }

  // Phone logic
  if (!req.user.phone && req.body.phone) {
    filteredBody.phone = req.body.phone;
  } else if (req.user.phone && req.body.phone && req.body.phone !== req.user.phone) {
    return next(new AppError('Phone number is already set and cannot be changed.', 400));
  }

  // 4) Handle delivery-specific field updates with re-verification
  let requiresReverification = false;
  if (req.user.roles.includes('delivery') && req.body.deliveryDetails) {
    const allowedDeliveryFields = ['vehicleNumber', 'licenseNumber', 'vehicleType'];
    const deliveryProfile = await DeliveryProfile.findOne({ userId: req.user._id });
    const incomingDetails = req.body.deliveryDetails;

    if (deliveryProfile) {
      // Check if any delivery detail actually changed
      for (const field of allowedDeliveryFields) {
        if (incomingDetails[field] !== undefined && incomingDetails[field] !== deliveryProfile[field]) {
          requiresReverification = true;
          break;
        }
      }

      // Update the DeliveryProfile document
      const profileUpdate = {};
      allowedDeliveryFields.forEach(field => {
        if (incomingDetails[field] !== undefined) {
          profileUpdate[field] = incomingDetails[field];
        }
      });

      // Reset delivery profile status to pending for admin re-verification
      if (requiresReverification) {
        profileUpdate.status = 'pending';
        // Also set user account to pending
        filteredBody.status = 'pending';
      }

      await DeliveryProfile.findByIdAndUpdate(deliveryProfile._id, profileUpdate);
    }
  }

  // 5) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  // Build response with role-specific data
  const responseData = {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    roles: updatedUser.roles,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt,
  };

  if (updatedUser.roles.includes('delivery')) {
    const deliveryProfile = await DeliveryProfile.findOne({ userId: updatedUser._id });
    if (deliveryProfile) {
      responseData.deliveryProfile = {
        status: deliveryProfile.status,
        vehicleNumber: deliveryProfile.vehicleNumber,
        licenseNumber: deliveryProfile.licenseNumber,
        vehicleType: deliveryProfile.vehicleType
      };
    }
  }

  if (updatedUser.roles.includes('restaurant')) {
    const restaurant = await Restaurant.findOne({ ownerId: updatedUser._id });
    if (restaurant) {
      responseData.restaurant = {
        id: restaurant.id,
        name: restaurant.name,
        approvalStatus: restaurant.approvalStatus,
        isActive: restaurant.isActive
      };
    }
  }

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
