import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('farmconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => api.getToken());
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (api.getToken()) {
        const userData = await api.get('/me/');
        setUser(userData);
        localStorage.setItem('farmconnect_user', JSON.stringify(userData));
      } else {
        setUser(null);
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username, password) => {
    const data = await api.post('/token/', { username, password });
    api.setTokens(data.access, data.refresh);
    setToken(data.access);

    // Fetch user details
    const userData = await api.get('/me/');
    setUser(userData);
    localStorage.setItem('farmconnect_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (formData) => {
    await api.post('/register/', formData);
    // Log in immediately
    return await login(formData.username, formData.password);
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (updateData) => {
    const updated = await api.patch('/me/', updateData);
    setUser(updated);
    localStorage.setItem('farmconnect_user', JSON.stringify(updated));
    return updated;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isConsumer: user?.role === 'consumer',
    isFarmer: user?.role === 'farmer',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    refreshUser: fetchCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
