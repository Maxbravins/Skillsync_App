import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  payPremium,
  premiumCallback,
} from "../controllers/premium.controller.js";

const router = express.Router();

// Start Premium M-Pesa payment
router.post(
  "/pay",
  auth,
  payPremium
);

// M-Pesa callback
router.post(
  "/callback",
  premiumCallback
);

export default router;