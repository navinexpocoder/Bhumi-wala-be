const express = require('express');
const router = express.Router();
const {
  createPropertyCard,
  getPropertyCards,
  getPropertyCardById,
  updatePropertyCard,
  deletePropertyCard,
  getFeaturedCards,
  getNewCards,
  getHotDeals,
  searchPropertyCards,
  toggleFavorite,
  recordCardEngagement,
  markCardAsSeen,
  getTrendingCards,
} = require('../controllers/propertyCardController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.get('/', getPropertyCards);
router.get('/featured', getFeaturedCards);
router.get('/new', getNewCards);
router.get('/hot-deals', getHotDeals);
router.get('/trending', getTrendingCards);
router.get('/:id', getPropertyCardById);

// Search endpoint
router.post('/search', searchPropertyCards);

// Engagement and interaction endpoints (Public)
router.post('/:id/favorite', toggleFavorite);
router.post('/:id/engagement/:action', recordCardEngagement);
router.post('/:id/seen', markCardAsSeen);

// Protected routes (Admin only)
router.post('/', verifyToken, authorizeRoles('admin'), createPropertyCard);

router.put('/:id', verifyToken, authorizeRoles('admin'), updatePropertyCard);

router.delete('/:id', verifyToken, authorizeRoles('admin'), deletePropertyCard);

module.exports = router;
