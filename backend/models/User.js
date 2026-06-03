// models/User.js — Mongoose schema for User collection
// Stores user credentials and their role (admin or seller)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Display name of the user
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Unique email used for login
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Hashed password (never store plain text!)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },

    // Role controls what the user can see and do
    role: {
      type: String,
      enum: ['admin', 'seller'], // Only these two values are allowed
      default: 'seller',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
// Before saving the user, hash the password if it was modified
// NOTE: Mongoose 8 async middleware does NOT use next() — just return
userSchema.pre('save', async function () {
  // Only hash if the password field changed (prevents re-hashing on profile update)
  if (!this.isModified('password')) return;

  // Salt rounds = 10 means bcrypt will run 2^10 = 1024 iterations (secure enough)
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Method ──────────────────────────────────────────────────────────
// Compare a plain text password with the stored hashed password
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
