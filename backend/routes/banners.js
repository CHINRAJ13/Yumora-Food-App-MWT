import express from 'express';
import { getAllBanners } from '../controllers/catalogController.js';

const router = express.Router();

router.get('/', getAllBanners);

export default router;
