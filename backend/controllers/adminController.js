import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Customer from '../models/Customer.js';
import RestaurantOwner from '../models/RestaurantOwner.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Admin from '../models/Admin.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import { sendEmail } from '../utils/email.js';
import { emitOrderUpdate, emitNewAvailableOrder, emitOrderAccepted, emitOrderAssignedToDriver } from '../socket.js';
import { applyStatusTimestamps } from '../utils/orderTimers.js';
import { settleOrderSplits } from '../services/walletService.js';

const buildDateRangeSeries = (daysCount, dailyRows) => {
  const rowMap = new Map(dailyRows.map((r) => [r._id, r]));
  const result = [];
  // Generate continuous IST dates ending today
  const nowIstMs = Date.now() + 5.5 * 3600 * 1000;
  const dayMs = 24 * 3600 * 1000;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(nowIstMs - i * dayMs);
    const isoDate = d.toISOString().slice(0, 10);
    const hit = rowMap.get(isoDate);
    result.push({
      date: isoDate,
      gmv: Math.round(hit?.gmv || 0),
      profit: Math.round(hit?.profit || 0),
      orders: hit?.orders || 0,
      deliveredOrders: hit?.deliveredOrders || 0,
    });
  }
  return result;
};

export const getStats = asyncHandler(async (req, res, next) => {
  const rangeParam = String(req.query.range || 'all').toLowerCase();
  const isAllTime = rangeParam === 'all';
  const rangeDays = rangeParam === '90d' ? 90 : rangeParam === '30d' ? 30 : 7;

  const startDate = new Date(Date.now() - (rangeDays - 1) * 24 * 3600 * 1000);
  startDate.setUTCHours(0, 0, 0, 0);
  const facetMatch = isAllTime ? {} : { createdAt: { $gte: startDate } };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    orderCount,
    restaurantCount,
    customerCount,
    activeDeliveryPartners,
    todayOrders,
    headlineTotals,
    analyticsFacet,
  ] = await Promise.all([
    Order.countDocuments(facetMatch),
    Restaurant.countDocuments(),
    Customer.countDocuments(),
    DeliveryPartner.countDocuments({ status: 'active', availability: true }),
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    Order.aggregate([
      { $match: { ...facetMatch, status: 'Delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          platformNetRevenue: {
            $sum: {
              $ifNull: [
                '$settlement.platformProfit',
                {
                  $add: [
                    5,
                    { $multiply: [{ $ifNull: ['$pricing.foodSubtotal', '$totalAmount'] }, 0.1] },
                  ],
                },
              ],
            },
          },
          avgDeliveryMinutes: {
            $avg: {
              $ifNull: [
                '$actualDeliveryMinutes',
                {
                  $cond: [
                    { $and: [{ $ne: ['$deliveredAt', null] }, { $ne: ['$createdAt', null] }] },
                    { $divide: [{ $subtract: ['$deliveredAt', '$createdAt'] }, 60000] },
                    null,
                  ],
                },
              ],
            },
          },
        },
      },
    ]),
    Order.aggregate([
      { $match: facetMatch },
      {
        $facet: {
          dailyRaw: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt',
                    timezone: '+05:30',
                  },
                },
                gmv: {
                  $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, '$totalAmount', 0] },
                },
                profit: {
                  $sum: {
                    $cond: [
                      { $eq: ['$status', 'Delivered'] },
                      {
                        $ifNull: [
                          '$settlement.platformProfit',
                          {
                            $add: [
                              5,
                              {
                                $multiply: [
                                  { $ifNull: ['$pricing.foodSubtotal', '$totalAmount'] },
                                  0.1,
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      0,
                    ],
                  },
                },
                orders: { $sum: 1 },
                deliveredOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
                },
              },
            },
          ],
          statusBreakdown: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          hourlyRaw: [
            {
              $group: {
                _id: { $hour: { date: '$createdAt', timezone: '+05:30' } },
                orders: { $sum: 1 },
              },
            },
          ],
          topRestaurants: [
            { $match: { status: { $ne: 'Cancelled' } } },
            {
              $group: {
                _id: { $ifNull: ['$restaurantName', 'Yumora Kitchen'] },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
          ],
          financialSplit: [
            { $match: { status: 'Delivered' } },
            {
              $group: {
                _id: null,
                restaurantShare: {
                  $sum: {
                    $ifNull: [
                      '$settlement.restaurantAmount',
                      { $multiply: [{ $ifNull: ['$pricing.foodSubtotal', '$totalAmount'] }, 0.9] },
                    ],
                  },
                },
                riderPayouts: {
                  $sum: {
                    $ifNull: [
                      '$settlement.deliveryPartnerAmount',
                      { $ifNull: ['$pricing.baseDeliveryFee', 30] },
                    ],
                  },
                },
                platformProfit: {
                  $sum: {
                    $ifNull: [
                      '$settlement.platformProfit',
                      {
                        $add: [
                          5,
                          { $multiply: [{ $ifNull: ['$pricing.foodSubtotal', '$totalAmount'] }, 0.1] },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]),
  ]);

  const facet = analyticsFacet[0] || {};
  const dailyRows = facet.dailyRaw || [];
  let effectiveDays = rangeDays;
  if (isAllTime) {
    if (dailyRows.length > 0) {
      const sortedDates = dailyRows.map((r) => r._id).sort();
      const firstMs = new Date(`${sortedDates[0]}T00:00:00Z`).getTime();
      const nowIstMs = Date.now() + 5.5 * 3600 * 1000;
      const spanDays = Math.ceil((nowIstMs - firstMs) / (24 * 3600 * 1000)) + 1;
      effectiveDays = Math.min(180, Math.max(7, spanDays));
    } else {
      effectiveDays = 30;
    }
  }
  const dailyTrend = buildDateRangeSeries(effectiveDays, dailyRows);

  const hourMap = new Map((facet.hourlyRaw || []).map((h) => [h._id, h.orders]));
  const hourlyDemand = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour < 12 ? 'a' : 'p'}`,
    orders: hourMap.get(hour) || 0,
  }));

  const statusBreakdown = (facet.statusBreakdown || []).map((s) => ({
    status: s._id || 'Placed',
    count: s.count,
  }));

  const topRestaurants = (facet.topRestaurants || []).map((r) => ({
    name: r._id,
    revenue: Math.round(r.revenue || 0),
    orders: r.orders,
  }));

  const splitDoc = facet.financialSplit?.[0] || {};
  const financialSplit = {
    restaurantShare: Math.round(splitDoc.restaurantShare || 0),
    riderPayouts: Math.round(splitDoc.riderPayouts || 0),
    platformProfit: Math.round(splitDoc.platformProfit || 0),
  };

  const headline = headlineTotals[0] || {};

  sendResponse(res, 200, 'Stats retrieved successfully', {
    range: isAllTime ? 'all' : `${rangeDays}d`,
    orderCount,
    restaurantCount,
    userCount: customerCount, // Keeping the key name userCount for frontend compatibility
    activeDeliveryPartners,
    todayOrders,
    avgDeliveryMinutes: headline.avgDeliveryMinutes ? Math.round(headline.avgDeliveryMinutes) : null,
    totalRevenue: Math.round(headline.totalRevenue || 0), // GMV
    platformNetRevenue: Math.round(headline.platformNetRevenue || 0),
    dailyTrend,
    statusBreakdown,
    hourlyDemand,
    topRestaurants,
    financialSplit,
  });
});

export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find().sort('-createdAt').lean();
  
  // Backwards compatibility: fetch customer name for older orders
  for (let order of orders) {
    if (!order.customerName && order.userId && order.userId !== 'guest') {
      try {
        const customer = await Customer.findById(order.userId);
        if (customer) {
          order.customerName = customer.name;
        }
      } catch (err) {
        console.error('Error fetching customer name for order', err);
      }
    }
  }

  sendResponse(res, 200, 'All orders retrieved successfully', orders);
});

export const updateOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (status === 'Cancelled') {
    const { cancelOrderService } = await import('../services/cancellationService.js');
    const cancelledOrder = await cancelOrderService(id, req.user, 'admin', reason || 'Cancelled by admin');
    return sendResponse(res, 200, 'Order cancelled and refund processed', cancelledOrder);
  }

  const existingOrder = await Order.findById(id);
  
  if (!existingOrder) {
    return next(new AppError('Order not found', 404));
  }

  applyStatusTimestamps(existingOrder, status);
  const order = await existingOrder.save();

  if (status === 'Delivered') {
    try {
      await settleOrderSplits(order._id);
    } catch (err) {
      console.error('Settlement error on admin updateOrder:', err);
    }
  }

  emitOrderUpdate(id, status, order);

  if (status === 'Ready for Pickup') {
    emitNewAvailableOrder(order);
  }

  sendResponse(res, 200, 'Order updated successfully', order);
});

export const assignDeliveryPerson = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { deliveryPersonId } = req.body;

  if (!deliveryPersonId) {
    return next(new AppError('Delivery person ID is required', 400));
  }

  const deliveryPerson = await DeliveryPartner.findById(deliveryPersonId);
  if (!deliveryPerson) {
    return next(new AppError('Invalid delivery person', 400));
  }

  const order = await Order.findByIdAndUpdate(
    id,
    {
      deliveryPersonId: deliveryPerson._id,
      deliveryPersonName: deliveryPerson.name,
      status: 'Out for Delivery',
      assignedAt: new Date()
    },
    { returnDocument: 'after' }
  );

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  emitOrderAccepted(id, { _id: deliveryPerson._id, name: deliveryPerson.name });
  emitOrderUpdate(id, 'Out for Delivery', order);
  emitOrderAssignedToDriver(deliveryPerson._id.toString(), order);

  sendResponse(res, 200, 'Delivery person assigned successfully', order);
});

export const getDeliveryPersons = asyncHandler(async (req, res, next) => {
  const deliveryPersons = await DeliveryPartner.find().select('name email phone status availability');
  sendResponse(res, 200, 'Delivery persons retrieved', deliveryPersons);
});

export const getAllRestaurants = asyncHandler(async (req, res, next) => {
  const restaurants = await Restaurant.find();
  sendResponse(res, 200, 'Restaurants retrieved', restaurants);
});

export const createRestaurant = asyncHandler(async (req, res, next) => {
  if (!req.body.id) {
    req.body.id = Date.now().toString();
  }
  
  if (req.file) {
    req.body.image = req.file.path;
  }

  const restaurant = await Restaurant.create(req.body);
  sendResponse(res, 201, 'Restaurant created', restaurant);
});

export const updateRestaurant = asyncHandler(async (req, res, next) => {
  if (req.file) {
    req.body.image = req.file.path;
  }

  const restaurant = await Restaurant.findOneAndUpdate({ id: req.params.id }, req.body, { returnDocument: 'after' });
  if (!restaurant) return next(new AppError('Restaurant not found', 404));
  sendResponse(res, 200, 'Restaurant updated', restaurant);
});

export const deleteRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findOneAndDelete({ id: req.params.id });
  if (!restaurant) return next(new AppError('Restaurant not found', 404));

  if (restaurant.ownerId) {
    await RestaurantOwner.findByIdAndDelete(restaurant.ownerId);
  }

  sendResponse(res, 200, 'Restaurant and owner deleted', null);
});

export const verifyRestaurant = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isVerified } = req.body;

  const restaurant = await Restaurant.findOneAndUpdate(
    { id },
    { isVerified },
    { returnDocument: 'after' }
  );

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  sendResponse(res, 200, `Restaurant ${isVerified ? 'verified' : 'unverified'} successfully`, restaurant);
});

export const updateRestaurantAvailability = asyncHandler(async (req, res, next) => {
  const { availability } = req.body;
  const { id } = req.params;

  if (typeof availability !== 'boolean') {
    return next(new AppError('Availability must be a boolean (true/false)', 400));
  }

  let restaurant = await Restaurant.findOneAndUpdate(
    { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
    { availability },
    { returnDocument: 'after' }
  );

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  sendResponse(res, 200, `Restaurant is now ${availability ? 'Open' : 'Closed'}`, restaurant);
});

// --- Users ---
export const getAllUsers = asyncHandler(async (req, res, next) => {
  // Aggregate all user types into one response
  const customers = await Customer.find().lean().then(docs => docs.map(d => ({ ...d, type: 'customer' })));
  const deliveryPartners = await DeliveryPartner.find().lean().then(docs => docs.map(d => ({ ...d, type: 'delivery', availability: d.availability ?? false, deliveryDetails: d })));
  
  const restaurantOwners = await RestaurantOwner.aggregate([
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: 'ownerId',
        as: 'restaurantDetails'
      }
    },
    {
      $unwind: {
        path: '$restaurantDetails',
        preserveNullAndEmptyArrays: true
      }
    }
  ]).then(docs => docs.map(d => ({ ...d, type: 'restaurant', availability: d.restaurantDetails?.availability ?? false })));

  const admins = await Admin.find().lean().then(docs => docs.map(d => ({ ...d, type: 'admin' })));

  const allUsers = [...customers, ...deliveryPartners, ...restaurantOwners, ...admins];
  // Sort by createdAt descending
  allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sendResponse(res, 200, 'Users retrieved', allUsers);
});

export const updateUserRole = asyncHandler(async (req, res, next) => {
  return next(new AppError('Roles can no longer be updated dynamically in the new architecture.', 400));
});

export const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { status, comment } = req.body;
  const userId = req.params.id;

  if (!status || !['pending', 'active', 'suspended', 'approved', 'rejected'].includes(status)) {
    return next(new AppError('Please provide a valid status', 400));
  }

  // Try to find the user in each collection
  let user = await Customer.findById(userId);
  let userType = 'customer';

  if (!user) {
    user = await RestaurantOwner.findById(userId);
    userType = 'restaurant';
  }
  if (!user) {
    user = await DeliveryPartner.findById(userId);
    userType = 'delivery';
  }

  if (!user) {
    const isAdmin = await Admin.findById(userId);
    if (isAdmin) {
      return next(new AppError('Cannot update status of Admin users', 403));
    }
    return next(new AppError('User not found', 404));
  }

  let finalStatus = status;
  if (userType === 'delivery') {
    if (status === 'active') finalStatus = 'approved';
    if (status === 'suspended') finalStatus = 'rejected';
  }

  user.status = finalStatus;
  await user.save({ validateBeforeSave: false });

  // Post-update actions based on role
  if (userType === 'restaurant') {
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (restaurant) {
      if (status === 'active' || status === 'approved') {
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          approvalStatus: 'approved',
          isActive: true
        });
      } else if (status === 'suspended' || status === 'rejected') {
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          approvalStatus: 'rejected',
          adminComment: comment || null,
          isActive: false
        });
      }
    }

    try {
      const emailSubject = (status === 'active' || status === 'approved') ? 'Your restaurant has been approved' : 'Your restaurant application was rejected';
      const emailText = (status === 'active' || status === 'approved')
        ? 'Congratulations! Your restaurant account is now approved and active.'
        : `We regret to inform you that your restaurant application was rejected. ${comment ? 'Comment: ' + comment : ''}`;
      await sendEmail(user.email, emailSubject, emailText);
    } catch (err) {
      console.log('Email notification failed:', err.message);
    }
  }

  if (userType === 'delivery') {
    try {
      const emailSubject = (status === 'active' || status === 'approved') ? 'Your delivery account has been approved' : 'Your delivery application was rejected';
      const emailText = (status === 'active' || status === 'approved')
        ? 'Congratulations! Your delivery account is now approved and active.'
        : `We regret to inform you that your delivery application was rejected. ${comment ? 'Comment: ' + comment : ''}`;
      await sendEmail(user.email, emailSubject, emailText);
    } catch (err) {
      console.log('Email notification failed:', err.message);
    }
  }

  sendResponse(res, 200, `User status updated to ${status}`, user);
});

export const updateUserAvailability = asyncHandler(async (req, res, next) => {
  const { availability } = req.body;
  const userId = req.params.id;

  if (typeof availability !== 'boolean') {
    return next(new AppError('Availability must be a boolean (true/false)', 400));
  }

  // 1. Try Delivery Partner
  let partner = await DeliveryPartner.findByIdAndUpdate(userId, { availability }, { new: true });
  if (partner) {
    return sendResponse(res, 200, `Rider availability set to ${availability ? 'Online' : 'Offline'}`, {
      _id: partner._id,
      type: 'delivery',
      availability: partner.availability
    });
  }

  // 2. Try Restaurant Owner (and update linked restaurant)
  const owner = await RestaurantOwner.findById(userId);
  if (owner) {
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: owner._id },
      { availability },
      { new: true }
    );
    return sendResponse(res, 200, `Restaurant availability set to ${availability ? 'Open' : 'Closed'}`, {
      _id: owner._id,
      type: 'restaurant',
      availability: restaurant?.availability ?? availability
    });
  }

  // 3. Try direct Restaurant ID
  const directRest = await Restaurant.findByIdAndUpdate(userId, { availability }, { new: true });
  if (directRest) {
    return sendResponse(res, 200, `Restaurant availability set to ${availability ? 'Open' : 'Closed'}`, {
      _id: directRest._id,
      type: 'restaurant',
      availability: directRest.availability
    });
  }

  return next(new AppError('User not found', 404));
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOneAndDelete({ id: req.params.id });
  if (!category) return next(new AppError('Category not found', 404));
  sendResponse(res, 200, 'Category deleted', null);
});

export const getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();
  sendResponse(res, 200, 'Categories retrieved', categories);
});

export const createCategory = asyncHandler(async (req, res, next) => {
  if (!req.body.id) req.body.id = Date.now().toString();
  
  if (req.file) {
    req.body.image = req.file.path;
  }

  const category = await Category.create(req.body);
  sendResponse(res, 201, 'Category created', category);
});

export const getAllBanners = asyncHandler(async (req, res, next) => {
  const banners = await Banner.find();
  sendResponse(res, 200, 'Banners retrieved', banners);
});

export const createBanner = asyncHandler(async (req, res, next) => {
  if (!req.body.id) req.body.id = Date.now().toString();

  if (req.file) {
    req.body.image = req.file.path;
  }

  const banner = await Banner.create(req.body);
  sendResponse(res, 201, 'Banner created', banner);
});

export const deleteBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findOneAndDelete({ id: req.params.id });
  if (!banner) return next(new AppError('Banner not found', 404));
  sendResponse(res, 200, 'Banner deleted', null);
});

// --- Admins Management (Super Admin Only) ---
export const getAdminUsers = asyncHandler(async (req, res, next) => {
  const admins = await Admin.find().select('-password').sort('-createdAt');
  sendResponse(res, 200, 'Admins retrieved successfully', admins);
});

export const createAdminUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, permissions } = req.body;
  if (!name || !email || !password) {
    return next(new AppError('Name, email, and password are required', 400));
  }
  
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return next(new AppError('Admin with this email already exists', 400));
  }
  
  const newAdmin = await Admin.create({
    name,
    email,
    password,
    permissions: permissions || [],
    status: 'active'
  });
  
  newAdmin.password = undefined;
  sendResponse(res, 201, 'Admin created successfully', newAdmin);
});

export const updateAdminPermissions = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { permissions, status } = req.body;
  
  if (id === req.user.id) {
    return next(new AppError('You cannot update your own permissions/status here', 400));
  }
  
  const updateData = {};
  if (permissions !== undefined) updateData.permissions = permissions;
  if (status !== undefined) updateData.status = status;
  
  const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
  
  if (!updatedAdmin) {
    return next(new AppError('Admin not found', 404));
  }
  
  sendResponse(res, 200, 'Admin updated successfully', updatedAdmin);
});

