
const db = require("../config/db");

const auditLogger = async (userId, action, details) => {
    try {
        await db.execute(
            `INSERT INTO audit_logs (user_id, action, details)
             VALUES (?, ?, ?)`,
            [userId, action, details]
        );
    } catch (error) {
        console.error("Audit log error:", error);
    }
};

module.exports = auditLogger;
