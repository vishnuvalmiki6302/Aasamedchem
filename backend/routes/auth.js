// routes/auth.js — Authentication Routes
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register — Create a new account
router.post('/register', register);

// POST /api/auth/login — Login with email and password
router.post('/login', login);

module.exports = router;
