import axios from 'axios';

// Get API base URL - use local proxy server for local dev, SWA Data API for production
const getApiUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocal) {
    const proxyUrl = import.meta.env.VITE_AUTH_PROXY_URL || 'http://localhost:3001';
    return proxyUrl;
  }
  
  const dataApiUrl = import.meta.env.VITE_DATA_API_URL;
  if (dataApiUrl) {
    return dataApiUrl.endsWith('/') ? dataApiUrl.slice(0, -1) : dataApiUrl;
  }
  return '';
};

/**
 * Fetches dashboard data from Azure SQL Database via SWA Data API or local proxy
 * Transforms flat SQL data into chart-ready formats
 * 
 * Connection: 
 * - Localhost: Proxy server → Azure SQL Database (ReceiptsDB)
 * - Production: Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)
 */
export const fetchDashboard = async () => {
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = getApiUrl();
    
    let response;
    
    if (isLocal) {
      // Use local proxy server
      console.log('Fetching receipts from local proxy server...');
      response = await axios.get(`${baseUrl}/api/receipts`, {
        timeout: 10000
      });
    } else {
      // Use SWA Data API
      console.log('Fetching receipts from SWA Data API...');
      response = await axios.get(`${baseUrl}/data-api/rest/Receipt`, {
        timeout: 10000
      });
    }
    
    const receipts = response.data.value || response.data || [];
    console.log(`Fetched ${receipts.length} receipts from database`);
    
    // Log sample receipt to debug status field
    if (receipts.length > 0) {
      console.log('Sample receipt:', {
        Status: receipts[0].Status,
        StatusType: typeof receipts[0].Status,
        StatusLength: receipts[0].Status?.length,
        NormalizedStatus: normalizeStatus(receipts[0].Status),
        MerchantName: receipts[0].MerchantName,
        TotalAmount: receipts[0].TotalAmount
      });
    }

    // Transform Flat SQL Data to Chart Data
    const dashboardData = {
      totalSpendByVendor: processVendorSpend(receipts),
      dailyExpenseTrend: processDailyTrend(receipts),
      pendingApprovals: processPendingApprovals(receipts),
      employeeMonthlySpending: processEmployeeMonthlySpending(receipts)
    };
    
    console.log('Dashboard data processed:', {
      vendors: dashboardData.totalSpendByVendor.length,
      dailyTrend: dashboardData.dailyExpenseTrend.length,
      pending: dashboardData.pendingApprovals.length,
      employees: dashboardData.employeeMonthlySpending.length
    });
    
    return dashboardData;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(`Failed to load dashboard data: ${error.message}. Ensure the database connection is configured.`);
  }
};

/**
 * Fetches employee-specific dashboard data from Azure SQL Database
 * 
 * Connection: Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)
 * Filters receipts by EmployeeId
 */
export const fetchEmployeeDashboard = async (employeeId) => {
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = getApiUrl();
    
    let response;
    
    if (isLocal) {
      // Use local proxy server - filter in memory for now
      response = await axios.get(`${baseUrl}/api/receipts`, {
        timeout: 10000
      });
      const allReceipts = response.data.value || [];
      const receipts = allReceipts.filter(r => 
        (r.EmployeeId === employeeId) || 
        (r.EmployeeName === employeeId) ||
        (r.Username === employeeId)
      );
      response.data = { value: receipts };
    } else {
      // Use SWA Data API
      response = await axios.get(`${baseUrl}/data-api/rest/Receipt?$filter=EmployeeId eq '${employeeId}'`, {
        timeout: 10000
      });
    }
    
    const receipts = response.data.value || [];

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyReceipts = receipts.filter(r => {
      const receiptDate = r.TransactionDate ? r.TransactionDate.split('T')[0].slice(0, 7) : '';
      return receiptDate === currentMonth && isApproved(r);
    });

    const monthlyTotal = monthlyReceipts.reduce((sum, r) => sum + (Number(r.TotalAmount) || 0), 0);

    return {
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      pendingCount: receipts.filter(r => isPending(r)).length,
      approvedCount: receipts.filter(r => isApproved(r)).length,
      rejectedCount: receipts.filter(r => normalizeStatus(r.Status) === 'rejected').length,
      recentReceipts: receipts.slice(0, 10).sort((a, b) => {
        const dateA = new Date(a.TransactionDate || 0);
        const dateB = new Date(b.TransactionDate || 0);
        return dateB - dateA;
      })
    };
  } catch (error) {
    console.error('Failed to fetch employee dashboard:', error);
    throw new Error(`Failed to load employee dashboard: ${error.message}`);
  }
};

