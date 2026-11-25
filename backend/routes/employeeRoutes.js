
const express = require("express");
const router = express.Router();

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const {
    getMyProfile,
    getMyAssets,
    getMyLicenses,
    getAllEmployees
} = require("../controllers/employeeController");

// GET ALL EMPLOYEES - Admin
router.get(
    "/all",
    verifyToken,
    allowRoles("admin"),
    getAllEmployees
);

// Employee Profile
router.get(
    "/profile",
    verifyToken,
    allowRoles("employee"),
    getMyProfile
);

// Employee Assigned Assets
router.get(
    "/my-assets",
    verifyToken,
    allowRoles("employee"),
    getMyAssets
);

// Employee Assigned Licenses
router.get(
    "/my-licenses",
    verifyToken,
    allowRoles("employee"),
    getMyLicenses
);

module.exports = router;
