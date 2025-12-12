import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      {/* Urdu App Name */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{
          fontFamily: '"Aldhabi", "Al Qalam Taj Nastaleeq", "Noto Nastaliq Urdu", "Nafees Web Naskh", "Jameel Noori Nastaleeq", "Urdu Typesetting", serif',
          fontSize: '7.5rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0',
          direction: 'rtl',
          whiteSpace: 'nowrap',
          lineHeight: '1.2',
          fontFeatureSettings: '"liga" 1, "kern" 1',
          marginBottom: '8px'
        }}>
          رسید
        </div>
      </div>
      
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

