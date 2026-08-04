export const PLATFORM_FEE_PERCENTAGE = 0.10;

// Client pays this before a job is published
export const calculatePlatformFee = (budget) => {
  return Math.round(budget * PLATFORM_FEE_PERCENTAGE);
};

// SkillSync keeps this after project payment
export const calculateCommission = (amount) => {
  return Math.round(amount * PLATFORM_FEE_PERCENTAGE);
};

// Amount that belongs to the developer
export const calculateDeveloperAmount = (amount) => {
  return amount - calculateCommission(amount);
};