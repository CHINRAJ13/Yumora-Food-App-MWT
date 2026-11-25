import DeliveryPricingConfig, { DEFAULT_SLABS } from '../models/DeliveryPricingConfig.js';
import { parseEstimatedMinutes } from '../utils/orderTimers.js';

export const DEFAULT_PRICING_CONFIG = {
  slabs: DEFAULT_SLABS,
  freeDeliveryEnabled: true,
  freeDeliveryMinSubtotal: 199,
  freeDeliveryMaxDistanceKm: 5,
  longDistanceSubsidy: 25,
  surgeFee: 0,
  surgeLabel: '',
  roadFactorMultiplier: 1.25,
  fallbackDistanceKm: 2.5,
};

// Fast in-memory cache so quote & checkout stay sub-millisecond
let cachedPricingConfig = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60 * 1000;

export const invalidatePricingConfigCache = () => {
  cachedPricingConfig = null;
  cacheLoadedAt = 0;
};

/**
 * Load active pricing configuration from MongoDB (auto-seeding defaults if empty).
 */
export const getActivePricingConfig = async () => {
  if (cachedPricingConfig && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedPricingConfig;
  }

  let doc = await DeliveryPricingConfig.findOne({ key: 'default' }).lean();
  if (!doc) {
    const created = await DeliveryPricingConfig.create({
      key: 'default',
      ...DEFAULT_PRICING_CONFIG,
    });
    doc = created.toObject();
  }

  cachedPricingConfig = doc;
  cacheLoadedAt = Date.now();
  return doc;
};

/**
 * Validate slab list against negative values, invalid min/max, or overlapping active ranges.
 * Returns null if valid, or error string if invalid.
 */
export const validatePricingSlabs = (slabs = []) => {
  if (!Array.isArray(slabs) || slabs.length === 0) {
    return 'At least one delivery distance slab is required.';
  }

  for (const s of slabs) {
    if (!s.label || !String(s.label).trim()) {
      return 'Every slab must have a descriptive label.';
    }
    const minKm = Number(s.minKm);
    const maxKm = s.maxKm !== null && s.maxKm !== undefined && s.maxKm !== '' ? Number(s.maxKm) : null;
    const amount = Number(s.amount);

    if (Number.isNaN(minKm) || minKm < 0) {
      return `Invalid min distance for "${s.label}".`;
    }
    if (maxKm !== null && (Number.isNaN(maxKm) || maxKm <= minKm)) {
      return `Max distance must be greater than min distance for "${s.label}".`;
    }
    if (Number.isNaN(amount) || amount < 0) {
      return `Amount must be a non-negative number for "${s.label}".`;
    }
    if (!['flat', 'per_km'].includes(s.chargeType)) {
      return `Invalid chargeType for "${s.label}". Must be 'flat' or 'per_km'.`;
    }
  }

  const activeSorted = slabs
    .filter((s) => s.isActive !== false)
    .map((s) => ({
      label: s.label,
      minKm: Number(s.minKm),
      maxKm: s.maxKm !== null && s.maxKm !== undefined && s.maxKm !== '' ? Number(s.maxKm) : Infinity,
    }))
    .sort((a, b) => a.minKm - b.minKm);

  if (activeSorted.length === 0) {
    return 'At least one slab must remain active.';
  }

  for (let i = 0; i < activeSorted.length - 1; i++) {
    const curr = activeSorted[i];
    const next = activeSorted[i + 1];
    if (curr.maxKm > next.minKm) {
      return `Overlapping distance ranges between "${curr.label}" and "${next.label}".`;
    }
  }

  return null;
};

/**
 * Progressive slab evaluator supporting arbitrary flat & per-km slabs.
 */
export const evaluateDistanceSlabs = (distanceKm, slabs = DEFAULT_SLABS) => {
  const activeSlabs = (slabs || DEFAULT_SLABS)
    .filter((s) => s.isActive !== false)
    .sort((a, b) => Number(a.minKm) - Number(b.minKm));

  let total = 0;
  const breakdown = [];

  for (const slab of activeSlabs) {
    const minKm = Number(slab.minKm) || 0;
    const maxKm =
      slab.maxKm !== null && slab.maxKm !== undefined && slab.maxKm !== ''
        ? Number(slab.maxKm)
        : Infinity;
    const amount = Number(slab.amount) || 0;

    if (distanceKm <= minKm && minKm > 0) {
      continue;
    }

    if (slab.chargeType === 'flat') {
      if (distanceKm > 0 && (distanceKm > minKm || minKm === 0)) {
        total += amount;
        breakdown.push({
          label: slab.label,
          chargeType: 'flat',
          fee: amount,
          kmApplied: Math.max(0, Math.min(distanceKm, maxKm) - minKm),
        });
      }
    } else {
      const kmInBand = Math.max(0, Math.min(distanceKm, maxKm) - minKm);
      if (kmInBand > 0) {
        const billedKm = Math.ceil(kmInBand);
        const slabFee = billedKm * amount;
        total += slabFee;
        breakdown.push({
          label: slab.label,
          chargeType: 'per_km',
          fee: slabFee,
          kmApplied: billedKm,
          ratePerKm: amount,
        });
      }
    }
  }

  return { total, breakdown };
};

