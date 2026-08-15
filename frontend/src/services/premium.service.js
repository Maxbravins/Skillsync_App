import api from "./api";

export const payPremium = async (plan, phoneNumber) => {
  const response = await api.post("/premium/pay", {
    plan,
    phoneNumber,
  });

  return response.data;
};