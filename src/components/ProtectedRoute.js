import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-dark" />
      </div>
    );
  }

  if (!user) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
