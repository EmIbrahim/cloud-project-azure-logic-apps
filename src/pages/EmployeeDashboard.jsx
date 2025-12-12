import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchEmployeeDashboard } from '../api/dashboard';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import InteractiveReceiptsTable from '../components/InteractiveReceiptsTable';
import ReviewRequestModal from '../components/ReviewRequestModal';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestingReview, setRequestingReview] = useState(new Set());
  const [reviewModal, setReviewModal] = useState({ isOpen: false, receipt: null });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const dashboardData = await fetchEmployeeDashboard(user?.id || user?.username);
        setDashboard(dashboardData);
        setReceipts(dashboardData?.recentReceipts || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const formatCurrency = (value) => `$${(Number(value) || 0).toFixed(2)}`;
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  
  const getDisplayDate = (receipt) => {
    return receipt.ApprovalDate || receipt.ApprovedDate || receipt.TransactionDate || null;
  };

  const getStatusBadge = (status) => {
    const normalized = String(status || '')
      .replace(/^["']|["']$/g, '')
      .trim()
      .toLowerCase();
    
    const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    
    const statusColors = {
      Approved: { bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#166534', text: 'Approved', border: '#86efac' },
      Pending: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e', text: 'Pending', border: '#fcd34d' },
      Rejected: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#991b1b', text: 'Rejected', border: '#fca5a5' },
      Processing: { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', text: 'Processing', border: '#93c5fd' }
    };
    const style = statusColors[capitalized] || statusColors.Pending;
    return (
      <span
        style={{
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          display: 'inline-block'
        }}
      >
        {style.text}
      </span>
    );
  };

  const isRejected = (status) => {
    const normalized = String(status || '')
      .replace(/^["']|["']$/g, '')
      .trim()
      .toLowerCase();
    return normalized === 'rejected';
  };

  const handleRequestReviewClick = (receipt) => {
    setReviewModal({ isOpen: true, receipt });
  };

  const handleReviewSubmit = async (justification) => {
    const receipt = reviewModal.receipt;
    if (!receipt) return;

    const receiptId = receipt.Id || receipt.id;
    if (!receiptId) {
      alert('Error: Receipt ID not found.');
      setReviewModal({ isOpen: false, receipt: null });
      return;
    }

    const logicAppUrl = import.meta.env.VITE_LOGIC_APP_REVIEW_URL || 
                       import.meta.env.VITE_LOGIC_APP_TRIGGER_URL;
    
    if (!logicAppUrl) {
      alert('Error: Logic App URL not configured. Please set VITE_LOGIC_APP_REVIEW_URL or VITE_LOGIC_APP_TRIGGER_URL in environment variables.');
      setReviewModal({ isOpen: false, receipt: null });
      return;
    }

    setRequestingReview(prev => new Set(prev).add(receiptId));

    try {
      const response = await fetch(logicAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiptId: parseInt(receiptId, 10),
          justification: justification
        })
      });

      if (response.ok || response.status === 200 || response.status === 202) {
        alert('Review request sent to Admin.');
        setReviewModal({ isOpen: false, receipt: null });
      } else {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('Request Review Error:', err);
      alert(`Failed to send review request: ${err.message || 'Unknown error'}`);
    } finally {
      setRequestingReview(prev => {
        const next = new Set(prev);
        next.delete(receiptId);
        return next;
      });
    }
  };

  const handleCloseModal = () => {
    setReviewModal({ isOpen: false, receipt: null });
  };

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1>My Dashboard</h1>
        <p>Welcome back, {user?.name || 'Employee'}</p>
      </div>

      <ErrorBanner message={error} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {/* Stats Cards - Compact Grid */}
        <div className="dashboard-compact">
          <div className="stat-card">
            <h3>This Month's Total</h3>
            <div className="stat-value" style={{ 
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {formatCurrency(dashboard?.monthlyTotal || 0)}
            </div>
            <p className="stat-label">Approved receipts only</p>
          </div>

          <div className="stat-card">
            <h3>Receipt Status</h3>
            <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '80px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b', lineHeight: 1.2 }}>
                  {dashboard?.pendingCount || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Pending</div>
              </div>
              <div style={{ flex: 1, minWidth: '80px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981', lineHeight: 1.2 }}>
                  {dashboard?.approvedCount || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Approved</div>
              </div>
              <div style={{ flex: 1, minWidth: '80px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ef4444', lineHeight: 1.2 }}>
                  {dashboard?.rejectedCount || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Receipts - Compact Table */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700' }}>Recent Receipts</h2>
          </div>
          {receipts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No receipts found. Upload your first receipt to get started.
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <InteractiveReceiptsTable
                receipts={receipts}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                getDisplayDate={getDisplayDate}
                isRejected={isRejected}
                onRequestReview={handleRequestReviewClick}
                requestingReview={requestingReview}
              />
            </div>
          )}
        </div>
      </div>

      <ReviewRequestModal
        isOpen={reviewModal.isOpen}
        onClose={handleCloseModal}
        onSubmit={handleReviewSubmit}
        isLoading={reviewModal.receipt && requestingReview.has(reviewModal.receipt.Id || reviewModal.receipt.id)}
      />
    </div>
  );
};

export default EmployeeDashboard;
