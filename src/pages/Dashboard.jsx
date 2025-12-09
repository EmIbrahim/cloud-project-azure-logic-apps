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

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3>Total Spend by Vendor</h3>
        <ErrorBanner message={errors.dashboard} />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dashboard?.totalSpendByVendor}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vendor" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#2563eb" name="Spend ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Daily Expense Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dashboard?.dailyExpenseTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#0f172a" name="Amount ($)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Pending Approvals</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dashboard?.pendingApprovals}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="employee" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#f59e0b" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Employee Monthly Spending vs Salary</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dashboard?.employeeMonthlySpending}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="employee" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="spend" fill="#22c55e" name="Spend" />
            <Bar dataKey="salary" fill="#94a3b8" name="Salary" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <PowerBIPlaceholder />
    </div>
  );
};

export default Dashboard;

