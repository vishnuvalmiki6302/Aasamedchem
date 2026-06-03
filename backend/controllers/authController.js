// controllers/authController.js — Handles user registration and login
// These functions are called by the auth routes

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helper: Generate JWT Token ────────────────────────────────────────────────
// Creates a signed JWT that expires in 7 days
// The payload contains just the user's ID — we look up the full user when needed
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },           // Payload: what we embed in the token
    process.env.JWT_SECRET,   // Secret key from .env
    { expiresIn: '7d' }       // Token is valid for 7 days
  );
};

// ─── Register ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Create the user — password will be hashed by the pre-save hook in User.js
    const user = await User.create({ name, email, password, role });

    // Generate a token so the user is immediately logged in after registration
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Validates credentials and returns a JWT token
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the submitted password with the hashed password in DB
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = { register, login };
