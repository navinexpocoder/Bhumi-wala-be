const express = require('express');
const router = express.Router();
const {
  getNearbyUsers,
  addUser,
  getAllUsers,
  deleteUser,
  getUserById,
  updateUserProfile,
} = require('../controllers/userController');

// Get users near a location
// Usage: GET /api/users/nearby?latitude=40.7128&longitude=-74.0060&maxDistance=5000
router.get('/nearby', getNearbyUsers);

// Get user by ID
// Usage: GET /api/users/:id
router.get('/:id', getUserById);

// Get all users
router.get('/all', getAllUsers);

// Add a new user
// Body: { name, email, phone, latitude, longitude, address }
router.post('/', addUser);

// Update user profile
// Usage: PUT /api/users/:id
// Body: { name, email, contact, age, details, useridprof, verified }
router.put('/:id', updateUserProfile);

// Delete a user
router.delete('/:id', deleteUser);

module.exports = router;
