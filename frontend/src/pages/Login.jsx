import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import AuthForm from '../components/auth/AuthForm';
import API, { loginUser, getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiBriefcase, FiCheckCircle } from 'react-icons/fi';

const Login = () => {
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState('');
  const [showGoogleModal, setShowGoogleModal] = React.useState(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = React.useState('');
  const { user, login, initializing } = useAuth();
  const navigate = useNavigate();

  // If already authenticated and session initialized, automatically redirect logged-in users away from /login
  useEffect(() => {
    if (!initializing && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'hr') {
        navigate('/hr/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    }
  }, [user, initializing, navigate]);

  const handleLogin = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await loginUser(data);
      login(res.data, data.email);
      toast.success('Signed in successfully');
      
      if (res.data.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (res.data.role === 'hr') {
        navigate('/hr/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Invalid email or password. Please try again.');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-50 dark:bg-gray-900">
      {/* Left Branding Column */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500/20 backdrop-blur-md rounded-xl border border-indigo-400/30 flex items-center justify-center">
              <FiBriefcase className="w-6 h-6 text-indigo-300" />
            </div>
            <span className="text-2xl font-bold tracking-tight">HireFlow</span>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
            Next-Gen Recruitment Platform
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Automate hiring with intelligent agent pipelines.
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Screen candidates, schedule interviews, and analyze resume fits seamlessly with AI-driven precision.
          </p>

          <div className="space-y-3 pt-4">
            {['AI Resume Matching & Scoring', 'Automated Candidate Communication', 'Role-Based Dashboard Portals'].map((feature, i) => (
              <div key={i} className="flex items-center space-x-3 text-sm text-indigo-100">
                <FiCheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-400">
          © {new Date().getFullYear()} HireFlow AI Inc. All rights reserved.
        </div>
      </div>

      {/* Right Form Column */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter your registered credentials below to access your workspace.
            </p>
          </div>

          <AuthForm type="login" onSubmit={handleLogin} isLoading={loading} serverError={serverError} />

          {/* Continue with Google Candidate Auth (Placed below Email/Password form) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2 text-[11px] text-gray-400">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span>or sign in with Google</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    // Decode real JWT credential token returned by native Google popup
                    const base64Url = credentialResponse.credential.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                    const googleUser = JSON.parse(jsonPayload);
                    
                    const userEmail = googleUser.email;
                    const userName = googleUser.name || googleUser.given_name || 'Candidate';

                    const res = await API.post('/google-login', { email: userEmail, name: userName });
                    login(res.data, userEmail);
                    toast.success(`Signed in with Google as ${userEmail}!`);
                    navigate('/candidate/dashboard', { replace: true });
                  } catch (err) {
                    const msg = err.response?.data?.detail || 'Google authentication failed';
                    toast.error(msg);
                  }
                }}
                onError={() => {
                  toast.error('Google Sign-In failed. Please configure VITE_GOOGLE_CLIENT_ID or sign in via email.');
                }}
                theme="outline"
                size="large"
                shape="pill"
                text="continue_with"
                width="100%"
              />
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Create a candidate account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
