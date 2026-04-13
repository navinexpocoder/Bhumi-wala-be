const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const ResponseFormatter = require('../utils/responseFormatter');
const { validateEmail, validateRole } = require('../utils/validation');
const { ROLES } = require('../utils/constants');
const logger = require('../config/logger');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation - Required fields
    const errors = [];
    if (!name || !name.trim()) {
      errors.push('Name is required');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!email || !email.trim()) {
      errors.push('Email is required');
    } else if (!validateEmail(email.trim())) {
      errors.push('Invalid email format');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (errors.length > 0) {
      return ResponseFormatter.validationError(res, errors);
    }

    // Validate role if provided
    if (role) {
      const roleValidation = validateRole(role);
      if (!roleValidation.isValid) {
        return ResponseFormatter.validationError(res, [roleValidation.error]);
      }
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return ResponseFormatter.conflict(res, 'An account with this email already exists. Please login or use a different email.');
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role || ROLES.BUYER,
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info(`✓ User registered successfully: ${user._id} (${user.role})`);

    return ResponseFormatter.created(res, 'User registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    ResponseFormatter.serverError(res, 'Server error during registration', error.message);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return ResponseFormatter.validationError(res, ['Please provide email and password']);
    }

    // Check if user exists and get password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return ResponseFormatter.error(res, 'Invalid credentials', 401);
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return ResponseFormatter.error(res, 'Invalid credentials', 401);
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return ResponseFormatter.forbidden(res, 'Your account has been blocked. Please contact administrator.');
    }

    // Check if user is active
    if (!user.isActive) {
      return ResponseFormatter.forbidden(res, 'Your account is inactive. Please contact administrator.');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return ResponseFormatter.success(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    ResponseFormatter.serverError(res, 'Server error during login', error.message);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return ResponseFormatter.notFound(res, 'User not found');
    }

    return ResponseFormatter.success(res, 'User retrieved successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isBlocked: user.isBlocked,
        verified: user.verified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Get me error: ${error.message}`);
    ResponseFormatter.serverError(res, 'Server error retrieving user', error.message);
  }
};

// @desc    Logout user (all roles)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. However, we can log the logout event.
    return ResponseFormatter.success(res, 'Logout successful. Please remove the token from client storage.');
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    ResponseFormatter.serverError(res, 'Server error during logout', error.message);
  }
};
