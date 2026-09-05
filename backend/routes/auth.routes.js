// backend/routes/auth.routes.js
import express from "express";
import {
  registerUser,
  loginUser,
  logout,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword, 
  refreshToken,    
} from "../controllers/auth.controller.js";
import auth from "../middleware/auth.middleware.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  changePasswordSchema, 
} from "../validators/auth.schema.js";

const router = express.Router();

// Public routes (with rate limiting)
router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/forgot-password", otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-otp", otpLimiter, validate(verifyOTPSchema), verifyOTP);
router.post("/reset-password", otpLimiter, validate(resetPasswordSchema), resetPassword);

// Protected routes (require authentication)
router.get("/me", auth, getMe);
router.post("/logout", auth, logout);
router.post("/refresh-token", auth, refreshToken); // ← ADD
router.put("/change-password", auth, validate(changePasswordSchema), changePassword); // ← ADD

export default router;