import express from "express";
import { registerUser, loginUser, logout, getMe, forgotPassword, verifyOTP, resetPassword } from "../controllers/auth.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;