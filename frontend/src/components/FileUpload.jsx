import { useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

const FileUpload = () => {
  const { updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");

  const uploadFile = async (file) => {
    if (!file) return;

    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const response = await api.put("/users/profile", formData);
      const uploadedUrl = response.data?.user?.profilePicture;
      if (!uploadedUrl) throw new Error("The server did not return the uploaded image.");
      updateUser(response.data.user);
      setFileUrl(uploadedUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error.response?.data?.message || error.message || "Upload failed. Please try again.");
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
      {error && <p role="alert">{error}</p>}
      {fileUrl && <img src={fileUrl} alt="Uploaded" />}
    </div>
  );
};

export default FileUpload;
