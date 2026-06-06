import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// Config & Utils
import connectDB from './config/db.js';
import AppError from './utils/AppError.js';
import errorHandler from './middleware/errorHandler.js';

// Socket
import { init as initSocket } from './socket.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurants.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/categories.js';
import bannerRoutes from './routes/banners.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import restaurantDashRoutes from './routes/restaurantDashRoutes.js';
import userRoutes from './routes/userRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to Database
connectDB();

const app = express();

// Required for express-rate-limit to work on Render/Heroku
app.set('trust proxy', 1);

// 1. GLOBAL MIDDLEWARES

// Security Headers
// app.use(helmet());
app.use(cookieParser());

// CORS
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
  "http://127.0.0.1:8083"
];

// Dynamically add production URLs from environment variables
if (process.env.PROD_FRONTEND_URLS) {
  const prodUrls = process.env.PROD_FRONTEND_URLS.split(',');
  allowedOrigins.push(...prodUrls);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('❌ CORS Blocked Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent Parameter Pollution
app.use(hpp({
  whitelist: ['price', 'rating', 'category'] // Allow duplicates for these fields
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 1/2 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body Parser
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 2. ROUTES
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/restaurant-dash', restaurantDashRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);

// 3. ERROR HANDLING
app.all('*', (req, res, next) => {
  console.log(`❌ 404 Route Not Found: ${req.method} ${req.originalUrl}`);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

// 4. START SERVER
const PORT = Number(process.env.PORT) || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Initialize Socket.io
initSocket(server);

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
