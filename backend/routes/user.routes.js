import express from "express";
import auth from "../middleware/auth.middleware.js";
import { createProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", auth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed",
    user: req.user,
  });
});

router.post("/profile", auth, createProfile);

export default router;