import api from "./api";

/**
 * Initiate payment of the platform fee for a job.
 */
export const payPlatformFee = async (jobId, phoneNumber) => {
  if (!jobId) {
    throw new Error("Job ID is required.");
  }

  if (!phoneNumber?.trim()) {
    throw new Error("Phone number is required.");
  }

  const response = await api.post(
    `/platform-payment/${jobId}`,
    {
      phoneNumber: phoneNumber.trim(),
    }
  );

  return response.data;
};
