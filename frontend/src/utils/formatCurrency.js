export const formatCurrency =
  (amount) => {
    return `KES ${Number(
      amount
    ).toLocaleString()}`;
  };