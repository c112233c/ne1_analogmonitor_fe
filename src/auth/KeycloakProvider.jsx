import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import keycloak, { keycloakConfig } from "./keycloak";

const KeycloakContext = createContext(null);

// keycloak-js does not allow the same Keycloak instance to be initialized twice.
// Keep the initialization promise at module scope so React StrictMode (which can
// run effects twice in development) does not call keycloak.init() twice.
let keycloakInitPromise = null;

function initializeKeycloak() {
    if (!keycloakInitPromise) {
        keycloakInitPromise = keycloak.init({
            onLoad: "login-required",
            checkLoginIframe: false,
            pkceMethod: "S256",
        });
    }

    return keycloakInitPromise;
}

export function KeycloakProvider({ children }) {
    const [initialized, setInitialized] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                if (!keycloakConfig.url || !keycloakConfig.realm || !keycloakConfig.clientId) {
                    throw new Error(
                        "Missing VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM or VITE_KEYCLOAK_CLIENT_ID"
                    );
                }

                const isAuthenticated = await initializeKeycloak();

                if (mounted) {
                    setAuthenticated(isAuthenticated);
                    setInitialized(true);
                }
            } catch (initError) {
                console.error("Keycloak initialization failed", initError);
                if (mounted) {
                    setError(initError);
                    setInitialized(true);
                }
            }
        };

        keycloak.onAuthSuccess = () => mounted && setAuthenticated(true);
        keycloak.onAuthLogout = () => mounted && setAuthenticated(false);
        keycloak.onTokenExpired = async () => {
            try {
                await keycloak.updateToken(30);
                if (mounted) setAuthenticated(true);
            } catch (refreshError) {
                console.error("Keycloak token refresh failed", refreshError);
                if (mounted) setAuthenticated(false);
                keycloak.login();
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, []);

    const login = useCallback(() => keycloak.login(), []);
    const logout = useCallback(() => keycloak.logout(), []);

    const updateToken = useCallback(async () => {
        if (!keycloak.authenticated) return false;
        try {
            await keycloak.updateToken(30);
            return true;
        } catch (refreshError) {
            console.error("Keycloak token refresh failed", refreshError);
            setAuthenticated(false);
            await keycloak.login();
            return false;
        }
    }, []);

    const user = keycloak.tokenParsed;
    const userName =
        user?.name ||
        [user?.given_name, user?.family_name].filter(Boolean).join(" ") ||
        user?.preferred_username ||
        user?.email ||
        "User";

    const value = useMemo(
        () => ({
            keycloak,
            initialized,
            authenticated,
            error,
            user,
            userName,
            login,
            logout,
            updateToken,
        }),
        [initialized, authenticated, error, login, logout, updateToken]
    );

    if (!initialized) {
        return <div className="auth-loading">Authenticating...</div>;
    }

    if (error) {
        return (
            <div className="auth-error">
                <h2>Authentication failed</h2>
                <p>{error.message}</p>
                <button type="button" onClick={login}>
                    Login with Keycloak
                </button>
            </div>
        );
    }

    if (!authenticated) {
        return <div className="auth-loading">Redirecting to Keycloak...</div>;
    }

    return <KeycloakContext.Provider value={value}>{children}</KeycloakContext.Provider>;
}

export function useKeycloak() {
    const context = useContext(KeycloakContext);

    if (!context) {
        throw new Error("useKeycloak must be used inside KeycloakProvider");
    }

    return context;
}
