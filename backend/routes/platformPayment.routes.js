import express from "express";

import {
    payPlatformFee,
    platformCallback,
} from "../controllers/platformPayment.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/:jobId",
    protect,
    payPlatformFee
);

router.post(
    "/callback",
    platformCallback
);

export default router;