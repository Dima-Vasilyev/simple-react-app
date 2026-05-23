import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/auth.css';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.email) errors.email = 'Email is required';
  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!PASSWORD_RE.test(form.password)) {
    errors.password = 'Must include uppercase, lowercase, number, and special character';
  }
  if (form.password !== form.confirm) errors.confirm = 'Passwords do not match';
  return errors;
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errors = validate(form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setSuccessMsg(data.message);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="status-icon success">&#10003;</div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">{successMsg}</p>
          <div className="auth-footer">
            <Link to="/login" className="auth-link">Back to sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Get started for free</p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              className={`form-input${fieldErrors.name ? ' error' : ''}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoComplete="name"
            />
            {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className={`form-input${fieldErrors.email ? ' error' : ''}`}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
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
              : <p className="password-hint">Min 8 chars — uppercase, lowercase, number &amp; special character (@$!%*?&amp;)</p>
            }
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm password</label>
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
            {loading ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
