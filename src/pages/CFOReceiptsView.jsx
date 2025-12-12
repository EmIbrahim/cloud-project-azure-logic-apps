import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

// Get API base URL - same as dashboard.js
const getApiUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocal) {
    const proxyUrl = import.meta.env.VITE_AUTH_PROXY_URL || 'http://localhost:3001';
    return proxyUrl;
  }
  
  // Production: Use relative paths (Azure Functions are served from /api)
  return '';
};
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import InteractiveReceiptsTable from '../components/InteractiveReceiptsTable';

const CFOReceiptsView = () => {
  const [receipts, setReceipts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const baseUrl = getApiUrl();
        
        // Fetch all receipts
        const receiptsResponse = await axios.get(`${baseUrl}/api/receipts`, {
          timeout: 10000
        });
        const allReceipts = (receiptsResponse.data.value || receiptsResponse.data || [])
          .filter(r => r.UserID !== null && r.UserID !== undefined && r.UserID !== '');
        
        // Fetch users for name mapping
        const usersResponse = await axios.get(`${baseUrl}/api/users`, {
          timeout: 8000
        });
        const usersData = usersResponse.data.value || usersResponse.data || [];
        
        // Create usersById mapping
        const usersById = Array.isArray(usersData)
          ? usersData.reduce((acc, u) => {
              const primaryKey = u.UserID !== undefined && u.UserID !== null ? u.UserID : 
                                u.UserId !== undefined && u.UserId !== null ? u.UserId : null;
              
              if (primaryKey !== null) {
                acc[String(primaryKey)] = u;
                if (typeof primaryKey === 'number' || !isNaN(Number(primaryKey))) {
                  acc[Number(primaryKey)] = u;
                }
              }
              return acc;
            }, {})
          : {};
        
        // Map employee names to receipts
        const receiptsWithEmployeeNames = allReceipts.map(receipt => {
          const receiptUserID = receipt.UserID !== undefined && receipt.UserID !== null 
            ? receipt.UserID 
            : receipt.UserId !== undefined && receipt.UserId !== null 
              ? receipt.UserId 
              : null;
          
          const user = receiptUserID 
            ? (usersById[String(receiptUserID)] || usersById[Number(receiptUserID)] || null)
            : null;
          
          const employeeName = user 
            ? (user.Name || user.FullName || user.Username || user.Email || 'Unknown')
            : (receipt.EmployeeName || receipt.Username || receipt.UserName || 'Unknown');
          
          return {
            ...receipt,
            EmployeeName: employeeName
          };
        });
        
        setReceipts(receiptsWithEmployeeNames);
        setUsers(usersData);
      } catch (err) {
        setError(err.message || 'Failed to load receipts');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading all receipts..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1>All Receipts</h1>
        <p>View and manage all employee receipts</p>
      </div>

      <ErrorBanner message={error} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700' }}>Receipts</h2>
          </div>
          {receipts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No receipts found.
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <CFOReceiptsTable
                receipts={receipts}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                getDisplayDate={getDisplayDate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom table component for CFO with Employee Name column
const CFOReceiptsTable = ({ 
  receipts, 
  formatCurrency, 
  formatDate, 
  getStatusBadge, 
  getDisplayDate
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMerchant, setFilterMerchant] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique values for filters
  const uniqueMerchants = useMemo(() => {
    const merchants = [...new Set(receipts.map(r => r.MerchantName).filter(Boolean))];
    return merchants.sort();
  }, [receipts]);

  const uniqueEmployees = useMemo(() => {
    const employees = [...new Set(receipts.map(r => r.EmployeeName).filter(Boolean))];
    return employees.sort();
  }, [receipts]);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    let filtered = receipts;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => {
        const status = String(r.Status || '').replace(/^["']|["']$/g, '').trim().toLowerCase();
        return status === filterStatus.toLowerCase();
      });
    }

    if (filterMerchant) {
      filtered = filtered.filter(r => 
        (r.MerchantName || '').toLowerCase().includes(filterMerchant.toLowerCase())
      );
    }

    if (filterEmployee) {
      filtered = filtered.filter(r => 
        (r.EmployeeName || '').toLowerCase().includes(filterEmployee.toLowerCase())
      );
    }

    return filtered;
  }, [receipts, filterStatus, filterMerchant, filterEmployee]);

  // Sort receipts
  const sortedReceipts = useMemo(() => {
    if (!sortConfig.key) return filteredReceipts;

    const sorted = [...filteredReceipts].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'TransactionDate' || sortConfig.key === 'ApprovalDate') {
        const aDate = a.ApprovalDate || a.ApprovedDate || a.TransactionDate || null;
        const bDate = b.ApprovalDate || b.ApprovedDate || b.TransactionDate || null;
        aVal = aDate ? new Date(aDate) : new Date(0);
        bVal = bDate ? new Date(bDate) : new Date(0);
      } else if (sortConfig.key === 'TotalAmount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortConfig.key === 'EmployeeName') {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredReceipts, sortConfig]);

  // Paginate receipts
  const paginatedReceipts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedReceipts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedReceipts, currentPage]);

  const totalPages = Math.ceil(sortedReceipts.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="receipt-list">
      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '16px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
          <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 10px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.8rem',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#059669'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '180px' }}>
          <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Search Merchant
          </label>
          <input
            type="text"
            value={filterMerchant}
            onChange={(e) => {
              setFilterMerchant(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Type to filter..."
            style={{
              padding: '6px 12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.8rem',
              width: '100%',
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
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '180px' }}>
          <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Search Employee
          </label>
          <input
            type="text"
            value={filterEmployee}
            onChange={(e) => {
              setFilterEmployee(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Type to filter..."
            style={{
              padding: '6px 12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.8rem',
              width: '100%',
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
          />
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          fontSize: '0.75rem',
          color: '#64748b',
          paddingBottom: '4px',
          fontWeight: '500'
        }}>
          <span style={{ 
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db'
          }}>
            {paginatedReceipts.length} of {sortedReceipts.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 500px)', flex: 1 }}>
        <table className="review-table" style={{ width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th 
                onClick={() => handleSort('EmployeeName')}
                style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = ''}
              >
                Employee {getSortIcon('EmployeeName')}
              </th>
              <th 
                onClick={() => handleSort('MerchantName')}
                style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = ''}
              >
                Merchant {getSortIcon('MerchantName')}
              </th>
              <th 
                onClick={() => handleSort('ApprovalDate')}
                style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = ''}
              >
                Date {getSortIcon('ApprovalDate')}
              </th>
              <th 
                onClick={() => handleSort('TotalAmount')}
                style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = ''}
              >
                Amount {getSortIcon('TotalAmount')}
              </th>
              <th 
                onClick={() => handleSort('Status')}
                style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = ''}
              >
                Status {getSortIcon('Status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedReceipts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No receipts match your filters.
                </td>
              </tr>
            ) : (
              paginatedReceipts.map((receipt) => {
                const displayDate = getDisplayDate 
                  ? getDisplayDate(receipt)
                  : (receipt.ApprovalDate || receipt.ApprovedDate || receipt.TransactionDate);
                
                return (
                  <tr 
                    key={receipt.Id || receipt.id}
                    style={{
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>
                      {receipt.EmployeeName || 'Unknown'}
                    </td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>
                      {receipt.MerchantName || 'Unknown'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{formatDate(displayDate)}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{formatCurrency(receipt.TotalAmount)}</td>
                    <td>{getStatusBadge(receipt.Status)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              width: 'auto',
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>
          
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#64748b', 
            minWidth: '80px', 
            textAlign: 'center',
            fontWeight: '500',
            padding: '6px 12px',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            borderRadius: '8px',
            border: '1px solid #d1d5db'
          }}>
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              width: 'auto',
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default CFOReceiptsView;

