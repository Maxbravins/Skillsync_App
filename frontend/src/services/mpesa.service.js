import api from "./api";

export const initiatePayment = async (
  applicationId,
  phoneNumber
) => {
  const res = await api.post(
    `/mpesa/pay/${applicationId}`,
    {
      phoneNumber,
    }
  );

  return res.data;
};

export const getTransactionStatus = async (
  transactionId
) => {
  const res = await api.get(
    `/mpesa/status/${transactionId}`
  );

  return res.data;
};

export const getPaymentHistory = async () => {
  const res = await api.get("/mpesa/history");

  return res.data;
};