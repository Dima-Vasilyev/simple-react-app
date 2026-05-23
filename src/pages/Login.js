import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import '../styles/auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const locationMsg = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setResendEmail('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || 'Sign in failed. Please try again.');
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setResendEmail(form.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setError('');
      setResendEmail('');
      setSuccessMsg('Verification email sent. Please check your inbox.');
    } catch {
      // server always returns 200 for this endpoint; failure is a network error
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {locationMsg && <div className="alert alert-success">{locationMsg}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {error && (
          <div className="alert alert-error">
            {error}
            {resendEmail && (
              <button className="resend-btn" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              required
            />
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </div>
      </div>
    </div>
  );
}
