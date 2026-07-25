import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiMail, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API, { getErrorMessage } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthForm = ({ type = 'login', onSubmit, isLoading, serverError }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = Details, 2 = 6-digit OTP verification
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingRegistrationData, setPendingRegistrationData] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'candidate',
    },
  });

  const emailVal = watch('email');

  const handleFormSubmit = async (data) => {
    if (type === 'login') {
      onSubmit(data);
      return;
    }

    // Candidate Registration: Step 1 -> Send OTP via email
    setSendingOtp(true);
    try {
      await API.post('/auth/send-otp', { email: data.email, name: data.name });
      setPendingRegistrationData(data);
      setOtpCode(''); // Ensure box is completely empty for real user entry
      setStep(2);
      toast.success(`Verification OTP code sent to ${data.email}! Check your inbox.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send OTP email'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await API.post('/auth/verify-otp-register', {
        email: pendingRegistrationData?.email || emailVal,
        otp: otpCode,
        name: pendingRegistrationData?.name,
        password: pendingRegistrationData?.password
      });

      login(res.data, pendingRegistrationData?.email || emailVal);
      toast.success('🎉 Candidate profile verified & registered successfully!');
      navigate('/candidate/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid or expired OTP code'));
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (type === 'register' && step === 2) {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-5">
        <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2 text-center">
          <div className="w-10 h-10 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md">
            <FiMail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verify Your Email Address</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We sent a 6-digit verification OTP code to <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{pendingRegistrationData?.email}</strong>
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
            Enter 6-Digit OTP Code
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl font-extrabold tracking-[10px] font-mono py-3 px-4 bg-white dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-slate-900 dark:text-white shadow-sm"
            autoFocus
          />
          <p className="text-[11px] text-slate-400 text-center mt-2">Code valid for 5 minutes</p>
        </div>

        <Button type="submit" isLoading={verifyingOtp} className="w-full py-3 text-sm font-bold">
          Verify & Access Candidate Dashboard →
        </Button>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer font-semibold"
          >
            ← Change Email
          </button>

          <button
            type="button"
            onClick={async () => {
              setSendingOtp(true);
              try {
                await API.post('/auth/send-otp', { email: pendingRegistrationData?.email, name: pendingRegistrationData?.name });
                toast.success('Resent new OTP code to your email!');
              } catch (err) {
                toast.error(getErrorMessage(err, 'Failed to resend OTP'));
              } finally {
                setSendingOtp(false);
              }
            }}
            disabled={sendingOtp}
            className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold flex items-center"
          >
            <FiRefreshCw className={`mr-1 w-3 h-3 ${sendingOtp ? 'animate-spin' : ''}`} /> Resend OTP
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center space-x-2">
          <FiAlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {type === 'register' && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required' })}
            className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition text-gray-900 dark:text-white ${
              errors.name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 dark:border-gray-600 focus:ring-indigo-500'
            }`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
          Email Address
        </label>
        <input
          type="email"
          placeholder="name@company.com"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: 'Invalid email address',
            },
          })}
          className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition text-gray-900 dark:text-white ${
            errors.email
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-200 dark:border-gray-600 focus:ring-indigo-500'
          }`}
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition pr-10 text-gray-900 dark:text-white ${
              errors.password
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 dark:border-gray-600 focus:ring-indigo-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      {type === 'register' && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-between">
          <span>Registering Candidate Account</span>
          <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">Candidate</span>
        </div>
      )}

      <Button type="submit" isLoading={isLoading || sendingOtp} className="w-full mt-2">
        {type === 'login' ? 'Sign In to HireFlow' : 'Send Verification OTP →'}
      </Button>
    </form>
  );
};

export default AuthForm;
