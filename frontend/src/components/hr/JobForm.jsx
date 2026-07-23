import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiX, FiPlus, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createJob, updateJob } from '../../api';

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
      toast.error(err.response?.data?.detail || 'Failed to save job');
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
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Fullstack Engineer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Detailed responsibilities, expectations, and role description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Experience Required</label>
              <input
                type="text"
                placeholder="e.g. 3+ years"
                value={formData.experience_required}
                onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Education</label>
              <input
                type="text"
                placeholder="e.g. B.S. in Computer Science"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. Remote / New York, NY"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Salary Range</label>
              <input
                type="text"
                placeholder="e.g. $120,000 - $150,000"
                value={formData.salary_range}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Must Have Skills Tag Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Must-Have Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add skill (e.g. React)"
                value={mustInput}
                onChange={(e) => setMustInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('must'); } }}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => addSkill('must')}>
                <FiPlus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mustHaveSkills.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <FiTag className="w-3 h-3 mr-1" /> {skill}
                  <button type="button" onClick={() => removeSkill('must', skill)} className="ml-1 text-indigo-500 hover:text-indigo-800">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Nice Have Skills Tag Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nice-to-Have Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Docker)"
                value={niceInput}
                onChange={(e) => setNiceInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('nice'); } }}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => addSkill('nice')}>
                <FiPlus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {niceToHaveSkills.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <FiTag className="w-3 h-3 mr-1" /> {skill}
                  <button type="button" onClick={() => removeSkill('nice', skill)} className="ml-1 text-purple-500 hover:text-purple-800">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              {initialData ? 'Update Posting' : 'Publish Job'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default JobForm;
