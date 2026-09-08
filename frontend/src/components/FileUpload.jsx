import { useState } from "react";
import api from "../services/api";

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const uploadFile = async (file) => {
    setUploading(true);

    try {
      // Get upload signature from backend (api.js attaches the
      // current in-memory access token automatically).
      const { data } = await api.get("/upload/signature");

      //  Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", data.data.apiKey);
      formData.append("timestamp", data.data.timestamp);
      formData.append("signature", data.data.signature);
      formData.append("folder", data.data.folder);
      formData.append("upload_preset", data.data.uploadPreset);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${data.data.cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await cloudinaryResponse.json();
      
      if (result.secure_url) {
        setFileUrl(result.secure_url);
        // Save this URL to your database via your API
        await api.post("/users/profile", {
          profilePicture: result.secure_url,
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => uploadFile(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {fileUrl && <img src={fileUrl} alt="Uploaded" />}
    </div>
  );
};

export default FileUpload;