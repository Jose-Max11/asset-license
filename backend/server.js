
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const assetRoutes = require("./routes/assetRoutes");

// Additional route imports
const assetAssignmentRoutes = require("./routes/assetAssignmentRoutes");
const licenseRoutes = require("./routes/licenseRoutes");
const licenseAssignmentRoutes = require("./routes/licenseAssignmentRoutes");
const requestRoutes = require("./routes/requestRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditRoutes = require("./routes/auditRoutes");
const assetReportRoutes = require("./routes/assetReportRoutes");

const app = express();

// Security headers
app.use(helmet());

// Frontend connection
app.use(cors({
    origin: process.env.FRONTEND_URL
}));

// JSON request body
app.use(express.json({
    limit: "10kb"
}));

// Backend health
app.get("/", (req, res) => {
    res.send("Asset Management Backend is Running");
});

// Database health
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.status(200).json({
            success: true,
            message: "Backend connected successfully",
            database: "MySQL Connected"
        });

    } catch (error) {

        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Authentication routes
app.use("/api/auth", authRoutes);

app.use("/api/assets", assetRoutes);

// Additional API routes
app.use("/api/asset-assignments", assetAssignmentRoutes);
app.use("/api/licenses", licenseRoutes);
app.use("/api/license-assignments", licenseAssignmentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/asset-reports", assetReportRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
