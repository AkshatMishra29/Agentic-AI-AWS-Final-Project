import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiLogOut, FiBriefcase, FiChevronDown, FiSun, FiMoon } from 'react-icons/fi';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 px-6 flex items-center justify-between transition-all">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <FiBriefcase className="w-5 h-5" />
        </div>
        <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Hire<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {theme === 'dark' ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-slate-600" />}
        </button>

        <NotificationBell />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-semibold text-sm">
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || 'Guest'}
              </p>
            </div>
            <FiChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500">Signed in as</p>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-2 cursor-pointer"
              >
                <FiLogOut />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
