import { useState, useMemo } from 'react';

const InteractiveReceiptsTable = ({ 
  receipts, 
  formatCurrency, 
  formatDate, 
  getStatusBadge, 
  getDisplayDate,
  isRejected,
  onRequestReview,
  requestingReview
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMerchant, setFilterMerchant] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Get unique merchants for filter dropdown
  const uniqueMerchants = useMemo(() => {
    const merchants = [...new Set(receipts.map(r => r.MerchantName).filter(Boolean))];
    return merchants.sort();
  }, [receipts]);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    let filtered = receipts;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => {
        // Normalize status: remove quotes and convert to lowercase
        const status = String(r.Status || '').replace(/^["']|["']$/g, '').trim().toLowerCase();
        return status === filterStatus.toLowerCase();
      });
    }

    // Filter by merchant
    if (filterMerchant) {
      filtered = filtered.filter(r => 
        (r.MerchantName || '').toLowerCase().includes(filterMerchant.toLowerCase())
      );
    }

    return filtered;
  }, [receipts, filterStatus, filterMerchant]);

  // Sort receipts
  const sortedReceipts = useMemo(() => {
    if (!sortConfig.key) return filteredReceipts;

    const sorted = [...filteredReceipts].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle date sorting - use ApprovalDate with fallback to TransactionDate
      if (sortConfig.key === 'TransactionDate' || sortConfig.key === 'ApprovalDate') {
        // For date sorting, use ApprovalDate first, then TransactionDate
        const aDate = a.ApprovalDate || a.ApprovedDate || a.TransactionDate || null;
        const bDate = b.ApprovalDate || b.ApprovedDate || b.TransactionDate || null;
        aVal = aDate ? new Date(aDate) : new Date(0);
        bVal = bDate ? new Date(bDate) : new Date(0);
      }
      // Handle numeric sorting
      else if (sortConfig.key === 'TotalAmount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      // Handle string sorting
      else {
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
    setCurrentPage(1); // Reset to first page on sort
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div>
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
              <th style={{ userSelect: 'none' }}>Action</th>
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
                const receiptId = receipt.Id || receipt.id;
                const isRejectedReceipt = isRejected && isRejected(receipt.Status);
                const isLoading = requestingReview && requestingReview.has(receiptId);
                
                return (
                  <tr 
                    key={receiptId}
                    style={{
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>
                      {receipt.MerchantName || 'Unknown'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{formatDate(displayDate)}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{formatCurrency(receipt.TotalAmount)}</td>
                    <td>{getStatusBadge(receipt.Status)}</td>
                    <td>
                      {isRejectedReceipt && (
                        <button
                          className="btn secondary"
                          onClick={() => onRequestReview && onRequestReview(receipt)}
                          disabled={isLoading}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            opacity: isLoading ? 0.6 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            width: 'auto'
                          }}
                          onMouseEnter={(e) => {
                            if (!isLoading) {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          {isLoading ? '⏳ Sending...' : '📝 Request Review'}
                        </button>
                      )}
                    </td>
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

export default InteractiveReceiptsTable;

