import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const norm = status.toLowerCase();

  let colorClasses = 'bg-[#EDE8E0] text-[#73706B] border-[#DDD7CE]';

  if (norm === 'approved' || norm === 'resolved') {
    colorClasses = 'bg-[#E6F5EB] text-[#2C8A4D] border-[#CAEAD4]';
  } else if (norm === 'draft' || norm === 'open' || norm === 'intake') {
    colorClasses = 'bg-[#FAEDE2] text-[#B3662E] border-[#F4DCBE]';
  } else if (norm === 'in_progress' || norm === 'in progress' || norm === 'sent' || norm === 'proposal_ready') {
    colorClasses = 'bg-[#E8EDFA] text-[#4769D6] border-[#D0DCF7]';
  } else if (norm === 'in_review' || norm === 'client_review' || norm === 'client review' || norm === 'in review' || norm === 'answered') {
    colorClasses = 'bg-[#F0EBFA] text-[#7849C4] border-[#E1D4F5]';
  } else if (norm === 'archived' || norm === 'dismissed') {
    colorClasses = 'bg-[#EDE8E0] text-[#73706B] border-[#DDD7CE]';
  }

  const formatText = (txt: string) => {
    return txt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${colorClasses} ${className}`}
    >
      {formatText(status)}
    </span>
  );
};
