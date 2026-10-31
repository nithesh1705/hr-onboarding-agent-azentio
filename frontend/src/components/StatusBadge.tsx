import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  AlertTriangle,
  FileCheck2,
  HelpCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let bg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let Icon = HelpCircle;

  switch (status) {
    case 'Completed':
    case 'Accepted':
    case 'Fulfilled':
    case 'Day-1 Ready':
    case 'Active':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      Icon = CheckCircle2;
      break;

    case 'In Progress':
    case 'Under Review':
    case 'Submitted':
    case 'Requested':
      bg = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      Icon = Clock;
      break;

    case 'Pending':
    case 'Not Submitted':
    case 'Pre-joining':
    case 'Waiting':
      bg = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      Icon = Clock;
      break;

    case 'Blocked':
      bg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      Icon = AlertTriangle;
      break;

    case 'Correction Requested':
    case 'Needs Info':
      bg = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800';
      Icon = AlertCircle;
      break;

    case 'Overdue':
    case 'Rejected':
    case 'Failed':
    case 'Locked':
      bg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      Icon = XCircle;
      break;

    case 'Acknowledged':
      bg = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      Icon = FileCheck2;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${bg}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{status}</span>
    </span>
  );
};

