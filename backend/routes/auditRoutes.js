
const express = require("express");
const router = express.Router();

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const { getAuditLogs } = require("../controllers/auditController");

// Admin - View Audit Logs
router.get(
    "/",
    verifyToken,
    allowRoles("admin"),
    getAuditLogs
);

module.exports = router;
