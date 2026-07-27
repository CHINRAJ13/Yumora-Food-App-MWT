import DeliveryPartner from '../models/DeliveryPartner.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { createSendToken } from '../utils/jwt.js';

export const registerDeliveryPartner = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, vehicleNumber, licenseNumber, vehicleType, aadharNumber, panNumber, accountNumber, ifscCode } = req.body;

  if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
    return next(new AppError('A valid 12-digit Aadhar number is required.', 400));
  }
  
  if (!panNumber || !accountNumber || !ifscCode) {
    return next(new AppError('PAN, Account Number and IFSC Code are required.', 400));
  }

  let aadharImagePath = null;
  let licenseImagePath = null;
  let rcImagePath = null;
  let panImagePath = null;
  let selfieImagePath = null;

  if (req.files) {
    if (req.files.aadharImage && req.files.aadharImage[0]) aadharImagePath = req.files.aadharImage[0].path;
    if (req.files.licenseImage && req.files.licenseImage[0]) licenseImagePath = req.files.licenseImage[0].path;
    if (req.files.rcImage && req.files.rcImage[0]) rcImagePath = req.files.rcImage[0].path;
    if (req.files.panImage && req.files.panImage[0]) panImagePath = req.files.panImage[0].path;
    if (req.files.selfieImage && req.files.selfieImage[0]) selfieImagePath = req.files.selfieImage[0].path;
  }

  if (!aadharImagePath) return next(new AppError('Aadhar image is required', 400));
  if (!licenseImagePath) return next(new AppError('License image is required', 400));
  if (!rcImagePath) return next(new AppError('RC image is required', 400));
  if (!panImagePath) return next(new AppError('PAN image is required', 400));
  if (!selfieImagePath) return next(new AppError('Selfie image is required', 400));

  const partner = await DeliveryPartner.create({
    name,
    email,
    password,
    phone,
    vehicleNumber,
    licenseNumber,
    vehicleType: vehicleType || 'Bike',
    aadharNumber,
    aadharImage: aadharImagePath,
    licenseImage: licenseImagePath,
    rcImage: rcImagePath,
    panNumber,
    panImage: panImagePath,
    accountNumber,
    ifscCode,
    selfieImage: selfieImagePath,
    status: 'pending'
  });

  res.status(201).json({
    status: 'success',
    message: 'Registration successful! Your account is pending admin approval.',
    data: {
      partner: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        status: partner.status
      }
    }
  });
});

export const loginDeliveryPartner = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const partner = await DeliveryPartner.findOne({ email }).select('+password');

  if (!partner || !(await partner.correctPassword(password, partner.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (partner.status === 'pending') {
    return next(new AppError('Your account is pending approval by an admin.', 403));
  }

  if (partner.status === 'rejected') {
    return next(new AppError('Your application was rejected. Contact admin for details.', 403));
  }

  createSendToken(partner, 200, res, 'delivery');
});
