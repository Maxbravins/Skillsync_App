import express from "express";
import {  payPlatformFee, platformCallback } from "../controllers/platformPayment.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/:jobId/pay",
  auth,
  payPlatformFee
);

router.post(
    "/callback",
    platformCallback
);

export default router;