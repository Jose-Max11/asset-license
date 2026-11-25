
const db = require("../config/db");

// ADMIN DASHBOARD
exports.getAdminDashboard = async (req, res) => {
    try {

        // ASSET STATISTICS
        const [[assetStats]] = await db.execute(`
            SELECT
                COUNT(*) AS total_assets,
                COALESCE(SUM(status = 'Available'), 0) AS available_assets,
                COALESCE(SUM(status = 'Assigned'), 0) AS assigned_assets,
                COALESCE(SUM(status = 'Maintenance'), 0) AS maintenance_assets,
                COALESCE(SUM(status = 'Retired'), 0) AS retired_assets,
                COALESCE(SUM(status = 'Lost'), 0) AS lost_assets
            FROM assets
        `);

        // LICENSE SEAT USAGE STATISTICS
        const [[licenseStats]] = await db.execute(`
            SELECT
                COUNT(*) AS total_licenses,
                COALESCE(SUM(total_seats), 0) AS total_seats,
                COALESCE(SUM(used_seats), 0) AS used_seats,
                COALESCE(SUM(
                    CASE
                        WHEN expiry_date >= CURDATE()
                        THEN GREATEST(total_seats - used_seats, 0)
                        ELSE 0
                    END
                ), 0) AS available_seats
            FROM (
                SELECT
                    l.id,
                    l.total_seats,
                    l.expiry_date,
                    COUNT(la.id) AS used_seats
                FROM licenses l
                LEFT JOIN license_assignments la
                    ON l.id = la.license_id
                    AND la.released_at IS NULL
                GROUP BY l.id, l.total_seats, l.expiry_date
            ) AS license_usage
        `);

        // INDIVIDUAL LICENSE SEAT USAGE
        const [licenseSeatUsage] = await db.execute(`
            SELECT
                l.id AS license_id,
                l.software_name,
                l.vendor,
                l.total_seats,
                l.expiry_date,
                COUNT(la.id) AS used_seats,
                CASE
                    WHEN l.expiry_date < CURDATE() THEN 0
                    ELSE GREATEST(
                        l.total_seats - COUNT(la.id), 0
                    )
                END AS available_seats,
                CASE
                    WHEN l.expiry_date < CURDATE() THEN 'Expired'
                    ELSE 'Active'
                END AS license_status
            FROM licenses l
            LEFT JOIN license_assignments la
                ON l.id = la.license_id
                AND la.released_at IS NULL
            GROUP BY
                l.id,
                l.software_name,
                l.vendor,
                l.total_seats,
                l.expiry_date
            ORDER BY l.software_name
        `);

        // EMPLOYEE STATISTICS
        const [[employeeStats]] = await db.execute(`
            SELECT COUNT(*) AS total_employees
            FROM users
            WHERE role = 'employee'
            AND is_active = 1
        `);

        // REQUEST STATISTICS
        const [[requestStats]] = await db.execute(`
            SELECT COUNT(*) AS pending_requests
            FROM requests
            WHERE status = 'Pending'
        `);

        // EXPIRING ASSET WARRANTIES
        const [expiringAssets] = await db.execute(`
            SELECT
                id,
                asset_tag,
                asset_name,
                warranty_expiry,
                DATEDIFF(warranty_expiry, CURDATE()) AS days_remaining,
                CASE
                    WHEN warranty_expiry < CURDATE() THEN 'Expired'
                    WHEN DATEDIFF(warranty_expiry, CURDATE()) <= 7 THEN 'Critical'
                    WHEN DATEDIFF(warranty_expiry, CURDATE()) <= 15 THEN 'Warning'
                    ELSE 'Upcoming'
                END AS urgency
            FROM assets
            WHERE warranty_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND status NOT IN ('Retired', 'Lost')
            ORDER BY warranty_expiry ASC
        `);

        // EXPIRING LICENSES
        const [expiringLicenses] = await db.execute(`
            SELECT
                id,
                software_name,
                vendor,
                expiry_date,
                DATEDIFF(expiry_date, CURDATE()) AS days_remaining,
                CASE
                    WHEN expiry_date < CURDATE() THEN 'Expired'
                    WHEN DATEDIFF(expiry_date, CURDATE()) <= 7 THEN 'Critical'
                    WHEN DATEDIFF(expiry_date, CURDATE()) <= 15 THEN 'Warning'
                    ELSE 'Upcoming'
                END AS urgency
            FROM licenses
            WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            ORDER BY expiry_date ASC
        `);

        return res.json({
            success: true,
            dashboard: {
                assets: assetStats,
                licenses: licenseStats,
                license_seat_usage: licenseSeatUsage,
                employees: employeeStats.total_employees,
                pending_requests: requestStats.pending_requests,
                expiring_assets: expiringAssets,
                expiring_licenses: expiringLicenses
            }
        });

    } catch (error) {
        console.error("Admin dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load admin dashboard."
        });
    }
};


// EMPLOYEE DASHBOARD
exports.getEmployeeDashboard = async (req, res) => {
    try {

        // EMPLOYEE ASSET COUNT
        const [[assetStats]] = await db.execute(`
            SELECT COUNT(*) AS my_assets
            FROM asset_assignments
            WHERE user_id = ?
            AND returned_at IS NULL
        `, [req.user.id]);

        // EMPLOYEE LICENSE COUNT
        const [[licenseStats]] = await db.execute(`
            SELECT COUNT(*) AS my_licenses
            FROM license_assignments
            WHERE user_id = ?
            AND released_at IS NULL
        `, [req.user.id]);

        // EMPLOYEE REQUEST STATISTICS
        const [[requestStats]] = await db.execute(`
            SELECT
                COUNT(*) AS total_requests,
                COALESCE(SUM(status = 'Pending'), 0) AS pending_requests
            FROM requests
            WHERE user_id = ?
        `, [req.user.id]);

        return res.json({
            success: true,
            dashboard: {
                my_assets: assetStats.my_assets,
                my_licenses: licenseStats.my_licenses,
                total_requests: requestStats.total_requests,
                pending_requests: requestStats.pending_requests
            }
        });

    } catch (error) {
        console.error("Employee dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load employee dashboard."
        });
    }
};
