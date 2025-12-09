import { useState } from 'react';

const PowerBIPlaceholder = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const POWERBI_EMBED_URL = import.meta.env.VITE_POWERBI_EMBED_URL || 
    'https://app.powerbi.com/view?r=eyJrIjoiMDJhMDA4MDgtMWQzOC00MmM4LWFjZTctYzRhY2E4YjhjN2Q5IiwidCI6ImFhZDI5MmY1LTNmMTgtNDc2Ny1hMTgyLWJhYjE5MzI3MDQ5NiJ9';

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0 }}>PowerBI Analytics Dashboard</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Advanced analytics and insights powered by Azure SQL Database
          </p>
        </div>
        <button
          className="btn secondary"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ width: 'auto', padding: '8px 16px' }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#f8fafc',
          transition: 'height 0.3s ease'
        }}
      >
        <iframe
          title="PowerBI Analytics Dashboard"
          style={{
            width: '100%',
            height: isExpanded ? '600px' : '400px',
            border: 'none',
            transition: 'height 0.3s ease'
          }}
          src={POWERBI_EMBED_URL}
          allowFullScreen
        />
      </div>

      <div style={{ marginTop: '16px', padding: '12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.875rem', color: '#475569' }}>
        <strong>Data Source:</strong> Azure SQL Database (ReceiptsDB) • 
        <strong> Refresh:</strong> Automatic via Logic App • 
        <strong> Access:</strong> Secure embed token via Azure AD
      </div>
    </div>
  );
};

export default PowerBIPlaceholder;
