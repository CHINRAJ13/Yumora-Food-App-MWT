import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import DeliveryPricingConfig, { DEFAULT_SLABS } from '../models/DeliveryPricingConfig.js';
import {
  DEFAULT_PRICING_CONFIG,
  getActivePricingConfig,
  invalidatePricingConfigCache,
  validatePricingSlabs,
} from '../services/pricingService.js';

/**
 * @desc    Get active distance-based delivery pricing configuration
 * @route   GET /api/admin/delivery-pricing
 * @access  Admin
 */
export const getDeliveryPricing = asyncHandler(async (req, res) => {
  const config = await getActivePricingConfig();
  sendResponse(res, 200, 'Delivery pricing config retrieved', config);
});

/**
 * @desc    Update global pricing rules and/or slabs list
 * @route   PUT /api/admin/delivery-pricing
 * @access  Admin
 */
export const updateDeliveryPricing = asyncHandler(async (req, res, next) => {
  const {
    slabs,
    freeDeliveryEnabled,
    freeDeliveryMinSubtotal,
    freeDeliveryMaxDistanceKm,
    longDistanceSubsidy,
    surgeFee,
    surgeLabel,
    roadFactorMultiplier,
    fallbackDistanceKm,
  } = req.body;

  let config = await DeliveryPricingConfig.findOne({ key: 'default' });
  if (!config) {
    config = await DeliveryPricingConfig.create({ key: 'default', ...DEFAULT_PRICING_CONFIG });
  }

  if (slabs !== undefined) {
    const err = validatePricingSlabs(slabs);
    if (err) return next(new AppError(err, 400));
    config.slabs = slabs
      .map((s) => ({
        ...s,
        label: String(s.label).trim(),
        minKm: Number(s.minKm),
        maxKm: s.maxKm !== null && s.maxKm !== undefined && s.maxKm !== '' ? Number(s.maxKm) : null,
        amount: Number(s.amount),
        isActive: s.isActive !== false,
      }))
      .sort((a, b) => a.minKm - b.minKm);
  }

  if (freeDeliveryEnabled !== undefined) config.freeDeliveryEnabled = Boolean(freeDeliveryEnabled);
  if (freeDeliveryMinSubtotal !== undefined) config.freeDeliveryMinSubtotal = Math.max(0, Number(freeDeliveryMinSubtotal));
  if (freeDeliveryMaxDistanceKm !== undefined) config.freeDeliveryMaxDistanceKm = Math.max(0, Number(freeDeliveryMaxDistanceKm));
  if (longDistanceSubsidy !== undefined) config.longDistanceSubsidy = Math.max(0, Number(longDistanceSubsidy));
  if (surgeFee !== undefined) config.surgeFee = Math.max(0, Number(surgeFee));
  if (surgeLabel !== undefined) config.surgeLabel = String(surgeLabel).trim();
  if (roadFactorMultiplier !== undefined) {
    config.roadFactorMultiplier = Math.min(3, Math.max(1, Number(roadFactorMultiplier) || 1.25));
  }
  if (fallbackDistanceKm !== undefined) {
    config.fallbackDistanceKm = Math.min(50, Math.max(0.5, Number(fallbackDistanceKm) || 2.5));
  }
  config.updatedBy = req.user?._id || null;

  await config.save();
  invalidatePricingConfigCache();

  sendResponse(res, 200, 'Delivery pricing rules updated successfully', config);
});

/**
 * @desc    Add a new distance pricing slab
 * @route   POST /api/admin/delivery-pricing/slabs
 * @access  Admin
 */
export const addDeliveryPricingSlab = asyncHandler(async (req, res, next) => {
  const { label, minKm, maxKm, chargeType, amount, isActive = true } = req.body;

  let config = await DeliveryPricingConfig.findOne({ key: 'default' });
  if (!config) {
    config = await DeliveryPricingConfig.create({ key: 'default', ...DEFAULT_PRICING_CONFIG });
  }

  const newSlab = {
    label: String(label || '').trim(),
    minKm: Number(minKm),
    maxKm: maxKm !== null && maxKm !== undefined && maxKm !== '' ? Number(maxKm) : null,
    chargeType: chargeType || 'per_km',
    amount: Number(amount),
    isActive: isActive !== false,
  };

  const nextSlabs = [...config.slabs.map((s) => s.toObject()), newSlab];
  const err = validatePricingSlabs(nextSlabs);
  if (err) return next(new AppError(err, 400));

  config.slabs = nextSlabs.sort((a, b) => a.minKm - b.minKm);
  config.updatedBy = req.user?._id || null;
  await config.save();
  invalidatePricingConfigCache();

  sendResponse(res, 201, 'Distance slab added successfully', config);
});

