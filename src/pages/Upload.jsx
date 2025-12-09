import { useState, useRef } from 'react';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { useAuth } from '../context/AuthContext';
import { analyzeReceipt, uploadReceipt } from '../api/uploads';

const Upload = () => {
  const { user } = useAuth();
  const [localError, setLocalError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    setLocalError('');
    setSuccess(false);
    setExtractedData(null);
    setAnalysisResult(null);
    setSelectedFile(file);
    setAnalyzing(true);

    try {
      // Step 1: Analyze receipt using Logic App
      const result = await analyzeReceipt(file);
      setExtractedData(result.extractedData);
      setAnalysisResult(result);
    } catch (err) {
      setLocalError(err.message || 'Failed to analyze receipt. Please try again.');
      setSelectedFile(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleProceedToCFO = async () => {
    if (!selectedFile || !analysisResult) return;

    setLocalError('');
    setUploading(true);

    try {
      // Step 2: Upload to blob storage for final processing
      // This will trigger the Logic App blob trigger
      await uploadReceipt(selectedFile, analysisResult.blobName);
      setSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSuccess(false);
        setSelectedFile(null);
        setExtractedData(null);
        setAnalysisResult(null);
      }, 5000);
    } catch (err) {
      setLocalError(err.message || 'Failed to upload receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setAnalysisResult(null);
    setLocalError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '—';
    const num = typeof value === 'object' ? value.valueNumber || value.value : value;
    return `$${(Number(num) || 0).toFixed(2)}`;
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = typeof value === 'object' ? value.valueDate || value.value : value;
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(date);
    }
  };

  const formatString = (value) => {
    if (!value) return '—';
    return typeof value === 'object' ? value.valueString || value.value || '—' : String(value);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Upload Receipt</h1>
        <p>Upload your receipt for automated processing and CFO approval</p>
      </div>

      <ErrorBanner message={localError} />

      {success && (
        <div className="card">
          <div className="success-message">
            <strong>✓ Receipt sent to CFO successfully!</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem' }}>
              Your receipt "{selectedFile?.name}" has been uploaded to Azure Blob Storage.
              The Logic App will automatically process it and send it for manager approval.
            </p>
          </div>
        </div>
      )}

      {!extractedData && !success && (
        <div className="card">
          <h2>Select Receipt</h2>
          
          <div
            className={`upload-area ${analyzing ? 'dragover' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            role="button"
            tabIndex={0}
          >
            {analyzing ? (
              <div className="spinner-container">
                <Spinner label="Analyzing receipt with AI..." />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '500', color: '#0f172a' }}>
                  Drag & drop receipt here
                </div>
                <div style={{ marginBottom: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                  Images, PDFs, CSV • Camera capture supported
                </div>
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Browse files to upload"
                  disabled={analyzing || uploading}
                >
                  Browse files
                </button>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.csv,text/csv"
            capture="environment"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={analyzing || uploading}
          />
        </div>
      )}

      {extractedData && !success && (
        <div className="card review-card">
          <h3>Review Extracted Data</h3>
          <p style={{ marginBottom: '20px', color: '#64748b', fontSize: '0.875rem' }}>
            Please review the extracted information before sending to CFO for approval.
          </p>
          
          <table className="review-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {extractedData.MerchantName && (
                <tr>
                  <td><strong>Merchant</strong></td>
                  <td>{formatString(extractedData.MerchantName)}</td>
                </tr>
              )}
              {extractedData.TransactionDate && (
                <tr>
                  <td><strong>Transaction Date</strong></td>
                  <td>{formatDate(extractedData.TransactionDate)}</td>
                </tr>
              )}
              {extractedData.Total && (
                <tr>
                  <td><strong>Total Amount</strong></td>
                  <td>{formatCurrency(extractedData.Total)}</td>
                </tr>
              )}
              {extractedData.Tax && (
                <tr>
                  <td><strong>Tax</strong></td>
                  <td>{formatCurrency(extractedData.Tax)}</td>
                </tr>
              )}
              {extractedData.Tip && (
                <tr>
                  <td><strong>Tip</strong></td>
                  <td>{formatCurrency(extractedData.Tip)}</td>
                </tr>
              )}
              {extractedData.Category && (
                <tr>
                  <td><strong>Category</strong></td>
                  <td>{formatString(extractedData.Category)}</td>
                </tr>
              )}
              {Object.keys(extractedData).length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                    No data extracted. The file may not be a valid receipt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="review-actions">
            <button
              className="btn secondary"
              type="button"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              className="btn"
              type="button"
              onClick={handleProceedToCFO}
              disabled={uploading}
            >
              {uploading ? 'Sending to CFO...' : 'Send to CFO'}
            </button>
          </div>
        </div>
      )}

      {!extractedData && !success && (
        <div className="card">
          <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.875rem', color: '#475569' }}>
            <strong>How it works:</strong>
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Upload your receipt (image, PDF, or CSV)</li>
              <li>AI Document Intelligence extracts data automatically</li>
              <li>Review the extracted information</li>
              <li>Click "Send to CFO" to submit for approval</li>
              <li>Manager receives approval request via Teams/Email</li>
              <li>Approved receipts are saved to database and you'll be notified</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
