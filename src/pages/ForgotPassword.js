import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="status-icon success">&#10003;</div>
          <h1 className="auth-title">Email sent</h1>
          <p className="auth-subtitle">
            If an account with that email exists, we&apos;ve sent a reset link. Check your inbox.
          </p>
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
        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-subtitle">Enter your email and we&apos;ll send you a reset link</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !email}>
            {loading ? <span className="spinner" /> : 'Send reset link'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">&#8592; Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
