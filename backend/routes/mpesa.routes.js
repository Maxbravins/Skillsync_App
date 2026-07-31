import express from "express";
import auth from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

import {
  initiatePayment,
  mpesaCallback,
  getTransactionStatus,
  getMyTransactions,
} from "../controllers/mpesa.controller.js";

const router = express.Router();

// Client initiates payment
router.post(
  "/pay/:applicationId",
  auth,
  authorizeRoles("client"),
  initiatePayment
);

// Payment history
router.get(
  "/history",
  auth,
  getMyTransactions
);

// Single transaction
router.get(
  "/status/:id",
  auth,
  getTransactionStatus
);

// M-Pesa callback
router.post(
  "/callback",
  mpesaCallback
);

export default router;