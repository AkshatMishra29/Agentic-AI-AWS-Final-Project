import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';

const AuthForm = ({ type = 'login', onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'candidate',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {type === 'register' && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required' })}
            className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
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
          className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
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
        <input
          type="password"
          placeholder="••••••••"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
          className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
            errors.password
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-200 dark:border-gray-600 focus:ring-indigo-500'
          }`}
        />
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      {type === 'register' && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
            I am registering as a:
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <label className="flex items-center justify-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border-gray-200 dark:border-gray-600">
              <input
                type="radio"
                value="candidate"
                {...register('role')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Candidate</span>
            </label>
            <label className="flex items-center justify-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border-gray-200 dark:border-gray-600">
              <input
                type="radio"
                value="hr"
                {...register('role')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">HR Manager</span>
            </label>
          </div>
        </div>
      )}

      <Button type="submit" isLoading={isLoading} className="w-full mt-2">
        {type === 'login' ? 'Sign In to HireFlow' : 'Create Account'}
      </Button>
    </form>
  );
};

export default AuthForm;
