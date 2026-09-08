import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api, { setAccessToken } from "../services/api";

export const AuthContext = createContext(null);

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Failed to parse stored user:", error);

    localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authentication state when the app starts.
  //
  // The access token is never persisted (see services/api.js), so on
  // a fresh page load we don't have one yet. Instead we try a silent
  // refresh: if the browser still has a valid HttpOnly refresh-token
  // cookie, the backend hands back a new access token and we're
  // logged back in without the user re-entering credentials. If that
  // fails (cookie expired/missing), we fall back to logged-out.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const cachedUser = getStoredUser();

      try {
        const res = await api.post("/auth/refresh-token");
        const newToken = res.data?.token;

        if (!newToken) {
          throw new Error("No token returned from refresh");
        }

        setAccessToken(newToken);

        // Re-fetch the canonical user record rather than trusting
        // the (possibly stale) cached copy.
        const meRes = await api.get("/auth/me");
        const freshUser = meRes.data?.user;

        if (cancelled) return;

        if (freshUser) {
          localStorage.setItem("user", JSON.stringify(freshUser));
          setUser(freshUser);
        } else {
          setUser(cachedUser);
        }

        setToken(newToken);
      } catch (error) {
        if (cancelled) return;

        localStorage.removeItem("user");
        setAccessToken(null);
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((userData, tokenData) => {
    if (!userData || !tokenData) {
      console.error("Login requires user data and a token.");
      return;
    }

    localStorage.setItem("user", JSON.stringify(userData));
    setAccessToken(tokenData);

    setToken(tokenData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    // Best-effort: revoke the refresh-token cookie server-side too,
    // so the session can't be silently restored elsewhere.
    api.post("/auth/logout").catch(() => {});

    localStorage.removeItem("user");
    setAccessToken(null);

    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    if (!updatedUser) {
      return;
    }

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const isDeveloper = user?.role === "developer";
  const isClient = user?.role === "client";
  const isAdmin = user?.role === "admin";

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated,
      isDeveloper,
      isClient,
      isAdmin,
    }),
    [
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated,
      isDeveloper,
      isClient,
      isAdmin,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
