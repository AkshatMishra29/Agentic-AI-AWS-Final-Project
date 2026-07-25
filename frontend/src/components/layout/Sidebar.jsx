import React from 'react';
import { FiGrid, FiBriefcase, FiFileText, FiUploadCloud, FiUser, FiCpu, FiSend, FiBarChart2 } from 'react-icons/fi';

const Sidebar = ({ role, activeTab, setActiveTab }) => {
  const adminLinks = [
    { key: 'overview', label: 'Overview', icon: FiGrid },
    { key: 'hr_management', label: 'HR Management', icon: FiUser },
    { key: 'jobs', label: 'Job Postings', icon: FiBriefcase },
    { key: 'copilot', label: 'Recruiter Copilot', icon: FiCpu },
    { key: 'offers', label: 'Offer Letters', icon: FiSend },
    { key: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { key: 'interviews', label: 'Scheduled Interviews', icon: FiGrid },
    { key: 'kb', label: 'Knowledge Base', icon: FiFileText },
  ];

  const hrLinks = [
    { key: 'overview', label: 'Overview', icon: FiGrid },
    { key: 'jobs', label: 'Job Postings', icon: FiBriefcase },
    { key: 'copilot', label: 'Recruiter Copilot', icon: FiCpu },
    { key: 'offers', label: 'Offer Letters', icon: FiSend },
    { key: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { key: 'interviews', label: 'Scheduled Interviews', icon: FiGrid },
    { key: 'kb', label: 'Knowledge Base', icon: FiFileText },
  ];

  const candidateLinks = [
    { key: 'browse', label: 'Browse Jobs', icon: FiBriefcase },
    { key: 'applications', label: 'My Applications', icon: FiFileText },
    { key: 'interviews', label: 'My Interviews', icon: FiGrid },
    { key: 'assistant', label: 'AI Assistant', icon: FiFileText },
    { key: 'resumes', label: 'My Resumes', icon: FiUploadCloud },
    { key: 'profile', label: 'My Profile', icon: FiUser },
  ];

  const navItems = role === 'admin' ? adminLinks : role === 'hr' ? hrLinks : candidateLinks;

  return (
    <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 min-h-[calc(100vh-4rem)] p-3 flex flex-col hidden md:flex">
      <div className="space-y-0.5 flex-1">
        <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-3 mt-1">
          {role === 'admin' ? 'Admin Portal' : role === 'hr' ? 'HR Portal' : 'Candidate'}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab && setActiveTab(item.key)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
