import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import './ReceiptViewModal.css'; 

const ReceiptViewModal = ({ receipt, onClose }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!receipt) return;

    
    api.get(`/receipts/file/${receipt.id}`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        setImageUrl(url);
      })
      .catch(() => console.error("Could not load receipt image."))
      .finally(() => setLoading(false));

    
    return () => {
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
  }, [receipt, imageUrl]);

  if (!receipt) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Receipt Details</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <div className="receipt-details-grid">
            <div><strong>Vendor:</strong> {receipt.vendor || 'N/A'}</div>
            <div><strong>Amount:</strong> ₹{receipt.amount?.toFixed(2) || 'N/A'}</div>
            <div><strong>Category:</strong> {receipt.category || 'N/A'}</div>
            <div><strong>Date:</strong> {receipt.transaction_date ? new Date(receipt.transaction_date).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div className="receipt-image-container">
            {loading ? <p>Loading image...</p> : <img src={imageUrl} alt={receipt.filename} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewModal;