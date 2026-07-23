import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { FiArrowLeft, FiFileText, FiDownload, FiUser, FiMail, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getJobApplications, updateApplicationStatus } from '../../api';

const statusOptions = [
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const ApplicantsView = ({ job, onBack }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await getJobApplications(job.id);
      setApplications(res.data || []);
    } catch (err) {
      toast.error('Failed to load applications for this job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (job) fetchApplications();
  }, [job]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      toast.success('Applicant status updated & notified!');
      fetchApplications();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <FiArrowLeft className="mr-1" /> Back to Jobs
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Applicants for "{job.title}"
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Review candidates, examine attached resumes, and update hiring pipeline status.
            </p>
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading candidate applications...</div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-12">
          <FiUser className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No Applicants Yet</h3>
          <p className="text-xs text-gray-500 mt-1">Candidates who apply to this role will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {app.candidate_id[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                        <FiMail className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {app.candidate_id}
                      </h4>
                      <p className="text-[11px] text-gray-400 flex items-center mt-0.5">
                        <FiCalendar className="w-3 h-3 mr-1" />
                        Applied on {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {app.resume && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 px-3 py-1.5 rounded-lg w-fit">
                      <FiFileText className="text-indigo-500" />
                      <span className="font-medium">{app.resume.filename}</span>
                      <a
                        href={`http://127.0.0.1:8000${app.resume.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 ml-2 flex items-center underline"
                      >
                        <FiDownload className="mr-1" /> Download
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Dropdown selector */}
                <div className="flex items-center space-x-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-500">Stage:</span>
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicantsView;
