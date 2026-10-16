import crypto from "node:crypto";

// ============================================================
// M-PESA WEBHOOK AUTHENTICATION
//
// Safaricom cannot send custom headers or signatures with its
// callbacks, so the standard approach is to put an unguessable
// secret in the callback URL itself. Only requests to
//   /api/mpesa/callback/<MPESA_WEBHOOK_SECRET>
// (and the B2C equivalents) are accepted; everything else is
// rejected before it can touch a transaction.
//
// Behaviour:
//   - Secret configured: it must match, in every environment.
//   - Secret missing, NODE_ENV=development: allowed (with a warning)
//     so local testing with curl/ngrok keeps working.
//   - Secret missing, any other NODE_ENV: FAIL CLOSED (503).
//   - Optional extra layer: set MPESA_ALLOWED_IPS to a
//     comma-separated list of Safaricom IPs to also enforce an
//     IP allowlist. It is opt-in because an incomplete list would
//     silently drop genuine payments.
// ============================================================

const MIN_SECRET_LENGTH = 24;

const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest();

// Hash both sides first so timingSafeEqual always receives
// equal-length buffers and never leaks length information.
const secretsMatch = (provided, expected) =>
  crypto.timingSafeEqual(sha256(provided), sha256(expected));

const normalizeIp = (ip = "") => ip.replace(/^::ffff:/, "");

const getAllowedIps = () =>
  (process.env.MPESA_ALLOWED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

export const validateMpesaWebhook = (req, res, next) => {
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!expectedSecret) {
    if (isDevelopment) {
      console.warn(
        "[mpesa-webhook] MPESA_WEBHOOK_SECRET is not set; accepting callback because NODE_ENV=development."
      );
      return next();
    }

    console.error(
      "[mpesa-webhook] MPESA_WEBHOOK_SECRET is not set; rejecting callback."
    );

    return res.status(503).json({
      success: false,
      message: "Webhook endpoint is not configured.",
    });
  }

  if (!isDevelopment && expectedSecret.length < MIN_SECRET_LENGTH) {
    console.error(
      `[mpesa-webhook] MPESA_WEBHOOK_SECRET must be at least ${MIN_SECRET_LENGTH} characters; rejecting callback.`
    );

    return res.status(503).json({
      success: false,
      message: "Webhook endpoint is not configured.",
    });
  }

  const providedSecret = req.params?.secret;

  if (!providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    console.warn(
      `[mpesa-webhook] Rejected callback with invalid secret from ${req.ip}`
    );

    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  const allowedIps = getAllowedIps();

  if (allowedIps.length > 0 && !allowedIps.includes(normalizeIp(req.ip))) {
    console.warn(
      `[mpesa-webhook] Rejected callback from non-allowlisted IP ${req.ip}`
    );

    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  return next();
};
