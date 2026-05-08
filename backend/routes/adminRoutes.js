import express from 'express';
import { 
  getStats, 
  getAllOrders, 
  updateOrder 
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes here are protected and restricted to admin
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getStats);
router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrder);

export default router;
