
const db = require("../config/db");

// EMPLOYEE - Submit Request
exports.createRequest = async (req, res) => {
    try {
        const { request_type, description } = req.body;

        if (
            !["asset", "license"].includes(request_type) ||
            !description ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid request type and description are required."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO requests (user_id, request_type, description)
             VALUES (?, ?, ?)`,
            [req.user.id, request_type, description.trim()]
        );

        res.status(201).json({
            success: true,
            message: "Request submitted successfully.",
            requestId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to submit request."
        });
    }
};


// EMPLOYEE - View Own Requests
exports.getMyRequests = async (req, res) => {
    try {
        const [requests] = await db.execute(
            `SELECT
                r.*,
                admin.name AS admin_name
             FROM requests r
             LEFT JOIN users admin ON r.reviewed_by = admin.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch requests."
        });
    }
};


// ADMIN - View All Requests
exports.getAllRequests = async (req, res) => {
    try {
        const [requests] = await db.execute(
            `SELECT
                r.*,
                employee.name AS employee_name,
                employee.email AS employee_email,
                admin.name AS admin_name
             FROM requests r
             JOIN users employee ON r.user_id = employee.id
             LEFT JOIN users admin ON r.reviewed_by = admin.id
             ORDER BY r.created_at DESC`
        );

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch requests."
        });
    }
};


// ADMIN - Approve or Reject Request
exports.reviewRequest = async (req, res) => {
    try {
        const { status, admin_remarks } = req.body;
        const { id } = req.params;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Approved or Rejected."
            });
        }

        if (!admin_remarks || !admin_remarks.trim()) {
            return res.status(400).json({
                success: false,
                message: "Admin remarks are required."
            });
        }

        const [result] = await db.execute(
            `UPDATE requests
             SET status = ?,
                 admin_remarks = ?,
                 reviewed_by = ?,
                 reviewed_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'Pending'`,
            [
                status,
                admin_remarks.trim(),
                req.user.id,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Pending request not found."
            });
        }

        res.json({
            success: true,
            message: `Request ${status.toLowerCase()} successfully.`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to review request."
        });
    }
};
