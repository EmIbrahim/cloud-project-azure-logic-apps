import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CFOReceiptsView from './pages/CFOReceiptsView';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import './index.css';

const App = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      {user && <Header />}
      <div className="app-body">
        {user && <Sidebar />}
        <main className="app-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute roles={['employee']}>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-dashboard"
              element={
                <ProtectedRoute roles={['employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['cfo']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipts"
              element={
                <ProtectedRoute roles={['cfo']}>
                  <CFOReceiptsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={(user.role?.toLowerCase()?.trim() === 'cfo') ? '/dashboard' : '/my-dashboard'} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default App;

