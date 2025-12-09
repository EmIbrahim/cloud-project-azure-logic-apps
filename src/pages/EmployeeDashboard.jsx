import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchEmployeeDashboard } from '../api/dashboard';
import { fetchReceipts } from '../api/uploads';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch employee dashboard stats
        const dashboardData = await fetchEmployeeDashboard(user?.id || user?.username);
        setDashboard(dashboardData);

        // Fetch employee receipts
        const receiptsData = await fetchReceipts(user?.id || user?.username);
        setReceipts(receiptsData);
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

  const getStatusBadge = (status) => {
    const statusColors = {
      Approved: { bg: '#dcfce7', color: '#166534', text: 'Approved' },
      Pending: { bg: '#fef3c7', color: '#92400e', text: 'Pending' },
      Rejected: { bg: '#fee2e2', color: '#991b1b', text: 'Rejected' },
      Processing: { bg: '#dbeafe', color: '#1e40af', text: 'Processing' }
    };
    const style = statusColors[status] || statusColors.Pending;
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: style.bg,
          color: style.color
        }}
      >
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Dashboard</h1>
        <p>Welcome back, {user?.name || 'Employee'}</p>
      </div>

      <ErrorBanner message={error} />

      {/* Stats Cards */}
      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
            This Month's Total
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', margin: '8px 0' }}>
            {formatCurrency(dashboard?.monthlyTotal || 0)}
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            Approved receipts only
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
            Receipt Status
          </h3>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                {dashboard?.pendingCount || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                {dashboard?.approvedCount || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Approved</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
                {dashboard?.rejectedCount || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Receipts */}
      <div className="card">
        <h2>Recent Receipts</h2>
        {receipts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
            No receipts found. Upload your first receipt to get started.
          </div>
        ) : (
          <div className="receipt-list">
            <table className="review-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receipts.slice(0, 10).map((receipt) => (
                  <tr key={receipt.Id || receipt.id}>
                    <td>
                      <strong>{receipt.MerchantName || 'Unknown'}</strong>
                    </td>
                    <td>{formatDate(receipt.TransactionDate)}</td>
                    <td>{formatCurrency(receipt.TotalAmount)}</td>
                    <td>{getStatusBadge(receipt.Status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;

