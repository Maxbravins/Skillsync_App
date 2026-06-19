import express from "express";
import auth from "../middleware/auth.middleware.js";

import {
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller.js";

const router =
  express.Router();

router.get(
  "/",
  auth,
  getNotifications
);

router.put(
  "/:id/read",
  auth,
  markAsRead
);

export default router;