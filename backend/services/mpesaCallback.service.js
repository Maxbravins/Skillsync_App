// ============================================================
// Pure helpers for validating an M-Pesa STK Push callback.
// Kept free of database access so they can be unit tested.
// ============================================================

// initiateSTKPush() sends Math.max(1, Math.round(amount)) to M-Pesa,
// so that is the amount the customer is actually charged and the
// amount the callback reports back.
export const expectedStkAmount = (totalAmount) =>
  Math.max(1, Math.round(Number(totalAmount)));

export const extractStkMetadata = (callbackMetadata) => {
  const items = Array.isArray(callbackMetadata?.Item)
    ? callbackMetadata.Item
    : [];

  const valueOf = (name) =>
    items.find((item) => item?.Name === name)?.Value;

  return {
    receiptNumber: valueOf("MpesaReceiptNumber"),
    amount: valueOf("Amount"),
  };
};

// A "successful" callback is only trusted when it carries BOTH a
// receipt number and an amount that exactly matches what we asked
// the customer to pay. A missing or non-numeric amount is a
// rejection, never a pass.
export const verifySuccessfulStkPayment = (
  transaction,
  callbackMetadata
) => {
  const { receiptNumber, amount } = extractStkMetadata(callbackMetadata);

  const receipt =
    typeof receiptNumber === "string" ? receiptNumber.trim() : "";

  if (!receipt) {
    return {
      valid: false,
      reason: "M-Pesa success callback is missing a receipt number.",
    };
  }

  if (amount === undefined || amount === null || amount === "") {
    return {
      valid: false,
      reason: "M-Pesa success callback is missing the paid amount.",
    };
  }

  const paidAmount = Number(amount);

  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    return {
      valid: false,
      reason: `M-Pesa success callback has an invalid amount: ${String(
        amount
      )}.`,
    };
  }

  const expected = expectedStkAmount(transaction.totalAmount);

  if (paidAmount !== expected) {
    return {
      valid: false,
      reason: `M-Pesa amount mismatch. Expected ${expected}, received ${paidAmount}.`,
    };
  }

  return { valid: true, receiptNumber: receipt, paidAmount };
};
