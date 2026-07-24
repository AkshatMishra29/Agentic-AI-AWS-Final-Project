import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true); // ← prevents premature redirect

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
    setInitializing(false); // ← signal: auth check done, safe to route
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
    <AuthContext.Provider value={{ user, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
