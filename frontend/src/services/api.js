import axios from "axios";

// Keep API requests same-origin in both development and production.
// Vite proxies /api locally; Vercel rewrites /api in production.
const API_URL = "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  // Required so the HttpOnly refresh-token cookie is sent to /auth/*
  // endpoints and so the backend's CORS `credentials: true` config
  withCredentials: true,
});

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

let refreshPromise = null;

const requestRefresh = async () => {
  try {
    return await axios.post(
      `${API_URL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );
  } catch (error) {
    // Another tab may have rotated the single-use cookie just before
    // this request reached the server. Give the browser time to apply
    // that response cookie, then retry once with the current cookie.
    if (error.response?.status !== 409) {
      throw error;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250));
    return axios.post(
      `${API_URL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );
  }
};

const requestRefreshWithBrowserLock = () => {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(
      "skillsync-refresh-token",
      { mode: "exclusive" },
      requestRefresh
    );
  }

  return requestRefresh();
};

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = requestRefreshWithBrowserLock()
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isRefreshEndpoint = originalRequest?.url?.includes(
      "/auth/refresh-token"
    );

    if (status === 401 && !originalRequest?._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        // fall through to logout below
      }

      clearAuth();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
