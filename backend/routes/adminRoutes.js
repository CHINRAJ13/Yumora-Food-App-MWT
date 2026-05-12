import express from 'express';
import { 
  getStats, 
  getAllOrders, 
  updateOrder,
  assignDeliveryPerson,
  getDeliveryPersons,
  getAllRestaurants, createRestaurant, updateRestaurant, deleteRestaurant,
  getAllUsers, updateUserRole, updateUserStatus,
  getAllCategories, createCategory, deleteCategory,
  getAllBanners, createBanner, deleteBanner
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadRestaurant, uploadCategory, uploadBanner } from '../middleware/upload.js';

const router = express.Router();

// All routes here are protected and restricted to admin
router.use(protect);
router.use(restrictTo('admin'));

// Stats
router.get('/stats', getStats);

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrder);
router.patch('/orders/:id/assign', assignDeliveryPerson);

// Delivery Persons
router.get('/delivery-persons', getDeliveryPersons);

// Restaurants
router.get('/restaurants', getAllRestaurants);
router.post('/restaurants', uploadRestaurant.single('image'), createRestaurant);
router.put('/restaurants/:id', uploadRestaurant.single('image'), updateRestaurant);
router.delete('/restaurants/:id', deleteRestaurant);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);

// Categories
router.get('/categories', getAllCategories);
router.post('/categories', uploadCategory.single('image'), createCategory);
router.delete('/categories/:id', deleteCategory);

// Banners
router.get('/banners', getAllBanners);
router.post('/banners', uploadBanner.single('image'), createBanner);
router.delete('/banners/:id', deleteBanner);

export default router;