/**
 * @desc    Edit an existing distance pricing slab
 * @route   PATCH /api/admin/delivery-pricing/slabs/:slabId
 * @access  Admin
 */
export const updateDeliveryPricingSlab = asyncHandler(async (req, res, next) => {
  const { slabId } = req.params;
  const config = await DeliveryPricingConfig.findOne({ key: 'default' });
  if (!config) return next(new AppError('Pricing configuration not found', 404));

  const idx = config.slabs.findIndex((s) => s._id.toString() === slabId);
  if (idx === -1) return next(new AppError('Distance slab not found', 404));

  const current = config.slabs[idx].toObject();
  const updatedSlab = {
    ...current,
    label: req.body.label !== undefined ? String(req.body.label).trim() : current.label,
    minKm: req.body.minKm !== undefined ? Number(req.body.minKm) : current.minKm,
    maxKm:
      req.body.maxKm !== undefined
        ? req.body.maxKm !== null && req.body.maxKm !== ''
          ? Number(req.body.maxKm)
          : null
        : current.maxKm,
    chargeType: req.body.chargeType !== undefined ? req.body.chargeType : current.chargeType,
    amount: req.body.amount !== undefined ? Number(req.body.amount) : current.amount,
    isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : current.isActive,
  };

  const nextSlabs = config.slabs.map((s, i) => (i === idx ? updatedSlab : s.toObject()));
  const err = validatePricingSlabs(nextSlabs);
  if (err) return next(new AppError(err, 400));

  config.slabs = nextSlabs.sort((a, b) => a.minKm - b.minKm);
  config.updatedBy = req.user?._id || null;
  await config.save();
  invalidatePricingConfigCache();

  sendResponse(res, 200, 'Distance slab updated successfully', config);
});

/**
 * @desc    Delete a distance pricing slab
 * @route   DELETE /api/admin/delivery-pricing/slabs/:slabId
 * @access  Admin
 */
export const deleteDeliveryPricingSlab = asyncHandler(async (req, res, next) => {
  const { slabId } = req.params;
  const config = await DeliveryPricingConfig.findOne({ key: 'default' });
  if (!config) return next(new AppError('Pricing configuration not found', 404));

  const nextSlabs = config.slabs
    .filter((s) => s._id.toString() !== slabId)
    .map((s) => s.toObject());

  if (nextSlabs.length === config.slabs.length) {
    return next(new AppError('Distance slab not found', 404));
  }

  const err = validatePricingSlabs(nextSlabs);
  if (err) return next(new AppError(err, 400));

  config.slabs = nextSlabs;
  config.updatedBy = req.user?._id || null;
  await config.save();
  invalidatePricingConfigCache();

  sendResponse(res, 200, 'Distance slab deleted successfully', config);
});

/**
 * @desc    Reset delivery pricing configuration back to defaults
 * @route   POST /api/admin/delivery-pricing/reset
 * @access  Admin
 */
export const resetDeliveryPricing = asyncHandler(async (req, res) => {
  let config = await DeliveryPricingConfig.findOne({ key: 'default' });
  if (!config) {
    config = new DeliveryPricingConfig({ key: 'default' });
  }

  config.slabs = DEFAULT_SLABS;
  config.freeDeliveryEnabled = DEFAULT_PRICING_CONFIG.freeDeliveryEnabled;
  config.freeDeliveryMinSubtotal = DEFAULT_PRICING_CONFIG.freeDeliveryMinSubtotal;
  config.freeDeliveryMaxDistanceKm = DEFAULT_PRICING_CONFIG.freeDeliveryMaxDistanceKm;
  config.longDistanceSubsidy = DEFAULT_PRICING_CONFIG.longDistanceSubsidy;
  config.surgeFee = DEFAULT_PRICING_CONFIG.surgeFee;
  config.surgeLabel = DEFAULT_PRICING_CONFIG.surgeLabel;
  config.roadFactorMultiplier = DEFAULT_PRICING_CONFIG.roadFactorMultiplier;
  config.fallbackDistanceKm = DEFAULT_PRICING_CONFIG.fallbackDistanceKm;
  config.updatedBy = req.user?._id || null;

  await config.save();
  invalidatePricingConfigCache();

  sendResponse(res, 200, 'Delivery pricing reset to platform defaults', config);
});
