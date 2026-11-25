
const db = require("../config/db");

// ADMIN - VIEW AUDIT LOGS
exports.getAuditLogs = async (req, res) => {
    try {
        const [logs] = await db.execute(
            `SELECT
                al.id,
                al.action,
                al.details,
                al.created_at,
                u.name AS user_name,
                u.email AS user_email
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             ORDER BY al.created_at DESC
             LIMIT 200`
        );

        res.json({
            success: true,
            logs
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs."
        });
    }
};
