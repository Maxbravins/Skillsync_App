import express from "express";
import auth from "../middleware/auth.middleware.js";
import multer from "multer";
import {
  generateUploadSignature,
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../controllers/upload.controller.js";

const router = express.Router();

// Configure multer for memory storage (files as buffers)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: images, PDF, DOC, DOCX"));
    }
  },
});

// Generate signature for direct frontend upload
router.get("/signature", auth, generateUploadSignature);

// Upload via backend proxy
router.post("/upload", auth, upload.single("file"), uploadToCloudinary);

// Delete file
router.delete("/delete", auth, deleteFromCloudinary);

export default router;