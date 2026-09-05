import api from "./api";

/**
 * Initiate payment for a premium subscription.
 *
 * @param {string} plan - Premium subscription plan.
 * @param {string} phoneNumber - M-Pesa phone number.
 * @returns {Promise<Object>} API response.
 */
export const payPremium = async (plan, phoneNumber) => {
  if (!plan?.trim()) {
    throw new Error("Premium plan is required.");
  }

  if (!phoneNumber?.trim()) {
    throw new Error("Phone number is required.");
  }

  const response = await api.post("/premium/pay", {
    plan: plan.trim(),
    phoneNumber: phoneNumber.trim(),
  });

  return response.data;
};
