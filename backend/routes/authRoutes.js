import express from 'express';
import { 
  register, 
  login, 
  logout, 
  sendOTP, 
  verifyOTP 
} from '../controllers/authController.js';

import validate from '../middleware/validate.js';
import { 
  registerSchema, 
  loginSchema, 
  otpSchema, 
  verifyOtpSchema 
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/logout', logout);
router.post('/send-otp', validate(otpSchema), sendOTP);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOTP);

export default router;
