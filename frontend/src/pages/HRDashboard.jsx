import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FiUsers, FiBriefcase, FiCheckSquare, FiPlus, FiCpu } from 'react-icons/fi';
import JobList from '../components/hr/JobList';
import ApplicantsView from '../components/hr/ApplicantsView';
import { getJobs } from '../api';

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'jobs' | 'applicants'
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getJobs();
        const jobsList = res.data || [];
        setStats({ activeJobs: jobsList.filter(j => j.status === 'open').length, totalApplicants: 0 });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleSelectJobForApplicants = (job) => {
    setSelectedJobForApplicants(job);
    setActiveTab('applicants');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar role="hr" activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Top Nav Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 text-sm font-semibold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-2 text-sm font-semibold transition cursor-pointer ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Job Postings
            </button>
            {selectedJobForApplicants && (
              <button
                onClick={() => setActiveTab('applicants')}
                className={`pb-2 text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'applicants'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Applicants ({selectedJobForApplicants.title})
              </button>
            )}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Top Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Recruitment Overview</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Monitor agent pipelines and active candidate funnels.
                  </p>
                </div>
                <Button variant="primary" size="md" onClick={() => setActiveTab('jobs')}>
                  <FiPlus className="mr-2" /> Post New Job
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Openings" value={stats.activeJobs.toString()} icon={FiBriefcase} />
                <StatCard title="Total Applicants" value="0" icon={FiUsers} />
                <StatCard title="AI Screened" value="0" icon={FiCpu} trend="up" change="100%" />
                <StatCard title="Hired Candidates" value="0" icon={FiCheckSquare} />
              </div>

              {/* JobList preview component inside Overview */}
              <JobList onSelectJobForApplicants={handleSelectJobForApplicants} />
            </div>
          )}

          {activeTab === 'jobs' && (
            <JobList onSelectJobForApplicants={handleSelectJobForApplicants} />
          )}

          {activeTab === 'applicants' && selectedJobForApplicants && (
            <ApplicantsView
              job={selectedJobForApplicants}
              onBack={() => setActiveTab('jobs')}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default HRDashboard;
