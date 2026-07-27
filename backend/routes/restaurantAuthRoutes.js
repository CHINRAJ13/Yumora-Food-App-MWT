import express from 'express';
import { registerRestaurantOwner, loginRestaurantOwner } from '../controllers/restaurantAuthController.js';
import { uploadRestaurant } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', uploadRestaurant.fields([
  { name: 'image', maxCount: 1 },
  { name: 'aadharImage', maxCount: 1 },
  { name: 'fssaiCertificate', maxCount: 1 }
]), registerRestaurantOwner);

router.post('/login', loginRestaurantOwner);

export default router;
