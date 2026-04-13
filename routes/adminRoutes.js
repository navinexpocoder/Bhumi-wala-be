const express = require('express');
const router = express.Router();
const {
  approveProperty,
  getAllUsers,
  getAllProperties,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getActiveUsers,
  getAgents,
  getAgentDetails,
  blockUnblockAgent,
  createAgent,
} = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { sanitizeRequestBody, validateRequiredFields } = require('../middleware/requestValidation');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(authorizeRoles('admin'));

// Property management
router.put(
  '/property/:id/approve',
  sanitizeRequestBody,
  validateRequiredFields(['status']),
  approveProperty
);

router.get('/properties', getAllProperties);

// User management
router.post(
  '/users',
  sanitizeRequestBody,
  validateRequiredFields(['name', 'email', 'password']),
  createUser
);

router.get('/users', getAllUsers);
router.get('/users/active', getActiveUsers);
router.get('/users/:id', getUser);

router.put(
  '/users/:id',
  sanitizeRequestBody,
  updateUser
);

router.delete('/users/:id', deleteUser);

// Agent management
router.post(
  '/agents',
  sanitizeRequestBody,
  validateRequiredFields(['name', 'email', 'password']),
  createAgent
);

router.get('/agents', getAgents);
router.get('/agents/:id', getAgentDetails);

router.put(
  '/agents/:id/block',
  sanitizeRequestBody,
  validateRequiredFields(['action']),
  blockUnblockAgent
);

module.exports = router;
