import express from "express";
import {  payPlatformFee, platformCallback } from "../controllers/platformPayment.controller.js";
import auth from "../middleware/auth.middleware.js";
import { financialLimiter, webhookLimiter } from "../middleware/rateLimiter.js";
import { validateMpesaWebhook } from "../middleware/webhook.middleware.js";

const router = express.Router();

router.post(
  "/:jobId/pay",
  auth,
  financialLimiter,
  payPlatformFee
);

router.post(
    "/callback",
    webhookLimiter,
    validateMpesaWebhook,
    platformCallback
);

export default router;