// routes/products.js — Product Routes
const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, requireAdmin } = require('../middleware/auth');

// GET /api/products — Any logged-in user can view products
router.get('/', protect, getAllProducts);

// POST /api/products — Only admins can create products
router.post('/', protect, requireAdmin, createProduct);

// PUT /api/products/:id — Only admins can update products
router.put('/:id', protect, requireAdmin, updateProduct);

// DELETE /api/products/:id — Only admins can delete products
router.delete('/:id', protect, requireAdmin, deleteProduct);

module.exports = router;
