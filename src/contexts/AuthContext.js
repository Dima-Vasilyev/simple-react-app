import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { setToken } from '../api/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, try to restore a previous session using the refresh token cookie.
    // We use plain axios here (not our api instance) so the interceptor doesn't
    // interfere with what is itself a refresh call.
    const restore = async () => {
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        setToken(data.accessToken);
        setUser(data.user);
      } catch {
        // No valid session — user must log in
      } finally {
        setLoading(false);
      }
    };
    restore();

    // The axios interceptor fires this event when a refresh attempt fails mid-session
    const handleForceLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the server call fails, clear local state
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
