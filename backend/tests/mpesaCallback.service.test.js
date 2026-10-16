import assert from "node:assert/strict";
import test from "node:test";

import {
  expectedStkAmount,
  verifySuccessfulStkPayment,
} from "../services/mpesaCallback.service.js";

const metadata = (items) => ({ Item: items });
const receipt = (value = "NLJ7RT61SV") => ({
  Name: "MpesaReceiptNumber",
  Value: value,
});
const amount = (value) => ({ Name: "Amount", Value: value });

const tx = (totalAmount) => ({ totalAmount });

test("expectedStkAmount mirrors the rounding used when sending the STK push", () => {
  assert.equal(expectedStkAmount(1050), 1050);
  assert.equal(expectedStkAmount(1050.4), 1050);
  assert.equal(expectedStkAmount(1050.5), 1051);
  assert.equal(expectedStkAmount(0.2), 1); // STK push never sends less than 1
});

test("accepts a callback with the right receipt and amount", () => {
  const result = verifySuccessfulStkPayment(
    tx(1050),
    metadata([amount(1050), receipt()])
  );

  assert.equal(result.valid, true);
  assert.equal(result.receiptNumber, "NLJ7RT61SV");
  assert.equal(result.paidAmount, 1050);
});

test("accepts a non-integer total when M-Pesa reports the rounded amount", () => {
  const result = verifySuccessfulStkPayment(
    tx(1050.5),
    metadata([amount(1051), receipt()])
  );

  assert.equal(result.valid, true);
});

test("REGRESSION: rejects a success callback that omits the Amount", () => {
  // Previously Number(undefined) -> NaN skipped the amount check entirely.
  const result = verifySuccessfulStkPayment(
    tx(1050),
    metadata([receipt()])
  );

  assert.equal(result.valid, false);
  assert.match(result.reason, /missing the paid amount/i);
});

test("rejects a non-numeric or non-positive amount", () => {
  for (const bad of ["abc", 0, -5, NaN, null, ""]) {
    const result = verifySuccessfulStkPayment(
      tx(1050),
      metadata([amount(bad), receipt()])
    );

    assert.equal(result.valid, false, `amount ${String(bad)} should be rejected`);
  }
});

test("rejects an amount that differs from what was requested", () => {
  const underpaid = verifySuccessfulStkPayment(
    tx(1050),
    metadata([amount(1), receipt()])
  );
  const overpaid = verifySuccessfulStkPayment(
    tx(1050),
    metadata([amount(5000), receipt()])
  );

  assert.equal(underpaid.valid, false);
  assert.match(underpaid.reason, /mismatch/i);
  assert.equal(overpaid.valid, false);
});

test("REGRESSION: rejects a success callback with no receipt number", () => {
  for (const meta of [
    metadata([amount(1050)]),
    metadata([amount(1050), receipt("")]),
    metadata([amount(1050), receipt("   ")]),
    metadata([amount(1050), receipt(12345)]),
  ]) {
    const result = verifySuccessfulStkPayment(tx(1050), meta);

    assert.equal(result.valid, false);
    assert.match(result.reason, /receipt/i);
  }
});

test("rejects missing or malformed CallbackMetadata", () => {
  for (const meta of [undefined, null, {}, { Item: "nope" }, { Item: [] }]) {
    assert.equal(verifySuccessfulStkPayment(tx(1050), meta).valid, false);
  }
});
