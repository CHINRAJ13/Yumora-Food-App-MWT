import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';
import Category from './models/Category.js';
import Banner from './models/Banner.js';
import { restaurantsData } from './restaurantsData.js';

dotenv.config();

const categories = [
  { id: "1", name: "Biryani", emoji: "🍛" },
  { id: "2", name: "Dosa", emoji: "🥞" },
  { id: "3", name: "Meals", emoji: "🍽️" },
  { id: "4", name: "Chinese", emoji: "🥡" },
  { id: "5", name: "Sweets", emoji: "🍬" },
  { id: "6", name: "Snacks", emoji: "🍟" },
  { id: "7", name: "Parotta", emoji: "🫓" },
  { id: "8", name: "Chicken", emoji: "🍗" },
  { id: "9", name: "Desserts", emoji: "🍰" },
  { id: "10", name: "Beverages", emoji: "🥤" },
];

const banners = [
  { id: "1", title: "Flat ₹100 OFF", subtitle: "On your first KovaiCrave order", code: "KOVAI100", gradient: "from-primary to-accent" },
  { id: "2", title: "Free Delivery", subtitle: "On orders above ₹199", code: "FREEDEL", gradient: "from-success to-primary" },
  { id: "3", title: "₹75 Cashback", subtitle: "Pay via UPI & save more", code: "UPISAVE", gradient: "from-accent to-warning" },
  { id: "4", title: "FLAT 50% OFF", subtitle: "On select restaurants", code: "FLAT50", gradient: "from-warning to-primary" },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    await Restaurant.deleteMany({});
    await Category.deleteMany({});
    await Banner.deleteMany({});

    await Category.insertMany(categories);
    console.log('✅ Categories seeded');

    await Banner.insertMany(banners);
    console.log('✅ Banners seeded');

    // Normalize all data to ensure string IDs
    const normalized = restaurantsData.map(r => ({
      ...r,
      id: String(r.id),
      menu: (r.menu || []).map(m => ({ ...m, id: String(m.id) }))
    }));

    await Restaurant.insertMany(normalized);
    console.log(`✅ ${normalized.length} Restaurants seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
