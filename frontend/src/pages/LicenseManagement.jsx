
import { useEffect, useState } from "react";
import "./LicenseManagement.css";
const initialForm = {
    software_name: "",
    vendor: "",
    license_key: "",
    total_seats: "",
    expiry_date: "",
    cost: ""
};

function LicenseManagement() {
    const [licenses, setLicenses] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [history, setHistory] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    const [selectedLicense, setSelectedLicense] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const fetchData = async () => {
        try {
            const endpoints = [
                "http://localhost:5000/api/licenses",
                "http://localhost:5000/api/employees/all",
                "http://localhost:5000/api/license-assignments/history"
            ];

            const responses = await Promise.all(
                endpoints.map(url => fetch(url, { headers }))
            );

            const results = await Promise.all(
                responses.map(response => response.json())
            );

            const failed = results.find(
                (result, index) =>
                    !responses[index].ok || !result.success
            );

            if (failed) {
                throw new Error(
                    failed.message || "Failed to load license data."
                );
            }

            setLicenses(results[0].licenses || []);
            setEmployees(results[1].employees || []);
            setHistory(results[2].history || []);

            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!form.software_name.trim() || !form.total_seats) {
            setError("Software name and total seats are required.");
            return;
        }

        try {
            setSaving(true);

            const url = editingId
                ? `http://localhost:5000/api/licenses/${editingId}`
                : "http://localhost:5000/api/licenses";

            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers,
                body: JSON.stringify({
                    ...form,
                    total_seats: Number(form.total_seats),
                    cost: Number(form.cost || 0)
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "License save failed.");
            }

            setMessage(data.message);
            resetForm();
            await fetchData();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (license) => {
        setEditingId(license.id);

        setForm({
            software_name: license.software_name || "",
            vendor: license.vendor || "",
            license_key: license.license_key || "",
            total_seats: String(license.total_seats),
            expiry_date: license.expiry_date
                ? String(license.expiry_date).slice(0, 10)
                : "",
            cost: String(license.cost || 0)
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this license?")) {
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await fetch(
                `http://localhost:5000/api/licenses/${id}`,
                {
                    method: "DELETE",
                    headers
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Delete failed.");
            }

            setMessage(data.message);
            await fetchData();

        } catch (err) {
            setError(err.message);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!selectedLicense || !selectedEmployee) {
            setError("Select a license and employee.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/license-assignments/assign",
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        license_id: Number(selectedLicense),
                        user_id: Number(selectedEmployee)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "License assignment failed.");
            }

            setMessage(data.message);
            setSelectedLicense("");
            setSelectedEmployee("");

            await fetchData();

        } catch (err) {
            setError(err.message);
        }
    };

    const handleRelease = async (assignmentId) => {
        if (!window.confirm("Release this license from the employee?")) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/license-assignments/release/${assignmentId}`,
                {
                    method: "PATCH",
                    headers
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Release failed.");
            }

            setMessage(data.message);
            await fetchData();

        } catch (err) {
            setError(err.message);
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";

        const parsed = new Date(date);

        return Number.isNaN(parsed.getTime())
            ? date
            : parsed.toLocaleDateString("en-IN");
    };

    const filteredLicenses = licenses.filter(license =>
        `${license.software_name} ${license.vendor || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="dashboard-page employee-loading">
                <h2>Loading licenses...</h2>
            </div>
        );
    }

    return (
        <div className="dashboard-page employee-dashboard">
            <div className="employee-layout">

                <aside className="employee-sidebar">
                    <div className="employee-brand">
                        <h2>FORTISURE</h2>
                        <p>Asset Management</p>
                    </div>

                    <nav className="employee-nav">
                        <a href="#license-list" className="active">
                            Licenses
                        </a>
                        <a href="#add-license">Add License</a>
                        <a href="#assign-license">Assign Seats</a>
                        <a href="#license-history">Assignment History</a>
                    </nav>

                    <div className="employee-sidebar-footer">
                        <p>Admin Portal</p>
                        <button onClick={() => window.location.reload()}>
                            Back to Dashboard
                        </button>
                    </div>
                </aside>

                <main className="employee-main">

                    <header className="employee-topbar">
                        <div>
                            <p className="employee-breadcrumb">
                                Admin Portal / License Management
                            </p>
                            <h1>Software License Management</h1>
                        </div>
                    </header>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {message && (
                        <div className="success-message">{message}</div>
                    )}

                    {/* ADD / EDIT LICENSE */}
                    <section id="add-license" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>{editingId ? "Edit License" : "Add New License"}</h2>
                                <p>Manage software license details</p>
                            </div>
                        </div>

                        <form
                            className="employee-request-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="employee-form-group">
                                <label>Software Name</label>
                                <input
                                    name="software_name"
                                    value={form.software_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter software name"
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Vendor</label>
                                <input
                                    name="vendor"
                                    value={form.vendor}
                                    onChange={handleChange}
                                    placeholder="Enter vendor"
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>License Key</label>
                                <input
                                    name="license_key"
                                    value={form.license_key}
                                    onChange={handleChange}
                                    placeholder="Enter license key"
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Total Seats</label>
                                <input
                                    type="number"
                                    min="1"
                                    name="total_seats"
                                    value={form.total_seats}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={form.expiry_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Cost</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="cost"
                                    value={form.cost}
                                    onChange={handleChange}
                                />
                            </div>

                            <button type="submit" disabled={saving}>
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update License"
                                        : "Add License"}
                            </button>

                            {editingId && (
                                <button type="button" onClick={resetForm}>
                                    Cancel Edit
                                </button>
                            )}
                        </form>
                    </section>

                    {/* LICENSE LIST */}
                    <section id="license-list" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>All Software Licenses</h2>
                                <p>View and manage available licenses</p>
                            </div>
                            <span className="employee-count">
                                {licenses.length} Licenses
                            </span>
                        </div>

                        <div className="employee-form-group">
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search software or vendor..."
                            />
                        </div>

                        <div className="employee-table-wrapper">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Software</th>
                                        <th>Vendor</th>
                                        <th>Total Seats</th>
                                        <th>Used Seats</th>
                                        <th>Available Seats</th>
                                        <th>Expiry</th>
                                        <th>Cost</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredLicenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="employee-empty">
                                                No licenses found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLicenses.map(license => {
                                            const used = Number(license.used_seats || 0);
                                            const total = Number(license.total_seats || 0);

                                            return (
                                                <tr key={license.id}>
                                                    <td>{license.software_name}</td>
                                                    <td>{license.vendor || "N/A"}</td>
                                                    <td>{total}</td>
                                                    <td>{used}</td>
                                                    <td>{Math.max(total - used, 0)}</td>
                                                    <td>{formatDate(license.expiry_date)}</td>
                                                    <td>{license.cost}</td>
                                                    <td>
                                                        <button onClick={() => handleEdit(license)}>
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(license.id)}>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ASSIGN LICENSE */}
                    <section id="assign-license" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>Assign License Seats</h2>
                                <p>Assign available seats to employees</p>
                            </div>
                        </div>

                        <form
                            className="employee-request-form"
                            onSubmit={handleAssign}
                        >
                            <div className="employee-form-group">
                                <label>Select License</label>
                                <select
                                    value={selectedLicense}
                                    onChange={e => setSelectedLicense(e.target.value)}
                                    required
                                >
                                    <option value="">Select License</option>
                                    {licenses
                                        .filter(license =>
                                            Number(license.used_seats || 0) <
                                            Number(license.total_seats)
                                        )
                                        .map(license => (
                                            <option
                                                key={license.id}
                                                value={license.id}
                                            >
                                                {license.software_name} -
                                                {" "}Available: {
                                                    Number(license.total_seats) -
                                                    Number(license.used_seats || 0)
                                                }
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="employee-form-group">
                                <label>Select Employee</label>
                                <select
                                    value={selectedEmployee}
                                    onChange={e => setSelectedEmployee(e.target.value)}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(employee => (
                                        <option
                                            key={employee.id}
                                            value={employee.id}
                                        >
                                            {employee.name} ({employee.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit">
                                Assign License
                            </button>
                        </form>
                    </section>

                    {/* HISTORY */}
                    <section id="license-history" className="employee-section">
                        <div className="employee-section-heading">
                            <div>
                                <h2>License Assignment History</h2>
                                <p>Track assigned and released seats</p>
                            </div>
                            <span className="employee-count">
                                {history.length} Records
                            </span>
                        </div>

                        <div className="employee-table-wrapper">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Software</th>
                                        <th>Vendor</th>
                                        <th>Employee</th>
                                        <th>Email</th>
                                        <th>Assigned Date</th>
                                        <th>Released Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="employee-empty">
                                                No assignment history found.
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map(item => (
                                            <tr key={item.assignment_id}>
                                                <td>{item.software_name}</td>
                                                <td>{item.vendor || "N/A"}</td>
                                                <td>{item.employee_name}</td>
                                                <td>{item.employee_email}</td>
                                                <td>{formatDate(item.assigned_at)}</td>
                                                <td>{item.released_at
                                                    ? formatDate(item.released_at)
                                                    : "Active"}
                                                </td>
                                                <td>
                                                    {!item.released_at && (
                                                        <button
                                                            onClick={() =>
                                                                handleRelease(item.assignment_id)
                                                            }
                                                        >
                                                            Release
                                                        </button>
                                                    )}
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

export default LicenseManagement;
