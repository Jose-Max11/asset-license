
const express = require("express");
const router = express.Router();

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const {
    createRequest,
    getMyRequests,
    getAllRequests,
    reviewRequest
} = require("../controllers/requestController");

// Employee - Submit request
router.post(
    "/",
    verifyToken,
    allowRoles("employee"),
    createRequest
);

// Employee - View own requests
router.get(
    "/my",
    verifyToken,
    allowRoles("employee"),
    getMyRequests
);

// Admin - View all requests
router.get(
    "/",
    verifyToken,
    allowRoles("admin"),
    getAllRequests
);

// Admin - Approve or reject request
router.patch(
    "/:id/review",
    verifyToken,
    allowRoles("admin"),
    reviewRequest
);

module.exports = router;
