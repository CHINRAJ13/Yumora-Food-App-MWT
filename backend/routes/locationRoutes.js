import express from 'express';
import { getRoute, getAddress } from '../controllers/locationController.js';

const router = express.Router();

// POST /api/locations/route — Get driving route polyline
router.post('/route', getRoute);

// POST /api/locations/address — Reverse geocode lat/lng to address
router.post('/address', getAddress);

export default router;
