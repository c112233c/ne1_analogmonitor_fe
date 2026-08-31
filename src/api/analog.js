import keycloak from "../auth/keycloak";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    console.error("Missing VITE_API_BASE_URL");
}

const API_BASE = `${API_BASE_URL || ""}/api/analog`;

async function request(url) {
    if (keycloak.authenticated) {
        try {
            await keycloak.updateToken(30);
        } catch (error) {
            console.error("Failed to refresh Keycloak token", error);
            await keycloak.login();
            throw error;
        }
    }

    const headers = {};
    if (keycloak.token) {
        headers.Authorization = `Bearer ${keycloak.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Request failed");
    }

    return response.json();
}

export const getStations = () => request(`${API_BASE}/stations`);

export const getBays = (sub) =>
    request(`${API_BASE}/stations/${encodeURIComponent(sub)}/bays`);

export const getPoints = (sub, bay) =>
    request(
        `${API_BASE}/stations/${encodeURIComponent(sub)}/bays/${encodeURIComponent(bay)}/points`
    );

export const getHistory = (gid, from, to) =>
    request(`${API_BASE}/history?${new URLSearchParams({ gid, from, to })}`);

export const getDetail = (type, from, to) =>
    request(`${API_BASE}/detail?${new URLSearchParams({ type, from, to })}`);
