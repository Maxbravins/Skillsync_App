import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { fundContract, contractCallback, getMyContracts, releasePayment, } from "../controllers/contract.controller.js";

const router = express.Router();

    // Client funds contract

router.post(
    "/:contractId/fund",
    authMiddleware,
    fundContract
);

    // Safaricom callback

router.post(
    "/callback",
    contractCallback
);

    // My contracts

router.get(
    "/my-contracts",
    authMiddleware,
    getMyContracts
);

    // Release payment

router.post(
    "/:contractId/release-payment",
    authMiddleware,
    releasePayment
);

export default router;