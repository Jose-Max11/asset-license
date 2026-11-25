
const express = require("express");
const router = express.Router();

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const {
    getAdminDashboard,
    getEmployeeDashboard
} = require("../controllers/dashboardController");

// Admin Dashboard
router.get(
    "/admin",
    verifyToken,
    allowRoles("admin"),
    getAdminDashboard
);

// Employee Dashboard
router.get(
    "/employee",
    verifyToken,
    allowRoles("employee"),
    getEmployeeDashboard
);

module.exports = router;
