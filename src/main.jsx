import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { KeycloakProvider } from "./auth/KeycloakProvider";
import "./styles.css";

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <KeycloakProvider>
            <App />
        </KeycloakProvider>
    </React.StrictMode>
);

