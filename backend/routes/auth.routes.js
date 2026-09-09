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
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import auth from "../middleware/auth.middleware.js";
import { authLimiter, otpLimiter, refreshLimiter } from "../middleware/rateLimiter.js";
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

// Refresh token exchange — deliberately NOT behind `auth`, since its
// whole purpose is to mint a new access token once the old one has
// expired. It authenticates itself via the HttpOnly refresh cookie.
router.post("/refresh-token", authLimiter, refreshAccessToken);
router.post("/refresh-token", refreshLimiter, refreshAccessToken);

// Protected routes (require authentication)
router.get("/me", auth, getMe);
router.post("/logout", auth, logout);
router.put("/change-password", auth, validate(changePasswordSchema), changePassword);

export default router;