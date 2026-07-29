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
import { emitOrderUpdate, emitNewAvailableOrder, emitOrderAccepted } from '../socket.js';

export const getStats = asyncHandler(async (req, res, next) => {
  const orderCount = await Order.countDocuments();
  const restaurantCount = await Restaurant.countDocuments();
  const customerCount = await Customer.countDocuments();
  
  const revenue = await Order.aggregate([
    { $match: { status: 'Delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  sendResponse(res, 200, 'Stats retrieved successfully', {
    orderCount,
    restaurantCount,
    userCount: customerCount, // Keeping the key name userCount for frontend compatibility
    totalRevenue: revenue[0]?.total || 0
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
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
  
  if (!order) {
    return next(new AppError('Order not found', 404));
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

  sendResponse(res, 200, 'Delivery person assigned successfully', order);
});

export const getDeliveryPersons = asyncHandler(async (req, res, next) => {
  const deliveryPersons = await DeliveryPartner.find().select('name email phone status');
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

// --- Users ---
export const getAllUsers = asyncHandler(async (req, res, next) => {
  // Aggregate all user types into one response
  const customers = await Customer.find().lean().then(docs => docs.map(d => ({ ...d, type: 'customer' })));
  const deliveryPartners = await DeliveryPartner.find().lean().then(docs => docs.map(d => ({ ...d, type: 'delivery', deliveryDetails: d })));
  
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
  ]).then(docs => docs.map(d => ({ ...d, type: 'restaurant' })));

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

