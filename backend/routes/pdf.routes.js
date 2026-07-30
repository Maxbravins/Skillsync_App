import express from "express";
import auth from "../middleware/auth.middleware.js";
import { exportApplications } from "../controllers/pdf.controller.js";

const router = express.Router();

router.get("/applications", auth, (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  next();
}, exportApplications);

export default router;