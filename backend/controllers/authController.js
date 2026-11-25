
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const db = require("../config/db");

const {
    validateSignup,
    validateLogin
} = require("../utils/validators");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

function generateToken(user) {
    if (
        !process.env.JWT_SECRET ||
        process.env.JWT_SECRET.length < 32
    ) {
        throw new Error("JWT_SECRET must contain at least 32 characters.");
    }

    return jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            issuer: "asset-management-system",
            audience: "asset-management-users"
        }
    );
}


// SIGNUP
exports.signup = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            confirmPassword,
            role,
            adminCode
        } = req.body || {};

        const errors = validateSignup({
            name,
            email,
            password,
            confirmPassword
        });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        if (!["admin", "employee"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid role."
            });
        }

        // Verify admin registration code
        if (role === "admin") {
            if (!process.env.ADMIN_REGISTRATION_CODE) {
                return res.status(503).json({
                    success: false,
                    message: "Admin registration is not configured."
                });
            }

            if (
                typeof adminCode !== "string" ||
                adminCode !== process.env.ADMIN_REGISTRATION_CODE
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid admin registration code."
                });
            }
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            `INSERT INTO users
            (name, email, password_hash, role, is_active)
            VALUES (?, ?, ?, ?, TRUE)`,
            [cleanName, cleanEmail, passwordHash, role]
        );

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user: {
                id: result.insertId,
                name: cleanName,
                email: cleanEmail,
                role
            }
        });

    } catch (error) {
        console.error("Signup error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create account."
        });
    }
};


// NORMAL LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body || {};

        if (!["admin", "employee"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid role."
            });
        }

        const errors = validateLogin({ email, password });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.execute(
            `SELECT id, name, email, password_hash, role, is_active
             FROM users WHERE email = ? LIMIT 1`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive."
            });
        }

        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                message: "This account uses Google Login."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (user.role !== role) {
            return res.status(403).json({
                success: false,
                message: "Selected role does not match your account."
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login."
        });
    }
};


// GOOGLE LOGIN
exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body || {};

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required."
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const email = payload.email?.trim().toLowerCase();
        const name = payload.name;

        if (
            !email ||
            payload.email_verified !== true ||
            !name
        ) {
            return res.status(401).json({
                success: false,
                message: "Google email verification failed."
            });
        }

        const [users] = await db.execute(
            `SELECT id, name, email, role, is_active
             FROM users WHERE email = ? LIMIT 1`,
            [email]
        );

        let user;

        if (users.length > 0) {
            user = users[0];

            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: "Your account is inactive."
                });
            }

        } else {
            const [result] = await db.execute(
                `INSERT INTO users
                (name, email, password_hash, role, is_active)
                VALUES (?, ?, NULL, 'employee', TRUE)`,
                [name, email]
            );

            user = {
                id: result.insertId,
                name,
                email,
                role: "employee"
            };
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Google login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Google login error:", error);

        return res.status(401).json({
            success: false,
            message: "Google authentication failed. Please try again."
        });
    }
};
