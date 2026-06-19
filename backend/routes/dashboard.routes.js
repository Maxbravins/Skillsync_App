import express from "express";
import auth from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { getDeveloperDashboard, getClientDashboard, } from "../controllers/dashboard.controller.js";

const router = express.Router();
    // Get developer dashboard
router.get(
  "/developer",
  auth,
  authorizeRoles("developer"),
  getDeveloperDashboard
);

// Get client dashboard
router.get(
  "/client",
  auth,
  authorizeRoles("client"),
  getClientDashboard
);

export default router;