import express from 'express';
import { registerDeliveryPartner, loginDeliveryPartner } from '../controllers/deliveryAuthController.js';
import { uploadDelivery } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', uploadDelivery.fields([
  { name: 'aadharImage', maxCount: 1 },
  { name: 'licenseImage', maxCount: 1 },
  { name: 'rcImage', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'selfieImage', maxCount: 1 }
]), registerDeliveryPartner);

router.post('/login', loginDeliveryPartner);

export default router;
