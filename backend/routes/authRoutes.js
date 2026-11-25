
const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const {
    signup,
    login,
    googleLogin
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again after 15 minutes."
    }
});

// Signup
router.post("/signup", signup);

// Normal login
router.post("/login", loginLimiter, login);

// Google login
router.post("/google", googleLogin);

// Current logged-in user
router.get("/me", verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});



module.exports = router;
