import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/auth.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">AuthApp</Link>
      <div className="navbar-nav">
        {user ? (
          <>
            <span className="navbar-user">{user.name}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="auth-link">Sign in</Link>
            <Link to="/register" className="btn btn-nav-register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
