const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { sanitizeRequestBody, validateRequiredFields } = require('../middleware/requestValidation');

// Public routes
router.post(
  '/register',
  sanitizeRequestBody,
  validateRequiredFields(['name', 'email', 'password']),
  register
);

router.post(
  '/login',
  sanitizeRequestBody,
  validateRequiredFields(['email', 'password']),
  login
);

// Protected routes
router.get('/me', verifyToken, getMe);
router.post('/logout', verifyToken, logout);

module.exports = router;
