
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                issuer: "asset-management-system",
                audience: "asset-management-users"
            }
        );

        const [users] = await db.execute(
            `SELECT id, name, email, role, is_active
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [decoded.id]
        );

        if (
            users.length === 0 ||
            !users[0].is_active
        ) {
            return res.status(401).json({
                success: false,
                message: "Account is unavailable."
            });
        }

        req.user = users[0];

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }
};


exports.allowRoles = (...allowedRoles) => {

    return (req, res, next) => {

        if (
            !req.user ||
            !allowedRoles.includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource."
            });
        }

        next();
    };
};