// --- Helper Functions ---

/**
 * Normalizes status field by removing extra quotes and converting to lowercase
 * Handles cases like '"Approved"' -> 'approved', 'Approved' -> 'approved'
 */
const normalizeStatus = (status) => {
  if (!status) return '';
  // Remove surrounding quotes if present
  let normalized = String(status).replace(/^["']|["']$/g, '').trim();
  return normalized.toLowerCase();
};

/**
 * Checks if a receipt has approved status (case-insensitive, handles quotes)
 */
const isApproved = (receipt) => {
  const status = normalizeStatus(receipt.Status);
  return status === 'approved';
};

/**
 * Checks if a receipt has pending status (case-insensitive, handles quotes)
 */
const isPending = (receipt) => {
  const status = normalizeStatus(receipt.Status);
  return status === 'pending';
};

const processVendorSpend = (receipts) => {
  console.log('Processing vendor spend from', receipts.length, 'receipts');
  const map = {};
  let approvedCount = 0;
  
  receipts.forEach((r) => {
    if (isApproved(r)) {
      approvedCount++;
      const vendor = r.MerchantName || 'Unknown';
      const amount = Number(r.TotalAmount) || 0;
      map[vendor] = (map[vendor] || 0) + amount;
    }
  });
  
  console.log(`Found ${approvedCount} approved receipts for vendor spend`);
  console.log('Vendor map:', map);
  
  const result = Object.entries(map)
    .map(([vendor, amount]) => ({ vendor, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Top 10 vendors
    
  console.log('Vendor spend result:', result);
  return result;
};

const processDailyTrend = (receipts) => {
  console.log('Processing daily trend from', receipts.length, 'receipts');
  const map = {};
  let approvedCount = 0;
  
  receipts.forEach((r) => {
    if (isApproved(r)) {
      approvedCount++;
      const date = r.TransactionDate ? r.TransactionDate.split('T')[0] : 'Unknown';
      const amount = Number(r.TotalAmount) || 0;
      map[date] = (map[date] || 0) + amount;
    }
  });
  
  console.log(`Found ${approvedCount} approved receipts for daily trend`);
  console.log('Daily trend map:', map);
  
  const result = Object.entries(map)
    .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days
    
  console.log('Daily trend result:', result);
  return result;
};

const processPendingApprovals = (receipts) => {
  console.log('Processing pending approvals from', receipts.length, 'receipts');
  const employeeMap = {};
  let pendingCount = 0;
  
  receipts.forEach((r) => {
    if (isPending(r)) {
      pendingCount++;
      const employee = r.EmployeeName || r.UserName || r.CreatedBy || 'Unknown';
      employeeMap[employee] = (employeeMap[employee] || 0) + 1;
    }
  });

  console.log(`Found ${pendingCount} pending receipts`);
  console.log('Pending approvals map:', employeeMap);

  const result = Object.entries(employeeMap).map(([employee, count]) => ({
    employee,
    count
  })).sort((a, b) => b.count - a.count);
  
  console.log('Pending approvals result:', result);
  return result;
};

const processEmployeeMonthlySpending = (receipts) => {
  console.log('Processing employee monthly spending from', receipts.length, 'receipts');
  const employeeMap = {};
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  let approvedCount = 0;
  let currentMonthCount = 0;

  receipts.forEach((r) => {
    if (isApproved(r)) {
      approvedCount++;
      const receiptDate = r.TransactionDate ? r.TransactionDate.split('T')[0].slice(0, 7) : '';
      if (receiptDate === currentMonth) {
        currentMonthCount++;
        const employee = r.EmployeeName || r.UserName || 'Unknown';
        const amount = Number(r.TotalAmount) || 0;
        employeeMap[employee] = (employeeMap[employee] || 0) + amount;
      }
    }
  });

  console.log(`Found ${approvedCount} approved receipts, ${currentMonthCount} in current month`);
  console.log('Employee monthly spending map:', employeeMap);

  const result = Object.entries(employeeMap)
    .map(([employee, spend]) => ({
      employee,
      spend: Math.round(spend * 100) / 100,
      salary: 0 // Would come from separate employee table
    }))
    .sort((a, b) => b.spend - a.spend);
    
  console.log('Employee monthly spending result:', result);
  return result;
};
