import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm p-6 transition-all duration-200 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export const StatCard = ({ title, value, change, icon: Icon, trend = 'up' }) => {
  return (
    <Card className="hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
          <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h4>
          {change && (
            <span className={`inline-flex items-center text-xs font-semibold ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend === 'up' ? '↑' : '↓'} {change}
            </span>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
};
