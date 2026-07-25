import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { Card, StatCard } from '../components/ui/Card';
import { FiUsers, FiBriefcase, FiCheckSquare, FiCpu, FiCalendar, FiVideo, FiClock, FiUser, FiExternalLink, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import JobList from '../components/hr/JobList';
import ApplicantsView from '../components/hr/ApplicantsView';
import API, { getJobs, getHrInterviews, deleteInterview } from '../api';
import AiAssistant from '../components/candidate/AiAssistant';
import RecruiterCopilot from '../components/hr/RecruiterCopilot';
import OfferLettersView from '../components/hr/OfferLettersView';
import RecruitmentAnalytics from '../components/hr/RecruitmentAnalytics';

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0, scheduledInterviews: 0 });
  const [scheduledList, setScheduledList] = useState([]);

  const fetchStatsAndInterviews = async () => {
    try {
      const res = await getJobs();
      const jobsList = res.data || [];
      const activeJobs = jobsList.filter(j => j.status === 'open').length;
      const totalApplicants = jobsList.reduce((sum, j) => sum + (j.applicant_count || 0), 0);

      // Fetch all scheduled interviews across all jobs for HR
      const intRes = await getHrInterviews().catch(() => ({ data: [] }));
      const allInts = intRes.data || [];
      
      setStats({
        activeJobs,
        totalApplicants,
        scheduledInterviews: allInts.length
      });
      setScheduledList(allInts);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStatsAndInterviews();
    const interval = setInterval(fetchStatsAndInterviews, 30000);
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruitment Overview</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Monitor your hiring pipeline and scheduled candidate interviews.
                </p>
              </div>

              {/* Stat Cards with "Interviews Scheduled" box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard title="Active Openings" value={stats.activeJobs.toString()} icon={FiBriefcase} />
                <StatCard title="Total Applicants" value={stats.totalApplicants.toString()} icon={FiUsers} />
                <div 
                  onClick={() => setActiveTab('interviews')}
                  className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm hover:border-indigo-400 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Interviews Scheduled
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {stats.scheduledInterviews}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-medium">Click to view all Meet invites →</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FiCalendar className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <JobList onSelectJobForApplicants={handleSelectJobForApplicants} showPostButton />
            </div>
          )}

          {activeTab === 'jobs' && (
            <JobList onSelectJobForApplicants={handleSelectJobForApplicants} showPostButton />
          )}

          {/* Dedicated HR Scheduled Interviews View */}
          {activeTab === 'interviews' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <FiCalendar className="text-indigo-600 dark:text-indigo-400" />
                  <span>Scheduled Candidate Interviews</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Organized list of all upcoming candidate interviews with identical Google Meet links.
                </p>
              </div>

              {scheduledList.length === 0 ? (
                <Card className="text-center py-16">
                  <FiCalendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Scheduled Interviews Yet</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    Go to Applicants under any active job posting to schedule a Google Meet interview.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scheduledList.map((item) => (
                    <Card key={item.id} className="p-5 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
                          {item.status || 'Scheduled'}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400 flex items-center">
                          <FiClock className="mr-1 w-3 h-3" /> {item.scheduled_time}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                          <FiUser className="w-4 h-4 text-indigo-500" />
                          <span>{item.candidate_name || item.candidate_id}</span>
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Role: <strong>{item.job_title}</strong> ({item.candidate_id})</p>
                        {item.meet_link && (
                          <div className="mt-2 text-xs bg-indigo-50/60 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                            <span className="text-gray-500 font-semibold">Meeting URL: </span>
                            <a href={item.meet_link} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-mono font-bold underline hover:text-indigo-800 break-all">
                              {item.meet_link}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this interview card?')) {
                              try {
                                await deleteInterview(item.id);
                                toast.success('Interview card removed');
                                fetchStatsAndInterviews();
                              } catch (err) {
                                toast.error('Failed to remove interview card');
                              }
                            }
                          }}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center space-x-1 transition"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                        {item.meet_link && (
                          <a
                            href={item.meet_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
                          >
                            <FiVideo className="mr-1.5 w-3.5 h-3.5" /> Join Meet Call
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'copilot' && (
            <RecruiterCopilot />
          )}

          {activeTab === 'offers' && (
            <OfferLettersView />
          )}

          {activeTab === 'analytics' && (
            <RecruitmentAnalytics />
          )}

          {activeTab === 'kb' && (
            <AiAssistant role="hr" />
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
