import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { FiUser, FiMail, FiPhone, FiLinkedin, FiGithub, FiMapPin, FiBook, FiBriefcase, FiSave, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PROFILE_KEY = 'hireflow_candidate_profile';

const defaultProfile = {
  full_name: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  type: 'fresher', // 'fresher' | 'experienced'
  // Fresher fields
  degree: '',
  college: '',
  graduation_year: '',
  cgpa: '',
  // Experienced fields
  current_role: '',
  current_company: '',
  total_experience: '',
  notice_period: '',
  current_ctc: '',
  expected_ctc: '',
  // Common
  skills: [],
  bio: '',
};

const CandidateProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try { setProfile({ ...defaultProfile, ...JSON.parse(saved) }); } catch { }
    }
  }, []);

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      toast.success('Profile saved!');
      setSaving(false);
    }, 400);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !profile.skills.includes(s)) {
      setProfile(p => ({ ...p, skills: [...p.skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (s) => setProfile(p => ({ ...p, skills: p.skills.filter(sk => sk !== s) }));

  const field = (key, label, placeholder, type = 'text', icon = null) => (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
        {icon && <span className="mr-1">{icon}</span>}{label}
      </label>
      <input
        type={type}
        value={profile[key]}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Keep your profile complete to help HRs understand your background.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={save} isLoading={saving}>
          <FiSave className="mr-1.5" /> Save Profile
        </Button>
      </div>

      {/* Account Info (read-only) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Account</h3>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-600 text-base">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.full_name || 'Your Name'}</p>
            <p className="text-xs text-gray-500 flex items-center"><FiMail className="mr-1 w-3 h-3" />{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('full_name', 'Full Name', 'Your full name')}
          {field('phone', 'Phone', '+91 98765 43210', 'tel')}
          {field('location', 'Location', 'City, State')}
          {field('linkedin', 'LinkedIn URL', 'https://linkedin.com/in/...')}
          {field('github', 'GitHub URL', 'https://github.com/...')}
          {field('portfolio', 'Portfolio / Website', 'https://yoursite.com')}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Bio / Summary</label>
          <textarea
            value={profile.bio}
            onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
            placeholder="Brief introduction about yourself (2-3 sentences)"
            rows={3}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      {/* Fresher / Experienced Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Career Stage</h3>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            {['fresher', 'experienced'].map(t => (
              <button
                key={t}
                onClick={() => setProfile(p => ({ ...p, type: t }))}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition capitalize ${
                  profile.type === t
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {profile.type === 'fresher' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('degree', 'Degree', 'B.Tech Computer Science')}
            {field('college', 'College / University', 'IIT Delhi')}
            {field('graduation_year', 'Graduation Year', '2025', 'number')}
            {field('cgpa', 'CGPA / Percentage', '8.5 / 10 or 85%')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('current_role', 'Current Role', 'Software Engineer')}
            {field('current_company', 'Current Company', 'Infosys')}
            {field('total_experience', 'Total Experience', '3 years 2 months')}
            {field('notice_period', 'Notice Period', '30 days / Immediate')}
            {field('current_ctc', 'Current CTC (₹ LPA)', '8')}
            {field('expected_ctc', 'Expected CTC (₹ LPA)', '12')}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Skills</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            placeholder="Type a skill and press Enter"
            className="flex-1 px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button variant="primary" size="sm" onClick={addSkill}>
            <FiPlus className="w-4 h-4" />
          </Button>
        </div>
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s, i) => (
              <span key={i} className="flex items-center px-3 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800">
                {s}
                <button onClick={() => removeSkill(s)} className="ml-1.5 text-indigo-400 hover:text-red-500">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pb-4">
        <Button variant="primary" size="md" onClick={save} isLoading={saving}>
          <FiSave className="mr-2" /> Save Profile
        </Button>
      </div>
    </div>
  );
};

export default CandidateProfile;
