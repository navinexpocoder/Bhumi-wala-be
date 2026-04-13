const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { sanitizeRequestBody } = require('../middleware/requestValidation');
const configController = require('../controllers/dynamicConfigController');

const checkAdmin = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'moderator') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
};

// Public routes (read-only)
router.get('/', configController.getConfigs);
router.get('/theme', configController.getThemeConfig);
router.get('/features', configController.getFeatureFlags);
router.get('/:configKey', configController.getConfigByKey);

// Protected routes (Admin only - write)
router.post('/', verifyToken, checkAdmin, sanitizeRequestBody, configController.createOrUpdateConfig);
router.put('/theme', verifyToken, checkAdmin, sanitizeRequestBody, configController.updateTheme);
router.put('/features', verifyToken, checkAdmin, sanitizeRequestBody, configController.updateFeatures);
router.delete('/:id', verifyToken, checkAdmin, configController.deleteConfig);

module.exports = router;
