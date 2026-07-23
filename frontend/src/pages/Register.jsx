import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm';
import { registerUser } from '../api';
import toast from 'react-hot-toast';
import { FiBriefcase, FiCheckCircle } from 'react-icons/fi';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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
            Join the HireFlow Network
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Start your journey with smart automated hiring.
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Create an account to submit application profiles or manage enterprise candidate evaluation funnels.
          </p>

          <div className="space-y-3 pt-4">
            {['Instant Profile Setup', 'Real-time Pipeline Updates', 'Direct HR & Candidate Connect'].map((feature, i) => (
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
              Create your account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select your role and fill in your details to get started.
            </p>
          </div>

          <AuthForm type="register" onSubmit={handleRegister} isLoading={loading} />

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
