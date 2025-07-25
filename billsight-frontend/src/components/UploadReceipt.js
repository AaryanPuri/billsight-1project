import React, { useRef, useState } from "react";
import api from "../api/axios";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "application/pdf", "text/plain"];

const UploadReceipt = ({ onUploaded }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

  const uploadFile = async (file) => {
    setErr(null);
    if (!ALLOWED.includes(file.type)) {
      setErr("Invalid file type! Only JPG, PNG, PDF or TXT allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setErr("File too large (10MB max)");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await api.post("/receipts/upload", formData); 
      fileRef.current.value = "";
      onUploaded && onUploaded();
    } catch (err) {
      
      let msg = "Upload failed. Please try again.";
      if (err.response && err.response.data && err.response.data.detail) {
        if (typeof err.response.data.detail === "string") {
          msg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map(e => e.msg).join(", ");
        }
      }
      setErr(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,.txt"
        onChange={handleChange}
        disabled={uploading}
      />
      {uploading && <span style={{ marginLeft: 10 }}>Uploading...</span>}
      {err && <div style={{ color: "red", marginTop: 5 }}>{err}</div>}
    </div>
  );
};

export default UploadReceipt;
