import express from "express";
import auth from "../middleware/auth.middleware.js";
import { createProfile, updateProfile, getProfile } from "../controllers/user.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/profile", auth, getProfile);

router.post("/profile", auth, createProfile);

router.put(
  "/profile",
  auth,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  updateProfile
);

export default router;