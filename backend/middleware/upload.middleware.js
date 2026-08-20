import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import multerCloudinary from "multer-storage-cloudinary";
const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary.default?.CloudinaryStorage || multerCloudinary;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile pictures
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    if (file.fieldname === "profilePicture") {
      return {
        folder: "skillsync/avatars",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 400, crop: "fill" }],
      };
    }
    if (file.fieldname === "resume") {
      return {
        folder: "skillsync/resumes",
        allowed_formats: ["pdf", "doc", "docx"],
        resource_type: "raw",
      };
    }
  },
});

// Default export — handles both profilePicture and resume fields
const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
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