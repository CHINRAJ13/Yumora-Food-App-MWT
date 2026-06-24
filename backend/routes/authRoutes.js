import express from 'express';
import { 
  register, 
  login, 
  logout, 
  sendOTP, 
  verifyOTP,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';

import validate from '../middleware/validate.js';
import { 
  registerSchema, 
  loginSchema, 
  otpSchema, 
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authValidator.js';
import { uploadRestaurant } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', uploadRestaurant.fields([
  { name: 'image', maxCount: 1 },
  { name: 'aadharImage', maxCount: 1 },
  { name: 'licenseImage', maxCount: 1 }
]), validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/logout', logout);
router.post('/send-otp', validate(otpSchema), sendOTP);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOTP);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.patch('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

export default router;
