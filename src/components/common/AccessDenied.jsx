import { useNavigate } from 'react-router-dom';

const AccessDenied = ({ message = 'You do not have permission to view this page.', actionLabel = 'Go Home', fallback = '/' }) => {
  const navigate = useNavigate();
  return (
    <div className="card">
      <h3>Access denied</h3>
      <p style={{ color: '#b91c1c' }}>{message}</p>
      <button className="btn" style={{ width: 'auto' }} onClick={() => navigate(fallback)}>
        {actionLabel}
      </button>
    </div>
  );
};

export default AccessDenied;

