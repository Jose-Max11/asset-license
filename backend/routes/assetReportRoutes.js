
const express = require("express");
const router = express.Router();

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const {
    createAssetReport,
    getAllAssetReports,
    reviewAssetReport,
    getMyAssetReports
} = require("../controllers/assetReportController");

// EMPLOYEE - REPORT LOST / DAMAGED ASSET
router.post(
    "/",
    verifyToken,
    allowRoles("employee"),
    createAssetReport
);

// EMPLOYEE - VIEW OWN REPORTS
router.get(
    "/my",
    verifyToken,
    allowRoles("employee"),
    getMyAssetReports
);

// ADMIN - VIEW ALL REPORTS
router.get(
    "/",
    verifyToken,
    allowRoles("admin"),
    getAllAssetReports
);

// ADMIN - APPROVE / REJECT REPORT
router.patch(
    "/:id/review",
    verifyToken,
    allowRoles("admin"),
    reviewAssetReport
);

module.exports = router;
