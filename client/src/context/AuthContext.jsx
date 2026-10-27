import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "../lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch((err) => {
        // Only clear the session on a real 401 (token rejected by server).
        // Network errors (status 0) should not log the user out silently.
        if (err.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [logout]);

  const authenticate = async (path, body) => {
    const d = await api(path, { method: "POST", body, auth: false });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };

  const value = {
    user,
    loading,
    login: (email, password) => authenticate("/auth/login", { email, password }),
    register: (name, email, password) => authenticate("/auth/register", { name, email, password }),
    logout,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
