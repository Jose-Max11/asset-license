
import React from "react";
import ReactDOM from "react-dom/client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";

const GOOGLE_CLIENT_ID="1040748517860-unsdjsnv20ft24ejt8guu313ktr976ue.apps.googleusercontent.com";

ReactDOM.createRoot(
    document.getElementById("root")
).render(

    <React.StrictMode>

        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>

            <App />

        </GoogleOAuthProvider>

    </React.StrictMode>

);
