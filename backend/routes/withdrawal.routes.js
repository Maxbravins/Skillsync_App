import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { requestWithdrawal, getMyWithdrawals } from "../controllers/withdrawal.controller.js";

const router=express.Router();

router.post(

"/",

authMiddleware,

requestWithdrawal

);

router.get(

"/my",

authMiddleware,

getMyWithdrawals

);

export default router;