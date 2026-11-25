
import { useEffect, useState } from "react";
import "./RequestManagement.css";

function RequestsManagement({ user, onLogout, onNavigate }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [filter, setFilter] = useState("All");

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminRemarks, setAdminRemarks] = useState("");

    const getToken = () =>
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    // FETCH REQUESTS
    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/requests",
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to fetch requests."
                );
            }

            setRequests(data.requests || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // OPEN REMARKS FORM
    const handleReview = (request, status) => {
        setSelectedRequest({
            id: request.id,
            status
        });

        setAdminRemarks("");
        setMessage("");
        setError("");
    };

    // SUBMIT REVIEW
    const submitReview = async (e) => {
        e.preventDefault();

        if (!adminRemarks.trim()) {
            setError("Please enter admin remarks.");
            return;
        }

        const { id, status } = selectedRequest;

        try {
            setProcessingId(id);
            setMessage("");
            setError("");

            const response = await fetch(
                `http://localhost:5000/api/requests/${id}/review`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({
                        status: status,
                        admin_remarks: adminRemarks.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to review request."
                );
            }

            setMessage(data.message);
            setSelectedRequest(null);
            setAdminRemarks("");

            await fetchRequests();

        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    // FILTER REQUESTS
    const filteredRequests =
        filter === "All"
            ? requests
            : requests.filter(
                (request) => request.status === filter
            );

    const pendingCount = requests.filter(
        (request) => request.status === "Pending"
    ).length;

    const approvedCount = requests.filter(
        (request) => request.status === "Approved"
    ).length;

    const rejectedCount = requests.filter(
        (request) => request.status === "Rejected"
    ).length;

    return (
        <div className="employee-layout">

            {/* SIDEBAR */}
            <aside className="employee-sidebar">

                <div className="employee-brand">
                    <h2>FORTISURE</h2>
                    <p>Asset Management</p>
                </div>

                <nav className="employee-nav">

                    <button onClick={() => onNavigate("dashboard")}>
                        Dashboard
                    </button>

                    <button onClick={() => onNavigate("assets")}>
                        Hardware Assets
                    </button>

                    <button onClick={() => onNavigate("licenses")}>
                        Software Licenses
                    </button>

                    <button
                        className="active"
                        onClick={() => onNavigate("requests")}
                    >
                        Employee Requests
                    </button>

                </nav>

                <div className="employee-sidebar-footer">
                    <p>{user?.name}</p>
                    <button onClick={onLogout}>Logout</button>
                </div>

            </aside>

            {/* MAIN CONTENT */}
            <main className="employee-main">

                <header className="employee-topbar">
                    <div>
                        <h2>Employee Requests</h2>
                        <p>Review and manage employee requests</p>
                    </div>
                </header>

                {/* REQUEST OVERVIEW */}
                <section className="employee-section">

                    <h2>Request Overview</h2>

                    <div className="employee-stats">

                        <div className="employee-count">
                            <h3>{requests.length}</h3>
                            <p>Total Requests</p>
                        </div>

                        <div className="employee-count">
                            <h3>{pendingCount}</h3>
                            <p>Pending</p>
                        </div>

                        <div className="employee-count">
                            <h3>{approvedCount}</h3>
                            <p>Approved</p>
                        </div>

                        <div className="employee-count">
                            <h3>{rejectedCount}</h3>
                            <p>Rejected</p>
                        </div>

                    </div>

                </section>

                {message && (
                    <p className="success-message">{message}</p>
                )}

                {error && (
                    <p className="error-message">{error}</p>
                )}

                {/* ADMIN REMARKS FORM */}
                {selectedRequest && (
                    <section className="employee-section">

                        <h2>
                            {selectedRequest.status === "Approved"
                                ? "Approve Request"
                                : "Reject Request"}
                        </h2>

                        <form
                            className="employee-request-form"
                            onSubmit={submitReview}
                        >

                            <div className="employee-form-group">

                                <label>Admin Remarks *</label>

                                <textarea
                                    value={adminRemarks}
                                    onChange={(e) =>
                                        setAdminRemarks(e.target.value)
                                    }
                                    placeholder="Enter your reason or remarks..."
                                    rows="4"
                                    required
                                />

                            </div>

                            <div className="request-actions">

                                <button
                                    type="submit"
                                    disabled={processingId === selectedRequest.id}
                                >
                                    {processingId === selectedRequest.id
                                        ? "Submitting..."
                                        : "Confirm"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRequest(null);
                                        setAdminRemarks("");
                                        setError("");
                                    }}
                                    disabled={processingId === selectedRequest.id}
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    </section>
                )}

                {/* REQUEST HISTORY */}
                <section className="employee-section">

                    <div className="employee-section-header">

                        <h2>All Employee Requests</h2>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="All">All Requests</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                    </div>

                    {loading ? (
                        <p>Loading requests...</p>
                    ) : filteredRequests.length === 0 ? (
                        <p>No requests found.</p>
                    ) : (

                        <div className="employee-table-wrapper">

                            <table className="employee-table">

                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Email</th>
                                        <th>Request Type</th>
                                        <th>Description</th>
                                        <th>Request Date</th>
                                        <th>Status</th>
                                        <th>Admin Remarks</th>
                                        <th>Action By</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredRequests.map((request) => (

                                        <tr key={request.id}>

                                            <td>{request.employee_name}</td>

                                            <td>{request.employee_email}</td>

                                            <td>{request.request_type}</td>

                                            <td>{request.description}</td>

                                            <td>
                                                {request.created_at
                                                    ? new Date(
                                                        request.created_at
                                                    ).toLocaleDateString()
                                                    : "-"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`request-status ${request.status?.toLowerCase()}`}
                                                >
                                                    {request.status}
                                                </span>
                                            </td>

                                            <td>
                                                {request.admin_remarks || "-"}
                                            </td>

                                            <td>
                                                {request.admin_name || "-"}
                                            </td>

                                            <td>

                                                {request.status === "Pending" ? (

                                                    <div className="request-actions">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleReview(
                                                                    request,
                                                                    "Approved"
                                                                )
                                                            }
                                                        >
                                                            Approve
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleReview(
                                                                    request,
                                                                    "Rejected"
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </button>

                                                    </div>

                                                ) : (
                                                    <span>Reviewed</span>
                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default RequestsManagement;
