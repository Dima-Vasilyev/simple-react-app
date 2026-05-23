import { useAuth } from '../contexts/AuthContext';
import '../styles/auth.css';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1 className="dashboard-title">Welcome, {user?.name}!</h1>
        <p className="dashboard-subtitle">You are successfully signed in.</p>

        <div className="info-grid">
          <div className="info-item">
            <p className="info-label">Name</p>
            <p className="info-value">{user?.name}</p>
          </div>
          <div className="info-item">
            <p className="info-label">Email</p>
            <p className="info-value">{user?.email}</p>
          </div>
          <div className="info-item">
            <p className="info-label">User ID</p>
            <p className="info-value" style={{ fontSize: '11px' }}>{user?.id}</p>
          </div>
          <div className="info-item">
            <p className="info-label">Status</p>
            <p className="info-value" style={{ color: 'var(--success)' }}>Verified</p>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px', color: 'var(--text)' }}>
          Active Security Features
        </h2>
        <ul className="feature-list">
          <li>JWT access tokens — 15-minute expiry, stored in memory (not localStorage)</li>
          <li>Refresh token rotation — HTTP-only cookie, 7-day expiry, SHA-256 hashed in DB</li>
          <li>Token reuse detection — all sessions invalidated on suspicious reuse</li>
          <li>Account lockout — after 5 failed login attempts (2-hour cooldown)</li>
          <li>Email verification — required before first login</li>
          <li>Bcrypt password hashing — cost factor 12</li>
          <li>Rate limiting — per-endpoint, per-IP</li>
          <li>Helmet security headers — CSP, HSTS, X-Frame-Options, etc.</li>
        </ul>
      </div>
    </div>
  );
}
