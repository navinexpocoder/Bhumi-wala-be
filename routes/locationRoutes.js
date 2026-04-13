const express = require('express');
const router = express.Router();
const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationsByState,
  searchLocations,
  getCurrentCoordinates,
  getMyLocation,
} = require('../controllers/locationController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { sanitizeRequestBody, validateRequiredFields } = require('../middleware/requestValidation');

// Public routes
router.get('/current/coordinates', getCurrentCoordinates);
router.get('/my-location', getMyLocation);
router.get('/', getLocations);
router.get('/state/:state', getLocationsByState);
router.get('/search/:name', searchLocations);
router.get('/:id', getLocation);

// Protected routes (Admin only)
router.post(
  '/',
  sanitizeRequestBody,
  validateRequiredFields(['name', 'state', 'latitude', 'longitude']),
  verifyToken,
  authorizeRoles('admin'),
  createLocation
);

router.put(
  '/:id',
  sanitizeRequestBody,
  verifyToken,
  authorizeRoles('admin'),
  updateLocation
);

router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteLocation);

module.exports = router;
