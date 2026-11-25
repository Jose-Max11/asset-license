
function validateSignup({
    name,
    email,
    password,
    confirmPassword
}) {
    const errors = [];

    if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
    ) {
        errors.push("Name must contain 2 to 100 characters.");
    } else if (
        !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name.trim())
    ) {
        errors.push("Name contains invalid characters.");
    }

    if (
        typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        errors.push("Enter a valid email address.");
    }

    if (typeof password !== "string") {
        errors.push("Password is required.");
    } else {
        if (password.length < 8) {
            errors.push("Password must contain at least 8 characters.");
        }

        if (Buffer.byteLength(password, "utf8") > 72) {
            errors.push("Password is too long.");
        }

        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain an uppercase letter.");
        }

        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain a lowercase letter.");
        }

        if (!/[0-9]/.test(password)) {
            errors.push("Password must contain a number.");
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push("Password must contain a special character.");
        }
    }

    if (
        typeof confirmPassword !== "string" ||
        password !== confirmPassword
    ) {
        errors.push("Password and confirm password do not match.");
    }

    return errors;
}

function validateLogin({ email, password }) {
    const errors = [];

    if (typeof email !== "string" || !email.trim()) {
        errors.push("Email is required.");
    }

    if (typeof password !== "string" || !password) {
        errors.push("Password is required.");
    }

    return errors;
}

module.exports = {
    validateSignup,
    validateLogin
};
