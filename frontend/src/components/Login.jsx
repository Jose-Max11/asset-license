
import { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";

function Login({ onSwitch, onLogin }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("employee");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {

        e.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                        role
                    })
                }
            );

            const responseText = await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error("Invalid server response. Please try again.");
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.errors?.join(" ") ||
                    "Login failed."
                );
            }

            localStorage.setItem("token", data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            onLogin(data.user);

        } catch (err) {

            setError(
                err.message || "Unable to connect to the server."
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="auth-card">

            <h2>Welcome Back!</h2>

            <p className="subtitle">
                Sign in to access your account
            </p>

            <form onSubmit={handleLogin}>

                <label>Select Role</label>

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                </select>

                <label>Email Address</label>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                />

                <label>Password</label>

                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />

                {error && (
                    <p className="error-message">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Signing In..." : "Login"}
                </button>

            </form>

            <div className="or-divider">
                <span>OR</span>
            </div>

            <GoogleLoginButton
                onLogin={onLogin}
                onError={setError}
            />

            <p className="switch-text">
                Don't have an account?{" "}
                <span onClick={onSwitch}>
                    Sign Up
                </span>
            </p>

        </div>
    );
}

export default Login;
