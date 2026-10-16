import multer from "multer";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import multerCloudinary from "multer-storage-cloudinary";
import { MAX_UPLOAD_SIZE_BYTES } from "../config/uploadLimits.js";
const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary.default?.CloudinaryStorage || multerCloudinary;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileUploadDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../uploads/profiles"
);

// Presentation profile photos are stored on the Render service disk.
// Keep resumes in Cloudinary because they use authenticated delivery.
const profilePictureStorage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await fs.mkdir(profileUploadDirectory, { recursive: true });
      callback(null, profileUploadDirectory);
    } catch (error) {
      callback(error);
    }
  },
  filename: (_req, file, callback) => {
    const extension = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    }[file.mimetype];
    callback(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`);
  },
});

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    if (file.fieldname === "resume") {
      return {
        folder: "skillsync/resumes",
        allowed_formats: ["pdf", "doc", "docx"],
        resource_type: "raw",
        // Private delivery: the resulting resource can NOT be
        // fetched by URL alone. A signed, short-lived link must be
        // generated server-side (see upload.controller.js ->
        // getResumeSignedUrl) after an ownership check.
        type: "authenticated",
      };
    }
  },
});

// Multer storage engine that stores profile photos locally but leaves
// private resume uploads in Cloudinary.
const profileAndResumeStorage = {
  _handleFile(req, file, callback) {
    const storage = file.fieldname === "profilePicture"
      ? profilePictureStorage
      : resumeStorage;
    storage._handleFile(req, file, callback);
  },
  _removeFile(req, file, callback) {
    const storage = file.fieldname === "profilePicture"
      ? profilePictureStorage
      : resumeStorage;
    storage._removeFile(req, file, callback);
  },
};

const upload = multer({
  storage: profileAndResumeStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = file.fieldname === "profilePicture"
      ? ["image/jpeg", "image/png", "image/webp"]
      : [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error(
        file.fieldname === "profilePicture"
          ? "Profile photos must be JPG, PNG, or WEBP images."
          : "Resumes must be PDF, DOC, or DOCX files."
      ));
    }

    callback(null, true);
  },
});

// Named exports for individual use elsewhere
export const handleAvatarUpload = upload.single("profilePicture");
export const handleResumeUpload = upload.single("resume");
export const uploadErrorHandler = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }
    next();
  });
};

export default upload;
