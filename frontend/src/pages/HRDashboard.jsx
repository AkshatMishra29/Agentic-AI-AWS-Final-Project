import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { StatCard } from '../components/ui/Card';
import { FiUsers, FiBriefcase, FiCheckSquare, FiCpu } from 'react-icons/fi';
import JobList from '../components/hr/JobList';
import ApplicantsView from '../components/hr/ApplicantsView';
import { getJobs, getMyNotifications } from '../api';

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0, screened: 0 });

  const fetchStats = async () => {
    try {
      const res = await getJobs();
      const jobsList = res.data || [];
      const activeJobs = jobsList.filter(j => j.status === 'open').length;
      const totalApplicants = jobsList.reduce((sum, j) => sum + (j.applicant_count || 0), 0);
      setStats({ activeJobs, totalApplicants, screened: 0 });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSelectJobForApplicants = (job) => {
    setSelectedJobForApplicants(job);
    setActiveTab('applicants');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar role="hr" activeTab={activeTab} setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'applicants') setSelectedJobForApplicants(null);
        }} />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Top Nav Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-1 pb-0">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'jobs', label: 'Job Postings' },
              ...(selectedJobForApplicants ? [{ key: 'applicants', label: `Applicants — ${selectedJobForApplicants.title}` }] : []),
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

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruitment Overview</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Monitor your hiring pipeline and candidate funnels.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard title="Active Openings" value={stats.activeJobs.toString()} icon={FiBriefcase} />
                <StatCard title="Total Applicants" value={stats.totalApplicants.toString()} icon={FiUsers} />
                <StatCard title="AI Screened" value={stats.screened.toString()} icon={FiCpu} trend="up" change="Live" />
              </div>

              <JobList onSelectJobForApplicants={handleSelectJobForApplicants} showPostButton />
            </div>
          )}

          {activeTab === 'jobs' && (
            <JobList onSelectJobForApplicants={handleSelectJobForApplicants} showPostButton />
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
