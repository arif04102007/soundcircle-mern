export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const TOKEN_KEY = "sc_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, "NETWORK");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth && getToken()) onUnauthorized();
    throw new ApiError(data.error || "Something went wrong.", res.status, data.code);
  }
  return data;
}

const FALLBACK_ICE = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  {
    urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];
export async function getIceServers() {
  try {
    const data = await api("/config/ice", { auth: false });
    return data.iceServers?.length ? data.iceServers : FALLBACK_ICE;
  } catch {
    return FALLBACK_ICE;
  }
}
