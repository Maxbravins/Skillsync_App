import express from "express";
import {
  getAllUsers,
  getAllJobs,
  deleteUser,
  deleteJob,
  getStats,
  getRecentTransactions,
} from "../controllers/admin.controller.js";
import auth from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(authorizeRoles("admin"));
router.get("/stats", getStats);
router.get("/transactions", getRecentTransactions);
router.get("/users", getAllUsers);
router.get("/jobs", getAllJobs);
router.delete("/users/:id", deleteUser);
router.delete("/jobs/:id", deleteJob);

export default router;