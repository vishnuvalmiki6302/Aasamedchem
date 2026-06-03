// middleware/auth.js — JWT Authentication Middleware
// This middleware protects routes by verifying the JWT token from the request header.
// Usage: add `protect` or `requireAdmin` to any route you want to secure.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── protect ─────────────────────────────────────────────────────────────────
// Verifies the JWT token and attaches the user object to req.user
// Any route using this middleware requires a valid login token
const protect = async (req, res, next) => {
  try {
    // The frontend sends the token in the Authorization header as:
    // "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, access denied' });
    }

    // Extract just the token part (remove "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verify the token using our JWT_SECRET
    // If the token is invalid or expired, jwt.verify() will throw an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in DB and attach to request (exclude password field)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found, token invalid' });
    }

    req.user = user; // Now any route handler can access req.user
    next(); // Continue to the actual route handler
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Role check — must be used AFTER `protect` since it needs req.user
// Only allows admin users to proceed; sellers get 403 Forbidden
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, allow through
  } else {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

module.exports = { protect, requireAdmin };
