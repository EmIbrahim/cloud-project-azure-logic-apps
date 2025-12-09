import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './common/Spinner';
import AccessDenied from './common/AccessDenied';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Checking session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'cfo' ? '/dashboard' : '/upload';
    return (
      <AccessDenied
        fallback={fallback}
        actionLabel="Go to your home page"
        message="You do not have the required role for this route."
      />
    );
  }

  return children;
};

export default ProtectedRoute;

