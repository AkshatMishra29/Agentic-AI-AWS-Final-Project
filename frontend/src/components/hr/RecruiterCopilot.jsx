import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiCpu, FiSend, FiUserCheck, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API, { getErrorMessage } from '../../api';

const RecruiterCopilot = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: 'Hello! I am your AI Recruiter Copilot. Ask me anything about candidate performance, top scores, skill matches, or shortlists across all job postings.',
      cited: []
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    'Who is the top scoring candidate for Software Engineer?',
    'List all candidates with high skill alignment.',
    'Summarize recent candidate interview readiness.'
  ];

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query;
    setQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await API.post('/copilot/query', { query: userText });
      setMessages(prev => [
        ...prev,
        {
          sender: 'copilot',
          text: res.data.answer || 'Analysis complete.',
          cited: res.data.cited_candidates || []
        }
      ]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to consult Recruiter Copilot'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <FiCpu className="text-indigo-600 dark:text-indigo-400" />
          <span>Recruiter Copilot Agent</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Grounded candidate intelligence — ask questions across screening evaluations and shortlists.
        </p>
      </div>

      <Card className="flex flex-col h-[520px] p-0 overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2 ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                {m.cited && m.cited.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-indigo-500 flex items-center">
                      <FiUserCheck className="mr-1" /> Cited Candidates:
                    </span>
                    {m.cited.map((c, cIdx) => (
                      <span key={cIdx} className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center space-x-2 text-xs text-gray-400">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing candidate MongoDB records & generating grounded response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center whitespace-nowrap">
            <FiHelpCircle className="mr-1" /> Suggested:
          </span>
          {sampleQueries.map((sq, sqIdx) => (
            <button
              key={sqIdx}
              onClick={() => { setQuery(sq); }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-indigo-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition whitespace-nowrap"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask Copilot about any candidate, score, or skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-white"
          />
          <Button type="submit" isLoading={loading} size="sm">
            <FiSend className="mr-1" /> Ask
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default RecruiterCopilot;
