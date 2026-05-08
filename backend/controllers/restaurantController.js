import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendResponse } from '../utils/responseFormatter.js';

/**
 * @desc    Get all restaurants (with filtering, sorting, pagination)
 * @route   GET /api/restaurants
 * @access  Public
 */
export const getAllRestaurants = asyncHandler(async (req, res, next) => {
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
  excludedFields.forEach(el => delete queryObj[el]);

  // 2) Search
  let filter = {};
  if (req.query.search) {
    filter = {
      $or: [
        { name: { $regex: req.query.search, $options: 'i' } },
        { cuisines: { $regex: req.query.search, $options: 'i' } }
      ]
    };
  }

  // Category filter
  if (req.query.category) {
    filter.cuisines = { $regex: req.query.category, $options: 'i' };
  }

  // Veg filter
  if (req.query.isVeg !== undefined) {
    filter.isVeg = req.query.isVeg === 'true';
  }

  // 3) Sorting
  let sortBy = '-rating'; // Default: highest rated
  if (req.query.sort) {
    sortBy = req.query.sort.split(',').join(' ');
  }

  // 4) Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const restaurants = await Restaurant.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  const total = await Restaurant.countDocuments(filter);

  sendResponse(res, 200, 'Restaurants fetched successfully', restaurants, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});

/**
 * @desc    Get single restaurant by ID
 * @route   GET /api/restaurants/:id
 * @access  Public
 */
export const getRestaurantById = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findOne({ id: req.params.id });

  if (!restaurant) {
    return next(new AppError('No restaurant found with that ID', 404));
  }

  sendResponse(res, 200, 'Restaurant fetched successfully', restaurant);
});
