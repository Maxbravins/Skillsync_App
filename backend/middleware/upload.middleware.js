import multer from "multer";
import path from "path";
import fs from "fs";

// Create upload folders
["uploads", "uploads/profiles", "uploads/resumes"].forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.fieldname === "profilePicture") {
      return cb(null, "uploads/profiles");
    }

    if (file.fieldname === "resume") {
      return cb(null, "uploads/resumes");
    }

    return cb(new Error("Invalid upload field."));
  },

  filename(req, file, cb) {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profilePicture") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }

    return cb(new Error("Only image files are allowed."));
  }

  if (file.fieldname === "resume") {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error("Resume must be PDF, DOC or DOCX."));
  }

  return cb(new Error("Invalid upload field."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;