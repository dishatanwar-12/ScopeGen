import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const norm = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'approved' || norm === 'resolved') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (norm === 'draft' || norm === 'open' || norm === 'intake') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (norm === 'in_review' || norm === 'answered' || norm === 'proposal_ready') {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
  } else if (norm === 'archived' || norm === 'dismissed') {
    colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
  }

  const formatText = (txt: string) => {
    return txt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClasses} ${className}`}
    >
      {formatText(status)}
    </span>
  );
};

