import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../styles/auth.css';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

export default function ResetPassword() {
  // All hooks must be called before any conditional returns
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="status-icon error">&#10005;</div>
          <h1 className="auth-title">Invalid link</h1>
          <p className="auth-subtitle">This password reset link is missing or invalid.</p>
          <div className="auth-footer">
            <Link to="/forgot-password" className="auth-link">Request a new link</Link>
          </div>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errors = {};
    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!PASSWORD_RE.test(form.password)) {
      errors.password = 'Must include uppercase, lowercase, number, and special character';
    }
    if (form.password !== form.confirm) errors.confirm = 'Passwords do not match';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Choose a strong password for your account</p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              className={`form-input${fieldErrors.password ? ' error' : ''}`}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
            />
            {fieldErrors.password
              ? <p className="form-error">{fieldErrors.password}</p>
              : <p className="password-hint">Min 8 chars — uppercase, lowercase, number &amp; special character</p>
            }
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm new password</label>
            <input
              id="confirm"
              type="password"
              className={`form-input${fieldErrors.confirm ? ' error' : ''}`}
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              autoComplete="new-password"
            />
            {fieldErrors.confirm && <p className="form-error">{fieldErrors.confirm}</p>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
