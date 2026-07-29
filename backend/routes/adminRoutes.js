import express from 'express';
import { 
  getStats, 
  getAllOrders, 
  updateOrder,
  assignDeliveryPerson,
  getDeliveryPersons,
  getAllRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, verifyRestaurant,
  getAllUsers, updateUserRole, updateUserStatus,
  getAllCategories, createCategory, deleteCategory,
  getAllBanners, createBanner, deleteBanner,
  getAdminUsers, createAdminUser, updateAdminPermissions
} from '../controllers/adminController.js';
import { protect, restrictTo, requireAdminPermission } from '../middleware/auth.js';
import { uploadRestaurant, uploadCategory, uploadBanner } from '../middleware/upload.js';

const router = express.Router();

// All routes here are protected and restricted to admin
router.use(protect);
router.use(restrictTo('admin'));

// Stats (allow super_admin or view_analytics)
router.get('/stats', requireAdminPermission('view_analytics'), getStats);

// Orders (allow monitor_orders)
router.get('/orders', requireAdminPermission('monitor_orders'), getAllOrders);
router.patch('/orders/:id', requireAdminPermission('monitor_orders'), updateOrder);
router.patch('/orders/:id/assign', requireAdminPermission('monitor_orders'), assignDeliveryPerson);

// Delivery Persons (needed for orders/restaurants)
router.get('/delivery-persons', getDeliveryPersons);

// Restaurants (allow manage_restaurants)
router.get('/restaurants', requireAdminPermission('manage_restaurants'), getAllRestaurants);
router.post('/restaurants', requireAdminPermission('manage_restaurants'), uploadRestaurant.single('image'), createRestaurant);
router.put('/restaurants/:id', requireAdminPermission('manage_restaurants'), uploadRestaurant.single('image'), updateRestaurant);
router.delete('/restaurants/:id', requireAdminPermission('manage_restaurants'), deleteRestaurant);
router.patch('/restaurants/:id/verify', requireAdminPermission('manage_restaurants'), verifyRestaurant);

// Users (allow manage_users or manage_approvals)
router.get('/users', requireAdminPermission('manage_users', 'manage_approvals'), getAllUsers);
router.patch('/users/:id/role', requireAdminPermission('manage_users', 'manage_approvals'), updateUserRole);
router.patch('/users/:id/status', requireAdminPermission('manage_users', 'manage_approvals'), updateUserStatus);

// Categories & Banners (allow manage_catalog)
router.get('/categories', requireAdminPermission('manage_catalog'), getAllCategories);
router.post('/categories', requireAdminPermission('manage_catalog'), uploadCategory.single('image'), createCategory);
router.delete('/categories/:id', requireAdminPermission('manage_catalog'), deleteCategory);

router.get('/banners', requireAdminPermission('manage_catalog'), getAllBanners);
router.post('/banners', requireAdminPermission('manage_catalog'), uploadBanner.single('image'), createBanner);
router.delete('/banners/:id', requireAdminPermission('manage_catalog'), deleteBanner);

// Admin Management (allow super_admin only)
router.get('/admins', requireAdminPermission('super_admin'), getAdminUsers);
router.post('/admins', requireAdminPermission('super_admin'), createAdminUser);
router.patch('/admins/:id/permissions', requireAdminPermission('super_admin'), updateAdminPermissions);

export default router;

