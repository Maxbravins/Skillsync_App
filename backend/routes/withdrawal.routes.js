import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { financialLimiter, webhookLimiter } from "../middleware/rateLimiter.js";
import { validateMpesaWebhook } from "../middleware/webhook.middleware.js";
import { requestWithdrawal, getMyWithdrawals, approveWithdrawal,
  rejectWithdrawal, sendWithdrawalPayment, b2cResultCallback,
  b2cTimeoutCallback } from "../controllers/withdrawal.controller.js";

const router = express.Router();

// Developer
router.post("/", authMiddleware, financialLimiter, requestWithdrawal);
router.get("/my", authMiddleware, getMyWithdrawals);

// Admin
router.put(
  "/approve/:id",
  authMiddleware,
  approveWithdrawal
);

router.put(
  "/reject/:id",
  authMiddleware,
  rejectWithdrawal
);

router.post(
  "/send-payment/:id",
  authMiddleware,
  sendWithdrawalPayment
);

// M-Pesa B2C payout callbacks — same protections as the STK push
// callback: rate-limited and authenticated by the secret in the URL
// (MPESA_WEBHOOK_SECRET; see webhook.middleware.js).
router.post(
  "/b2c/result/:secret",
  webhookLimiter,
  validateMpesaWebhook,
  b2cResultCallback
);

router.post(
  "/b2c/timeout/:secret",
  webhookLimiter,
  validateMpesaWebhook,
  b2cTimeoutCallback
);

export default router;