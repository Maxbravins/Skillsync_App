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
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
} from "../validators/auth.schema.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);
router.post("/forgot-password", otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-otp", otpLimiter, validate(verifyOTPSchema), verifyOTP);
router.post("/reset-password", otpLimiter, validate(resetPasswordSchema), resetPassword);

export default router;