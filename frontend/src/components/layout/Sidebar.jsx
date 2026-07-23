import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, 
  FiFileText, 
  FiUsers, 
  FiBriefcase, 
  FiSettings, 
  FiTrendingUp 
} from 'react-icons/fi';

const Sidebar = ({ role, activeTab, setActiveTab }) => {
  const hrLinks = [
    { key: 'overview', label: 'Overview', icon: FiGrid },
    { key: 'jobs', label: 'Job Postings', icon: FiBriefcase },
  ];

  const candidateLinks = [
    { key: 'browse', label: 'Browse Jobs', icon: FiBriefcase },
    { key: 'applications', label: 'My Applications', icon: FiFileText },
    { key: 'resumes', label: 'My Resumes', icon: FiSettings },
  ];

  const navItems = role === 'hr' ? hrLinks : candidateLinks;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/60 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          {role === 'hr' ? 'HR Portal' : 'Candidate Workspace'}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab && setActiveTab(item.key)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700/50">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">HireFlow Pipeline</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Module 2 Active (CRUD)</p>
      </div>
    </aside>
  );
};

export default Sidebar;
