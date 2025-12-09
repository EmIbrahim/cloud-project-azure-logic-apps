import { useState, useRef } from 'react';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { useAuth } from '../context/AuthContext';
import { uploadReceipt } from '../api/uploads';

const Upload = () => {
  const { user } = useAuth();
  const [localError, setLocalError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    setLocalError('');
    setSuccess(false);
    setUploading(true);
    setUploadedFile(file);

    try {
      const result = await uploadReceipt(file);
      setSuccess(true);
      setUploadedFile(file);
      
      // Reset file input after successful upload
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSuccess(false);
        setUploadedFile(null);
      }, 5000);
    } catch (err) {
      setLocalError(err.message || 'Failed to upload receipt. Please try again.');
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
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

      <div className="card">
        <h2>Select Receipt</h2>
        <ErrorBanner message={localError} />
        
        {success && (
          <div className="success-message">
            <strong>✓ Receipt uploaded successfully!</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem' }}>
              Your receipt "{uploadedFile?.name}" has been uploaded to Azure Blob Storage.
              The Logic App will automatically process it using AI Document Intelligence and send it for manager approval.
            </p>
          </div>
        )}

        <div
          className={`upload-area ${uploading ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          role="button"
          tabIndex={0}
        >
          {uploading ? (
            <div className="spinner-container">
              <Spinner label="Uploading receipt..." />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '500', color: '#0f172a' }}>
                Drag & drop receipt here
              </div>
              <div style={{ marginBottom: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                Images, PDFs • Camera capture supported
              </div>
              <button
                className="btn secondary"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Browse files to upload"
                disabled={uploading}
              >
                Browse files
              </button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        <div style={{ marginTop: '24px', padding: '16px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.875rem', color: '#475569' }}>
          <strong>How it works:</strong>
          <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Upload your receipt image or PDF</li>
            <li>Logic App automatically extracts data using AI Document Intelligence</li>
            <li>Manager receives approval request via Teams/Email</li>
            <li>Approved receipts are saved to database and you'll be notified</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Upload;
