import { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, getUser, setAuthToken, setUser } from '../utils/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Optimistically set cached user so UI doesn't flash, then verify with server
    const cached = getUser();
    if (cached) setUserState(cached);

    // Always re-fetch current profile to pick up role changes without re-login
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setUserState(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
