const express = require('express');
const router = express.Router();
const {
  createPropertyPreview,
  getPropertyPreviews,
  getPropertyPreviewById,
  updatePropertyPreview,
  deletePropertyPreview,
  getNearbyProperties,
  getFeaturedProperties,
  recordAnalyticsAction,
  searchProperties,
  getMyProperties,
  getPropertyStats,
} = require('../controllers/propertyPreviewController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.get('/', getPropertyPreviews);
router.get('/featured', getFeaturedProperties);
router.get('/nearby', getNearbyProperties);
router.get('/stats', getPropertyStats);
router.get('/:id', getPropertyPreviewById);

// Search endpoint
router.post('/search', searchProperties);

// Analytics endpoint
router.post('/:id/analytics/:action', recordAnalyticsAction);

// Protected routes (Seller, Agent, Admin)
router.post(
  '/',
  verifyToken,
  authorizeRoles('seller', 'agent', 'admin'),
  createPropertyPreview
);

router.get(
  '/my-properties/list',
  verifyToken,
  authorizeRoles('seller', 'agent', 'admin'),
  getMyProperties
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('seller', 'agent', 'admin'),
  updatePropertyPreview
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('seller', 'agent', 'admin'),
  deletePropertyPreview
);

module.exports = router;
