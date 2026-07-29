export const API_ENDPOINTS = {
  AUTH: { REGISTER: "/auth/register", LOGIN: "/auth/login", LOGOUT: "/auth/logout", ME: "/auth/me" },
  JOBS: { ALL: "/jobs", MY: "/jobs/my", CREATE: "/jobs", UPDATE: (id) => `/jobs/${id}`, DELETE: (id) => `/jobs/${id}` },
  APPLICATIONS: { MY: "/applications/me", JOB: (jobId) => `/applications/job/${jobId}` },
};
