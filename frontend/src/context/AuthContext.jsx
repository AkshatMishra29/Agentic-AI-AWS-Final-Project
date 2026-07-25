import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      const root = document.documentElement;
      if (next === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
      localStorage.setItem('theme', next);
      return next;
    });
  };

  useEffect(() => {
    // Purge any stale legacy localStorage session tokens
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');

    // Read session from sessionStorage synchronously before any route renders
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    const email = sessionStorage.getItem('email');
    if (token && role) {
      setUser({ token, role, email });
    }
    setInitializing(false);
  }, []);

  const login = (data, email) => {
    sessionStorage.setItem('token', data.access_token);
    sessionStorage.setItem('role', data.role);
    sessionStorage.setItem('email', email);
    setUser({ token: data.access_token, role: data.role, email });
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('email');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
