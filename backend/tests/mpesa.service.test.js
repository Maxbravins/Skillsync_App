import assert from "node:assert/strict";
import test from "node:test";

import { formatPhoneNumber } from "../services/mpesa.service.js";

test("formatPhoneNumber converts local Kenyan numbers to international format", () => {
  assert.equal(formatPhoneNumber("0712345678"), "254712345678");
  assert.equal(formatPhoneNumber("+254712345678"), "254712345678");
});

test("formatPhoneNumber rejects invalid phone numbers", () => {
  assert.throws(() => formatPhoneNumber("123"), /invalid phone number/i);
});
