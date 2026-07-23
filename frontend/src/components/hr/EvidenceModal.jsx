import React, { useState } from 'react';
import { FiX, FiFileText, FiCheckCircle, FiAlertTriangle, FiList, FiClock, FiCpu, FiEye } from 'react-icons/fi';
import { Card } from '../ui/Card';

const ScoreBar = ({ label, score, color = 'bg-indigo-500' }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
      <span>{label}</span>
      <span className="font-bold">{score}/100</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

const EvidenceModal = ({ result, candidateId, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!result) return null;

  const scores = result.scores || {};
  const evidence = result.evidence || {};
  const evidenceSummary = result.evidence_summary || {};

  const getScoreColor = (score) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return { label: 'Strong Match', cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' };
    if (score >= 60) return { label: 'Good Match', cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200' };
    if (score >= 40) return { label: 'Partial Match', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
    return { label: 'Weak Match', cls: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200' };
  };

  const overall = result.overall_score || 0;
  const scoreInfo = getScoreLabel(overall);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              {overall}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Screening Report</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{candidateId}</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border ${scoreInfo.cls}`}>
              {scoreInfo.label}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 px-6 space-x-5">
          {['overview', 'evidence', 'fairness'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-xs font-semibold capitalize transition border-b-2 ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {activeTab === 'overview' && (
            <>
              {/* Score Breakdown */}
              <Card title="Score Breakdown" className="p-5">
                <ScoreBar label="Skill Match (45% weight)" score={scores.skill_match || 0} color={getScoreColor(scores.skill_match || 0)} />
                <ScoreBar label="Experience Match (35% weight)" score={scores.experience_match || 0} color={getScoreColor(scores.experience_match || 0)} />
                <ScoreBar label="Project Relevance (20% weight)" score={scores.project_relevance || 0} color={getScoreColor(scores.project_relevance || 0)} />
                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Overall Score</span>
                    <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{overall}/100</span>
                  </div>
                </div>
              </Card>

              {/* AI Reasoning */}
              {result.reasoning && (
                <Card title="AI Reasoning" className="p-5">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.reasoning}</p>
                </Card>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.strengths?.length > 0 && (
                  <Card title="Strengths" className="p-5">
                    <ul className="space-y-2">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-gray-300">
                          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {result.weaknesses?.length > 0 && (
                  <Card title="Weaknesses" className="p-5">
                    <ul className="space-y-2">
                      {result.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-gray-300">
                          <FiAlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>

              {/* Missing Skills */}
              {result.missing_skills?.length > 0 && (
                <Card title="Missing Skills" className="p-5">
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-md border border-rose-200 dark:border-rose-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {[
                { label: 'Skill Match Evidence', items: evidence.skill_match_evidence, color: 'indigo' },
                { label: 'Experience Evidence', items: evidence.experience_evidence, color: 'blue' },
                { label: 'Project Evidence', items: evidence.project_evidence, color: 'purple' },
              ].map(({ label, items, color }) => (
                <Card key={label} title={label} className="p-5">
                  {items?.length > 0 ? (
                    <ul className="space-y-2">
                      {items.map((ev, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-gray-300">
                          <FiEye className={`w-3.5 h-3.5 text-${color}-500 mt-0.5 flex-shrink-0`} />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400">No evidence items collected.</p>
                  )}
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'fairness' && (
            <div className="space-y-4">
              <Card title="Bias Guardrail Report" className="p-5">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                  The following personal identity fields were automatically stripped from the candidate resume before AI scoring to prevent bias.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.bias_stripped_fields?.length > 0 ? (
                    result.bias_stripped_fields.map((f, i) => (
                      <span key={i} className="px-2 py-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-600">
                        {f}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No fields were stripped (clean resume).</p>
                  )}
                </div>
              </Card>
              <Card title="Scoring Methodology" className="p-5">
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <p>• <strong>Skills (45%):</strong> Direct match of candidate skills against must-have and nice-to-have requirements</p>
                  <p>• <strong>Experience (35%):</strong> Years of relevant experience, seniority level, and domain match</p>
                  <p>• <strong>Projects (20%):</strong> Tech stack overlap, project complexity, and domain relevance</p>
                  <p>• All scoring done post bias-stripping, ensuring fair evaluation based purely on merit</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceModal;
