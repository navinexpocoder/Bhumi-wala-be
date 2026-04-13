const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { sanitizeRequestBody } = require('../middleware/requestValidation');
const sectionController = require('../controllers/sectionController');

const checkAdmin = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'moderator') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
};

// Public routes
router.get('/', sectionController.getSections);
router.get('/reusable', sectionController.getReusableSections);
router.get('/:id', sectionController.getSectionById);
router.get('/slug/:slug', sectionController.getSectionBySlug);

// Protected routes (Admin only)
router.post('/', verifyToken, checkAdmin, sanitizeRequestBody, sectionController.createSection);
router.put('/:id', verifyToken, checkAdmin, sanitizeRequestBody, sectionController.updateSection);
router.delete('/:id', verifyToken, checkAdmin, sectionController.deleteSection);

module.exports = router;
