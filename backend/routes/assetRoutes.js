
const express = require("express");
const router = express.Router();

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const {
    addAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    retireAsset
} = require("../controllers/assetController");

// Add new asset
router.post(
    "/",
    verifyToken,
    allowRoles("admin"),
    addAsset
);

// Get all assets
router.get(
    "/",
    verifyToken,
    allowRoles("admin"),
    getAllAssets
);

// Get single asset
router.get(
    "/:id",
    verifyToken,
    allowRoles("admin"),
    getAssetById
);

// Update asset
router.put(
    "/:id",
    verifyToken,
    allowRoles("admin"),
    updateAsset
);

// Retire asset
router.patch(
    "/:id/retire",
    verifyToken,
    allowRoles("admin"),
    retireAsset
);

module.exports = router;
