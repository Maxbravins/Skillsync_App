import express from "express";
import { releaseMilestone } from "../controllers/payment.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.put(
  "/jobs/:jobId/milestones/:milestoneId/release",
  authenticate,
  authorize(["client", "admin"]),
  releaseMilestone
);

export default router;