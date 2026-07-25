import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const CandidateDashboard = lazy(() => import('./pages/CandidateDashboard'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const RootRedirect = () => {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return user.role === 'hr' ? <Navigate to="/hr/dashboard" replace /> : <Navigate to="/candidate/dashboard" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Router>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Loading module workspace...</p>
              </div>
            </div>
          }>
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

            {/* Admin Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
