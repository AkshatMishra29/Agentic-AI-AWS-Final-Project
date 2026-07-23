import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { FiSearch, FiMapPin, FiBriefcase, FiCheckCircle, FiUpload, FiFileText, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getJobs, getMyResumes, applyForJob, uploadResume } from '../../api';

const JobBrowse = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  // Apply Modal state
  const [applyingJob, setApplyingJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getJobs();
      setJobs(res.data || []);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await getMyResumes();
      const docs = res.data || [];
      setResumes(docs);
      if (docs.length > 0) {
        setSelectedResumeId(docs[0].id);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchResumes();
  }, []);

  const openApplyModal = (job) => {
    setApplyingJob(job);
    fetchResumes();
  };

  const handleFileUploadOnApply = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await uploadResume(formData);
      toast.success('Resume uploaded!');
      await fetchResumes();
      setSelectedResumeId(res.data.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleApplySubmit = async () => {
    if (!selectedResumeId) {
      toast.error('Please upload or select a resume first');
      return;
    }
    setSubmitting(true);
    try {
      await applyForJob({
        job_id: applyingJob.id,
        resume_id: selectedResumeId,
      });
      toast.success(`Successfully applied for ${applyingJob.title}!`);
      setApplyingJob(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSkill =
      !selectedSkill ||
      (job.must_have_skills && job.must_have_skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase())) ||
      (job.nice_to_have_skills && job.nice_to_have_skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase()));

    return matchesSearch && matchesSkill;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by job title, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <input
          type="text"
          placeholder="Filter by skill (e.g. React)"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="md:w-64 px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading open positions...</div>
      ) : filteredJobs.length === 0 ? (
        <Card className="text-center py-12">
          <FiBriefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No Jobs Found</h3>
          <p className="text-xs text-gray-500 mt-1">Try tweaking your search criteria or skills filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
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
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                    {job.salary_range || 'Competitive'}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 line-clamp-3">
                  {job.description}
                </p>

                {job.must_have_skills && job.must_have_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {job.must_have_skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
                <Button variant="primary" size="sm" onClick={() => openApplyModal(job)}>
                  Apply Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Apply for {applyingJob.title}
              </h3>
              <button
                onClick={() => setApplyingJob(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Resume for Application
                </label>

                {resumes.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {resumes.map((r) => (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                          selectedResumeId === r.id
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <FiFileText className="text-indigo-600" />
                          <span>{r.filename}</span>
                        </div>
                        <input
                          type="radio"
                          name="resume"
                          value={r.id}
                          checked={selectedResumeId === r.id}
                          onChange={() => setSelectedResumeId(r.id)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No uploaded resumes found. Please upload one below.</p>
                )}
              </div>

              {/* Upload New Resume Option */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Upload New Resume (.pdf, .docx)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUploadOnApply}
                  disabled={uploading}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="secondary" size="sm" onClick={() => setApplyingJob(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleApplySubmit} isLoading={submitting}>
                  Submit Application
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JobBrowse;
