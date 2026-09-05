import api from "./api";

/**
 * Apply for a job.
 */
export const applyForJob = async (jobId, coverLetter) => {
  if (!jobId) {
    throw new Error("Job ID is required.");
  }

  if (!coverLetter?.trim()) {
    throw new Error("Cover letter is required.");
  }

  const response = await api.post(
    `/applications/apply/${jobId}`,
    {
      coverLetter: coverLetter.trim(),
    }
  );

  return response.data;
};

/**
 * Get applications submitted by the authenticated developer.
 */
export const getMyApplications = async () => {
  const response = await api.get("/applications/my");

  return response.data;
};

/**
 * Get all applications for a specific job.
 * Intended for the job owner/client.
 */
export const getJobApplications = async (jobId) => {
  if (!jobId) {
    throw new Error("Job ID is required.");
  }

  const response = await api.get(
    `/applications/job/${jobId}`
  );

  return response.data;
};

/**
 * Update the status of an application.
 */
export const updateApplicationStatus = async (
  applicationId,
  status
) => {
  if (!applicationId) {
    throw new Error("Application ID is required.");
  }

  if (!status) {
    throw new Error("Application status is required.");
  }

  const response = await api.put(
    `/applications/${applicationId}/status`,
    { status }
  );

  return response.data;
};

/**
 * Get applications received by the authenticated client.
 */
export const getClientApplications = async () => {
  const response = await api.get("/applications/client");

  return response.data;
};
