import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface ReadinessRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showBadge?: boolean;
}

export const ReadinessRing: React.FC<ReadinessRingProps> = ({
  score = 0,
  size = 120,
  strokeWidth = 10,
  showBadge = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#0ea5e9'; // sky
  if (clampedScore >= 80) strokeColor = '#10b981'; // emerald
  else if (clampedScore >= 50) strokeColor = '#f59e0b'; // amber
  else strokeColor = '#ef4444'; // rose

  const isDay1Ready = clampedScore === 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-800"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {clampedScore}%
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ready
          </span>
        </div>
      </div>

      {showBadge && isDay1Ready && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Day-1 Ready</span>
        </div>
      )}
    </div>
  );
};

