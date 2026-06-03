// seed.js — Database Seeder
// Run this script once to populate the database with test data.
// Command: node seed.js
//
// This will CREATE:
//   - 1 Admin user  (admin@test.com / password123)
//   - 1 Seller user (seller@test.com / password123)
//   - 10 Sample products

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// ─── Sample Products ───────────────────────────────────────────────────────────
// All prices are stored as pricePerBaseUnit (per gram or per mL)
// Weights are stored in grams, Volumes in milliliters
const sampleProducts = [
  {
    name: 'Acetic Acid',
    sku: 'CHEM-001',
    category: 'Chemical',
    baseUnit: 'ml',
    pricePerBaseUnit: 0.8,      // ₹0.8 per mL = ₹800 per L
    stockQuantity: 50000,       // 50,000 mL = 50 L in stock
  },
  {
    name: 'Sodium Chloride (NaCl)',
    sku: 'CHEM-002',
    category: 'Chemical',
    baseUnit: 'g',
    pricePerBaseUnit: 0.05,     // ₹0.05 per g = ₹50 per kg
    stockQuantity: 100000,      // 100 kg in stock
  },
  {
    name: 'Hydrochloric Acid (HCl)',
    sku: 'CHEM-003',
    category: 'Chemical',
    baseUnit: 'ml',
    pricePerBaseUnit: 1.2,      // ₹1.2 per mL = ₹1200 per L
    stockQuantity: 20000,       // 20 L in stock
  },
  {
    name: 'Ethanol (95%)',
    sku: 'SOLV-001',
    category: 'Solvent',
    baseUnit: 'ml',
    pricePerBaseUnit: 0.5,      // ₹0.5 per mL = ₹500 per L
    stockQuantity: 200000,      // 200 L in stock
  },
  {
    name: 'Glucose (Dextrose)',
    sku: 'CHEM-004',
    category: 'Chemical',
    baseUnit: 'g',
    pricePerBaseUnit: 0.1,      // ₹0.1 per g = ₹100 per kg
    stockQuantity: 500000,      // 500 kg in stock
  },
  {
    name: 'Sulfuric Acid (H2SO4)',
    sku: 'CHEM-005',
    category: 'Chemical',
    baseUnit: 'ml',
    pricePerBaseUnit: 2.0,      // ₹2 per mL = ₹2000 per L
    stockQuantity: 10000,       // 10 L in stock
  },
  {
    name: 'Potassium Permanganate',
    sku: 'CHEM-006',
    category: 'Chemical',
    baseUnit: 'g',
    pricePerBaseUnit: 0.8,      // ₹0.8 per g = ₹800 per kg
    stockQuantity: 25000,       // 25 kg in stock
  },
  {
    name: 'Distilled Water',
    sku: 'SOLV-002',
    category: 'Solvent',
    baseUnit: 'ml',
    pricePerBaseUnit: 0.01,     // ₹0.01 per mL = ₹10 per L
    stockQuantity: 1000000,     // 1000 L in stock
  },
  {
    name: 'Beaker (250 mL)',
    sku: 'GLAS-001',
    category: 'Glassware',
    baseUnit: 'item',
    pricePerBaseUnit: 180,      // ₹180 per beaker
    stockQuantity: 500,
  },
  {
    name: 'Pipette (10 mL)',
    sku: 'GLAS-002',
    category: 'Glassware',
    baseUnit: 'item',
    pricePerBaseUnit: 45,       // ₹45 per pipette
    stockQuantity: 1000,
  },
];

// ─── Main Seed Function ────────────────────────────────────────────────────────
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data to start fresh
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create Admin user
    // Note: bcrypt hashing is done automatically by the User model's pre-save hook
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Create Seller user
    const sellerUser = await User.create({
      name: 'Seller User',
      email: 'seller@test.com',
      password: 'password123',
      role: 'seller',
    });
    console.log('✅ Seller user created:', sellerUser.email);

    // Create sample products
    await Product.insertMany(sampleProducts);
    console.log(`✅ ${sampleProducts.length} products created`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('─────────────────────────────────');
    console.log('Admin:  admin@test.com  / password123');
    console.log('Seller: seller@test.com / password123');
    console.log('─────────────────────────────────');

    process.exit(0); // Exit with success
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1); // Exit with failure
  }
};

seedDatabase();
