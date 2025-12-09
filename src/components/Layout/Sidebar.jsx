import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      {user.role === 'employee' && (
        <>
          <NavLink to="/my-dashboard">My Dashboard</NavLink>
          <NavLink to="/upload">Upload Receipt</NavLink>
        </>
      )}
      {user.role === 'cfo' && <NavLink to="/dashboard">CFO Dashboard</NavLink>}
    </aside>
  );
};

export default Sidebar;

