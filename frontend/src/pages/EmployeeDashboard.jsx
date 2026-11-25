
import { useEffect, useState } from "react";
import "./dashboard-layout.css";

function EmployeeDashboard({ user, onLogout }) {
    const [dashboard, setDashboard] = useState(null);
    const [assets, setAssets] = useState([]);
    const [licenses, setLicenses] = useState([]);
    const [requests, setRequests] = useState([]);
    const [assetReports, setAssetReports] = useState([]);

    const [requestType, setRequestType] = useState("asset");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [reportsLoading, setReportsLoading] = useState(false);

    // LOST / DAMAGED REPORT STATES
    const [selectedAssetId, setSelectedAssetId] = useState("");
    const [reportType, setReportType] = useState("Lost");
    const [reportDescription, setReportDescription] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    // FETCH EMPLOYEE DATA
    const fetchEmployeeData = async () => {
        try {
            if (!token) {
                throw new Error("Login token not found. Please login again.");
            }

            const endpoints = [
                "http://localhost:5000/api/dashboard/employee",
                "http://localhost:5000/api/employees/my-assets",
                "http://localhost:5000/api/employees/my-licenses",
                "http://localhost:5000/api/requests/my",
                "http://localhost:5000/api/asset-reports/my"
            ];

            const responses = await Promise.all(
                endpoints.map(url => fetch(url, { headers }))
            );

            const results = await Promise.all(
                responses.map(response => response.json())
            );

            const failedIndex = results.findIndex(
                (result, index) =>
                    !responses[index].ok || !result.success
            );

            if (failedIndex !== -1) {
                throw new Error(
                    results[failedIndex].message ||
                    "Failed to load employee data."
                );
            }

            setDashboard(results[0].dashboard);
            setAssets(results[1].assets || []);
            setLicenses(results[2].licenses || []);
            setRequests(results[3].requests || []);
            setAssetReports(results[4].reports || []);

            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setReportsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeData();
    }, []);

    // REFRESH ASSET REPORTS
    const refreshAssetReports = async () => {
        try {
            setReportsLoading(true);

            const response = await fetch(
                "http://localhost:5000/api/asset-reports/my",
                { headers }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to refresh asset reports."
                );
            }

            setAssetReports(data.reports || []);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setReportsLoading(false);
        }
    };

    // SUBMIT ASSET / LICENSE REQUEST
    const submitRequest = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!description.trim()) {
            setError("Please enter your request description.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(
                "http://localhost:5000/api/requests",
                {
                    method: "POST",
                    headers: {
                        ...headers,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        request_type: requestType,
                        description: description.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Request submission failed."
                );
            }

            setMessage("Your request has been submitted successfully!");
            setDescription("");

            await fetchEmployeeData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // SUBMIT LOST / DAMAGED ASSET REPORT
    const submitAssetReport = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!selectedAssetId) {
            setError("Please select an asset.");
            return;
        }

        try {
            setReportSubmitting(true);

            const response = await fetch(
                "http://localhost:5000/api/asset-reports",
                {
                    method: "POST",
                    headers: {
                        ...headers,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        asset_id: Number(selectedAssetId),
                        report_type: reportType,
                        description: reportDescription.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Asset report submission failed."
                );
            }

            setMessage("Your asset report has been submitted successfully!");

            setSelectedAssetId("");
            setReportType("Lost");
            setReportDescription("");

            // FETCH UPDATED REPORT HISTORY
            await fetchEmployeeData();

        } catch (err) {
            setError(err.message);
        } finally {
            setReportSubmitting(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("en-IN");
    };

    if (loading) {
        return (
            <div className="dashboard-page employee-loading">
                <h2>Loading your dashboard...</h2>
            </div>
        );
    }

    return (
        <div className="dashboard-page employee-dashboard">
            <div className="employee-layout">

                {/* SIDEBAR */}
                <aside className="employee-sidebar">
                    <div className="employee-brand">
                        <h2>FORTISURE</h2>
                        <p>Asset Management</p>
                    </div>

                    <nav className="employee-nav">
                        <a href="#overview" className="active">Overview</a>
                        <a href="#my-assets">My Assets</a>
                        <a href="#asset-report">Report Lost / Damaged</a>
                        <a href="#asset-report-history">Asset Report History</a>
                        <a href="#my-licenses">My Licenses</a>
                        <a href="#request-form">Raise Request</a>
                        <a href="#request-history">Request History</a>
                    </nav>

                    <div className="employee-sidebar-footer">
                        <p>Employee Portal</p>
                        <button onClick={onLogout}>Logout</button>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="employee-main">

                    {/* TOP HEADER */}
                    <header className="employee-topbar">
                        <div>
                            <p className="employee-breadcrumb">
                                Employee Portal / Overview
                            </p>
                            <h1>Employee Dashboard</h1>
                        </div>

                        <div className="employee-user-info">
                            <div>
                                <strong>{user.name}</strong>
                                <span>{user.email}</span>
                            </div>
                            <button onClick={onLogout}>Logout</button>
                        </div>
                    </header>

                    {/* WELCOME */}
                    <section className="employee-welcome">
                        <div>
                            <h2>Welcome back, {user.name}!</h2>
                            <p>
                                Here is an overview of your assigned assets,
                                software licenses and requests.
                            </p>
                        </div>

                        <div className="employee-id">
                            <span>EMPLOYEE ID</span>
                            <strong>
                                {user.employee_code || "Not assigned"}
                            </strong>
                        </div>
                    </section>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {message && (
                        <div className="success-message">{message}</div>
                    )}

                    {/* OVERVIEW */}
                    <section id="overview" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>My Overview</h2>
                                <p>Your current resource summary</p>
                            </div>
                        </div>

                        <div className="employee-stat-grid">
                            <div className="stat-card">
                                <span>MY ASSETS</span>
                                <h3>{dashboard?.my_assets ?? assets.length}</h3>
                                <p>Currently assigned</p>
                            </div>

                            <div className="stat-card">
                                <span>MY LICENSES</span>
                                <h3>{dashboard?.my_licenses ?? licenses.length}</h3>
                                <p>Active licenses</p>
                            </div>

                            <div className="stat-card">
                                <span>TOTAL REQUESTS</span>
                                <h3>{dashboard?.total_requests ?? requests.length}</h3>
                                <p>Requests submitted</p>
                            </div>

                            <div className="stat-card">
                                <span>PENDING REQUESTS</span>
                                <h3>{dashboard?.pending_requests ?? 0}</h3>
                                <p>Waiting for review</p>
                            </div>
                        </div>
                    </section>

                    {/* MY ASSETS */}
                    <section id="my-assets" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>My Assets</h2>
                                <p>Hardware devices assigned to you</p>
                            </div>

                            <span className="employee-count">
                                {assets.length} Assets
                            </span>
                        </div>

                        <div className="employee-table-wrapper">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Asset Name</th>
                                        <th>Asset Tag</th>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <th>Model</th>
                                        <th>Assigned Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {assets.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="employee-empty">
                                                No assets assigned to you.
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map(asset => (
                                            <tr key={asset.id}>
                                                <td>{asset.asset_name}</td>
                                                <td>{asset.asset_tag}</td>
                                                <td>{asset.category}</td>
                                                <td>{asset.brand || "N/A"}</td>
                                                <td>{asset.model || "N/A"}</td>
                                                <td>{formatDate(asset.assigned_at)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* REPORT LOST / DAMAGED ASSET */}
                    <section id="asset-report" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>Report Lost / Damaged Asset</h2>
                                <p>
                                    Report an asset that has been lost or damaged
                                </p>
                            </div>
                        </div>

                        <form
                            className="employee-request-form"
                            onSubmit={submitAssetReport}
                        >
                            <div className="employee-form-group">
                                <label>Select Asset</label>

                                <select
                                    value={selectedAssetId}
                                    onChange={(e) =>
                                        setSelectedAssetId(e.target.value)
                                    }
                                    required
                                >
                                    <option value="">
                                        Choose an assigned asset
                                    </option>

                                    {assets.map(asset => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.asset_name} - {asset.asset_tag}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="employee-form-group">
                                <label>Report Type</label>

                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                >
                                    <option value="Lost">Lost</option>
                                    <option value="Damaged">Damaged</option>
                                </select>
                            </div>

                            <div className="employee-form-group">
                                <label>Description</label>

                                <textarea
                                    value={reportDescription}
                                    onChange={(e) =>
                                        setReportDescription(e.target.value)
                                    }
                                    placeholder="Explain what happened to the asset..."
                                    rows="4"
                                    maxLength="2000"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={reportSubmitting || assets.length === 0}
                            >
                                {reportSubmitting
                                    ? "Submitting..."
                                    : "Submit Asset Report"}
                            </button>
                        </form>
                    </section>

                    {/* MY LOST / DAMAGED REPORT HISTORY */}
                    <section
                        id="asset-report-history"
                        className="employee-section"
                    >
                        <div className="employee-section-heading">
                            <div>
                                <h2>My Lost / Damaged Report History</h2>
                                <p>
                                    Check the approval status of your asset reports
                                </p>
                            </div>

                            <div className="asset-form-actions">
                                <span className="employee-count">
                                    {assetReports.length} Reports
                                </span>

                                <button
                                    type="button"
                                    onClick={refreshAssetReports}
                                    disabled={reportsLoading}
                                >
                                    {reportsLoading ? "Refreshing..." : "Refresh"}
                                </button>
                            </div>
                        </div>

                        <div className="employee-table-wrapper">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Asset Name</th>
                                        <th>Asset Tag</th>
                                        <th>Report Type</th>
                                        <th>Description</th>
                                        <th>Reported Date</th>
                                        <th>Status</th>
                                        <th>Reviewed By</th>
                                        <th>Reviewed Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {assetReports.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="8"
                                                className="employee-empty"
                                            >
                                                No lost or damaged asset reports found.
                                            </td>
                                        </tr>
                                    ) : (
                                        assetReports.map(report => (
                                            <tr key={report.id}>
                                                <td>{report.asset_name}</td>

                                                <td>{report.asset_tag}</td>

                                                <td>{report.report_type}</td>

                                                <td>
                                                    {report.description || "-"}
                                                </td>

                                                <td>
                                                    {formatDate(report.reported_at)}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`employee-status status-${String(report.status || "").toLowerCase()}`}
                                                    >
                                                        {report.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    {report.reviewer_name || "-"}
                                                </td>

                                                <td>
                                                    {formatDate(report.reviewed_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* MY LICENSES */}
                    <section id="my-licenses" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>My Software Licenses</h2>
                                <p>Software licenses assigned to you</p>
                            </div>

                            <span className="employee-count">
                                {licenses.length} Licenses
                            </span>
                        </div>

                        <div className="employee-table-wrapper">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Software Name</th>
                                        <th>Vendor</th>
                                        <th>Expiry Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {licenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="employee-empty">
                                                No licenses assigned to you.
                                            </td>
                                        </tr>
                                    ) : (
                                        licenses.map(license => (
                                            <tr key={license.id}>
                                                <td>{license.software_name}</td>
                                                <td>{license.vendor || "N/A"}</td>
                                                <td>{formatDate(license.expiry_date)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* REQUEST FORM */}
                    <section id="request-form" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>Request Asset / License</h2>
                                <p>
                                    Submit a request to the IT administration team
                                </p>
                            </div>
                        </div>

                        <form
                            className="employee-request-form"
                            onSubmit={submitRequest}
                        >
                            <div className="employee-form-group">
                                <label>Request Type</label>

                                <select
                                    value={requestType}
                                    onChange={(e) => setRequestType(e.target.value)}
                                >
                                    <option value="asset">Hardware Asset</option>
                                    <option value="license">Software License</option>
                                </select>
                            </div>

                            <div className="employee-form-group">
                                <label>Request Description</label>

                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Explain why you need this asset or license..."
                                    rows="4"
                                    maxLength="2000"
                                />
                            </div>

                            <button type="submit" disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </form>
                    </section>

                    {/* REQUEST HISTORY */}
                    <section id="request-history" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>My Request History</h2>
                                <p>
                                    Track the status and admin response of your requests
                                </p>
                            </div>

                            <span className="employee-count">
                                {requests.length} Requests
                            </span>
                        </div>

                        <div className="employee-table-wrapper">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Request Type</th>
                                        <th>Description</th>
                                        <th>Submitted Date</th>
                                        <th>Status</th>
                                        <th>Admin Remarks</th>
                                        <th>Action By</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="employee-empty">
                                                You have not submitted any requests.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map(request => (
                                            <tr key={request.id}>
                                                <td>
                                                    {request.request_type === "asset"
                                                        ? "Hardware Asset"
                                                        : "Software License"}
                                                </td>

                                                <td>{request.description}</td>

                                                <td>
                                                    {formatDate(request.created_at)}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`employee-status status-${String(request.status || "").toLowerCase()}`}
                                                    >
                                                        {request.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    {request.admin_remarks?.trim()
                                                        ? request.admin_remarks
                                                        : "-"}
                                                </td>

                                                <td>
                                                    {request.admin_name || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <footer className="employee-footer">
                        Fortisure Asset & License Management System
                    </footer>

                </main>
            </div>
        </div>
    );
}

export default EmployeeDashboard;
