import { useState } from 'react';

const ReviewRequestModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [justification, setJustification] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (justification.trim()) {
      onSubmit(justification.trim());
      setJustification(''); // Reset after submit
    }
  };

  const handleCancel = () => {
    setJustification('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
          Request Review
        </h3>
        
        <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: '#64748b' }}>
          Please provide a justification for this review request:
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Enter your justification here..."
            required
            disabled={isLoading}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '20px',
              boxSizing: 'border-box',
              backgroundColor: isLoading ? '#f1f5f9' : 'white',
              color: '#0f172a',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#059669';
              e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
            autoFocus
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="btn secondary"
              style={{
                padding: '8px 16px',
                fontSize: '0.875rem',
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !justification.trim()}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.875rem',
                opacity: isLoading || !justification.trim() ? 0.6 : 1,
                cursor: isLoading || !justification.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Sending...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewRequestModal;

