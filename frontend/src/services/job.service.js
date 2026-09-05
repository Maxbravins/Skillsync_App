import api from "./api";

const validateJobId = (id) => {
  if (!id) {
    throw new Error("Job ID is required.");
  }
};

const normalizePagination = (page, limit) => {
  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);

  return {
    page:
      Number.isInteger(normalizedPage) && normalizedPage > 0
        ? normalizedPage
        : 1,

    limit:
      Number.isInteger(normalizedLimit) && normalizedLimit > 0
        ? normalizedLimit
        : 10,
  };
};

/**
 * Get all available jobs.
 */
export const getAllJobs = async (page = 1, limit = 10) => {
  const pagination = normalizePagination(page, limit);

  const response = await api.get("/jobs", {
    params: pagination,
  });

  return response.data;
};

/**
 * Get jobs created by the authenticated client.
 */
export const getMyJobs = async (page = 1, limit = 10) => {
  const pagination = normalizePagination(page, limit);

  const response = await api.get("/jobs/my", {
    params: pagination,
  });

  return response.data;
};

/**
 * Get a single job by ID.
 */
export const getJobById = async (id) => {
  validateJobId(id);

  const response = await api.get(`/jobs/${id}`);

  return response.data;
};

/**
 * Create a new job.
 */
export const createJob = async (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Job data is required.");
  }

  const response = await api.post("/jobs", data);

  return response.data;
};

/**
 * Update an existing job.
 */
export const updateJob = async (id, data) => {
  validateJobId(id);

  if (!data || typeof data !== "object") {
    throw new Error("Job data is required.");
  }

  const response = await api.put(`/jobs/${id}`, data);

  return response.data;
};

/**
 * Delete a job.
 */
export const deleteJob = async (id) => {
  validateJobId(id);

  const response = await api.delete(`/jobs/${id}`);

  return response.data;
};
