import axios from 'axios';

// Get API base URL - use local proxy server for local dev, Azure Functions for production
const getApiUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocal) {
    const proxyUrl = import.meta.env.VITE_AUTH_PROXY_URL || 'http://localhost:3001';
    return proxyUrl;
  }
  
  // Production: Use relative paths (Azure Functions are served from /api)
  return '';
};

/**
 * Fetches dashboard data from Azure SQL Database via Azure Functions or local proxy
 * Transforms flat SQL data into chart-ready formats
 * 
 * Connection: 
 * - Localhost: Proxy server → Azure SQL Database (ReceiptsDB)
 * - Production: Azure Functions → Azure SQL Database (ReceiptsDB)
 */
export const fetchDashboard = async () => {
  try {
    const baseUrl = getApiUrl();
    const receiptsEndpoint = `${baseUrl}/api/receipts`;
    
    console.log('Dashboard API Call:', {
      isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      baseUrl,
      receiptsEndpoint
    });
    
    console.log('Fetching receipts from API...');
    const response = await axios.get(receiptsEndpoint, {
      timeout: 10000
    });

    // Fetch users for name/email mapping
    const users = await tryFetchUsers(baseUrl);
    
    // Drop receipts that do not have a user identifier (cannot attribute spend)
    const receipts = (response.data.value || response.data || []).filter((r) => r.UserID !== null && r.UserID !== undefined && r.UserID !== '');
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

    const usersById = Array.isArray(users)
      ? users.reduce((acc, u) => {
          const key =
            u.Id ?? u.id ?? u.UserID ?? u.UserId;
          if (key !== undefined && key !== null) acc[String(key)] = u;
          return acc;
        }, {})
      : {};

    const approvedReceipts = receipts.filter(isApproved);
    const pendingReceipts = receipts.filter(isPending);

    // Transform Flat SQL Data to Chart Data
    const dashboardData = {
      totalSpendByVendor: processVendorSpend(approvedReceipts),
      dailyExpenseTrend: processDailyTrend(approvedReceipts),
      pendingApprovals: processPendingApprovals(receipts, usersById),
      employeeMonthlySpending: processEmployeeMonthlySpending(approvedReceipts, usersById)
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
    
    if (error.response?.status === 500) {
      const errorMsg = error.response?.data || error.response?.statusText || 'Data API call failure';
      throw new Error(`Database connection failed (500). Please configure DATABASE_CONNECTION_STRING in Azure Portal → Configuration → Application settings. Error: ${errorMsg}`);
    }
    
    throw new Error(`Failed to load dashboard data: ${error.message}. Ensure the database connection is configured.`);
  }
};

/**
 * Fetches employee-specific dashboard data from Azure SQL Database
 * 
 * Connection: Azure Functions or local proxy → Azure SQL Database (ReceiptsDB)
 * Filters receipts by EmployeeId
 */
export const fetchEmployeeDashboard = async (employeeId) => {
  try {
    const baseUrl = getApiUrl();
    
    // Fetch all receipts and filter client-side (works for both local and production)
    const response = await axios.get(`${baseUrl}/api/receipts`, {
      timeout: 10000
    });
    
    const allReceipts = response.data.value || [];
    const idStr = employeeId != null ? String(employeeId) : '';
    const receipts = allReceipts.filter((r) => {
      const userIdStr =
        r.UserID != null ? String(r.UserID) :
        r.UserId != null ? String(r.UserId) :
        r.EmployeeId != null ? String(r.EmployeeId) : '';
      const username = r.EmployeeName || r.Username || r.UserName || '';
      return userIdStr === idStr || username === idStr;
    });

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    // Prefer ApprovalDate month for approved receipts; fallback to TransactionDate
    const monthlyReceipts = receipts.filter(r => {
      if (!isApproved(r)) return false;
      const monthKey =
        getMonthKey(r.ApprovalDate) ||
        getMonthKey(r.ApprovedDate) ||
        getMonthKey(r.TransactionDate);
      return monthKey === currentMonth;
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
    
    if (error.response?.status === 500) {
      const errorMsg = error.response?.data || error.response?.statusText || 'Data API call failure';
      throw new Error(`Database connection failed (500). Please configure DATABASE_CONNECTION_STRING in Azure Portal → Configuration → Application settings. Error: ${errorMsg}`);
    }
    
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

// Attempts to fetch Users table for name mapping
const tryFetchUsers = async (baseUrl) => {
  try {
    const usersEndpoint = `${baseUrl}/api/users`;
    console.log('Fetching users from:', usersEndpoint);
    const resp = await axios.get(usersEndpoint, { timeout: 8000 });
    const val = resp.data?.value || resp.data || [];
    if (Array.isArray(val)) {
      console.log('Loaded Users for name mapping, count:', val.length);
      return val;
    }
  } catch (err) {
    console.warn('Could not load Users -', err?.message);
    console.warn('Error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      url: err.config?.url
    });
  }
  return [];
};

/**
 * Extracts YYYY-MM from an ISO-like date string
 */
const getMonthKey = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 7);
  } catch {
    return '';
  }
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
    if (isApproved(r) && (r.UserID || r.UserId)) {
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
      const date =
        r.ApprovalDate?.split('T')[0] ||
        r.ApprovedDate?.split('T')[0] ||
        r.TransactionDate?.split('T')[0] ||
        'Unknown';
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

const resolveEmployeeName = (receipt, usersById) => {
  const lookupKey =
    receipt.UserID !== undefined && receipt.UserID !== null
      ? String(receipt.UserID)
      : receipt.UserId !== undefined && receipt.UserId !== null
        ? String(receipt.UserId)
        : null;

  const user = lookupKey ? usersById?.[lookupKey] : null;

  // Prefer mapped user data; fall back to receipt-supplied employee name/username.
  if (user) {
    return (
      user.Name ||
      user.FullName ||
      user.Username ||
      user.Email ||
      lookupKey
    );
  }

  return (
    receipt.EmployeeName ||
    receipt.Username ||
    receipt.UserName ||
    lookupKey ||
    'Unknown'
  );
};

const processPendingApprovals = (receipts, usersById = {}) => {
  console.log('Processing approval status counts from', receipts.length, 'receipts');
  const employeeMap = {};

  receipts.forEach((r) => {
    if (!r.UserID && !r.UserId) {
      return; // skip receipts we cannot attribute
    }
    const employee = resolveEmployeeName(r, usersById);
    const status = normalizeStatus(r.Status);
    if (!employeeMap[employee]) {
      employeeMap[employee] = { approved: 0, pending: 0, rejected: 0 };
    }
    if (status === 'approved') employeeMap[employee].approved += 1;
    else if (status === 'rejected') employeeMap[employee].rejected += 1;
    else employeeMap[employee].pending += 1;
  });

  const result = Object.entries(employeeMap)
    .map(([employee, counts]) => ({
      employee,
      ...counts
    }))
    .sort((a, b) => (b.pending + b.rejected + b.approved) - (a.pending + a.rejected + a.approved));

  console.log('Approval status result:', result);
  return result;
};

const processEmployeeMonthlySpending = (receipts, usersById = {}) => {
  console.log('Processing employee monthly spending from', receipts.length, 'receipts');
  const employeeMap = {};
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  let approvedCount = 0;
  let currentMonthCount = 0;

  receipts.forEach((r) => {
    if (isApproved(r)) {
      approvedCount++;
      const receiptMonth =
        getMonthKey(r.ApprovalDate) ||
        getMonthKey(r.ApprovedDate) ||
        getMonthKey(r.TransactionDate);
      if (receiptMonth === currentMonth) {
        currentMonthCount++;
        const employee = resolveEmployeeName(r, usersById);
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
      spend: Math.round(spend * 100) / 100
    }))
    .sort((a, b) => b.spend - a.spend);
    
  console.log('Employee monthly spending result:', result);
  return result;
};
