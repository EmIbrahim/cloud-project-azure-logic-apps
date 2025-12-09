import axios from 'axios';

/**
 * Fetches dashboard data from Azure SQL Database via SWA Data API
 * Transforms flat SQL data into chart-ready formats
 * 
 * Connection: Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)
 * Endpoint: /data-api/rest/Receipt
 * Configured in: swa-db-connections/staticwebapp.database.config.json
 */
export const fetchDashboard = async () => {
  try {
    const response = await axios.get('/data-api/rest/Receipt');
    const receipts = response.data.value || []; // SWA Data API returns array in 'value'

    // Transform Flat SQL Data to Chart Data
    return {
      totalSpendByVendor: processVendorSpend(receipts),
      dailyExpenseTrend: processDailyTrend(receipts),
      pendingApprovals: processPendingApprovals(receipts),
      employeeMonthlySpending: processEmployeeMonthlySpending(receipts)
    };
  } catch (error) {
    console.error('Failed to fetch from Azure Data API:', error);
    throw new Error(`Failed to load dashboard data: ${error.message}. Ensure the database connection is configured in Azure Portal.`);
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
    const response = await axios.get(`/data-api/rest/Receipt?$filter=EmployeeId eq '${employeeId}'`);
    const receipts = response.data.value || [];

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyReceipts = receipts.filter(r => {
      const receiptDate = r.TransactionDate ? r.TransactionDate.split('T')[0].slice(0, 7) : '';
      return receiptDate === currentMonth && r.Status === 'Approved';
    });

    const monthlyTotal = monthlyReceipts.reduce((sum, r) => sum + (Number(r.TotalAmount) || 0), 0);

    return {
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      pendingCount: receipts.filter(r => r.Status === 'Pending').length,
      approvedCount: receipts.filter(r => r.Status === 'Approved').length,
      rejectedCount: receipts.filter(r => r.Status === 'Rejected').length,
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

const processVendorSpend = (receipts) => {
  const map = {};
  receipts.forEach((r) => {
    if (r.Status === 'Approved') {
      const vendor = r.MerchantName || 'Unknown';
      map[vendor] = (map[vendor] || 0) + (Number(r.TotalAmount) || 0);
    }
  });
  return Object.entries(map)
    .map(([vendor, amount]) => ({ vendor, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Top 10 vendors
};

const processDailyTrend = (receipts) => {
  const map = {};
  receipts.forEach((r) => {
    if (r.Status === 'Approved') {
      const date = r.TransactionDate ? r.TransactionDate.split('T')[0] : 'Unknown';
      map[date] = (map[date] || 0) + (Number(r.TotalAmount) || 0);
    }
  });
  return Object.entries(map)
    .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days
};

const processPendingApprovals = (receipts) => {
  const employeeMap = {};
  receipts.forEach((r) => {
    if (r.Status === 'Pending' || r.Status === 'pending') {
      const employee = r.EmployeeName || r.UserName || r.CreatedBy || 'Unknown';
      employeeMap[employee] = (employeeMap[employee] || 0) + 1;
    }
  });

  const pendingList = Object.entries(employeeMap).map(([employee, count]) => ({
    employee,
    count
  }));

  return pendingList.sort((a, b) => b.count - a.count);
};

const processEmployeeMonthlySpending = (receipts) => {
  const employeeMap = {};
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  receipts.forEach((r) => {
    if (r.Status === 'Approved') {
      const receiptDate = r.TransactionDate ? r.TransactionDate.split('T')[0].slice(0, 7) : '';
      if (receiptDate === currentMonth) {
        const employee = r.EmployeeName || r.UserName || 'Unknown';
        employeeMap[employee] = (employeeMap[employee] || 0) + (Number(r.TotalAmount) || 0);
      }
    }
  });

  return Object.entries(employeeMap)
    .map(([employee, spend]) => ({
      employee,
      spend: Math.round(spend * 100) / 100,
      salary: 0 // Would come from separate employee table
    }))
    .sort((a, b) => b.spend - a.spend);
};
