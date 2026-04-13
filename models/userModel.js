const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      trim: true,
      sparse: true, // Allow null/undefined but enforce uniqueness when present
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    age: {
      type: Number,
      min: [1, 'Age must be a positive number'],
      max: [150, 'Age must be a valid number'],
    },
    contact: {
      type: String,
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Please provide a valid contact number'],
    },
    details: {
      type: String,
      trim: true,
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'seller', 'buyer', 'agent'],
      default: 'buyer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    userIdProf: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      comment: 'Stores user ID document (image URL, base64, or string)',
    },
    verified: {
      type: String,
      enum: ['pending', 'approve', 'reject'],
      default: 'pending',
      comment: 'User verification status',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
