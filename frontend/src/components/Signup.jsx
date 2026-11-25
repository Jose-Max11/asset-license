
import { useState } from "react";

function Signup({ onSwitch }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "employee",
        adminCode: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const {
            name, email, password, confirmPassword, role, adminCode
        } = formData;

        if (name.trim().length < 2) {
            setError("Name must contain at least 2 characters.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (
            password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[^A-Za-z0-9]/.test(password)
        ) {
            setError("Password needs 8 characters, uppercase, lowercase, number and special character.");
            return;
        }

        if (new TextEncoder().encode(password).length > 72) {
            setError("Password is too long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (role === "admin" && !adminCode.trim()) {
            setError("Please enter the admin registration code.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                        password,
                        confirmPassword,
                        role,
                        adminCode
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || data.errors?.join(" ") || "Signup failed."
                );
            }

            setSuccess("Account created successfully! Please login.");

            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "employee",
                adminCode: ""
            });

        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">

            <h2>Create Account</h2>

            <p className="subtitle">
                Register to access your workspace
            </p>

            <form onSubmit={handleSignup}>

                <label>Select Role</label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                </select>

                {formData.role === "admin" && (
                    <>
                        <label>Admin Registration Code</label>
                        <input
                            type="password"
                            name="adminCode"
                            placeholder="Enter admin registration code"
                            value={formData.adminCode}
                            onChange={handleChange}
                            required
                        />
                    </>
                )}

                <label>Full Name</label>
                <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                />

                <label>Email Address</label>
                <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                />

                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                />

                <label>Confirm Password</label>
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                />

                <p className="password-hint">
                    Use at least 8 characters with uppercase,
                    lowercase, number and special character.
                </p>

                {error && (
                    <p className="error-message">{error}</p>
                )}

                {success && (
                    <p className="success-message">{success}</p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>

            </form>

            <p className="switch-text">
                Already have an account?{" "}
                <span onClick={onSwitch}>Login</span>
            </p>

        </div>
    );
}

export default Signup;
