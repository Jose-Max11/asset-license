
const db = require("../config/db");

// ASSIGN LICENSE - Admin
exports.assignLicense = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { license_id, user_id } = req.body;

        if (
            !Number.isInteger(Number(license_id)) ||
            Number(license_id) <= 0 ||
            !Number.isInteger(Number(user_id)) ||
            Number(user_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid License ID and Employee ID are required."
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock license row
        const [licenses] = await connection.execute(
            "SELECT * FROM licenses WHERE id = ? FOR UPDATE",
            [license_id]
        );

        if (licenses.length === 0) {
            throw new Error("LICENSE_NOT_FOUND");
        }

        const license = licenses[0];

        if (Number(license.total_seats) <= 0) {
            throw new Error("INVALID_SEAT_LIMIT");
        }

        // Check license expiry using MySQL date
        const [expiryCheck] = await connection.execute(
            `SELECT
                CASE
                    WHEN expiry_date IS NOT NULL
                    AND expiry_date < CURDATE()
                    THEN 1
                    ELSE 0
                END AS is_expired
             FROM licenses
             WHERE id = ?`,
            [license_id]
        );

        if (Number(expiryCheck[0].is_expired) === 1) {
            throw new Error("LICENSE_EXPIRED");
        }

        // Check active employee
        const [users] = await connection.execute(
            `SELECT id FROM users
             WHERE id = ?
             AND role = 'employee'
             AND is_active = 1`,
            [user_id]
        );

        if (users.length === 0) {
            throw new Error("EMPLOYEE_NOT_FOUND");
        }

        // Prevent duplicate active assignment
        const [existing] = await connection.execute(
            `SELECT id
             FROM license_assignments
             WHERE license_id = ?
             AND user_id = ?
             AND released_at IS NULL`,
            [license_id, user_id]
        );

        if (existing.length > 0) {
            throw new Error("ALREADY_ASSIGNED");
        }

        // Check available seats
        const [usage] = await connection.execute(
            `SELECT COUNT(*) AS used_seats
             FROM license_assignments
             WHERE license_id = ?
             AND released_at IS NULL`,
            [license_id]
        );

        const usedSeats = Number(usage[0].used_seats);
        const totalSeats = Number(license.total_seats);

        if (usedSeats >= totalSeats) {
            throw new Error("NO_SEATS_AVAILABLE");
        }

        // Create assignment
        await connection.execute(
            `INSERT INTO license_assignments
             (license_id, user_id, assigned_by)
             VALUES (?, ?, ?)`,
            [license_id, user_id, req.user.id]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "License assigned successfully.",
            usedSeats: usedSeats + 1,
            totalSeats,
            availableSeats: totalSeats - usedSeats - 1
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        const errors = {
            LICENSE_NOT_FOUND: [404, "License not found."],
            INVALID_SEAT_LIMIT: [400, "License seat limit must be greater than zero."],
            LICENSE_EXPIRED: [400, "This license has expired. New assignments are not allowed."],
            EMPLOYEE_NOT_FOUND: [404, "Active employee not found."],
            ALREADY_ASSIGNED: [409, "This license is already assigned to this employee."],
            NO_SEATS_AVAILABLE: [400, "No available license seats."]
        };

        if (errors[error.message]) {
            return res.status(errors[error.message][0]).json({
                success: false,
                message: errors[error.message][1]
            });
        }

        console.error("Assign license error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign license."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// RELEASE LICENSE - Admin
exports.releaseLicense = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { assignment_id } = req.params;

        if (
            !Number.isInteger(Number(assignment_id)) ||
            Number(assignment_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid assignment ID."
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [assignments] = await connection.execute(
            `SELECT id
             FROM license_assignments
             WHERE id = ?
             AND released_at IS NULL
             FOR UPDATE`,
            [assignment_id]
        );

        if (assignments.length === 0) {
            throw new Error("ASSIGNMENT_NOT_FOUND");
        }

        await connection.execute(
            `UPDATE license_assignments
             SET released_at = CURRENT_TIMESTAMP
             WHERE id = ?
             AND released_at IS NULL`,
            [assignment_id]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: "License released successfully."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        if (error.message === "ASSIGNMENT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Active license assignment not found."
            });
        }

        console.error("Release license error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to release license."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// VIEW LICENSE ASSIGNMENT HISTORY - Admin
exports.getLicenseAssignmentHistory = async (req, res) => {
    try {
        const [history] = await db.execute(
            `SELECT
                la.id AS assignment_id,
                la.license_id,
                la.user_id,
                l.software_name,
                l.vendor,
                l.total_seats,
                l.expiry_date,
                CASE
                    WHEN l.expiry_date < CURDATE() THEN 'Expired'
                    ELSE 'Active'
                END AS license_status,
                u.name AS employee_name,
                u.email AS employee_email,
                la.assigned_at,
                la.released_at
             FROM license_assignments la
             JOIN licenses l ON la.license_id = l.id
             JOIN users u ON la.user_id = u.id
             ORDER BY la.id DESC`
        );

        return res.json({
            success: true,
            history
        });

    } catch (error) {
        console.error("License history error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch license history."
        });
    }
};
