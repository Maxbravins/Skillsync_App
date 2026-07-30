import express from "express";
import { updateProfile } from "../controllers/user.controller.js";
import protect from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.put(
  "/profile",
  protect,
  upload.fields([
    {
      name: "profilePicture",
      maxCount: 1,
    },
    {
      name: "resume",
      maxCount: 1,
    },
  ]),
  updateProfile
);

export default router;