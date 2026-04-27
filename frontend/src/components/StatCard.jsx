import React from 'react';

export default function StatCard({ title, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { bg: 'bg-primary-50 dark:bg-primary-900/20',  icon: 'text-primary-600 dark:text-primary-400',  border: 'border-primary-100 dark:border-primary-900/40' },
    green:  { bg: 'bg-success-50 dark:bg-green-900/20',    icon: 'text-success-700 dark:text-green-400',     border: 'border-green-100 dark:border-green-900/40' },
    yellow: { bg: 'bg-warning-50 dark:bg-yellow-900/20',   icon: 'text-warning-700 dark:text-yellow-400',    border: 'border-yellow-100 dark:border-yellow-900/40' },
    red:    { bg: 'bg-danger-50 dark:bg-red-900/20',       icon: 'text-danger-700 dark:text-red-400',        border: 'border-red-100 dark:border-red-900/40' },
  };
  const c = colors[color] || colors.blue;

  // Guard against NaN (e.g. when yesterday = 0, trend is null/NaN)
  const trendValid = trend !== undefined && trend !== null && !isNaN(trend);

  return (
    <div className={`card p-5 border ${c.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{sub}</p>}
          {trendValid && (
            <p className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-success-700 dark:text-green-400' : 'text-danger-700 dark:text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend}% vs yesterday
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${c.bg} p-2.5 rounded-xl`}>
            <Icon className={c.icon} size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
