import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FiFileText, FiCheckCircle, FiClock, FiUploadCloud, FiBriefcase } from 'react-icons/fi';
import JobBrowse from '../components/candidate/JobBrowse';
import ResumeUpload from '../components/candidate/ResumeUpload';
import MyApplications from '../components/candidate/MyApplications';

const CandidateDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'applications' | 'resumes'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar role="candidate" activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back! 👋</h1>
              <p className="text-indigo-100 text-sm mt-1">
                Track your active job applications and keep your resume up to date.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" size="md" onClick={() => setActiveTab('resumes')}>
                <FiUploadCloud className="mr-2" /> Upload Resume
              </Button>
              <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => setActiveTab('browse')}>
                <FiBriefcase className="mr-2" /> Browse Jobs
              </Button>
            </div>
          </div>

          {/* Top Sub-Nav Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6 pb-2">
            <button
              onClick={() => setActiveTab('browse')}
              className={`pb-2 text-sm font-semibold transition cursor-pointer ${
                activeTab === 'browse'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Browse Openings
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-2 text-sm font-semibold transition cursor-pointer ${
                activeTab === 'applications'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              My Applications
            </button>
            <button
              onClick={() => setActiveTab('resumes')}
              className={`pb-2 text-sm font-semibold transition cursor-pointer ${
                activeTab === 'resumes'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Resumes & Documents
            </button>
          </div>

          {activeTab === 'browse' && <JobBrowse />}
          {activeTab === 'applications' && <MyApplications />}
          {activeTab === 'resumes' && <ResumeUpload />}
        </main>
      </div>
    </div>
  );
};

export default CandidateDashboard;
