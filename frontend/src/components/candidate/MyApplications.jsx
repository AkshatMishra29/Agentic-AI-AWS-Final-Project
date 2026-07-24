import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { FiBriefcase, FiMapPin, FiCalendar, FiFileText, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getMyApplications } from '../../api';

// Application stage pipeline (Indeed/Naukri style)
const STAGES = [
  { key: 'applied',        label: 'Applied',            desc: 'Application submitted' },
  { key: 'under_review',   label: 'Under Review',       desc: 'HR is reviewing your profile' },
  { key: 'shortlisted',    label: 'Shortlisted',        desc: 'You\'re on the shortlist!' },
  { key: 'interview',      label: 'Interview Scheduled', desc: 'Interview scheduled' },
  { key: 'hired',          label: 'Offer Extended',     desc: 'Congratulations! 🎉' },
];

const STAGE_ORDER = ['applied', 'under_review', 'shortlisted', 'interview', 'hired'];

const statusMeta = {
  applied:      { color: 'bg-blue-500',    text: 'Applied',          cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200' },
  under_review: { color: 'bg-amber-500',   text: 'Under Review',     cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
  shortlisted:  { color: 'bg-indigo-500',  text: 'Shortlisted',      cls: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' },
  interview:    { color: 'bg-purple-500',  text: 'Interview',        cls: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200' },
  hired:        { color: 'bg-emerald-500', text: 'Hired 🎉',         cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' },
  rejected:     { color: 'bg-red-400',     text: 'Not Selected',     cls: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200' },
};

const ApplicationCard = ({ app }) => {
  const [expanded, setExpanded] = useState(false);
  const job = app.job || {};
  const resume = app.resume || {};
  const meta = statusMeta[app.status] || statusMeta['applied'];
  const isRejected = app.status === 'rejected';

  const currentStageIdx = isRejected ? -1 : STAGE_ORDER.indexOf(app.status);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition">
      {/* Card header */}
      <div
        className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{job.title || 'Job Opening'}</h3>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-xl border ${meta.cls}`}>
              {meta.text}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
            <span className="flex items-center"><FiMapPin className="mr-1 w-3 h-3" />{job.location || 'Remote'}</span>
            <span className="flex items-center"><FiCalendar className="mr-1 w-3 h-3" />Applied {new Date(app.applied_at).toLocaleDateString('en-IN')}</span>
            {resume.filename && (
              <span className="flex items-center"><FiFileText className="mr-1 w-3 h-3 text-indigo-400" />{resume.filename}</span>
            )}
          </div>
        </div>
        <div className="text-gray-400">
          {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded: Stage Tracker */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          {isRejected ? (
            <div className="text-xs text-center text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl p-4">
              This application was not selected for further review. Keep applying — the right opportunity is coming! 💪
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="relative flex items-center justify-between mb-6">
                {/* Connector line */}
                <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-gray-200 dark:bg-gray-700 mx-6">
                  <div
                    className="h-0.5 bg-indigo-500 transition-all duration-500"
                    style={{ width: `${(currentStageIdx / (STAGE_ORDER.length - 1)) * 100}%` }}
                  />
                </div>

                {STAGES.map((stage, idx) => {
                  const isCompleted = idx <= currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  return (
                    <div key={stage.key} className="flex flex-col items-center z-10" style={{ flex: 1 }}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isCompleted
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-indigo-100 dark:ring-indigo-900/60 scale-110' : ''}`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <p className={`text-[9px] mt-2 font-semibold text-center leading-tight ${
                        isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
                      }`}>
                        {stage.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Current stage message */}
              <div className="text-xs text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-xl py-2.5 px-4">
                {STAGES[currentStageIdx]?.desc || 'Application in progress'}
              </div>
            </>
          )}

          {/* Last updated */}
          <p className="text-[10px] text-gray-400 text-center mt-3">
            Last updated: {new Date(app.updated_at).toLocaleString('en-IN')}
          </p>
        </div>
      )}
    </div>
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyApplications();
        setApplications(res.data || []);
      } catch { toast.error('Failed to load applications'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const active = applications.filter(a => a.status !== 'rejected').length;
  const hired = applications.filter(a => a.status === 'hired').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {applications.length} total · {active} active · {hired} hired
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500 animate-pulse">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <FiBriefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No Applications Yet</h3>
          <p className="text-xs text-gray-500 mt-1">Browse open positions and apply to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => <ApplicationCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
