import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Admin from '../models/Admin.js';
import connectDB from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'chinrajmit@gmail.com';
    const adminPassword = '12345678'; 
    
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists!');
      console.log(`Email: ${adminEmail}`);
      process.exit(0);
    }

    const adminUser = await Admin.create({
      name: 'Chinraj',
      email: adminEmail,
      password: adminPassword,
      permissions: ['super_admin'],
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