/**
 * Straight-line Haversine distance in km, multiplied by configurable urban road factor.
 */
export const calculateRoadDistanceKm = (lat1, lon1, lat2, lon2, roadFactor = 1.25) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadKm = R * c * (Number(roadFactor) || 1.25);
  return Math.round(roadKm * 10) / 10;
};

const isValidCoordPair = (lat, lng) =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  !Number.isNaN(lat) &&
  !Number.isNaN(lng) &&
  !(lat === 0 && lng === 0) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

/**
 * Compute distance-based delivery pricing quote & estimated delivery minutes
 * using Admin-configured slabs (with safe fallback to defaults).
 */
export const calculateDeliveryQuote = ({
  restaurant = null,
  customerLocation = null,
  foodSubtotal = 0,
  config = DEFAULT_PRICING_CONFIG,
  overrideDistanceKm = null,
}) => {
  const activeConfig = { ...DEFAULT_PRICING_CONFIG, ...(config || {}) };
  let distanceKm = null;
  let isEstimatedDistance = false;

  if (typeof overrideDistanceKm === 'number' && !Number.isNaN(overrideDistanceKm) && overrideDistanceKm >= 0) {
    distanceKm = Math.round(overrideDistanceKm * 10) / 10;
  } else {
    const restCoords = restaurant?.location?.coordinates;
    const restLng = Array.isArray(restCoords) ? Number(restCoords[0]) : NaN;
    const restLat = Array.isArray(restCoords) ? Number(restCoords[1]) : NaN;

    const custLat = customerLocation?.lat !== undefined ? Number(customerLocation.lat) : NaN;
    const custLng = customerLocation?.lng !== undefined ? Number(customerLocation.lng) : NaN;

    if (isValidCoordPair(restLat, restLng) && isValidCoordPair(custLat, custLng)) {
      distanceKm = calculateRoadDistanceKm(
        restLat,
        restLng,
        custLat,
        custLng,
        activeConfig.roadFactorMultiplier
      );
      if (distanceKm > 100) {
        distanceKm = activeConfig.fallbackDistanceKm || 2.5;
        isEstimatedDistance = true;
      }
    } else {
      isEstimatedDistance = true;
      const parsedDist =
        typeof restaurant?.distance === 'string'
          ? parseFloat(restaurant.distance)
          : NaN;
      distanceKm =
        !Number.isNaN(parsedDist) && parsedDist > 0 && parsedDist <= 50
          ? parsedDist
          : activeConfig.fallbackDistanceKm || 2.5;
    }
  }

  const { total: slabTotal, breakdown } = evaluateDistanceSlabs(distanceKm, activeConfig.slabs);
  const surgeFee = Number(activeConfig.surgeFee) > 0 ? Number(activeConfig.surgeFee) : 0;
  const baseDeliveryFee = Math.round(slabTotal + surgeFee);

  let deliveryFee = baseDeliveryFee;
  let isFreeDelivery = false;

  if (
    activeConfig.freeDeliveryEnabled &&
    Number(foodSubtotal) > Number(activeConfig.freeDeliveryMinSubtotal || 199)
  ) {
    if (distanceKm <= Number(activeConfig.freeDeliveryMaxDistanceKm || 5)) {
      deliveryFee = 0;
      isFreeDelivery = true;
    } else {
      const subsidy = Number(activeConfig.longDistanceSubsidy || 0);
      deliveryFee = Math.max(0, baseDeliveryFee - subsidy);
    }
  }

  const estimatedDeliveryMinutes = parseEstimatedMinutes(restaurant?.deliveryTime, distanceKm);

  return {
    distanceKm,
    isEstimatedDistance,
    baseDeliveryFee,
    deliveryFee,
    surgeFee,
    surgeLabel: surgeFee > 0 ? activeConfig.surgeLabel || 'Peak Surge' : '',
    isFreeDelivery,
    estimatedDeliveryMinutes,
    breakdown,
  };
};
