/**
 * Parse estimated delivery minutes from a restaurant's deliveryTime string (e.g. "25-35 mins")
 * and optionally adjust using distance in km.
 * @param {string} deliveryTimeStr
 * @param {number|null} distanceKm
 * @returns {number}
 */
export const parseEstimatedMinutes = (deliveryTimeStr, distanceKm = null) => {
  let baseMins = 35;

  if (typeof deliveryTimeStr === 'string' && deliveryTimeStr.trim()) {
    const matches = deliveryTimeStr.match(/\d+/g);
    if (matches && matches.length >= 2) {
      const low = parseInt(matches[0], 10);
      const high = parseInt(matches[1], 10);
      if (!Number.isNaN(low) && !Number.isNaN(high)) {
        baseMins = Math.round((low + high) / 2);
      }
    } else if (matches && matches.length === 1) {
      const val = parseInt(matches[0], 10);
      if (!Number.isNaN(val)) baseMins = val;
    }
  }

  if (typeof distanceKm === 'number' && !Number.isNaN(distanceKm) && distanceKm > 0) {
    // 18 min average prep + 3.5 min per km road travel
    const distanceBasedMins = Math.round(18 + distanceKm * 3.5);
    baseMins = Math.round((baseMins + distanceBasedMins) / 2);
  }

  return Math.min(90, Math.max(15, baseMins));
};

/**
 * Apply lifecycle milestone timestamps when an order transitions to a new status.
 * Works across Restaurant, Delivery Partner, and Admin updates.
 * @param {Object} order - Existing Mongoose order document or lean object
 * @param {string} newStatus
 * @returns {Object} patch fields to apply
 */
export const buildStatusTimestampPatch = (order, newStatus) => {
  const now = new Date();
  const patch = { status: newStatus };

  if (newStatus === 'Preparing' && !order?.preparingAt) {
    patch.preparingAt = now;
  }

  if (newStatus === 'Ready for Pickup') {
    if (!order?.preparingAt) patch.preparingAt = order?.createdAt || now;
    if (!order?.readyForPickupAt) patch.readyForPickupAt = now;
  }

  if (newStatus === 'Out for Delivery') {
    if (!order?.assignedAt) patch.assignedAt = now;
  }

  if (newStatus === 'Delivered') {
    if (!order?.deliveredAt) patch.deliveredAt = now;
    const createdAt = order?.createdAt ? new Date(order.createdAt) : now;
    const deliveredAt = order?.deliveredAt ? new Date(order.deliveredAt) : now;
    const diffMins = Math.max(1, Math.round((deliveredAt.getTime() - createdAt.getTime()) / 60000));
    patch.actualDeliveryMinutes = diffMins;
  }

  return patch;
};

/**
 * Mutate a Mongoose order document with lifecycle timestamps in place.
 * @param {Object} orderDoc
 * @param {string} newStatus
 */
export const applyStatusTimestamps = (orderDoc, newStatus) => {
  const patch = buildStatusTimestampPatch(orderDoc, newStatus);
  Object.assign(orderDoc, patch);
  return orderDoc;
};
