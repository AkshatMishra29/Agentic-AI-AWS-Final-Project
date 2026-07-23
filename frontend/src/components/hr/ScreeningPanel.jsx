import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { FiCpu, FiCheckCircle, FiClock, FiAlertCircle, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { triggerScreening } from '../../api';

const ScreeningPanel = ({ application, onScreeningStarted }) => {
  const [loading, setLoading] = useState(false);
  const screening = application?.screening;

  const getStatusDisplay = () => {
    if (!screening) return null;
    const statusMap = {
      pending: { label: 'Queued', icon: FiClock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200' },
      running: { label: 'Running…', icon: FiCpu, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 animate-pulse' },
      completed: { label: 'Screened', icon: FiCheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200' },
      failed: { label: 'Failed', icon: FiAlertCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200' },
    };
    const s = statusMap[screening.status] || statusMap.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-xl border ${s.color}`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {s.label}
        {screening.status === 'completed' && (
          <span className="ml-2 font-bold">{screening.overall_score}/100</span>
        )}
      </span>
    );
  };

  const handleTrigger = async () => {
    if (!application?.resume_id) {
      toast.error('No resume found for this applicant. Cannot screen.');
      return;
    }
    setLoading(true);
    try {
      await triggerScreening({
        job_id: application.job_id,
        resume_id: application.resume_id,
        candidate_id: application.candidate_id,
      });
      toast.success('AI Screening pipeline started!');
      if (onScreeningStarted) onScreeningStarted();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to start screening';
      if (msg.includes('already exists')) {
        toast('Screening already in progress for this candidate.', { icon: '⚠️' });
        if (onScreeningStarted) onScreeningStarted();
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {getStatusDisplay()}
      {(!screening || screening.status === 'failed') && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleTrigger}
          isLoading={loading}
          className="text-[11px]"
        >
          <FiZap className="mr-1 w-3.5 h-3.5" />
          {screening?.status === 'failed' ? 'Retry Screening' : 'Run AI Screen'}
        </Button>
      )}
    </div>
  );
};

export default ScreeningPanel;
