import { useEffect } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { useAppData } from '../context/AppDataContext';
import PowerBIPlaceholder from '../components/dashboard/PowerBIPlaceholder';

const Dashboard = () => {
  const { dashboard, loadingDashboard, errors, loadDashboard } = useAppData();

  useEffect(() => {
    if (!dashboard && !loadingDashboard) {
      loadDashboard();
    }
  }, [dashboard, loadingDashboard, loadDashboard]);

  if (loadingDashboard || !dashboard) {
    return (
      <div className="card">
        <Spinner label="Loading dashboard..." />
      </div>
    );
  }

  const hasData = dashboard && (
    (dashboard.totalSpendByVendor?.length > 0) ||
    (dashboard.dailyExpenseTrend?.length > 0) ||
    (dashboard.pendingApprovals?.length > 0)
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>CFO Dashboard</h1>
        <p>Analytics and insights for expense management</p>
      </div>

      <ErrorBanner message={errors.dashboard} />

      {!hasData && !loadingDashboard && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            <p style={{ fontSize: '1.125rem', marginBottom: '8px' }}>No data available</p>
            <p style={{ fontSize: '0.875rem' }}>
              Receipts will appear here once they are processed and approved.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3>Total Spend by Vendor</h3>
          {dashboard?.totalSpendByVendor?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.totalSpendByVendor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendor" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#2563eb" name="Spend ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              No vendor data available
            </div>
          )}
        </div>

        <div className="card">
          <h3>Daily Expense Trend</h3>
          {dashboard?.dailyExpenseTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dashboard.dailyExpenseTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#2563eb" name="Amount ($)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              No trend data available
            </div>
          )}
        </div>

        <div className="card">
          <h3>Approval Status by Employee</h3>
          {dashboard?.pendingApprovals?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.pendingApprovals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="employee" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" stackId="status" fill="#22c55e" name="Approved" />
                <Bar dataKey="pending" stackId="status" fill="#f59e0b" name="Pending" />
                <Bar dataKey="rejected" stackId="status" fill="#ef4444" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              No approval data
            </div>
          )}
        </div>

        <div className="card">
          <h3>Employee Monthly Spending</h3>
          {dashboard?.employeeMonthlySpending?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.employeeMonthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="employee" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="spend" fill="#22c55e" name="Approved Spend" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              No employee spending data available
            </div>
          )}
        </div>

        <PowerBIPlaceholder />
      </div>
    </div>
  );
};

export default Dashboard;

