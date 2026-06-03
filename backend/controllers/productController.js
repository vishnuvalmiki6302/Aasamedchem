// controllers/productController.js — CRUD operations for products
// GET is public (any logged-in user), others are admin-only

const Product = require('../models/Product');

// ─── GET All Products ─────────────────────────────────────────────────────────
// GET /api/products
// Returns all products — used by both admin and seller
const getAllProducts = async (req, res) => {
  try {
    // Optional: search by name using query param ?search=acid
    const search = req.query.search || '';
    const filter = search
      ? { name: { $regex: search, $options: 'i' } } // Case-insensitive search
      : {};

    // .lean() improves performance by returning plain JS objects
    // since we only need to read the data, not mutate and save it.
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

// ─── CREATE Product ───────────────────────────────────────────────────────────
// POST /api/products (Admin only)
const createProduct = async (req, res) => {
  try {
    const { name, sku, category, baseUnit, pricePerBaseUnit, stockQuantity } = req.body;

    // SKU must be unique — let Mongoose handle the duplicate key error
    const product = await Product.create({
      name,
      sku,
      category,
      baseUnit,
      pricePerBaseUnit,
      stockQuantity,
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    // Handle duplicate SKU error specifically
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// ─── UPDATE Product ───────────────────────────────────────────────────────────
// PUT /api/products/:id (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true } // Return updated doc and run schema validators
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// ─── DELETE Product ───────────────────────────────────────────────────────────
// DELETE /api/products/:id (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct };
