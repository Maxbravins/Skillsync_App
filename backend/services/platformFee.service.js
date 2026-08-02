export const calculatePlatformFee = (budget) => {

    const percentage = 0.10;

    const fee = Math.round(budget * percentage);

    return fee;
};