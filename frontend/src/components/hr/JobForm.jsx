import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiX, FiPlus, FiTag, FiUploadCloud, FiZap, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createJob, updateJob, parseJobDescription, getErrorMessage } from '../../api';

const JobForm = ({ initialData = null, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    experience_required: '',
    education: '',
    location: '',
    salary_range: '',
  });

  const [mustHaveSkills, setMustHaveSkills] = useState([]);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState([]);
  const [mustInput, setMustInput] = useState('');
  const [niceInput, setNiceInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsingJd, setParsingJd] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        experience_required: initialData.experience_required || '',
        education: initialData.education || '',
        location: initialData.location || '',
        salary_range: initialData.salary_range || '',
      });
      setMustHaveSkills(initialData.must_have_skills || []);
      setNiceToHaveSkills(initialData.nice_to_have_skills || []);
    }
  }, [initialData]);

  const handleJdFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingJd(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await parseJobDescription(fd);
      const data = res.data;
      
      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        experience_required: data.experience_required || prev.experience_required,
        education: data.education || prev.education,
        location: data.location || prev.location,
        salary_range: data.salary_range || prev.salary_range,
      }));

      if (data.must_have_skills && Array.isArray(data.must_have_skills)) {
        setMustHaveSkills(data.must_have_skills);
      }
      if (data.nice_to_have_skills && Array.isArray(data.nice_to_have_skills)) {
        setNiceToHaveSkills(data.nice_to_have_skills);
      }

      toast.success('✨ Auto-filled job details & skills from uploaded JD!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to parse JD file'));
    } finally {
      setParsingJd(false);
    }
  };

  const addSkill = (type) => {
    if (type === 'must') {
      if (mustInput.trim() && !mustHaveSkills.includes(mustInput.trim())) {
        setMustHaveSkills([...mustHaveSkills, mustInput.trim()]);
        setMustInput('');
      }
    } else {
      if (niceInput.trim() && !niceToHaveSkills.includes(niceInput.trim())) {
        setNiceToHaveSkills([...niceToHaveSkills, niceInput.trim()]);
        setNiceInput('');
      }
    }
  };

  const removeSkill = (type, skill) => {
    if (type === 'must') {
      setMustHaveSkills(mustHaveSkills.filter((s) => s !== skill));
    } else {
      setNiceToHaveSkills(niceToHaveSkills.filter((s) => s !== skill));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and Description are required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        must_have_skills: mustHaveSkills,
        nice_to_have_skills: niceToHaveSkills,
      };

      if (initialData) {
        await updateJob(initialData.id, payload);
        toast.success('Job posting updated!');
      } else {
        await createJob(payload);
        toast.success('Job posting created!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save job'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 my-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Job Posting' : 'Create New Job Posting'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* AI JD Upload Dropzone */}
          {!initialData && (
            <div className="p-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-center relative">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 flex items-center justify-center">
                  <FiZap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {parsingJd ? '✨ AI Extractor Analyzing JD Document...' : 'Upload JD Document for Instant AI Auto-Fill'}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Upload PDF, DOCX, or TXT file to automatically extract title, skills, experience & compensation
                  </p>
                </div>
                <label className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer transition shadow-sm">
                  <FiUploadCloud className="mr-1.5 w-4 h-4" />
                  <span>{parsingJd ? 'Extracting...' : 'Upload JD File'}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleJdFileUpload}
                    disabled={parsingJd}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Job Description *
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of responsibilities and scope..."
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Experience Required
              </label>
              <input
                type="text"
                value={formData.experience_required}
                onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                placeholder="e.g. 3-5 years"
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Education
              </label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="e.g. B.Tech in CS or equivalent"
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Remote / Bangalore"
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Salary Range (in ₹ LPA)
              </label>
              <input
                type="text"
                value={formData.salary_range}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                placeholder="e.g. 15-22 LPA"
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Must Have Skills */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Must-Have Skills
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={mustInput}
                onChange={(e) => setMustInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('must'); } }}
                placeholder="Type skill and press Enter"
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => addSkill('must')}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {mustHaveSkills.map((s, idx) => (
                <span key={idx} className="px-2 py-1 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg flex items-center">
                  {s}
                  <button type="button" onClick={() => removeSkill('must', s)} className="ml-1 text-indigo-400 hover:text-red-500">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Nice to Have Skills */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nice-to-Have Skills
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={niceInput}
                onChange={(e) => setNiceInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('nice'); } }}
                placeholder="Type skill and press Enter"
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => addSkill('nice')}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {niceToHaveSkills.map((s, idx) => (
                <span key={idx} className="px-2 py-1 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center">
                  {s}
                  <button type="button" onClick={() => removeSkill('nice', s)} className="ml-1 text-gray-400 hover:text-red-500">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              {initialData ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default JobForm;
