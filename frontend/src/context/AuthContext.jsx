import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setToken(null);
      setUser(null);
    }

    setLoading(false);
  }, []);

  const login = useCallback((userData, tokenData) => {
    if (!userData || !tokenData) {
      console.error("Login requires user data and a token.");
      return;
    }

    localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(tokenData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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
