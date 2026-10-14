import express from "express";
import { payPlatformFee, platformCallback, reconcilePlatformFee } from "../controllers/platformPayment.controller.js";
import auth from "../middleware/auth.middleware.js";
import { apiLimiter, financialLimiter, webhookLimiter } from "../middleware/rateLimiter.js";
import { validateMpesaWebhook } from "../middleware/webhook.middleware.js";

const router = express.Router();

router.post(
  "/:jobId/pay",
  auth,
  financialLimiter,
  payPlatformFee
);

router.post(
  "/:jobId/reconcile",
  auth,
  apiLimiter,
  reconcilePlatformFee
);

router.post(
    "/callback",
    webhookLimiter,
    validateMpesaWebhook,
    platformCallback
);

export default router;
