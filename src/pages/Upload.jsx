import { useEffect, useMemo, useState } from 'react';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

const Upload = () => {
  const { user } = useAuth();
  const { receipts, loadingReceipts, errors, uploadAndProcess, loadReceipts } = useAppData();
  const [localError, setLocalError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(null);

  useEffect(() => {
    if (!receipts.length && !loadingReceipts) {
      loadReceipts();
    }
  }, [receipts.length, loadingReceipts, loadReceipts]);

  const simulateProgress = () => {
    setProgress(10);
    const timer = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 10));
    }, 200);
    return timer;
  };

  const handleFiles = async (selected) => {
    if (!selected?.length) return;
    setLocalError('');
    setProcessed(null);
    setConfirmation('');
    setUploading(true);
    const timer = simulateProgress();
    try {
      const { uploadRes, processed: processedRes } = await uploadAndProcess(selected[0]);
      setProgress(100);
      setConfirmation(`File "${uploadRes.receipt.MerchantName}" uploaded successfully.`);
      setProcessed(processedRes);
    } catch (err) {
      setLocalError(err.message || 'Upload failed. Try again.');
      setProgress(0);
    } finally {
      clearInterval(timer);
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onSelect = (e) => {
    handleFiles(e.target.files);
  };

  const uploadedRows = useMemo(
    () =>
      receipts.map((f) => (
        <div key={f.id} className="file-row">
          <div>{f.MerchantName}</div>
          <div>{f.TransactionDate}</div>
          <div>${f.TotalAmount.toFixed(2)}</div>
          <div>${f.Tax.toFixed(2)}</div>
          <div>${f.Tip.toFixed(2)}</div>
          <div className="chips">{f.Status}</div>
        </div>
      )),
    [receipts]
  );

  return (
    <div className="grid">
      <div className="card">
        <h2>Upload Receipt</h2>
        <p style={{ marginTop: -8, color: '#475569' }}>
          Hi {user?.name}, drop a file or use your camera. Mock upload simulates network latency.
        </p>
        <ErrorBanner message={localError || errors.receipts} />
        {confirmation && (
          <div className="chips" style={{ background: '#dcfce7', color: '#166534' }}>
            {confirmation}
          </div>
        )}
        {uploading && (
          <div style={{ margin: '12px 0', color: '#0f172a' }}>
            Uploading... {progress}% (simulated)
          </div>
        )}
        <div
          className="upload-area"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          role="button"
          tabIndex={0}
        >
          {uploading ? 'Uploading...' : 'Drag & drop receipt here'}
        </div>
        <div style={{ marginTop: 12 }}>
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={onSelect}
          />
        </div>
        {processed && (
          <div className="card" style={{ marginTop: 16 }}>
            <h4>Processed receipt (Logic App mock)</h4>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(processed, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Uploaded Receipts (mock API)</h3>
        {loadingReceipts ? <Spinner /> : <div className="file-list">{uploadedRows}</div>}
      </div>
    </div>
  );
};

export default Upload;

