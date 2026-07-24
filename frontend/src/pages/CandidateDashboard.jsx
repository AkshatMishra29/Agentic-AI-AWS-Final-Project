import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import JobBrowse from '../components/candidate/JobBrowse';
import ResumeUpload from '../components/candidate/ResumeUpload';
import MyApplications from '../components/candidate/MyApplications';
import CandidateProfile from '../components/candidate/CandidateProfile';
import MyInterviews from '../components/candidate/MyInterviews';
import AiAssistant from '../components/candidate/AiAssistant';
import ErrorBoundary from '../components/ErrorBoundary';

const CandidateDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar role="candidate" activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 overflow-y-auto">
          <ErrorBoundary>
            {activeTab === 'browse' && <JobBrowse />}
            {activeTab === 'applications' && <MyApplications />}
            {activeTab === 'interviews' && <MyInterviews />}
            {activeTab === 'assistant' && <AiAssistant role="candidate" />}
            {activeTab === 'resumes' && <ResumeUpload />}
            {activeTab === 'profile' && <CandidateProfile />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default CandidateDashboard;

