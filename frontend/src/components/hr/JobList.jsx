import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { FiEdit2, FiTrash2, FiUsers, FiMapPin, FiBriefcase, FiPlus, FiLock, FiUnlock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getJobs, deleteJob, updateJob } from '../../api';
import JobForm from './JobForm';

const JobList = ({ onSelectJobForApplicants }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getJobs();
      setJobs(res.data || []);
    } catch (err) {
      toast.error('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await deleteJob(id);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  const toggleStatus = async (job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await updateJob(job.id, { status: newStatus });
      toast.success(`Job marked as ${newStatus}`);
      fetchJobs();
    } catch (err) {
      toast.error('Failed to update job status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Job Postings</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your company's recruitment openings and applicant streams.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => { setEditingJob(null); setIsFormOpen(true); }}>
          <FiPlus className="mr-2" /> Post New Job
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading job postings...</div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-12">
          <FiBriefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No Job Postings Found</h3>
          <p className="text-xs text-gray-500 mt-1">Get started by creating your first job opening.</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => { setEditingJob(null); setIsFormOpen(true); }}>
            <FiPlus className="mr-2" /> Create Job
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center"><FiMapPin className="mr-1" /> {job.location || 'Remote'}</span>
                      <span>•</span>
                      <span>{job.experience_required || 'N/A'}</span>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 line-clamp-3">
                  {job.description}
                </p>

                {/* Must-have skills tags */}
                {job.must_have_skills && job.must_have_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {job.must_have_skills.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 rounded-md">
                        {skill}
                      </span>
                    ))}
                    {job.must_have_skills.length > 4 && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-500 rounded-md">
                        +{job.must_have_skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectJobForApplicants && onSelectJobForApplicants(job)}
                >
                  <FiUsers className="mr-1.5" /> View Applicants
                </Button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleStatus(job)}
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title={job.status === 'open' ? 'Close job' : 'Reopen job'}
                  >
                    {job.status === 'open' ? <FiLock className="w-4 h-4" /> : <FiUnlock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingJob(job); setIsFormOpen(true); }}
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Edit job"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    title="Delete job"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <JobForm
          initialData={editingJob}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchJobs}
        />
      )}
    </div>
  );
};

export default JobList;
