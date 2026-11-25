
const db = require("../config/db");

// ADD LICENSE - Admin
exports.addLicense = async (req, res) => {
    try {
        const {
            software_name,
            vendor,
            license_key,
            total_seats,
            expiry_date,
            cost
        } = req.body;

        if (!software_name || !total_seats) {
            return res.status(400).json({
                success: false,
                message: "Software name and total seats are required."
            });
        }

        if (
            !Number.isInteger(Number(total_seats)) ||
            Number(total_seats) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Total seats must be a positive whole number."
            });
        }

        if (
            cost !== undefined &&
            (!Number.isFinite(Number(cost)) || Number(cost) < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Cost cannot be negative."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO licenses
            (software_name, vendor, license_key, total_seats, expiry_date, cost)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                software_name.trim(),
                vendor || null,
                license_key || null,
                Number(total_seats),
                expiry_date || null,
                cost === undefined ? 0 : Number(cost)
            ]
        );

        res.status(201).json({
            success: true,
            message: "License added successfully.",
            licenseId: result.insertId
        });

    } catch (error) {
        console.error("Add license error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add license."
        });
    }
};


// GET ALL LICENSES - Admin
exports.getAllLicenses = async (req, res) => {
    try {
        const [licenses] = await db.execute(`
            SELECT
                l.*,
                (
                    SELECT COUNT(*)
                    FROM license_assignments la
                    WHERE la.license_id = l.id
                    AND la.released_at IS NULL
                ) AS used_seats,
                CASE
                    WHEN l.expiry_date < CURDATE() THEN 'Expired'
                    ELSE 'Active'
                END AS license_status,
                CASE
                    WHEN l.expiry_date < CURDATE() THEN 0
                    ELSE GREATEST(
                        l.total_seats - (
                            SELECT COUNT(*)
                            FROM license_assignments la
                            WHERE la.license_id = l.id
                            AND la.released_at IS NULL
                        ), 0
                    )
                END AS available_seats
            FROM licenses l
            ORDER BY l.id DESC
        `);

        res.json({
            success: true,
            licenses
        });

    } catch (error) {
        console.error("Get licenses error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch licenses."
        });
    }
};


// GET SINGLE LICENSE - Admin
exports.getLicenseById = async (req, res) => {
    try {
        const [licenses] = await db.execute(
            `SELECT
                l.*,
                CASE
                    WHEN l.expiry_date < CURDATE() THEN 'Expired'
                    ELSE 'Active'
                END AS license_status
             FROM licenses l
             WHERE l.id = ?`,
            [req.params.id]
        );

        if (licenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "License not found."
            });
        }

        res.json({
            success: true,
            license: licenses[0]
        });

    } catch (error) {
        console.error("Get license error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch license."
        });
    }
};


// UPDATE LICENSE - Admin
exports.updateLicense = async (req, res) => {
    try {
        const {
            software_name,
            vendor,
            license_key,
            total_seats,
            expiry_date,
            cost
        } = req.body;

        const [licenses] = await db.execute(
            "SELECT * FROM licenses WHERE id = ?",
            [req.params.id]
        );

        if (licenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "License not found."
            });
        }

        const current = licenses[0];

        const [usage] = await db.execute(
            `SELECT COUNT(*) AS used_seats
             FROM license_assignments
             WHERE license_id = ? AND released_at IS NULL`,
            [req.params.id]
        );

        const newTotal = total_seats === undefined
            ? Number(current.total_seats)
            : Number(total_seats);

        if (
            !Number.isInteger(newTotal) ||
            newTotal <= 0 ||
            newTotal < usage[0].used_seats
        ) {
            return res.status(400).json({
                success: false,
                message: "Total seats cannot be less than currently assigned seats."
            });
        }

        const newCost = cost === undefined
            ? Number(current.cost)
            : Number(cost);

        if (!Number.isFinite(newCost) || newCost < 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid non-negative cost."
            });
        }

        await db.execute(
            `UPDATE licenses SET
                software_name = ?,
                vendor = ?,
                license_key = ?,
                total_seats = ?,
                expiry_date = ?,
                cost = ?
             WHERE id = ?`,
            [
                software_name ?? current.software_name,
                vendor ?? current.vendor,
                license_key ?? current.license_key,
                newTotal,
                expiry_date === undefined
                    ? current.expiry_date
                    : (expiry_date || null),
                newCost,
                req.params.id
            ]
        );

        res.json({
            success: true,
            message: "License updated successfully."
        });

    } catch (error) {
        console.error("Update license error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update license."
        });
    }
};


// DELETE LICENSE - Admin
exports.deleteLicense = async (req, res) => {
    try {
        const [usage] = await db.execute(
            `SELECT COUNT(*) AS used_seats
             FROM license_assignments
             WHERE license_id = ? AND released_at IS NULL`,
            [req.params.id]
        );

        if (usage[0].used_seats > 0) {
            return res.status(400).json({
                success: false,
                message: "Release all assigned seats before deleting this license."
            });
        }

        const [result] = await db.execute(
            "DELETE FROM licenses WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "License not found."
            });
        }

        res.json({
            success: true,
            message: "License deleted successfully."
        });

    } catch (error) {
        console.error("Delete license error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete license."
        });
    }
};
