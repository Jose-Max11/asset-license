
import { useEffect, useState } from "react";
import "./dashboard-layout.css";

const initialForm = {
    asset_tag: "",
    serial_number: "",
    asset_name: "",
    category: "Laptop",
    brand: "",
    model: "",
    purchase_date: "",
    warranty_expiry: "",
    cost: "",
    status: "Available"
};

function AdminDashboard({ user, onLogout, onNavigate }) {
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [assignmentHistory, setAssignmentHistory] = useState([]);
    const [assetReports, setAssetReports] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reviewingReportId, setReviewingReportId] = useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({ ...initialForm });
    const [editingId, setEditingId] = useState(null);
    const [editingAssignedAsset, setEditingAssignedAsset] = useState(false);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedAsset, setSelectedAsset] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState("");

    const [historyAsset, setHistoryAsset] = useState(null);
    const [currentHolder, setCurrentHolder] = useState(null);
    const [assetHistory, setAssetHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    };

    // FETCH ASSETS
    const fetchAssets = async () => {
        try {
            const token = getToken();

            if (!token) {
                throw new Error("Login token not found. Please login again.");
            }

            const response = await fetch(
                "http://localhost:5000/api/assets",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to load assets.");
            }

            setAssets(data.assets || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // FETCH EMPLOYEES AND ASSIGNMENT HISTORY
    const fetchAssignmentData = async () => {
        try {
            const token = getToken();

            if (!token) {
                throw new Error("Login token not found. Please login again.");
            }

            const [employeeResponse, historyResponse] = await Promise.all([
                fetch("http://localhost:5000/api/employees/all", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }),

                fetch("http://localhost:5000/api/asset-assignments/history", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const employeeData = await employeeResponse.json();
            const historyData = await historyResponse.json();

            if (!employeeResponse.ok || !employeeData.success) {
                throw new Error(
                    employeeData.message || "Failed to load employees."
                );
            }

            if (!historyResponse.ok || !historyData.success) {
                throw new Error(
                    historyData.message || "Failed to load assignment history."
                );
            }

            setEmployees(employeeData.employees || []);
            setAssignmentHistory(historyData.history || []);

        } catch (err) {
            setError(err.message);
        }
    };

    // FETCH LOST / DAMAGED ASSET REPORTS
    const fetchAssetReports = async () => {
        try {
            setReportsLoading(true);

            const response = await fetch(
                "http://localhost:5000/api/asset-reports",
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to load asset reports."
                );
            }

            setAssetReports(data.reports || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setReportsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
        fetchAssignmentData();
        fetchAssetReports();
    }, []);

    // INPUT CHANGE
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // RESET FORM
    const resetForm = () => {
        setForm({ ...initialForm });
        setEditingId(null);
        setEditingAssignedAsset(false);
    };

    // ADD OR UPDATE ASSET
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");
        setSaving(true);

        try {
            const token = getToken();

            if (!token) {
                throw new Error("Login token not found. Please login again.");
            }

            const url = editingId
                ? `http://localhost:5000/api/assets/${editingId}`
                : "http://localhost:5000/api/assets";

            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    cost: Number(form.cost || 0)
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    (editingId
                        ? "Unable to update asset."
                        : "Unable to add asset.")
                );
            }

            setMessage(
                editingId
                    ? "Asset updated successfully!"
                    : "Asset added successfully!"
            );

            resetForm();
            await fetchAssets();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // EDIT ASSET
    const handleEdit = (asset) => {
        setError("");
        setMessage("");

        setEditingId(asset.id);

        const isAssigned = asset.status === "Assigned";

        setEditingAssignedAsset(isAssigned);

        setForm({
            asset_tag: asset.asset_tag || "",
            serial_number: asset.serial_number || "",
            asset_name: asset.asset_name || "",
            category: asset.category || "Other",
            brand: asset.brand || "",
            model: asset.model || "",
            purchase_date: asset.purchase_date
                ? String(asset.purchase_date).slice(0, 10)
                : "",
            warranty_expiry: asset.warranty_expiry
                ? String(asset.warranty_expiry).slice(0, 10)
                : "",
            cost: asset.cost ?? "",
            status: asset.status || "Available"
        });

        document.getElementById("add-asset")?.scrollIntoView({
            behavior: "smooth"
        });
    };

    // ASSIGN ASSET
    const handleAssignAsset = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!selectedAsset || !selectedEmployee) {
            setError("Please select an asset and an employee.");
            return;
        }

        try {
            setAssigning(true);

            const response = await fetch(
                "http://localhost:5000/api/asset-assignments/assign",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({
                        asset_id: selectedAsset,
                        user_id: selectedEmployee
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to assign asset.");
            }

            setMessage("Asset assigned successfully!");
            setSelectedAsset("");
            setSelectedEmployee("");

            await Promise.all([
                fetchAssets(),
                fetchAssignmentData()
            ]);

        } catch (err) {
            setError(err.message);
        } finally {
            setAssigning(false);
        }
    };

    // RETURN ASSET
    const handleReturnAsset = async (assignmentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to return this asset?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            const response = await fetch(
                `http://localhost:5000/api/asset-assignments/return/${assignmentId}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to return asset.");
            }

            setMessage("Asset returned successfully!");

            await Promise.all([
                fetchAssets(),
                fetchAssignmentData()
            ]);

            if (historyAsset) {
                await handleViewHistory(historyAsset.id);
            }

        } catch (err) {
            setError(err.message);
        }
    };

    // ADMIN APPROVE / REJECT ASSET REPORT
    const handleReviewAssetReport = async (reportId, status) => {
        const confirmed = window.confirm(
            `Are you sure you want to ${status.toLowerCase()} this asset report?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");
            setReviewingReportId(reportId);

            const response = await fetch(
                `http://localhost:5000/api/asset-reports/${reportId}/review`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({ status })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to review asset report."
                );
            }

            setMessage(
                `Asset report ${status.toLowerCase()} successfully!`
            );

            await Promise.all([
                fetchAssetReports(),
                fetchAssets(),
                fetchAssignmentData()
            ]);

        } catch (err) {
            setError(err.message);
        } finally {
            setReviewingReportId(null);
        }
    };

    // VIEW INDIVIDUAL ASSET HISTORY
    const handleViewHistory = async (assetId) => {
        try {
            setHistoryLoading(true);
            setError("");

            const response = await fetch(
                `http://localhost:5000/api/asset-assignments/asset/${assetId}`,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to load asset history."
                );
            }

            setHistoryAsset(data.asset);
            setCurrentHolder(data.currentHolder);
            setAssetHistory(data.history || []);

            document.getElementById("asset-history")?.scrollIntoView({
                behavior: "smooth"
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    // CURRENT HOLDER LOOKUP
    const getCurrentHolder = (assetId) => {
        return assignmentHistory.find(
            (item) =>
                Number(item.asset_id) === Number(assetId) &&
                item.returned_at === null
        );
    };

    // SEARCH AND FILTER
    const filteredAssets = assets.filter((asset) => {
        const searchValue = search.toLowerCase();

        const matchesSearch =
            (asset.asset_tag || "").toLowerCase().includes(searchValue) ||
            (asset.asset_name || "").toLowerCase().includes(searchValue) ||
            (asset.serial_number || "").toLowerCase().includes(searchValue) ||
            (asset.brand || "").toLowerCase().includes(searchValue);

        const matchesCategory =
            categoryFilter === "All" ||
            asset.category === categoryFilter;

        const matchesStatus =
            statusFilter === "All" ||
            asset.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // AVAILABLE ASSETS
    const availableAssets = assets.filter(
        (asset) => asset.status === "Available"
    );

    const pendingReports = assetReports.filter(
        (report) => report.status === "Pending"
    );

    return (
        <div className="dashboard-page admin-dashboard">
            <div className="employee-layout">

                {/* SIDEBAR */}
                <aside className="employee-sidebar">
                    <div className="employee-brand">
                        <h2>FORTISURE</h2>
                        <p>Asset Management</p>
                    </div>

                    <nav className="employee-nav">
                        <a href="#add-asset" className="active">
                            Add Assets
                        </a>

                        <a href="#asset-list">
                            Asset List
                        </a>

                        <a href="#assign-asset">
                            Assign Assets
                        </a>

                        <a href="#assignment-history">
                            Assignment History
                        </a>

                        <a href="#asset-reports">
                            Lost / Damaged Reports ({pendingReports.length})
                        </a>

                        <button
                            type="button"
                            onClick={() => onNavigate("requests")}
                        >
                            Employee Requests
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigate("licenses")}
                        >
                            Software Licenses
                        </button>
                    </nav>

                    <div className="employee-sidebar-footer">
                        <p>Administrator Panel</p>
                        <button onClick={onLogout}>Logout</button>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="employee-main">

                    <header className="employee-topbar">
                        <div>
                            <p className="employee-breadcrumb">
                                Admin Portal / Assets
                            </p>
                            <h1>Asset Management</h1>
                        </div>

                        <div className="employee-user-info">
                            <div>
                                <strong>{user?.name}</strong>
                                <span>{user?.email}</span>
                            </div>
                            <button onClick={onLogout}>Logout</button>
                        </div>
                    </header>

                    {error && <p className="asset-error">{error}</p>}
                    {message && <p className="asset-success">{message}</p>}

                    {/* ADD / EDIT ASSET */}
                    <section id="add-asset" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>
                                    {editingId ? "Edit Asset" : "Add New Asset"}
                                </h2>
                                <p>Enter the hardware asset details</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="asset-form">
                            <div className="asset-form-grid">

                                <input
                                    type="text"
                                    name="asset_tag"
                                    placeholder="Asset Tag *"
                                    value={form.asset_tag}
                                    onChange={handleChange}
                                    required
                                />

                                <input
                                    type="text"
                                    name="serial_number"
                                    placeholder="Serial Number"
                                    value={form.serial_number}
                                    onChange={handleChange}
                                />

                                <input
                                    type="text"
                                    name="asset_name"
                                    placeholder="Asset Name *"
                                    value={form.asset_name}
                                    onChange={handleChange}
                                    required
                                />

                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Laptop">Laptop</option>
                                    <option value="Desktop">Desktop</option>
                                    <option value="Monitor">Monitor</option>
                                    <option value="Keyboard">Keyboard</option>
                                    <option value="Mouse">Mouse</option>
                                    <option value="Printer">Printer</option>
                                    <option value="Other">Other</option>
                                </select>

                                <input
                                    type="text"
                                    name="brand"
                                    placeholder="Brand"
                                    value={form.brand}
                                    onChange={handleChange}
                                />

                                <input
                                    type="text"
                                    name="model"
                                    placeholder="Model"
                                    value={form.model}
                                    onChange={handleChange}
                                />

                                <label>
                                    Purchase Date
                                    <input
                                        type="date"
                                        name="purchase_date"
                                        value={form.purchase_date}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label>
                                    Warranty Expiry
                                    <input
                                        type="date"
                                        name="warranty_expiry"
                                        value={form.warranty_expiry}
                                        onChange={handleChange}
                                    />
                                </label>

                                <input
                                    type="number"
                                    name="cost"
                                    placeholder="Cost"
                                    min="0"
                                    step="0.01"
                                    value={form.cost}
                                    onChange={handleChange}
                                />

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    required
                                    disabled={editingAssignedAsset}
                                >
                                    <option value="Available">Available</option>
                                    {editingAssignedAsset && (
                                        <option value="Assigned">Assigned</option>
                                    )}
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Retired">Retired</option>
                                    <option value="Lost">Lost</option>
                                </select>

                            </div>

                            {editingAssignedAsset && (
                                <p>
                                    This asset is currently assigned. Return it
                                    before changing its status.
                                </p>
                            )}

                            <div className="asset-form-actions">
                                <button type="submit" disabled={saving}>
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Asset"
                                            : "Add Asset"}
                                </button>

                                {editingId && (
                                    <button type="button" onClick={resetForm}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>

                    {/* ASSET LIST */}
                    <section id="asset-list" className="employee-section">

                        <div className="employee-section-heading">
                            <div>
                                <h2>Registered Assets</h2>
                                <p>Search, filter and manage hardware assets</p>
                            </div>

                            <span className="employee-count">
                                {filteredAssets.length} Assets
                            </span>
                        </div>

                        <div className="asset-filter-grid">
                            <input
                                type="text"
                                placeholder="Search by tag, name, serial number or brand..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Desktop">Desktop</option>
                                <option value="Monitor">Monitor</option>
                                <option value="Keyboard">Keyboard</option>
                                <option value="Mouse">Mouse</option>
                                <option value="Printer">Printer</option>
                                <option value="Other">Other</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Available">Available</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Retired">Retired</option>
                                <option value="Lost">Lost</option>
                            </select>
                        </div>

                        <div className="employee-table-wrapper">
                            {loading ? (
                                <p>Loading assets...</p>
                            ) : (
                                <table className="employee-table">
                                    <thead>
                                        <tr>
                                            <th>Asset Tag</th>
                                            <th>Asset Name</th>
                                            <th>Category</th>
                                            <th>Brand</th>
                                            <th>Model</th>
                                            <th>Cost</th>
                                            <th>Status</th>
                                            <th>Current Holder</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredAssets.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="employee-empty">
                                                    No matching assets found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAssets.map((asset) => {
                                                const holder = getCurrentHolder(asset.id);

                                                return (
                                                    <tr key={asset.id}>
                                                        <td>{asset.asset_tag}</td>
                                                        <td>{asset.asset_name}</td>
                                                        <td>{asset.category}</td>
                                                        <td>{asset.brand || "N/A"}</td>
                                                        <td>{asset.model || "N/A"}</td>
                                                        <td>{asset.cost}</td>
                                                        <td>{asset.status}</td>
                                                        <td>
                                                            {holder
                                                                ? holder.employee_name
                                                                : "Not Assigned"}
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(asset)}
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewHistory(asset.id)}
                                                            >
                                                                History
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>

                    {/* ASSIGN ASSET */}
                    <section id="assign-asset" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>Assign Asset</h2>
                                <p>Assign available hardware assets to employees</p>
                            </div>
                        </div>

                        <form onSubmit={handleAssignAsset} className="asset-form">
                            <div className="asset-form-grid">
                                <select
                                    value={selectedAsset}
                                    onChange={(e) => setSelectedAsset(e.target.value)}
                                    required
                                >
                                    <option value="">Select Available Asset</option>
                                    {availableAssets.map((asset) => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.asset_tag} - {asset.asset_name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name} ({employee.employee_code || employee.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="asset-form-actions">
                                <button
                                    type="submit"
                                    disabled={
                                        assigning ||
                                        availableAssets.length === 0 ||
                                        employees.length === 0
                                    }
                                >
                                    {assigning ? "Assigning..." : "Assign Asset"}
                                </button>
                            </div>

                            {availableAssets.length === 0 && (
                                <p>No available assets to assign.</p>
                            )}

                            {employees.length === 0 && (
                                <p>No active employees found.</p>
                            )}
                        </form>
                    </section>

                    {/* COMPLETE ASSIGNMENT HISTORY */}
                    <section id="assignment-history" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>Assignment History</h2>
                                <p>Track all asset assignments and returns</p>
                            </div>

                            <span className="employee-count">
                                {assignmentHistory.length} Records
                            </span>
                        </div>

                        <div className="employee-table-wrapper">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Asset Tag</th>
                                        <th>Asset Name</th>
                                        <th>Employee</th>
                                        <th>Email</th>
                                        <th>Assigned Date</th>
                                        <th>Returned Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {assignmentHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="employee-empty">
                                                No assignment history found.
                                            </td>
                                        </tr>
                                    ) : (
                                        assignmentHistory.map((item) => (
                                            <tr key={item.assignment_id}>
                                                <td>{item.asset_tag}</td>
                                                <td>{item.asset_name}</td>
                                                <td>{item.employee_name}</td>
                                                <td>{item.employee_email}</td>
                                                <td>
                                                    {item.assigned_at
                                                        ? new Date(item.assigned_at).toLocaleString()
                                                        : "N/A"}
                                                </td>
                                                <td>
                                                    {item.returned_at
                                                        ? new Date(item.returned_at).toLocaleString()
                                                        : "Not Returned"}
                                                </td>
                                                <td>
                                                    {item.returned_at === null ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReturnAsset(item.assignment_id)}
                                                        >
                                                            Return
                                                        </button>
                                                    ) : (
                                                        "Completed"
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* LOST / DAMAGED ASSET REPORT MANAGEMENT */}
                    <section id="asset-reports" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>Lost / Damaged Asset Reports</h2>
                                <p>Review employee reports and take action</p>
                            </div>

                            <span className="employee-count">
                                {pendingReports.length} Pending Reports
                            </span>
                        </div>

                        <div className="employee-table-wrapper">
                            {reportsLoading ? (
                                <p>Loading asset reports...</p>
                            ) : (
                                <table className="employee-table">
                                    <thead>
                                        <tr>
                                            <th>Asset Tag</th>
                                            <th>Asset Name</th>
                                            <th>Employee</th>
                                            <th>Email</th>
                                            <th>Report Type</th>
                                            <th>Description</th>
                                            <th>Reported Date</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {assetReports.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="employee-empty">
                                                    No asset reports found.
                                                </td>
                                            </tr>
                                        ) : (
                                            assetReports.map((report) => (
                                                <tr key={report.id}>
                                                    <td>{report.asset_tag}</td>
                                                    <td>{report.asset_name}</td>
                                                    <td>{report.employee_name}</td>
                                                    <td>{report.employee_email}</td>
                                                    <td>{report.report_type}</td>
                                                    <td>{report.description || "-"}</td>
                                                    <td>
                                                        {report.reported_at
                                                            ? new Date(report.reported_at).toLocaleString()
                                                            : "N/A"}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`employee-status status-${String(report.status || "").toLowerCase()}`}
                                                        >
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {report.status === "Pending" ? (
                                                            <div className="asset-form-actions">
                                                                <button
                                                                    type="button"
                                                                    disabled={reviewingReportId === report.id}
                                                                    onClick={() =>
                                                                        handleReviewAssetReport(report.id, "Approved")
                                                                    }
                                                                >
                                                                    {reviewingReportId === report.id
                                                                        ? "Please wait..."
                                                                        : "Approve"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    disabled={reviewingReportId === report.id}
                                                                    onClick={() =>
                                                                        handleReviewAssetReport(report.id, "Rejected")
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            "Reviewed"
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>

                    {/* INDIVIDUAL ASSET HISTORY */}
                    {historyAsset && (
                        <section id="asset-history" className="employee-section">
                            <div className="employee-section-heading">
                                <div>
                                    <h2>Asset Holding History</h2>
                                    <p>
                                        {historyAsset.asset_tag} - {historyAsset.asset_name}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setHistoryAsset(null);
                                        setCurrentHolder(null);
                                        setAssetHistory([]);
                                    }}
                                >
                                    Close
                                </button>
                            </div>

                            {historyLoading ? (
                                <p>Loading asset history...</p>
                            ) : (
                                <>
                                    <h3>Current Holder</h3>

                                    {currentHolder ? (
                                        <div>
                                            <p>
                                                <strong>Name:</strong> {currentHolder.employee_name}
                                            </p>
                                            <p>
                                                <strong>Email:</strong> {currentHolder.employee_email}
                                            </p>
                                            <p>
                                                <strong>Assigned Date:</strong>{" "}
                                                {new Date(currentHolder.assigned_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <p>This asset is currently not assigned.</p>
                                    )}

                                    <h3>Previous Assignment Records</h3>

                                    <div className="employee-table-wrapper">
                                        <table className="employee-table">
                                            <thead>
                                                <tr>
                                                    <th>Employee</th>
                                                    <th>Email</th>
                                                    <th>Assigned Date</th>
                                                    <th>Returned Date</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {assetHistory.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="employee-empty">
                                                            No history available.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    assetHistory.map((item) => (
                                                        <tr key={item.assignment_id}>
                                                            <td>{item.employee_name}</td>
                                                            <td>{item.employee_email}</td>
                                                            <td>
                                                                {item.assigned_at
                                                                    ? new Date(item.assigned_at).toLocaleString()
                                                                    : "N/A"}
                                                            </td>
                                                            <td>
                                                                {item.returned_at
                                                                    ? new Date(item.returned_at).toLocaleString()
                                                                    : "Currently Assigned"}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    <footer className="employee-footer">
                        Fortisure Asset & License Management System
                    </footer>

                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;
