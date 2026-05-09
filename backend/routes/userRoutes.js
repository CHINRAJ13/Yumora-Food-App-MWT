import express from 'express';
import { getMe, updateMe } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes after this middleware are protected
router.use(protect);

router.get('/me', getMe);
router.patch('/updateMe', updateMe);

export default router;
