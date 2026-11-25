
const express = require("express");
const router = express.Router();

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const {
    assignLicense,
    releaseLicense,
    getLicenseAssignmentHistory
} = require("../controllers/licenseAssignmentController");

// Assign license
router.post(
    "/assign",
    verifyToken,
    allowRoles("admin"),
    assignLicense
);

// Release license
router.patch(
    "/release/:assignment_id",
    verifyToken,
    allowRoles("admin"),
    releaseLicense
);

// View license assignment history
router.get(
    "/history",
    verifyToken,
    allowRoles("admin"),
    getLicenseAssignmentHistory
);

module.exports = router;
