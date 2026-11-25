
const db = require("../config/db");

const allowedStatuses = [
    "Available",
    "Assigned",
    "Maintenance",
    "Retired",
    "Lost"
];

// VALIDATE DATE FORMAT (YYYY-MM-DD)
const isValidDate = (value) => {
    if (!value) return true;

    if (typeof value !== "string") return false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
};

// CHECK FUTURE PURCHASE DATE
const isFutureDate = (value) => {
    if (!value) return false;

    const today = new Date();

    const todayString =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    return value > todayString;
};

// COMMON ASSET VALIDATION
const validateAsset = (data) => {
    const {
        asset_tag,
        asset_name,
        category,
        purchase_date,
        warranty_expiry,
        cost
    } = data;

    if (
        typeof asset_tag !== "string" ||
        !asset_tag.trim() ||
        typeof asset_name !== "string" ||
        !asset_name.trim() ||
        typeof category !== "string" ||
        !category.trim()
    ) {
        return "Asset tag, asset name and category are required.";
    }

    const assetCost = Number(cost ?? 0);

    if (!Number.isFinite(assetCost) || assetCost < 0) {
        return "Please enter a valid asset cost.";
    }

    if (
        !isValidDate(purchase_date) ||
        !isValidDate(warranty_expiry)
    ) {
        return "Please enter valid dates.";
    }

    if (isFutureDate(purchase_date)) {
        return "Purchase date cannot be in the future.";
    }

    if (
        purchase_date &&
        warranty_expiry &&
        warranty_expiry < purchase_date
    ) {
        return "Warranty expiry cannot be before purchase date.";
    }

    return null;
};


// ADD ASSET
exports.addAsset = async (req, res) => {
    try {
        const {
            asset_tag,
            serial_number,
            asset_name,
            category,
            brand,
            model,
            purchase_date,
            warranty_expiry,
            cost,
            status
        } = req.body;

        const validationError = validateAsset(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const assetStatus = status || "Available";

        // NEW ASSETS CANNOT BE ASSIGNED DIRECTLY
        if (
            !allowedStatuses.includes(assetStatus) ||
            assetStatus === "Assigned"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid asset status. New assets must not be Assigned."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO assets
            (
                asset_tag,
                serial_number,
                asset_name,
                category,
                brand,
                model,
                purchase_date,
                warranty_expiry,
                cost,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                asset_tag.trim(),
                serial_number?.trim() || null,
                asset_name.trim(),
                category.trim(),
                brand?.trim() || null,
                model?.trim() || null,
                purchase_date || null,
                warranty_expiry || null,
                Number(cost ?? 0),
                assetStatus
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Asset added successfully.",
            assetId: result.insertId
        });

    } catch (error) {
        console.error("Add asset error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Asset tag or serial number already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add asset."
        });
    }
};


// GET ALL ASSETS
exports.getAllAssets = async (req, res) => {
    try {
        const [assets] = await db.execute(
            `SELECT * FROM assets ORDER BY id DESC`
        );

        return res.status(200).json({
            success: true,
            assets
        });

    } catch (error) {
        console.error("Get assets error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch assets."
        });
    }
};


// GET SINGLE ASSET
exports.getAssetById = async (req, res) => {
    try {
        const { id } = req.params;

        const [assets] = await db.execute(
            "SELECT * FROM assets WHERE id = ?",
            [id]
        );

        if (assets.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        return res.status(200).json({
            success: true,
            asset: assets[0]
        });

    } catch (error) {
        console.error("Get asset error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch asset."
        });
    }
};


// UPDATE ASSET
exports.updateAsset = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            asset_tag,
            serial_number,
            asset_name,
            category,
            brand,
            model,
            purchase_date,
            warranty_expiry,
            cost,
            status
        } = req.body;

        const validationError = validateAsset(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid asset status."
            });
        }

        const [existingAssets] = await db.execute(
            "SELECT status FROM assets WHERE id = ?",
            [id]
        );

        if (existingAssets.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        const currentStatus = existingAssets[0].status;

        // ASSIGNMENT STATUS MUST BE MANAGED THROUGH ASSIGNMENT APIs
        // ALLOW OTHER DETAILS TO BE UPDATED IF STATUS REMAINS ASSIGNED
        if (
            currentStatus !== status &&
            (
                currentStatus === "Assigned" ||
                status === "Assigned"
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please use the asset assignment or return option to change assignment status."
            });
        }

        const [result] = await db.execute(
            `UPDATE assets
             SET
                asset_tag = ?,
                serial_number = ?,
                asset_name = ?,
                category = ?,
                brand = ?,
                model = ?,
                purchase_date = ?,
                warranty_expiry = ?,
                cost = ?,
                status = ?
             WHERE id = ?`,
            [
                asset_tag.trim(),
                serial_number?.trim() || null,
                asset_name.trim(),
                category.trim(),
                brand?.trim() || null,
                model?.trim() || null,
                purchase_date || null,
                warranty_expiry || null,
                Number(cost ?? 0),
                status,
                id
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Asset updated successfully."
        });

    } catch (error) {
        console.error("Update asset error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Asset tag or serial number already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update asset."
        });
    }
};


// RETIRE ASSET
exports.retireAsset = async (req, res) => {
    try {
        const { id } = req.params;

        const [assets] = await db.execute(
            "SELECT status FROM assets WHERE id = ?",
            [id]
        );

        if (assets.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        if (assets[0].status === "Assigned") {
            return res.status(400).json({
                success: false,
                message: "Assigned asset cannot be retired. Return it first."
            });
        }

        await db.execute(
            "UPDATE assets SET status = 'Retired' WHERE id = ?",
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Asset retired successfully."
        });

    } catch (error) {
        console.error("Retire asset error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retire asset."
        });
    }
};
