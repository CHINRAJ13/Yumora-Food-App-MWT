import express from 'express';
import {
  getProfile,
  getOrders,
  getActive,
  updateStatus,
  getStats,
  getMenu,
  updateMenu,
  toggleStatus,
  updateProfile
} from '../controllers/restaurantDashController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadFood } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication + restaurant role
router.use(protect, restrictTo('restaurant'));

router.get('/profile', getProfile);
router.patch('/profile', uploadFood.single('image'), updateProfile);
router.get('/orders', getOrders);
router.get('/orders/active', getActive);
router.patch('/orders/:id/status', updateStatus);
router.get('/stats', getStats);
router.get('/menu', getMenu);
router.put('/menu', updateMenu);
router.post('/menu/upload', uploadFood.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
  }
  res.status(200).json({
    status: 'success',
    data: { url: req.file.path }
  });
});
router.patch('/toggle-status', toggleStatus);

export default router;
