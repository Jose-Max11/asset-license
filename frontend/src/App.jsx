
import { useState, useEffect } from "react";

import Login from "./components/Login";
import Signup from "./components/Signup";

import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManageAssets from "./pages/ManageAssets";
import LicenseManagement from "./pages/LicenseManagement";
import RequestsManagement from "./pages/RequestsManagement";

import "./auth.css";

function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyLogin = async () => {
            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    "http://localhost:5000/api/auth/me",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error("Session expired");
                }

                setUser(data.user);

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                setPage("dashboard");

            } catch (error) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifyLogin();
    }, []);

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
        setPage("dashboard");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setPage("login");
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <h2>Checking your session...</h2>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="auth-page">
                <div className="form-section">
                    {page === "signup" ? (
                        <Signup
                            onSwitch={() => setPage("login")}
                        />
                    ) : (
                        <Login
                            onSwitch={() => setPage("signup")}
                            onLogin={handleLogin}
                        />
                    )}
                </div>
            </div>
        );
    }

    if (user.role === "admin") {
        if (page === "assets") {
            return <ManageAssets />;
        }

        if (page === "licenses") {
            return <LicenseManagement />;
        }

        if (page === "requests") {
            return (
                <RequestsManagement
                    user={user}
                    onLogout={handleLogout}
                    onNavigate={setPage}
                />
            );
        }

        return (
            <AdminDashboard
                user={user}
                onLogout={handleLogout}
                onNavigate={setPage}
            />
        );
    }

    if (user.role === "employee") {
        return (
            <EmployeeDashboard
                user={user}
                onLogout={handleLogout}
            />
        );
    }

    return <h2>Invalid user role.</h2>;
}

export default App;
