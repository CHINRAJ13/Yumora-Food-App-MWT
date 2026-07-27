import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Setup Storage for different categories
const createStorage = (folder) => new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: `crave-quest/${folder}`,
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

// Middlewares
export const uploadProfile = multer({ storage: createStorage('profiles') });
export const uploadRestaurant = multer({ storage: createStorage('restaurants') });
export const uploadFood = multer({ storage: createStorage('foods') });
export const uploadBanner = multer({ storage: createStorage('banners') });
export const uploadCategory = multer({ storage: createStorage('categories') });
export const uploadDelivery = multer({ storage: createStorage('deliveries') });
