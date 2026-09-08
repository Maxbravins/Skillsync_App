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
      } catch (refreshError) {
        // fall through to logout below
      }

      clearAuth();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;