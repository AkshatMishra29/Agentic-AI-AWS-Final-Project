import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  FiHelpCircle, FiFileText, FiUserCheck, FiSend, FiZap,
  FiCheckCircle, FiAlertCircle, FiBookOpen, FiPlus, FiTrash2, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  askFaqAgent, getResumeAdvice, getInterviewPrep,
  getMyApplications, getCompanyDocs, addCompanyDoc, deleteCompanyDoc, getErrorMessage
} from '../../api';

const AiAssistant = ({ role = 'candidate' }) => {
  const [activeSubTab, setActiveSubTab] = useState('faq');

  // FAQ state
  const [question, setQuestion] = useState('');
  const [faqLoading, setFaqLoading] = useState(false);
  const [chatLog, setChatLog] = useState([]);

  // Resume Advisor state
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResult, setAdvisorResult] = useState(null);

  // Interview Coach state
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResult, setCoachResult] = useState(null);

  // HR Document Management State
  const [docs, setDocs] = useState([]);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docType, setDocType] = useState('policy');
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    if (role === 'candidate') {
      getMyApplications().then(res => {
        const apps = res.data || [];
        setApplications(apps);
        if (apps.length > 0) setSelectedAppId(apps[0].id);
      }).catch(() => {});
    }
    fetchDocs();
  }, [role]);

  const fetchDocs = async () => {
    try {
      const res = await getCompanyDocs();
      setDocs(res.data || []);
    } catch {}
  };

  const handleAskFaq = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQ = question.trim();
    setQuestion('');
    setFaqLoading(true);

    try {
      const res = await askFaqAgent(userQ);
      setChatLog(prev => [
        ...prev,
        { type: 'user', text: userQ },
        { type: 'bot', text: res.data.answer, sources: res.data.sources, model: res.data.model_used }
      ]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to get answer from FAQ bot'));
    } finally {
      setFaqLoading(false);
    }
  };

  const handleGetAdvice = async () => {
    setAdvisorLoading(true);
    try {
      const res = await getResumeAdvice({ application_id: selectedAppId });
      setAdvisorResult(res.data);
      toast.success('✨ Resume advice generated!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to generate resume feedback'));
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleGetCoach = async () => {
    setCoachLoading(true);
    try {
      const selectedApp = applications.find(a => a.id === selectedAppId);
      const res = await getInterviewPrep({ job_id: selectedApp?.job_id });
      setCoachResult(res.data);
      toast.success('🎯 Interview practice questions generated!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to generate interview questions'));
    } finally {
      setCoachLoading(false);
    }
  };

  const handleAddDoc = async (e) => {
    e.preventDefault();
    if (!docTitle || !docContent) {
      toast.error('Title and Content are required');
      return;
    }
    setDocLoading(true);
    try {
      await addCompanyDoc({ title: docTitle, content: docContent, doc_type: docType });
      toast.success('Document added & FAISS vector store updated!');
      setDocTitle('');
      setDocContent('');
      fetchDocs();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add document'));
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    try {
      await deleteCompanyDoc(id);
      toast.success('Document deleted');
      fetchDocs();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <FiZap className="text-indigo-600 dark:text-indigo-400" />
          <span>HireFlow AI Assistant Suite</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Grounded corporate FAQ Q&A, ATS resume advisor, and AI interview coach.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-2">
        <button
          onClick={() => setActiveSubTab('faq')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold transition border-b-2 -mb-px ${
            activeSubTab === 'faq'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <FiHelpCircle className="w-4 h-4" />
          <span>Company FAQ Bot</span>
        </button>

        {role === 'candidate' && (
          <>
            <button
              onClick={() => setActiveSubTab('advisor')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold transition border-b-2 -mb-px ${
                activeSubTab === 'advisor'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span>Resume Advisor</span>
            </button>
            <button
              onClick={() => setActiveSubTab('coach')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold transition border-b-2 -mb-px ${
                activeSubTab === 'coach'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <FiUserCheck className="w-4 h-4" />
              <span>Interview Coach</span>
            </button>
          </>
        )}

        {role === 'hr' && (
          <button
            onClick={() => setActiveSubTab('kb')}
            className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold transition border-b-2 -mb-px ${
              activeSubTab === 'kb'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FiBookOpen className="w-4 h-4" />
            <span>Manage RAG Knowledge Base</span>
          </button>
        )}
      </div>

      {/* ─── TAB 1: FAQ BOT ─────────────────────────────────────────────────── */}
      {activeSubTab === 'faq' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="space-y-3 min-h-[220px] max-h-[380px] overflow-y-auto pr-1">
              {chatLog.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FiHelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">Ask any question about company policies, leave rules, or process!</p>
                </div>
              ) : (
                chatLog.map((msg, i) => (
                  <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl p-3.5 rounded-2xl text-xs space-y-1.5 ${
                      msg.type === 'user'
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.sources?.length > 0 && (
                        <p className="text-[10px] opacity-75 font-semibold pt-1 border-t border-gray-200 dark:border-gray-600">
                          Source: {msg.sources.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAskFaq} className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about leave policies, work hours, compensation..."
                className="flex-1 px-4 py-2.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="submit" variant="primary" size="sm" isLoading={faqLoading}>
                <FiSend className="mr-1.5" /> Ask AI
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* ─── TAB 2: RESUME ADVISOR ────────────────────────────────────────────── */}
      {activeSubTab === 'advisor' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Targeted Application Analysis</h3>
                <p className="text-xs text-gray-400">Select an application to receive ATS optimization tips and missing keywords.</p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  {applications.map(a => (
                    <option key={a.id} value={a.id}>App ID: {a.id.slice(-6)} ({a.job_id.slice(-6)})</option>
                  ))}
                </select>
                <Button variant="primary" size="sm" onClick={handleGetAdvice} isLoading={advisorLoading}>
                  <FiZap className="mr-1.5" /> Analyze Resume
                </Button>
              </div>
            </div>

            {advisorResult && (
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Overall Assessment:</p>
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-1">{advisorResult.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Missing Keywords */}
                  <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/50 space-y-2">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center">
                      <FiAlertCircle className="mr-1.5" /> Recommended Missing Keywords
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {advisorResult.missing_keywords?.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 rounded-md">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Formatting Tips */}
                  <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-2">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center">
                      <FiCheckCircle className="mr-1.5" /> Formatting & Structure Tips
                    </p>
                    <ul className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                      {advisorResult.formatting_tips?.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── TAB 3: INTERVIEW COACH ────────────────────────────────────────────── */}
      {activeSubTab === 'coach' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Mock Interview Generator</h3>
                <p className="text-xs text-gray-400">Generate targeted technical and behavioral questions with ideal answer hints.</p>
              </div>
              <Button variant="primary" size="sm" onClick={handleGetCoach} isLoading={coachLoading}>
                <FiUserCheck className="mr-1.5" /> Generate Questions
              </Button>
            </div>

            {coachResult && (
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Target Role: {coachResult.role}
                </h4>
                {coachResult.questions?.map((q, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 uppercase">
                        {q.type}
                      </span>
                      <span className="text-[10px] text-gray-400">Question #{i + 1}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{q.question}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      💡 <strong>Ideal Answer Hint:</strong> {q.hint}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── TAB 4: HR RAG KNOWLEDGE BASE MANAGEMENT ─────────────────────────── */}
      {activeSubTab === 'kb' && role === 'hr' && (
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
              <FiPlus className="mr-1.5 text-indigo-500" /> Add New Company Knowledge Document
            </h3>
            <form onSubmit={handleAddDoc} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Document Title (e.g. Leave Policy 2026)"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                  required
                />
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="policy">Policy / Handbook</option>
                  <option value="benefits">Benefits & Perks</option>
                  <option value="faq">General FAQ</option>
                </select>
              </div>
              <textarea
                rows={4}
                placeholder="Paste company document text content here..."
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                required
              />
              <Button type="submit" variant="primary" size="sm" isLoading={docLoading}>
                Upload & Embed in FAISS Vector Store
              </Button>
            </form>
          </Card>

          {/* Existing Docs */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Indexed Knowledge Base Documents ({docs.length})
            </h3>
            {docs.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No knowledge base documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600 text-xs">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{d.title}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{d.doc_type} · {new Date(d.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <button onClick={() => handleDeleteDoc(d.id)} className="text-rose-500 hover:text-rose-700 p-1">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
