
const db = require("../config/db");

// ASSIGN ASSET - Admin
exports.assignAsset = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { asset_id, user_id } = req.body;

        if (!asset_id || !user_id) {
            return res.status(400).json({
                success: false,
                message: "Asset ID and Employee ID are required."
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock asset to prevent double assignment
        const [assets] = await connection.execute(
            "SELECT * FROM assets WHERE id = ? FOR UPDATE",
            [asset_id]
        );

        if (assets.length === 0) {
            throw new Error("ASSET_NOT_FOUND");
        }

        if (assets[0].status !== "Available") {
            throw new Error("ASSET_NOT_AVAILABLE");
        }

        // Check employee
        const [users] = await connection.execute(
            `SELECT id FROM users
             WHERE id = ? AND role = 'employee' AND is_active = 1`,
            [user_id]
        );

        if (users.length === 0) {
            throw new Error("EMPLOYEE_NOT_FOUND");
        }

        // Create assignment record
        await connection.execute(
            `INSERT INTO asset_assignments
             (asset_id, user_id, assigned_by)
             VALUES (?, ?, ?)`,
            [asset_id, user_id, req.user.id]
        );

        // Update asset status
        await connection.execute(
            `UPDATE assets
             SET status = 'Assigned'
             WHERE id = ?`,
            [asset_id]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Asset assigned successfully."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        if (error.message === "ASSET_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        if (error.message === "ASSET_NOT_AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: "Asset is not available for assignment."
            });
        }

        if (error.message === "EMPLOYEE_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Active employee not found."
            });
        }

        console.error("Assign asset error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign asset."
        });

    } finally {
        if (connection) connection.release();
    }
};


// RETURN ASSET - Admin
exports.returnAsset = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { assignment_id } = req.params;

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock active assignment
        const [assignments] = await connection.execute(
            `SELECT * FROM asset_assignments
             WHERE id = ? AND returned_at IS NULL
             FOR UPDATE`,
            [assignment_id]
        );

        if (assignments.length === 0) {
            throw new Error("ASSIGNMENT_NOT_FOUND");
        }

        const assetId = assignments[0].asset_id;

        // Lock asset
        const [assets] = await connection.execute(
            "SELECT * FROM assets WHERE id = ? FOR UPDATE",
            [assetId]
        );

        if (assets.length === 0) {
            throw new Error("ASSET_NOT_FOUND");
        }

        if (assets[0].status !== "Assigned") {
            throw new Error("ASSET_NOT_ASSIGNED");
        }

        // Record return date
        await connection.execute(
            `UPDATE asset_assignments
             SET returned_at = CURRENT_TIMESTAMP
             WHERE id = ? AND returned_at IS NULL`,
            [assignment_id]
        );

        // Make asset available again
        await connection.execute(
            `UPDATE assets
             SET status = 'Available'
             WHERE id = ?`,
            [assetId]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: "Asset returned successfully."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        if (error.message === "ASSIGNMENT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Active assignment not found."
            });
        }

        if (error.message === "ASSET_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        if (error.message === "ASSET_NOT_ASSIGNED") {
            return res.status(400).json({
                success: false,
                message: "This asset is not currently assigned."
            });
        }

        console.error("Return asset error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to return asset."
        });

    } finally {
        if (connection) connection.release();
    }
};


// VIEW ALL ASSIGNMENT HISTORY - Admin
exports.getAssignmentHistory = async (req, res) => {
    try {
        const [history] = await db.execute(
            `SELECT
                aa.id AS assignment_id,
                a.id AS asset_id,
                a.asset_tag,
                a.asset_name,
                a.category,
                u.id AS employee_id,
                u.name AS employee_name,
                u.email AS employee_email,
                aa.assigned_at,
                aa.returned_at
             FROM asset_assignments aa
             JOIN assets a ON aa.asset_id = a.id
             JOIN users u ON aa.user_id = u.id
             ORDER BY aa.assigned_at DESC`
        );

        return res.json({
            success: true,
            history
        });

    } catch (error) {
        console.error("Assignment history error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch assignment history."
        });
    }
};


// VIEW INDIVIDUAL ASSET HOLDER AND HISTORY - Admin
exports.getAssetAssignmentDetails = async (req, res) => {
    try {
        const { asset_id } = req.params;

        const [assets] = await db.execute(
            `SELECT
                id,
                asset_tag,
                asset_name,
                category,
                status
             FROM assets
             WHERE id = ?`,
            [asset_id]
        );

        if (assets.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        // Get current holder
        const [currentHolder] = await db.execute(
            `SELECT
                u.id AS employee_id,
                u.name AS employee_name,
                u.email AS employee_email,
                aa.assigned_at
             FROM asset_assignments aa
             JOIN users u ON aa.user_id = u.id
             WHERE aa.asset_id = ?
             AND aa.returned_at IS NULL
             LIMIT 1`,
            [asset_id]
        );

        // Get complete assignment history
        const [history] = await db.execute(
            `SELECT
                aa.id AS assignment_id,
                u.name AS employee_name,
                u.email AS employee_email,
                aa.assigned_at,
                aa.returned_at
             FROM asset_assignments aa
             JOIN users u ON aa.user_id = u.id
             WHERE aa.asset_id = ?
             ORDER BY aa.assigned_at DESC`,
            [asset_id]
        );

        return res.json({
            success: true,
            asset: assets[0],
            currentHolder: currentHolder.length > 0
                ? currentHolder[0]
                : null,
            history
        });

    } catch (error) {
        console.error("Asset assignment details error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch asset assignment details."
        });
    }
};
