import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { FiBriefcase, FiMapPin, FiCalendar, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getMyApplications } from '../../api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await getMyApplications();
      setApplications(res.data || []);
    } catch (err) {
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Job Applications</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Monitor real-time updates and screening stages for positions you have applied to.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-12">
          <FiBriefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No Applications Submitted</h3>
          <p className="text-xs text-gray-500 mt-1">Browse available job openings and submit your first application.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const job = app.job || {};
            const resume = app.resume || {};
            return (
              <Card key={app.id} className="hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {job.title || 'Job Opening'}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span className="flex items-center"><FiMapPin className="mr-1" /> {job.location || 'Remote'}</span>
                      <span>•</span>
                      <span className="flex items-center"><FiCalendar className="mr-1" /> Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>

                    {resume.filename && (
                      <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <FiFileText className="mr-1 text-indigo-500" />
                        <span>Submitted with: <span className="font-semibold text-gray-700 dark:text-gray-300">{resume.filename}</span></span>
                      </div>
                    )}
                  </div>

                  <div className="text-right border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400">Last updated</p>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-0.5">
                      {new Date(app.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
