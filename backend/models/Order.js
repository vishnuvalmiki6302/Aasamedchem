// models/Order.js — Mongoose schema for Order collection
// An order belongs to a seller and contains one or more order items

const mongoose = require('mongoose');

// ─── OrderItem Sub-schema ─────────────────────────────────────────────────────
// Each item in the order records both the original input and the converted values
const orderItemSchema = new mongoose.Schema({
  // Reference to the Product document
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  // The quantity the seller entered (e.g., 2)
  orderedQuantity: {
    type: Number,
    required: true,
    min: 0,
  },

  // The unit the seller selected (e.g., 'kg')
  orderedUnit: {
    type: String,
    required: true,
  },

  // Quantity converted to base unit (e.g., 2 kg → 2000 g)
  convertedQuantity: {
    type: Number,
    required: true,
  },

  // Price for this line item = convertedQuantity × pricePerBaseUnit
  lineTotal: {
    type: Number,
    required: true,
  },
});

// ─── Order Schema ─────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    // The seller who placed this order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Array of order items (embedded sub-documents)
    items: [orderItemSchema],

    // Sum of all line totals
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Order lifecycle status
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true, // createdAt tells us when the order was placed
  }
);

module.exports = mongoose.model('Order', orderSchema);
