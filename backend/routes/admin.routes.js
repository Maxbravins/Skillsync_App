import express from "express";
import {
  getAllUsers,
  getAllJobs,
  deleteUser,
  deleteJob,
  getStats,
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Admin access required" 
    });
  }
  next();
});

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.get("/jobs", getAllJobs);
router.delete("/users/:id", deleteUser);
router.delete("/jobs/:id", deleteJob);

export default router;