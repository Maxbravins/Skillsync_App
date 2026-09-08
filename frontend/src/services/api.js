import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn(
    "VITE_API_URL is not configured. Check your .env file."
  );
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  // Required so the HttpOnly refresh-token cookie is sent to /auth/*
  // endpoints and so the backend's CORS `credentials: true` config
  // actually takes effect.
  withCredentials: true,
});

// ============================================================
// ACCESS TOKEN — kept in memory only.
//
// It used to live in localStorage, which meant it (and its 7-day
// lifetime) was readable by any script on the page — a serious
// XSS blast-radius problem for an app that touches money. Now it's
// short-lived (15 min) and never persisted; a page reload silently
// re-derives it from the HttpOnly refresh-token cookie instead.
// ============================================================

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getAccessToken = () => accessToken;

const clearAuth = () => {
  accessToken = null;
  localStorage.removeItem("user");
};

const redirectToLogin = () => {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;

  // Don't redirect if already on an authentication page.
  const authPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-otp",
    "/reset-password",
  ];

  if (authPaths.includes(currentPath)) {
    return;
  }

  const redirect = encodeURIComponent(
    `${currentPath}${currentSearch}`
  );

  window.location.href = `/login?redirect=${redirect}`;
};

// Attach the in-memory access token to every request.
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// SILENT REFRESH
//
// A single in-flight refresh is shared across every request that
// hits a 401 at the same time, so a page with several concurrent
// API calls doesn't fire several parallel refresh attempts (which
// would race to rotate the same one-time-use refresh token and
// fail each other).
// ============================================================

let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      )
      .then((res) => {
        const newToken = res.data?.token;
        setAccessToken(newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Handle authentication errors globally, retrying once via a
// silent refresh before giving up and sending the user to /login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // fall through to logout below
      }

      clearAuth();
      redirectToLogin();
    } else if (status === 401 && isAuthEndpoint) {
      clearAuth();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
