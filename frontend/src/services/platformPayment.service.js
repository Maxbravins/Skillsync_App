import api from "./api";

export const payPlatformFee = async (jobId, phoneNumber) => {
  const response = await api.post(
    `/platform-payment/${jobId}`,
    {
      phoneNumber,
    }
  );

  return response.data;
};