import assert from "node:assert/strict";
import test from "node:test";

import { sendEmail } from "../services/email.service.js";

test("sendEmail skips delivery when Resend is not configured", async () => {
  const result = await sendEmail({
    to: "test@example.com",
    subject: "Test email",
    html: "<p>Hello</p>",
  });

  assert.equal(result.success, false);
  assert.equal(result.skipped, true);
});
