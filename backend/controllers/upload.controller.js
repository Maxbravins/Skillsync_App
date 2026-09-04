import cloudinary from "../config/cloudinary.js";
// GENERATE UPLOAD SIGNATURE (For direct frontend upload)
export const generateUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const folder = req.user.role === "client" ? "clients" : "developers";
    
    // Generate signature using your preset
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: `skillsync/${folder}/${req.user.id}`,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder: `skillsync/${folder}/${req.user.id}`,
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      },
    });
  } catch (error) {
    console.error("Signature generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate upload signature",
    });
  }
};

// 2. BACKEND PROXY UPLOAD (Server handles file)
export const uploadToCloudinary = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    const folder = req.user.role === "client" ? "clients" : "developers";
    
    // Convert buffer to base64 for Cloudinary
    const base64File = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64File}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `skillsync/${folder}/${req.user.id}`,
      resource_type: "auto",
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
};

// DELETE FILE FROM CLOUDINARY
export const deleteFromCloudinary = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete file",
        result,
      });
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Delete failed",
    });
  }
};