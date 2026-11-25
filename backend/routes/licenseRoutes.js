
const express = require("express");
const router = express.Router();

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const {
    addLicense,
    getAllLicenses,
    getLicenseById,
    updateLicense,
    deleteLicense
} = require("../controllers/licenseController");

// Add license
router.post(
    "/",
    verifyToken,
    allowRoles("admin"),
    addLicense
);

// Get all licenses
router.get(
    "/",
    verifyToken,
    allowRoles("admin"),
    getAllLicenses
);

// Get single license
router.get(
    "/:id",
    verifyToken,
    allowRoles("admin"),
    getLicenseById
);

// Update license
router.put(
    "/:id",
    verifyToken,
    allowRoles("admin"),
    updateLicense
);

// Delete license
router.delete(
    "/:id",
    verifyToken,
    allowRoles("admin"),
    deleteLicense
);

module.exports = router;
