import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getMyWallet } from "../controllers/wallet.controller.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyWallet);

export default router;