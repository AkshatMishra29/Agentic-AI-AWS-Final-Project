import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiCalendar, FiVideo, FiClock, FiBriefcase, FiUser, FiCheckCircle, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getMyInterviews, deleteInterview, getErrorMessage } from '../../api';

const MyInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await getMyInterviews();
      setInterviews(res.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load scheduled interviews'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <FiCalendar className="text-indigo-600 dark:text-indigo-400" />
            <span>My Scheduled Interviews</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            View upcoming interview rounds, Google Meet links, and status.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInterviews}>
          <FiRefreshCw className="mr-1.5" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <Card className="text-center py-16">
          <FiCalendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Scheduled Interviews</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Once HR shortlists your application and schedules an interview round, your Google Meet invite will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((item) => (
            <Card key={item.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition shadow-sm">
              <div className="space-y-2">
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
                    <FiBriefcase className="w-4 h-4 text-indigo-500" />
                    <span>{item.job_title}</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Candidate: {item.candidate_name}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <button
                  onClick={async () => {
                    if (window.confirm('Remove this interview card?')) {
                      try {
                        await deleteInterview(item.id);
                        toast.success('Interview card removed');
                        fetchInterviews();
                      } catch (err) {
                        toast.error('Failed to remove card');
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
                    <FiVideo className="mr-1.5 w-3.5 h-3.5" /> Join Call
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInterviews;
