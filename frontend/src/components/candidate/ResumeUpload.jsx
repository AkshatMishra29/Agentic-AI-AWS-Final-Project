import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiUploadCloud, FiFileText, FiCheckCircle, FiClock, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { uploadResume, getMyResumes } from '../../api';

const ResumeUpload = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await getMyResumes();
      setResumes(res.data || []);
    } catch (err) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadResume(formData);
      toast.success('Resume uploaded successfully!');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resume Management</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Upload and manage your resume documents for automated AI screening and applications.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <Card className="p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/10 text-center">
        <form
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center shadow-inner">
            <FiUploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Drag & Drop your resume here, or <label className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">browse<input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileChange} className="hidden" /></label>
            </p>
            <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, DOC, TXT (Max 10MB)</p>
          </div>
        </form>
      </Card>

      {/* Uploaded Resumes List */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Your Uploaded Resumes</h3>
        {loading ? (
          <div className="py-6 text-center text-xs text-gray-500">Loading resumes...</div>
        ) : resumes.length === 0 ? (
          <Card className="text-center py-8">
            <FiFileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No resumes uploaded yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {resumes.map((r) => (
              <Card key={r.id} className="flex items-center justify-between p-4 hover:shadow-md transition">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                    <FiFileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{r.filename}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Uploaded on {new Date(r.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center">
                    <FiCheckCircle className="w-3 h-3 mr-1" /> Ready
                  </span>
                  <a
                    href={`http://127.0.0.1:8000${r.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                    title="Download file"
                  >
                    <FiDownload className="w-4 h-4" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;
