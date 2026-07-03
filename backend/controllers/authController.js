import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import DeliveryProfile from '../models/DeliveryProfile.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { createSendToken } from '../utils/jwt.js';
import { sendSMS } from '../utils/sms.js';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 */
export const register = asyncHandler(async (req, res, next) => {
  let {
    name, email, password, phone, role,
    restaurantName, cuisines,
    vehicleNumber, licenseNumber, vehicleType,
    aadharNumber
  } = req.body;

  // console.log(req.body)

  // Sanitize role: Only allow public roles, default to 'user'
  const allowedPublicRoles = ['user', 'delivery', 'restaurant'];
  const finalRole = (role && allowedPublicRoles.includes(role)) ? role : 'user';

  if (finalRole === 'delivery' || finalRole === 'restaurant') {
    if (!phone || phone.trim() === "") {
      return next(new AppError(`Phone number is required to register as a ${finalRole}.`, 400));
    }
    if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
      return next(new AppError('A valid 12-digit Aadhar number is required.', 400));
    }
  } else {
    if (!phone || phone.trim() === "") {
      phone = undefined;
    }
  }

  // Set initial status based on role
  const initialStatus = (finalRole === 'restaurant' || finalRole === 'delivery') ? 'pending' : 'active';

  let imagePath = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000';
  let aadharImagePath = null;
  let licenseImagePath = null;

  if (req.files) {
    if (req.files.image && req.files.image[0]) imagePath = req.files.image[0].path;
    if (req.files.aadharImage && req.files.aadharImage[0]) aadharImagePath = req.files.aadharImage[0].path;
    if (req.files.licenseImage && req.files.licenseImage[0]) licenseImagePath = req.files.licenseImage[0].path;
  }

  const newUser = await User.create({
    name,
    email,
    password,
    phone,
    roles: [finalRole],
    status: initialStatus,
  });

  // If Delivery rider, create a DeliveryProfile document
  if (finalRole === 'delivery') {
    if (!aadharImagePath) return next(new AppError('Aadhar image is required', 400));
    if (!licenseImagePath) return next(new AppError('License image is required', 400));

    await DeliveryProfile.create({
      userId: newUser._id,
      status: 'pending',
      vehicleNumber,
      licenseNumber,
      vehicleType: vehicleType || 'Bike',
      aadharNumber,
      aadharImage: aadharImagePath,
      licenseImage: licenseImagePath
    });
  }

  // If Restaurant owner, create the Restaurant document
  if (finalRole === 'restaurant') {
    if (!aadharImagePath) return next(new AppError('Aadhar image is required', 400));

    const restaurantId = `rest_${Date.now()}`;
    await Restaurant.create({
      id: restaurantId,
      name: restaurantName || `${name}'s Restaurant`,
      ownerId: newUser._id,
      cuisines: cuisines ? cuisines.split(',').map(c => c.trim()) : ['Multicuisine'],
      image: imagePath,
      deliveryTime: '30-40 min',
      isVeg: false,
      rating: 0,
      isActive: false, // Hidden until admin approval
      approvalStatus: 'pending',
      aadharNumber,
      aadharImage: aadharImagePath
    });
  }

  // If user is pending (restaurant or delivery), respond with pending message
  if (newUser.status === 'pending') {
    return res.status(201).json({
      status: 'success',
      message: 'Registration successful! Your account is pending admin approval.',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          roles: newUser.roles,
          status: newUser.status
        }
      }
    });
  }

  // For non-restaurant users, proceed with token creation
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

  // 3) Check if account is active
  if (user.status === 'pending') {
    return next(new AppError('Your account is pending approval by an admin.', 403));
  }

  if (user.status === 'suspended') {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  // Additional check for restaurant profile status
  if (user.roles.includes('restaurant')) {
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (restaurant && restaurant.approvalStatus === 'rejected') {
      return next(new AppError('Your restaurant application was rejected. Contact admin for details.', 403));
    }
  }

  // Additional check for delivery profile status
  if (user.roles.includes('delivery')) {
    const deliveryProfile = await DeliveryProfile.findOne({ userId: user._id });
    if (deliveryProfile && deliveryProfile.status === 'rejected') {
      return next(new AppError('Your delivery application was rejected. Contact admin for details.', 403));
    }
  }

  // 4) If everything ok, send token to client
  createSendToken(user, 200, res);
});

/**
 * @desc    Logout user
 * @route   GET /api/auth/logout
 */
export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'none'
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
      name: `User_${phone.slice(-4)}`
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

/**
 * @desc    Forgot Password
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return next(new AppError('Please provide email or phone number', 400));
  }

  // 1) Find user by email OR phone
  const user = await User.findOne({
    $or: [
      { email: email || 'never_match_placeholder' },
      { phone: phone || 'never_match_placeholder' }
    ]
  });

  if (!user) {
    return next(new AppError('No user found with that email or phone number', 404));
  }

  // 2) Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it via Email and SMS
  // Construct reset URL using Origin header (the frontend app that initiated the request)
  // Fallback to host if Origin is not available (e.g. from Postman)
  const origin = req.headers.origin || `${req.protocol}://${req.get('host').replace('5000', '8080')}`;
  const resetURL = `${origin}/#/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    if (user.email && (email || !phone)) {
      await sendEmail(user.email, 'Your password reset token (valid for 10 min)', message);
    }

    if (user.phone && (phone || !email)) {
      await sendSMS(user.phone, `Your password reset link: ${resetURL}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email/phone!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the message. Try again later!', 500));
  }
});

/**
 * @desc    Reset Password
 * @route   PATCH /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Log the user in, send JWT
  createSendToken(user, 200, res);
});

/**
 * @desc    Update Password
 * @route   PATCH /api/users/updateMyPassword
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If correct, update password
  user.password = req.body.password;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
