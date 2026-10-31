import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { BarChart3, TrendingUp, CheckCircle2, Clock, ShieldCheck, Download } from 'lucide-react';

export const Metrics: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/metrics/summary')
      .then((data) => setMetrics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            <span>Onboarding Readiness & SLA Metrics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key indicators for time-to-readiness, document turnaround SLA, and AI assistant precision.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Metrics</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Median Days to Day-1 Ready
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics?.median_days_to_ready} days
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">↓ 3.2 days vs historical</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Day-1 Ready Rate at Joining
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {metrics?.day1_ready_percentage}%
          </div>
          <span className="text-[11px] text-slate-400">Target SLA: 95%</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            First-Pass Document Acceptance
          </span>
          <div className="text-2xl font-black text-blue-600">
            {metrics?.first_pass_doc_acceptance_rate}%
          </div>
          <span className="text-[11px] text-slate-400">15% required correction cycle</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Assistant Citation Presence
          </span>
          <div className="text-2xl font-black text-indigo-600">
            {metrics?.assistant_citation_rate}%
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">100% Policy Grounded</span>
        </div>
      </div>
    </div>
  );
};

