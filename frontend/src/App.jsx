import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import HRDashboard from './pages/HRDashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'hr' ? <Navigate to="/hr/dashboard" replace /> : <Navigate to="/candidate/dashboard" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Router>
          <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Candidate Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
            <Route path="/candidate/*" element={<CandidateDashboard />} />
          </Route>

          {/* HR Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/*" element={<HRDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
