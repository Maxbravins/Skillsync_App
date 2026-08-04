import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { requestWithdrawal, getMyWithdrawals, approveWithdrawal,
  rejectWithdrawal, sendWithdrawalPayment, b2cResultCallback,
  b2cTimeoutCallback } from "../controllers/withdrawal.controller.js";

const router = express.Router();

// Developer
router.post("/", authMiddleware, requestWithdrawal);
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

router.post("/b2c/result", b2cResultCallback);

router.post("/b2c/timeout", b2cTimeoutCallback);

export default router;