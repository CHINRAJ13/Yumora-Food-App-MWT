import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// Setup paths to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Admin credentials
    const adminEmail = 'chinrajmit@gmail.com';
    const adminPassword = '12345678'; // Standard secure password for testing
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists!');
      console.log(`Email: ${adminEmail}`);
      process.exit(0);
    }

    // Create the admin user
    const adminUser = await User.create({
      name: 'Chinraj',
      email: adminEmail,
      phone: '9047053739',
      password: adminPassword,
      roles: ['admin'],
      status: 'active'
    });

    console.log('✅ Admin user created successfully!');
    console.log('--- Credentials ---');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
