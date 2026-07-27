import RestaurantOwner from '../models/RestaurantOwner.js';
import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { createSendToken } from '../utils/jwt.js';

export const registerRestaurantOwner = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, restaurantName, cuisines, aadharNumber, fssaiNumber } = req.body;

  if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
    return next(new AppError('A valid 12-digit Aadhar number is required.', 400));
  }
  
  if (!fssaiNumber) {
    return next(new AppError('FSSAI Certificate Number is required.', 400));
  }

  let imagePath = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000';
  let aadharImagePath = null;
  let fssaiCertificatePath = null;

  if (req.files) {
    if (req.files.image && req.files.image[0]) imagePath = req.files.image[0].path;
    if (req.files.aadharImage && req.files.aadharImage[0]) aadharImagePath = req.files.aadharImage[0].path;
    if (req.files.fssaiCertificate && req.files.fssaiCertificate[0]) fssaiCertificatePath = req.files.fssaiCertificate[0].path;
  }

  if (!aadharImagePath) return next(new AppError('Aadhar image is required', 400));
  if (!fssaiCertificatePath) return next(new AppError('FSSAI Certificate image is required', 400));

  const newOwner = await RestaurantOwner.create({
    name,
    email,
    password,
    phone,
    status: 'pending'
  });

  const restaurantId = `rest_${Date.now()}`;
  await Restaurant.create({
    id: restaurantId,
    name: restaurantName || `${name}'s Restaurant`,
    ownerId: newOwner._id,
    cuisines: cuisines ? cuisines.split(',').map(c => c.trim()) : ['Multicuisine'],
    image: imagePath,
    deliveryTime: '30-40 min',
    isVeg: false,
    rating: 0,
    isActive: false, 
    approvalStatus: 'pending',
    aadharNumber,
    aadharImage: aadharImagePath,
    fssaiNumber,
    fssaiCertificate: fssaiCertificatePath
  });

  res.status(201).json({
    status: 'success',
    message: 'Registration successful! Your account is pending admin approval.',
    data: {
      owner: {
        id: newOwner._id,
        name: newOwner.name,
        email: newOwner.email,
        status: newOwner.status
      }
    }
  });
});

export const loginRestaurantOwner = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const owner = await RestaurantOwner.findOne({ email }).select('+password');

  if (!owner || !(await owner.correctPassword(password, owner.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (owner.status === 'pending') {
    return next(new AppError('Your account is pending approval by an admin.', 403));
  }

  if (owner.status === 'suspended') {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  const restaurant = await Restaurant.findOne({ ownerId: owner._id });
  if (restaurant && restaurant.approvalStatus === 'rejected') {
    return next(new AppError('Your restaurant application was rejected. Contact admin for details.', 403));
  }

  createSendToken(owner, 200, res, 'restaurant');
});
