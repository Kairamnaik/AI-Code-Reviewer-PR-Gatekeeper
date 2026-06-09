import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get('/auth/profile');
      setUser(data.user);
    } catch (err) {
      console.warn('[AuthContext] Session invalid or expired.');
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token) => {
    localStorage.setItem('token', token);
    fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get('token');

    if (urlToken) {
      // Token passed in URL from OAuth redirect
      localStorage.setItem('token', urlToken);
      // Clean up the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      login(urlToken);
    } else {
      const localToken = localStorage.getItem('token');
      if (localToken) {
        fetchProfile();
      } else {
        setLoading(false);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
