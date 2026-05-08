import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseFormatter.js';

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();
  sendResponse(res, 200, 'Categories fetched successfully', categories);
});

/**
 * @desc    Get all banners
 * @route   GET /api/banners
 * @access  Public
 */
export const getAllBanners = asyncHandler(async (req, res, next) => {
  const banners = await Banner.find();
  sendResponse(res, 200, 'Banners fetched successfully', banners);
});
