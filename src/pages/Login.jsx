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
      navigate(user.role === 'cfo' ? '/dashboard' : '/upload', { replace: true });
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
      const next =
        location.state?.from?.pathname || (authenticated.role === 'cfo' ? '/dashboard' : '/upload');
      navigate(next, { replace: true });
    } catch (err) {
      // Error is surfaced by context error state
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form">
      <h2>Login</h2>
      <p style={{ marginTop: -8, color: '#475569' }}>
        Mock users: cfo@acme.com / password123, employee@acme.com / password123
      </p>
      <ErrorBanner message={formError || error} />
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="username">Email</label>
          <input
            id="username"
            name="username"
            type="email"
            placeholder="you@company.com"
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

