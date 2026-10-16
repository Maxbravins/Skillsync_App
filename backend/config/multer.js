import { v2 as cloudinary } from "cloudinary";
import pkg from "multer-storage-cloudinary";
import multer from "multer";
import { MAX_UPLOAD_SIZE_BYTES } from "./uploadLimits.js";

const { CloudinaryStorage } = pkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Avatar / profile pictures
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "skillsync/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  },
});

// Resume / document uploads — private delivery (see note in
// upload.middleware.js's resume config for why).
const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "skillsync/resumes",
    allowed_formats: ["pdf", "doc", "docx"],
    resource_type: "raw",
    type: "authenticated",
  },
});

// General file uploads (contracts, etc.)
const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "skillsync/files",
    allowed_formats: ["pdf", "jpg", "jpeg", "png"],
    resource_type: "auto",
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

export const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

export const uploadFile = multer({
  storage: fileStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

export default cloudinary;
