import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/common/ErrorBanner';

const Login = () => {
  const { user, login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const role = user.role?.toLowerCase()?.trim();
      console.log('Login redirect - User role:', role);
      const redirectPath = role === 'cfo' ? '/dashboard' : '/my-dashboard';
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.username || !form.password) {
      setFormError('Username and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      const authenticated = await login(form.username, form.password);
      const role = authenticated.role?.toLowerCase()?.trim();
      console.log('Login successful - User role:', role);
      // Always redirect based on role, ignore previous path to prevent wrong dashboard access
      const defaultPath = role === 'cfo' ? '/dashboard' : '/my-dashboard';
      console.log('Navigating to:', defaultPath);
      navigate(defaultPath, { replace: true });
    } catch (err) {
      // Error is surfaced by context error state
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form">
      <h2>Login</h2>
      <ErrorBanner message={formError || error} />
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;

