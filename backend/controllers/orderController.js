// controllers/orderController.js — Handles order creation and management
// Sellers create orders; Admin can view all and change status

const Order = require('../models/Order');
const Product = require('../models/Product');
const { convertToBaseUnit } = require('../utils/conversion');

// ─── CREATE Order ─────────────────────────────────────────────────────────────
// POST /api/orders (Seller)
// Receives: { items: [{ productId, orderedQuantity, orderedUnit }] }
const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    let totalAmount = 0;
    const processedItems = [];

    // Loop through each item the seller wants to order
    for (const item of items) {
      // Fetch the product from DB
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      // Convert the ordered quantity to base units
      // Example: 2 kg → convertToBaseUnit(2, 'kg') → 2000 (grams)
      const convertedQuantity = convertToBaseUnit(item.orderedQuantity, item.orderedUnit);

      // Calculate line total
      // Example: 2000 g × ₹0.5/g = ₹1000
      const lineTotal = convertedQuantity * product.pricePerBaseUnit;

      totalAmount += lineTotal;

      processedItems.push({
        product: product._id,
        orderedQuantity: item.orderedQuantity,
        orderedUnit: item.orderedUnit,
        convertedQuantity,
        lineTotal,
      });
    }

    // Save the order linked to the logged-in seller
    const order = await Order.create({
      user: req.user._id,
      items: processedItems,
      totalAmount,
      status: 'Pending',
    });

    // Populate product names for a richer response
    const populatedOrder = await Order.findById(order._id).populate('items.product', 'name sku baseUnit');

    res.status(201).json({ message: 'Order placed successfully', order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

// ─── GET All Orders ───────────────────────────────────────────────────────────
// GET /api/orders (Admin only)
// Returns all orders from all sellers with user and product details
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')           // Include seller name and email
      .populate('items.product', 'name sku baseUnit') // Include product details
      .sort({ createdAt: -1 })                  // Newest orders first
      .lean();                                  // Optimize performance

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

// ─── GET My Orders ────────────────────────────────────────────────────────────
// GET /api/orders/my-orders (Seller)
// Returns only the orders placed by the currently logged-in seller
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name sku baseUnit')
      .sort({ createdAt: -1 })
      .lean();                                  // Optimize performance

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your orders', error: error.message });
  }
};

// ─── UPDATE Order Status ──────────────────────────────────────────────────────
// PUT /api/orders/:id/status (Admin only)
// Admin can approve or reject a pending order
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate the status value
    const validStatuses = ['Pending', 'Approved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('user', 'name email').populate('items.product', 'name sku');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: `Order status updated to ${status}`, order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

module.exports = { createOrder, getAllOrders, getMyOrders, updateOrderStatus };
