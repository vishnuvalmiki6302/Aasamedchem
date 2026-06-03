// models/Product.js — Mongoose schema for Product collection
// All prices and quantities are stored in BASE UNITS (grams, milliliters, items)

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Human-readable product name
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },

    // Stock Keeping Unit — unique identifier for the product
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Category like "Chemical", "Glassware", "Reagent", etc.
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },

    // The base unit for this product:
    // Weight → 'g' (grams)
    // Volume → 'ml' (milliliters)
    // Count  → 'item'
    baseUnit: {
      type: String,
      enum: ['g', 'ml', 'item'],
      required: [true, 'Base unit is required'],
    },

    // Price per ONE base unit in INR
    // Example: If product costs ₹500/kg → store ₹0.5 per gram
    pricePerBaseUnit: {
      type: Number,
      required: [true, 'Price per base unit is required'],
      min: 0,
    },

    // How many base units are currently in stock
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
