// backend/routes/mpesa.routes.js
import express from "express";
import auth from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { validateObjectId } from "../middleware/validate.js";
import { validateMpesaWebhook } from "../middleware/webhook.middleware.js";
import { webhookLimiter } from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";

import {
  initiatePayment,
  mpesaCallback,
  getTransactionStatus,
  getMyTransactions,
} from "../controllers/mpesa.controller.js";
import {
  b2cResultCallback,
  b2cTimeoutCallback,
} from "../controllers/withdrawal.controller.js";

import { paymentSchema } from "../validators/payment.schema.js";

const router = express.Router();

// ============================================
// WEBHOOKS (PUBLIC - NO AUTH)
// ============================================
// Order: Rate limit first, then security check
router.post(
  "/callback",
  webhookLimiter,
  validateMpesaWebhook,
  mpesaCallback
);

router.post(
  "/b2c-callback",
  webhookLimiter,
  validateMpesaWebhook,
  b2cResultCallback
);

router.post(
  "/b2c-timeout",
  webhookLimiter,
  validateMpesaWebhook,
  b2cTimeoutCallback
);

// PROTECTED ROUTES (REQUIRE AUTH)
// Client initiates payment for an application
router.post(
  "/pay/:applicationId",
  auth,
  authorizeRoles("client"),
  validateObjectId("applicationId"),
  validate(paymentSchema), // ← ADD: Validate phone number
  initiatePayment
);

// Get payment history for current user
router.get(
  "/history",
  auth,
  getMyTransactions
);

// Get single transaction status
router.get(
  "/status/:id",
  auth,
  validateObjectId("id"),
  getTransactionStatus
);

// DEVELOPMENT ONLY - Test webhooks
if (process.env.NODE_ENV === 'development') {
  router.post(
    "/test-webhook",
    (req, res) => {
      console.log('Test webhook received:', req.body);
      res.status(200).json({ success: true, message: 'Test webhook received' });
    }
  );
}

export default router;