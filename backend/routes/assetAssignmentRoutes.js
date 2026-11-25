
const express = require("express");
const router = express.Router();

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const {
    assignAsset,
    returnAsset,
    getAssignmentHistory,
    getAssetAssignmentDetails
} = require("../controllers/assetAssignmentController");

// Assign asset to employee
router.post(
    "/assign",
    verifyToken,
    allowRoles("admin"),
    assignAsset
);

// Return assigned asset
router.patch(
    "/return/:assignment_id",
    verifyToken,
    allowRoles("admin"),
    returnAsset
);

// View complete assignment history
router.get(
    "/history",
    verifyToken,
    allowRoles("admin"),
    getAssignmentHistory
);

// View individual asset holder and history
router.get(
    "/asset/:asset_id",
    verifyToken,
    allowRoles("admin"),
    getAssetAssignmentDetails
);

module.exports = router;
