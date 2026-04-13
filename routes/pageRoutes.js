const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { sanitizeRequestBody } = require('../middleware/requestValidation');
const pageController = require('../controllers/pageController');

const checkAdmin = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'moderator') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
};

// Public routes
router.get('/', pageController.getPages);
router.get('/slug/:slug', pageController.getPageBySlug);

// Protected routes (Admin only)
router.post('/', verifyToken, checkAdmin, sanitizeRequestBody, pageController.createPage);
router.get('/:id', verifyToken, checkAdmin, pageController.getPageById);
router.put('/:id', verifyToken, checkAdmin, sanitizeRequestBody, pageController.updatePage);
router.patch('/:id/publish', verifyToken, checkAdmin, pageController.publishPage);
router.delete('/:id', verifyToken, checkAdmin, pageController.deletePage);
router.post('/:id/blocks', verifyToken, checkAdmin, sanitizeRequestBody, pageController.addContentBlockToPage);

module.exports = router;
