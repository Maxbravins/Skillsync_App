import api from "./api";

const validateId = (id, fieldName) => {
  if (!id) {
    throw new Error(`${fieldName} is required.`);
  }
};

/**
 * Initiate an M-Pesa payment for an application.
 */
export const initiatePayment = async (
  applicationId,
  phoneNumber
) => {
  validateId(applicationId, "Application ID");

  if (!phoneNumber?.trim()) {
    throw new Error("Phone number is required.");
  }

  const response = await api.post(
    `/mpesa/pay/${applicationId}`,
    {
      phoneNumber: phoneNumber.trim(),
    }
  );

  return response.data;
};

/**
 * Get the current status of an M-Pesa transaction.
 */
export const getTransactionStatus = async (transactionId) => {
  validateId(transactionId, "Transaction ID");

  const response = await api.get(
    `/mpesa/status/${transactionId}`
  );

  return response.data;
};

/**
 * Get payment history for the authenticated user.
 */
export const getPaymentHistory = async () => {
  const response = await api.get("/mpesa/history");

  return response.data;
};
