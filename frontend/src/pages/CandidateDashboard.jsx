import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import JobBrowse from '../components/candidate/JobBrowse';
import ResumeUpload from '../components/candidate/ResumeUpload';
import MyApplications from '../components/candidate/MyApplications';
import CandidateProfile from '../components/candidate/CandidateProfile';
import ErrorBoundary from '../components/ErrorBoundary';

const CandidateDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar role="candidate" activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Top Tab Nav */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-1 mb-6">
            {[
              { key: 'browse', label: 'Browse Jobs' },
              { key: 'applications', label: 'My Applications' },
              { key: 'resumes', label: 'My Resumes' },
              { key: 'profile', label: 'Profile' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ErrorBoundary>
            {activeTab === 'browse' && <JobBrowse />}
            {activeTab === 'applications' && <MyApplications />}
            {activeTab === 'resumes' && <ResumeUpload />}
            {activeTab === 'profile' && <CandidateProfile />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default CandidateDashboard;

