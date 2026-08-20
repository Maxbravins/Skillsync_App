import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.put("/:id/read", auth, markAsRead);
router.put("/read-all", auth, markAllAsRead);
router.delete("/:id", auth, deleteNotification);

export default router;