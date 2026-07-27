import { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, getUser, setAuthToken, setUser } from '../utils/auth.js';
import api from '../config/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = getAuthToken();
      const cached = getUser();

      if (!token) {
        if (!cancelled) {
          setUserState(null);
          setLoading(false);
        }
        return;
      }

      // Optimistic cache so ProtectedRoute doesn't flash-redirect while /me loads
      if (cached) {
        setUserState(cached);
      }

      try {
        const res = await api.get('/api/auth/me');
        const fresh = res.data?.user || res.data;
        if (!cancelled && fresh?.id) {
          setUser(fresh);
          setUserState(fresh);
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          setAuthToken(null);
          setUser(null);
          if (!cancelled) setUserState(null);
        }
        // Keep cached user on network errors so a blip doesn't log them out
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const login = (token, userData) => {
    setAuthToken(token);
    setUser(userData);
    setUserState(userData);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setUserState(null);
    window.location.href = '/login';
  };

  const updateUser = (userData) => {
    setUser(userData);
    setUserState(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
