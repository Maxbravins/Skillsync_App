import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { releasePayment } from "../controllers/adminWallet.controller.js";

const router = express.Router();

// Admin releases developer payment
router.put(
  "/release-payment/:developerId",
  authMiddleware,
  releasePayment
);

export default router;