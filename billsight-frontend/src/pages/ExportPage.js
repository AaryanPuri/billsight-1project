import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiDownload, FiFileText, FiCode } from 'react-icons/fi';
import './ExportPage.css';

const ExportPage = () => {
  const [format, setFormat] = useState('csv');
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [availableReceipts, setAvailableReceipts] = useState([]);
  const [selectedReceipts, setSelectedReceipts] = useState([]);

  useEffect(() => {
    setError("");
    Promise.all([
      api.get('/export/summary').catch(() => ({ data: { total_exports: 0, last_export_date: null }})),
      api.get('/export/history').catch(() => ({ data: [] })),
      api.get('/receipts') 
    ]).then(([summaryRes, historyRes, receiptsRes]) => {
      setSummary(summaryRes.data);
      setHistory(historyRes.data);
      setAvailableReceipts(receiptsRes.data || []);
    }).catch(() => setError("Could not load page data."));
  }, [refresh]);

  const handleReceiptChange = (receiptId) => {
    setSelectedReceipts(prev =>
      prev.includes(receiptId)
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    );
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    setError("");
    try {
      await api.post("/export", { format, receipt_ids: selectedReceipts });
      
      alert('Export successfully generated! The history has been updated.');
      setRefresh(v => v + 1);

    } catch (e) {
      setError("Could not generate export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async (filePath) => {
  try {
    const response = await api.get(`/export/file?file_path=${encodeURIComponent(filePath)}`, {
      responseType: 'blob', // Expect file data
    });

    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const filename = filePath.split('\\').pop().split('/').pop();
    link.setAttribute('download', filename);
    
    document.body.appendChild(link);
    link.click();
    
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Download failed. An error occurred.');
  }
};

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Export Data</h1>
        <p className="page-subtitle">Export your receipt data in your preferred format with custom filtering options.</p>
      </div>

      <div className="export-grid">
        <div className="panel export-settings-panel">
          <h3 className="panel-title"><FiDownload /> Export Settings</h3>
          <div className="format-selector">
            <label>Export Format</label>
            <div className="format-buttons">
              <button
                className={`format-btn ${format === 'csv' ? 'active' : ''}`}
                onClick={() => setFormat('csv')}
              >
                <FiFileText /> CSV
              </button>
              <button
                className={`format-btn ${format === 'json' ? 'active' : ''}`}
                onClick={() => setFormat('json')}
              >
                <FiCode /> JSON
              </button>
            </div>
          </div>
          
          <div className="receipt-selector">
            <label>Select Receipts</label>
            <div className="receipt-list">
              {availableReceipts.length > 0 ? availableReceipts.map(receipt => (
                <div key={receipt.id} className="receipt-item">
                  <input
                    type="checkbox"
                    id={`receipt-${receipt.id}`}
                    value={receipt.id}
                    checked={selectedReceipts.includes(receipt.id)}
                    onChange={() => handleReceiptChange(receipt.id)}
                  />
                  <label htmlFor={`receipt-${receipt.id}`}>
                    <span className="receipt-vendor">{receipt.vendor || 'N/A'}</span>
                    <span className="receipt-date">{receipt.transaction_date ? new Date(receipt.transaction_date).toLocaleDateString() : '-'}</span>
                  </label>
                </div>
              )) : <p className="no-receipts-text">No receipts found to select.</p>}
            </div>
            <p className="receipt-note">If no receipts are selected, all receipts will be included.</p>
          </div>
          
          <button className="btn-primary export-trigger-btn" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Generating...' : 'Generate Export'}
          </button>
        </div>

        {summary && (
          <div className="panel export-summary-panel">
            <h3 className="panel-title">Export Summary</h3>
            <div className="summary-grid">
              <div className="summary-card"><span>{summary.total_exports}</span><p>Total Exports</p></div>
              <div className="summary-card"><span>{summary.last_export_date ? new Date(summary.last_export_date).toLocaleDateString() : 'N/A'}</span><p>Last Export</p></div>
            </div>
          </div>
        )}
      </div>

      <div className="panel recent-exports-panel">
        <h3 className="panel-title">Recent Exports</h3>
        {error && <p className="error-text">{error}</p>}
        <div className="table-wrapper">
          <table className="export-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Format</th>
                <th>Status</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>{item.format.toUpperCase()}</td>
                  <td><span className={`status-badge status-${item.status?.toLowerCase()}`}>{item.status || 'Completed'}</span></td>
                  <td>
                    <button 
                    onClick={() => handleDownload(item.file_path)} 
                    className="btn-link"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="no-data-cell">No export history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;