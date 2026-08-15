export const PREMIUM_PLANS = {
  monthly: {
    name: "Monthly Premium",
    price: 300,
    durationDays: 30,
  },

  yearly: {
    name: "Yearly Premium",
    price: 3000,
    durationDays: 365,
  },
};

export const getPremiumPlan = (plan) => {
  return PREMIUM_PLANS[plan] || null;
};

export const calculatePremiumExpiry = (plan, startDate = new Date()) => {
  const selectedPlan = getPremiumPlan(plan);

  if (!selectedPlan) {
    throw new Error("Invalid premium plan.");
  }

  const expiry = new Date(startDate);

  expiry.setDate(
    expiry.getDate() + selectedPlan.durationDays
  );

  return expiry;
};