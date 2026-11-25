
const db = require("../config/db");

// EMPLOYEE REPORT LOST OR DAMAGED ASSET
exports.createAssetReport = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { asset_id, report_type, description } = req.body;

        if (!asset_id || !["Lost", "Damaged"].includes(report_type)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid asset and report type."
            });
        }

        // CHECK WHETHER THIS ASSET IS ASSIGNED TO THIS EMPLOYEE
        const [assignments] = await db.execute(
            `SELECT id FROM asset_assignments
             WHERE asset_id = ?
             AND user_id = ?
             AND returned_at IS NULL
             LIMIT 1`,
            [asset_id, employeeId]
        );

        if (assignments.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You can report only assets assigned to you."
            });
        }

        // PREVENT DUPLICATE PENDING REPORTS
        const [existingReports] = await db.execute(
            `SELECT id FROM asset_reports
             WHERE asset_id = ?
             AND employee_id = ?
             AND status = 'Pending'
             LIMIT 1`,
            [asset_id, employeeId]
        );

        if (existingReports.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A pending report already exists for this asset."
            });
        }

        await db.execute(
            `INSERT INTO asset_reports
             (asset_id, employee_id, report_type, description)
             VALUES (?, ?, ?, ?)`,
            [
                asset_id,
                employeeId,
                report_type,
                description?.trim() || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Asset report submitted successfully."
        });

    } catch (error) {
        console.error("Create asset report error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit asset report."
        });
    }
};


// EMPLOYEE - VIEW OWN ASSET REPORTS
exports.getMyAssetReports = async (req, res) => {
    try {
        const employeeId = req.user.id;

        const [reports] = await db.execute(
            `SELECT
                ar.id,
                ar.asset_id,
                ar.report_type,
                ar.description,
                ar.status,
                ar.reported_at,
                ar.reviewed_at,
                a.asset_tag,
                a.asset_name,
                reviewer.name AS reviewer_name
             FROM asset_reports ar
             JOIN assets a ON ar.asset_id = a.id
             LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
             WHERE ar.employee_id = ?
             ORDER BY ar.reported_at DESC`,
            [employeeId]
        );

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        console.error("Get my asset reports error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your asset reports."
        });
    }
};


// ADMIN - VIEW ALL ASSET REPORTS
exports.getAllAssetReports = async (req, res) => {
    try {
        const [reports] = await db.execute(
            `SELECT
                ar.id,
                ar.asset_id,
                ar.employee_id,
                ar.report_type,
                ar.description,
                ar.status,
                ar.reported_at,
                ar.reviewed_at,
                a.asset_tag,
                a.asset_name,
                a.status AS asset_status,
                u.name AS employee_name,
                u.email AS employee_email,
                admin.name AS admin_name
             FROM asset_reports ar
             JOIN assets a ON ar.asset_id = a.id
             JOIN users u ON ar.employee_id = u.id
             LEFT JOIN users admin ON ar.reviewed_by = admin.id
             ORDER BY
                CASE WHEN ar.status = 'Pending' THEN 0 ELSE 1 END,
                ar.reported_at DESC`
        );

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        console.error("Get asset reports error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch asset reports."
        });
    }
};


// ADMIN - APPROVE OR REJECT REPORT
exports.reviewAssetReport = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = req.user.id;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Approved or Rejected."
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // LOCK REPORT
        const [reports] = await connection.execute(
            `SELECT * FROM asset_reports
             WHERE id = ?
             FOR UPDATE`,
            [id]
        );

        if (reports.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Asset report not found."
            });
        }

        const report = reports[0];

        if (report.status !== "Pending") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This report has already been reviewed."
            });
        }

        // LOCK ASSET
        const [assets] = await connection.execute(
            `SELECT status FROM assets
             WHERE id = ?
             FOR UPDATE`,
            [report.asset_id]
        );

        if (assets.length === 0) {
            throw new Error("Reported asset not found.");
        }

        if (status === "Approved") {
            if (assets[0].status !== "Assigned") {
                throw new Error(
                    "This asset is no longer assigned. Please verify its current status."
                );
            }

            const newAssetStatus =
                report.report_type === "Lost" ? "Lost" : "Maintenance";

            await connection.execute(
                `UPDATE assets
                 SET status = ?
                 WHERE id = ?`,
                [newAssetStatus, report.asset_id]
            );
        }

        // UPDATE REPORT STATUS
        await connection.execute(
            `UPDATE asset_reports
             SET status = ?,
                 reviewed_by = ?,
                 reviewed_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [status, adminId, id]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            success: true,
            message: `Asset report ${status.toLowerCase()} successfully.`
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error("Review asset report error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to review asset report."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
