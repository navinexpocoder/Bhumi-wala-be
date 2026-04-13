const express = require("express");
const router = express.Router();
const {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getMyLeads,
  getBuyerUsers,
  viewProperty,
  getNearbyProperties,
  getPendingProperties,
  approveProperty,
  rejectProperty,
  getAllPropertiesAdmin,

} = require("../controllers/propertyController");
const { verifyToken, optionalVerifyToken, authorizeRoles } = require("../middleware/auth");



// ADMIN ROUTES

router.get(
"/admin/pending",
verifyToken,
authorizeRoles("admin"),
getPendingProperties
);


router.get(
"/admin/all",
verifyToken,
authorizeRoles("admin"),
getAllPropertiesAdmin
);


router.put(
"/:id/approve",
verifyToken,
authorizeRoles("admin"),
approveProperty
);


router.put(
"/:id/reject",
verifyToken,
authorizeRoles("admin"),
rejectProperty
);

// Nearby properties route (public - must be before :id routes)
router.get("/nearby", getNearbyProperties);

// Public routes
router.get("/", getProperties);

// Protected routes
router.post(
  "/",
  verifyToken,
  authorizeRoles("seller", "agent", "admin"),
  createProperty,
);
router.get(
  "/my-properties/list",
  verifyToken,
  authorizeRoles("seller", "agent", "admin"),
  getMyProperties,
);
router.get(
  "/my-leads/list",
  verifyToken,
  authorizeRoles("seller", "agent", "admin"),
  getMyLeads,
);
router.get(
  "/buyers/list",
  verifyToken,
  authorizeRoles("seller", "agent", "admin"),
  getBuyerUsers,
);

// View property with lead tracking (authenticated users only)
router.get("/:id/view", verifyToken, viewProperty);

// Public route (must be after specific routes); optional auth so sellers can open their own pending listings.
router.get("/:id", optionalVerifyToken, getProperty);

// Protected routes
router.put("/:id", verifyToken, updateProperty);
router.delete("/:id", verifyToken, deleteProperty);

module.exports = router;
