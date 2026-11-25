
const db = require("../config/db");

// GET EMPLOYEE PROFILE
exports.getMyProfile = async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, name, email, employee_code, role, created_at
             FROM users
             WHERE id = ? AND role = 'employee'
             LIMIT 1`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        res.json({
            success: true,
            employee: users[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch employee profile."
        });
    }
};


// GET ALL ACTIVE EMPLOYEES - Admin
exports.getAllEmployees = async (req, res) => {
    try {
        const [employees] = await db.execute(
            `SELECT id, name, email, employee_code
             FROM users
             WHERE role = 'employee'
             AND is_active = 1
             ORDER BY name ASC`
        );

        res.json({
            success: true,
            employees
        });

    } catch (error) {
        console.error("Get employees error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employees."
        });
    }
};


// GET EMPLOYEE'S ASSIGNED ASSETS
exports.getMyAssets = async (req, res) => {
    try {
        const [assets] = await db.execute(
            `SELECT
                a.id,
                a.asset_tag,
                a.asset_name,
                a.category,
                a.brand,
                a.model,
                a.purchase_date,
                a.warranty_expiry,
                aa.assigned_at
             FROM asset_assignments aa
             JOIN assets a ON aa.asset_id = a.id
             WHERE aa.user_id = ?
             AND aa.returned_at IS NULL
             ORDER BY aa.assigned_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            assets
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch assigned assets."
        });
    }
};


// GET EMPLOYEE'S ASSIGNED LICENSES
exports.getMyLicenses = async (req, res) => {
    try {
        const [licenses] = await db.execute(
            `SELECT
                l.id,
                l.software_name,
                l.vendor,
                l.expiry_date,
                la.assigned_at
             FROM license_assignments la
             JOIN licenses l ON la.license_id = l.id
             WHERE la.user_id = ?
             AND la.released_at IS NULL
             ORDER BY la.assigned_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            licenses
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch assigned licenses."
        });
    }
};

module.exports = exports;
