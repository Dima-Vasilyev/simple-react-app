import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    // Plain axios — no auth header needed and no interceptor interference
    axios
      .get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="spinner-dark" style={{ margin: '0 auto 20px' }} />
          <p className="auth-subtitle">Verifying your email address&hellip;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className={`status-icon ${status}`}>
          {status === 'success' ? <>&#10003;</> : <>&#10005;</>}
        </div>
        <h1 className="auth-title">
          {status === 'success' ? 'Email verified!' : 'Verification failed'}
        </h1>
        <p className="auth-subtitle">{message}</p>
        <div className="auth-footer">
          {status === 'success' ? (
            <Link to="/login" className="auth-link">Sign in to your account</Link>
          ) : (
            <Link to="/login" className="auth-link">Back to sign in</Link>
          )}
        </div>
      </div>
    </div>
  );
}
