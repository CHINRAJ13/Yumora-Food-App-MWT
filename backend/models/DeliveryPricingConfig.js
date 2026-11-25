import mongoose from 'mongoose';

const DeliverySlabSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  minKm: { type: Number, required: true, min: 0 },
  maxKm: { type: Number, default: null }, // null = open-ended (e.g. 6+ km)
  chargeType: {
    type: String,
    enum: ['flat', 'per_km'],
    required: true,
    default: 'per_km'
  },
  amount: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true }
});

export const DEFAULT_SLABS = [
  { label: 'Base Distance (0 – 2 km)', minKm: 0, maxKm: 2, chargeType: 'flat', amount: 25, isActive: true },
  { label: 'Standard Tier (2 – 6 km)', minKm: 2, maxKm: 6, chargeType: 'per_km', amount: 8, isActive: true },
  { label: 'Long Distance (6+ km)', minKm: 6, maxKm: null, chargeType: 'per_km', amount: 12, isActive: true }
];

const DeliveryPricingConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    slabs: {
      type: [DeliverySlabSchema],
      default: () => DEFAULT_SLABS
    },
    freeDeliveryEnabled: { type: Boolean, default: true },
    freeDeliveryMinSubtotal: { type: Number, default: 199, min: 0 },
    freeDeliveryMaxDistanceKm: { type: Number, default: 5, min: 0 },
    longDistanceSubsidy: { type: Number, default: 25, min: 0 },
    surgeFee: { type: Number, default: 0, min: 0 },
    surgeLabel: { type: String, default: '', trim: true },
    roadFactorMultiplier: { type: Number, default: 1.25, min: 1, max: 3 },
    fallbackDistanceKm: { type: Number, default: 2.5, min: 0.5, max: 50 },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model('DeliveryPricingConfig', DeliveryPricingConfigSchema);
