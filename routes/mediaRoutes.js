const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { sanitizeRequestBody } = require('../middleware/requestValidation');
const mediaController = require('../controllers/mediaController');

const ALLOWED_UPLOAD_ROLES = new Set([
  'admin',
  'seller',
  'superadmin',
  'super_admin',
  'super-admin',
  'super admin',
]);

// Uploads are allowed for authenticated app users.
const checkUploader = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (ALLOWED_UPLOAD_ROLES.has(role)) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
};

// Public routes
router.get('/', mediaController.getMediaAssets);
router.get('/:id', mediaController.getMediaAssetById);

// Protected routes
router.post('/upload', verifyToken, checkUploader, sanitizeRequestBody, mediaController.uploadMedia);
router.put('/:id', verifyToken, checkUploader, sanitizeRequestBody, mediaController.updateMedia);
router.delete('/:id', verifyToken, checkUploader, mediaController.deleteMedia);

module.exports = router;
