import { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, getUser, setAuthToken, setUser } from '../utils/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const token = getAuthToken();
    const userData = getUser();
    
    if (token && userData) {
      setUserState(userData);
    }
    setLoading(false);
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
