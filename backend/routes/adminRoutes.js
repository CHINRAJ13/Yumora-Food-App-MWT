import express from 'express';
import { 
  getStats, 
  getAllOrders, 
  updateOrder,
  assignDeliveryPerson,
  getDeliveryPersons,
  getAllRestaurants, createRestaurant, updateRestaurant, deleteRestaurant,
  getAllUsers, updateUserRole,
  getAllCategories, createCategory, deleteCategory,
  getAllBanners, createBanner, deleteBanner
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';

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
router.post('/restaurants', createRestaurant);
router.put('/restaurants/:id', updateRestaurant);
router.delete('/restaurants/:id', deleteRestaurant);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);

// Categories
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// Banners
router.get('/banners', getAllBanners);
router.post('/banners', createBanner);
router.delete('/banners/:id', deleteBanner);

export default router;

