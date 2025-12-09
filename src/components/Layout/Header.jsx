import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  return (
    <header className="header">
      <div className="logo">Receipt Automation</div>
      <div className="user-meta">
        <span>{user?.name}</span>
        <button className="btn" style={{ width: 'auto', padding: '8px 12px' }} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;

