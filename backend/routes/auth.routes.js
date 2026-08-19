import express from "express";
import {
  registerUser,
  loginUser,
  logout,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from "../controllers/auth.controller.js";
import auth from "../middleware/auth.middleware.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/reset-password", otpLimiter, resetPassword);

export default router;
