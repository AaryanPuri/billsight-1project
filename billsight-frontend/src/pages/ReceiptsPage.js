import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from "../api/axios";
import ReceiptViewModal from "../components/ReceiptViewModal";
import { FiUploadCloud, FiSearch, FiTrash2, FiEye, FiDownload, FiPlus, FiEdit, FiSave, FiXCircle } from 'react-icons/fi';
import './ReceiptsPage.css';

const ReceiptsPage = () => {
  const location = useLocation();
  const [receipts, setReceipts] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("upload_date");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [isUploadVisible, setUploadVisible] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- NEW: STATE FOR INLINE EDITING ---
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [editFormData, setEditFormData] = useState({ category: '', transaction_date: '' });

  useEffect(() => {
    if (location.state?.openUploader) {
      setUploadVisible(true);
    }
  }, [location.state]);
  
  useEffect(() => {
    setError("");
    let params = { search, category, sort };
    api.get("/receipts", { params })
      .then((res) => setReceipts(res.data || []))
      .catch(() => setError("Could not load receipts."));
  }, [refresh, search, category, sort]);

  const handleDownload = async (receiptId, filename) => {
    try {
      const response = await api.get(`/receipts/file/${receiptId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed.');
    }
  };

  const handleDelete = async (receiptId) => {
    if (!window.confirm("Are you sure you want to delete this receipt?")) return;
    try {
      await api.delete(`/receipts/${receiptId}`);
      setRefresh((v) => v + 1);
    } catch {
      alert("Could not delete receipt. Please try again.");
    }
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFileToUpload(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'], 'application/pdf': [], 'text/plain': [] }
  });

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setIsUploading(true);
    setError("");
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      await api.post('/receipts/upload', formData);
      setFileToUpload(null);
      setRefresh(v => v + 1);
      setUploadVisible(false);
    } catch (err) {
      let msg = 'Upload failed. Please try again.';
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === "string" ? err.response.data.detail : JSON.stringify(err.response.data.detail);
      }
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };
  
  // --- NEW: HANDLERS FOR EDITING ---
  const handleEditClick = (receipt) => {
    setEditingReceiptId(receipt.id);
    setEditFormData({
      category: receipt.category || 'Uncategorized',
      transaction_date: receipt.transaction_date ? new Date(receipt.transaction_date).toISOString().slice(0, 10) : ''
    });
  };

  const handleCancelClick = () => {
    setEditingReceiptId(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveClick = async (receiptId) => {
    try {
      const response = await api.patch(`/receipts/${receiptId}`, editFormData);
      setReceipts(receipts.map(r => (r.id === receiptId ? response.data : r)));
      setEditingReceiptId(null);
    } catch (err) {
      alert('Failed to save changes.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipt Management</h1>
          <p className="page-subtitle">View and manage all your processed receipts and bills.</p>
        </div>
        <button className="btn-primary" onClick={() => setUploadVisible(!isUploadVisible)}>
          <FiPlus /> {isUploadVisible ? 'Close Uploader' : 'Add Receipt'}
        </button>
      </div>

      {isUploadVisible && (
        <div className="panel upload-panel">
          <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
            <input {...getInputProps()} />
            <FiUploadCloud className="dropzone-icon" />
            <p><b>Drop your receipt here or click to browse</b></p>
            <p className="dropzone-support-text">Supports JPG, PNG, PDF, and TXT files (one at a time)</p>
          </div>
          {fileToUpload && (
            <div className="upload-queue">
              <h4>Selected file:</h4>
              <ul><li>{fileToUpload.path || fileToUpload.name}</li></ul>
              <button className="btn-primary" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : `Upload`}
              </button>
            </div>
          )}
          {error && <div className="error-text">{error}</div>}
        </div>
      )}

      <div className="panel management-panel">
        <div className="filter-bar">
          <div className="filter-item search-filter">
            <FiSearch />
            <input type="text" placeholder="Search vendor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-item" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Grocery">Grocery</option>
            <option value="Travel">Travel</option>
            <option value="Utilities">Utilities</option>
            <option value="Dining">Dining</option>
          </select>
          <select className="filter-item" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="upload_date">Sort by: Newest</option>
            <option value="amount">Sort by: Amount</option>
          </select>
        </div>
        
        <div className="table-wrapper">
          <table className="receipts-table">
            <thead>
              <tr>
                <th>File</th><th>Vendor</th><th>Amount</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length > 0 ? receipts.map((r) => (
                <tr key={r.id}>
                  <td>{r.filename}</td>
                  <td>{r.vendor || "-"}</td>
                  <td>₹{r.amount ? r.amount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}</td>
                  
                  {/* --- UPDATED CATEGORY CELL --- */}
                  <td>
                    {editingReceiptId === r.id ? (
                      <select name="category" value={editFormData.category} onChange={handleEditFormChange} className="inline-edit-select">
                        <option value="Uncategorized">Uncategorized</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Travel">Travel</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Dining">Dining</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : ( r.category || "Uncategorized" )}
                  </td>

                  {/* --- UPDATED DATE CELL --- */}
                  <td>
                    {editingReceiptId === r.id ? (
                      <input type="date" name="transaction_date" value={editFormData.transaction_date} onChange={handleEditFormChange} className="inline-edit-input" />
                    ) : ( r.transaction_date ? new Date(r.transaction_date).toLocaleDateString() : "-" )}
                  </td>

                  <td><span className={`status-badge status-${r.status?.toLowerCase()}`}>{r.status}</span></td>
                  
                  {/* --- UPDATED ACTIONS CELL --- */}
                  <td className="actions-cell">
                    {editingReceiptId === r.id ? (
                      <>
                        <button className="btn-icon btn-save" onClick={() => handleSaveClick(r.id)}><FiSave title="Save" /></button>
                        <button className="btn-icon btn-cancel" onClick={handleCancelClick}><FiXCircle title="Cancel" /></button>
                      </>
                    ) : (
                      <>
                        <button className="btn-icon" onClick={() => setSelected(r)}><FiEye title="View Details" /></button>
                        <button className="btn-icon" onClick={() => handleDownload(r.id, r.filename)}>
                          <FiDownload title="Download" />
                        </button>
                        <button className="btn-icon" onClick={() => handleEditClick(r)}><FiEdit title="Edit" /></button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(r.id)}><FiTrash2 title="Delete" /></button>
                      </>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="no-data-cell">No receipts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && ( <ReceiptViewModal receipt={selected} onClose={() => setSelected(null)} /> )}
    </div>
  );
}

export default ReceiptsPage;