// routes/orders.js — Order Routes
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, requireAdmin } = require('../middleware/auth');

// POST /api/orders — Seller places a new order
router.post('/', protect, createOrder);

// GET /api/orders — Admin sees ALL orders
router.get('/', protect, requireAdmin, getAllOrders);

// GET /api/orders/my-orders — Seller sees only their own orders
// IMPORTANT: This specific route must be defined BEFORE /:id routes
// Otherwise Express would match "my-orders" as an :id parameter
router.get('/my-orders', protect, getMyOrders);

// PUT /api/orders/:id/status — Admin updates the order status
router.put('/:id/status', protect, requireAdmin, updateOrderStatus);

module.exports = router;
