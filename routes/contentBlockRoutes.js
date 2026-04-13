const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { sanitizeRequestBody } = require('../middleware/requestValidation');
const contentBlockController = require('../controllers/contentBlockController');

const checkAdmin = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'moderator') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
};

// Public routes
router.get('/', contentBlockController.getContentBlocks);
router.get('/:id', contentBlockController.getContentBlockById);
router.get('/slug/:slug', contentBlockController.getContentBlockBySlug);

// Protected routes (Admin only)
router.post('/', verifyToken, checkAdmin, sanitizeRequestBody, contentBlockController.createContentBlock);
router.put('/:id', verifyToken, checkAdmin, sanitizeRequestBody, contentBlockController.updateContentBlock);
router.delete('/:id', verifyToken, checkAdmin, contentBlockController.deleteContentBlock);

module.exports = router;
