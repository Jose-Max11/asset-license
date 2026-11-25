
import { GoogleLogin } from "@react-oauth/google";

function GoogleLoginButton({ onLogin, onError }) {

    const handleGoogleSuccess = async (credentialResponse) => {

        try {

            if (!credentialResponse.credential) {
                throw new Error("Google did not provide a valid credential.");
            }

            const response = await fetch(
                "http://localhost:5000/api/auth/google",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        credential: credentialResponse.credential
                    })
                }
            );

            // Read response safely
            const responseText = await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(
                    "Invalid server response. Check whether your backend is running."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Google login failed."
                );
            }

            if (!data.token || !data.user) {
                throw new Error("Invalid login response from server.");
            }

            // Store authentication details
            localStorage.setItem("token", data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            onLogin(data.user);

        } catch (error) {

            console.error("Google login error:", error);

            onError(
                error.message || "Unable to connect to server."
            );
        }
    };

    return (
        <div className="google-login">

            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                    onError("Google authentication was unsuccessful.");
                }}
                theme="outline"
                size="large"
                shape="rectangular"
                text="continue_with"
                width="320"
            />

        </div>
    );
}

export default GoogleLoginButton;
