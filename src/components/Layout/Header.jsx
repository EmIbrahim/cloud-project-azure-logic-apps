import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  return (
    <header className="header">
      <div className="logo">
        <span style={{ fontWeight: '700' }}>Receipt</span>
        <span style={{ fontWeight: '400', color: '#64748b' }}>Automation</span>
      </div>
      <div className="user-meta">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ fontWeight: '500', color: '#0f172a' }}>{user?.name}</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
            {user?.role || 'User'}
          </span>
        </div>
        <button className="btn secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '0.875rem' }} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;

