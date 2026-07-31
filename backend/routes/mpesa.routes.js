import express from "express";
import auth from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  initiatePayment,
  mpesaCallback,
  getTransactionStatus,
} from "../controllers/mpesa.controller.js";

const router = express.Router();

router.post(
  "/pay/:applicationId",
  auth,
  authorizeRoles("client"),
  initiatePayment
);

// Safaricom hits this directly — no auth
router.post("/callback", mpesaCallback);

router.get("/status/:id", auth, getTransactionStatus);

export default router;