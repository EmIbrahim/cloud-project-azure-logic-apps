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
  YAxis,
  Cell
} from 'recharts';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { useAppData } from '../context/AppDataContext';

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

  // Custom colors for charts - mature green palette
  const vendorColors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#047857', '#065f46', '#064e3b', '#022c22'];
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#0f172a' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '0.875rem' }}>
              {entry.name}: <strong>${Number(entry.value).toFixed(2)}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CountTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#0f172a' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '0.875rem' }}>
              {entry.name}: <strong>{Number(entry.value).toFixed(0)}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
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

      {hasData && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
          {/* Charts Grid - Compact Layout */}
          <div className="dashboard-charts" style={{ flex: 1, minHeight: 0 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className="chart-title">Total Spend by Vendor</div>
              {dashboard?.totalSpendByVendor?.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.totalSpendByVendor} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="vendor" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {dashboard.totalSpendByVendor.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  No vendor data available
                </div>
              )}
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className="chart-title">Daily Expense Trend</div>
              {dashboard?.dailyExpenseTrend?.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboard.dailyExpenseTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="url(#colorGradient)" 
                        strokeWidth={3}
                        dot={{ fill: '#059669', r: 4 }}
                        activeDot={{ r: 6, fill: '#10b981' }}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  No trend data available
                </div>
              )}
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className="chart-title">Approval Status by Employee</div>
              {dashboard?.pendingApprovals?.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.pendingApprovals} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="employee" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(value) => value.toString()}
                      />
                      <Tooltip content={<CountTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="approved" stackId="status" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="pending" stackId="status" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="rejected" stackId="status" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  No approval data
                </div>
              )}
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className="chart-title">Employee Monthly Spending</div>
              {dashboard?.employeeMonthlySpending?.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.employeeMonthlySpending} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="employee" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="spend" fill="url(#spendGradient)" radius={[8, 8, 0, 0]}>
                        {dashboard.employeeMonthlySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  No employee spending data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
