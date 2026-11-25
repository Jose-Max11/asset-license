
import { useEffect, useState } from "react";
import "./dashboard-layout.css";

function ManageAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        asset_tag: "",
        serial_number: "",
        asset_name: "",
        category: "",
        brand: "",
        model: "",
        purchase_date: "",
        warranty_expiry: "",
        cost: ""
    };

    const [form, setForm] = useState(initialForm);

    const getToken = () =>
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const fetchAssets = async () => {
        try {
            const token = getToken();

            if (!token) {
                throw new Error("Please login again.");
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
                throw new Error(data.message || "Unable to load assets.");
            }

            setAssets(data.assets || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
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

        const token = getToken();

        if (!token) {
            setError("Please login again.");
            return;
        }

        try {
            const payload = {
                ...form,
                cost: form.cost === "" ? 0 : Number(form.cost)
            };

            const url = editingId
                ? `http://localhost:5000/api/assets/${editingId}`
                : "http://localhost:5000/api/assets";

            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to save asset.");
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
        }
    };

    const handleEdit = (asset) => {
        setError("");
        setMessage("");

        setEditingId(asset.id);

        setForm({
            asset_tag: asset.asset_tag || "",
            serial_number: asset.serial_number || "",
            asset_name: asset.asset_name || "",
            category: asset.category || "",
            brand: asset.brand || "",
            model: asset.model || "",
            purchase_date: asset.purchase_date
                ? String(asset.purchase_date).slice(0, 10)
                : "",
            warranty_expiry: asset.warranty_expiry
                ? String(asset.warranty_expiry).slice(0, 10)
                : "",
            cost: asset.cost ?? ""
        });

        document.getElementById("asset-form")?.scrollIntoView({
            behavior: "smooth"
        });
    };

    const handleRetire = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to retire this asset?"
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:5000/api/assets/${id}/retire`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to retire asset.");
            }

            setMessage("Asset retired successfully!");
            await fetchAssets();

        } catch (err) {
            setError(err.message);
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

    return (
        <div className="dashboard-page">
            <main className="employee-main">

                <header className="employee-topbar">
                    <div>
                        <p className="employee-breadcrumb">
                            Admin Portal / Asset Management
                        </p>
                        <h1>Manage Assets</h1>
                    </div>
                </header>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                {message && (
                    <div className="success-message">{message}</div>
                )}

                {/* ADD / EDIT ASSET FORM */}
                <section
                    id="asset-form"
                    className="employee-section"
                >
                    <div className="employee-section-heading">
                        <div>
                            <h2>
                                {editingId ? "Edit Asset" : "Add New Asset"}
                            </h2>
                            <p>
                                Enter the hardware asset information below.
                            </p>
                        </div>
                    </div>

                    <form
                        className="employee-request-form asset-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="asset-form-grid">

                            <div className="employee-form-group">
                                <label>Asset Tag *</label>
                                <input
                                    name="asset_tag"
                                    value={form.asset_tag}
                                    onChange={handleChange}
                                    placeholder="Example: AST-001"
                                    required
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Serial Number</label>
                                <input
                                    name="serial_number"
                                    value={form.serial_number}
                                    onChange={handleChange}
                                    placeholder="Enter serial number"
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Asset Name *</label>
                                <input
                                    name="asset_name"
                                    value={form.asset_name}
                                    onChange={handleChange}
                                    placeholder="Example: Laptop"
                                    required
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Category *</label>
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select category</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Desktop">Desktop</option>
                                    <option value="Monitor">Monitor</option>
                                    <option value="Keyboard">Keyboard</option>
                                    <option value="Mouse">Mouse</option>
                                    <option value="Printer">Printer</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="employee-form-group">
                                <label>Brand</label>
                                <input
                                    name="brand"
                                    value={form.brand}
                                    onChange={handleChange}
                                    placeholder="Example: Dell"
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Model</label>
                                <input
                                    name="model"
                                    value={form.model}
                                    onChange={handleChange}
                                    placeholder="Enter model"
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Purchase Date</label>
                                <input
                                    type="date"
                                    name="purchase_date"
                                    value={form.purchase_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Warranty Expiry</label>
                                <input
                                    type="date"
                                    name="warranty_expiry"
                                    value={form.warranty_expiry}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>Asset Cost</label>
                                <input
                                    type="number"
                                    name="cost"
                                    value={form.cost}
                                    onChange={handleChange}
                                    placeholder="Enter cost"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                        </div>

                        <div className="asset-form-actions">
                            <button type="submit">
                                {editingId ? "Update Asset" : "Add Asset"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* ASSET LIST */}
                <section className="employee-section">
                    <div className="employee-section-heading">
                        <div>
                            <h2>All Assets</h2>
                            <p>View and manage registered hardware assets.</p>
                        </div>

                        <span className="employee-count">
                            {assets.length} Assets
                        </span>
                    </div>

                    {loading ? (
                        <p>Loading assets...</p>
                    ) : (
                        <div className="employee-table-wrapper">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Asset Tag</th>
                                        <th>Asset Name</th>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <th>Purchase Date</th>
                                        <th>Cost</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {assets.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="8"
                                                className="employee-empty"
                                            >
                                                No assets found. Add your first asset.
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map(asset => (
                                            <tr key={asset.id}>
                                                <td>{asset.asset_tag}</td>
                                                <td>{asset.asset_name}</td>
                                                <td>{asset.category}</td>
                                                <td>{asset.brand || "N/A"}</td>
                                                <td>{formatDate(asset.purchase_date)}</td>
                                                <td>{asset.cost ?? 0}</td>
                                                <td>
                                                    <span className="employee-status">
                                                        {asset.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="asset-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(asset)}
                                                            disabled={asset.status === "Retired"}
                                                        >
                                                            Edit
                                                        </button>

                                                        {asset.status !== "Retired" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRetire(asset.id)}
                                                            >
                                                                Retire
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}

export default ManageAssets;
