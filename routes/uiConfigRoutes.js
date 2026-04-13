const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const {
  getUIConfig,
  getUIConfigByKey,
  createOrUpdateUIConfig,
  deleteUIConfig,
  getSystemConfig,
  getSystemConfigByKey,
  createOrUpdateSystemConfig,
  deleteSystemConfig,
} = require("../controllers/uiConfigController");

// ==================== UI Configuration Routes ====================

// @desc    Get all UI configurations (public)
// @route   GET /api/ui-config
router.get("/ui-config", getUIConfig);

// @desc    Get specific UI configuration by key (public)
// @route   GET /api/ui-config/:key
router.get("/ui-config/:key", getUIConfigByKey);

// @desc    Create or update UI configuration (Admin only)
// @route   POST /api/ui-config
router.post("/ui-config", verifyToken, authorizeRoles("admin"), createOrUpdateUIConfig);

// @desc    Delete UI configuration (Admin only)
// @route   DELETE /api/ui-config/:key
router.delete("/ui-config/:key", verifyToken, authorizeRoles("admin"), deleteUIConfig);

// ==================== System Configuration Routes ====================

// @desc    Get all system configurations (public)
// @route   GET /api/system-config
router.get("/system-config", getSystemConfig);

// @desc    Get specific system configuration by key (public)
// @route   GET /api/system-config/:key
router.get("/system-config/:key", getSystemConfigByKey);

// @desc    Create or update system configuration (Admin only)
// @route   POST /api/system-config
router.post("/system-config", verifyToken, authorizeRoles("admin"), createOrUpdateSystemConfig);

// @desc    Delete system configuration (Admin only)
// @route   DELETE /api/system-config/:key
router.delete("/system-config/:key", verifyToken, authorizeRoles("admin"), deleteSystemConfig);

module.exports = router;
