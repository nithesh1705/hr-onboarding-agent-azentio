import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { FileCheck, AlertTriangle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export const ReviewerDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [urgentDocs, setUrgentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([apiRequest('/review/summary'), apiRequest('/reviews')])
      .then(([sumData, queueData]) => {
        setSummary(sumData);
        setUrgentDocs((queueData || []).slice(0, 5));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center">Loading reviewer dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-brand-600" />
            <span>Document Verification Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verification workload, OCR discrepancy flags, and compliance review turnaround.
          </p>
        </div>

        {urgentDocs.length > 0 && (
          <button
            onClick={() => navigate(`/review/documents/${urgentDocs[0].id}`)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <span>Start Next Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Waiting for Review</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {summary?.waiting_for_review || 0}
          </div>
          <span className="text-[11px] text-slate-400">In verification queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-rose-600 uppercase">Flagged with Mismatch</span>
          <div className="text-2xl font-black text-rose-600">
            {summary?.flagged_with_mismatch || 0}
          </div>
          <span className="text-[11px] text-slate-400">Name / Expiry Discrepancies</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-blue-600 uppercase">Assigned to Me</span>
          <div className="text-2xl font-black text-blue-600">
            {summary?.assigned_to_me || 0}
          </div>
          <span className="text-[11px] text-slate-400">Claimed documents</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Reviewed Today</span>
          <div className="text-2xl font-black text-emerald-600">
            {summary?.reviewed_today || 0}
          </div>
          <span className="text-[11px] text-slate-400">Completed decisions</span>
        </div>
      </div>

      {/* Most Urgent Queue List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Most Urgent Verification Requests</span>
          </h3>
          <Link
            to="/review/queue"
            className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>View all queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {urgentDocs.map((doc) => (
            <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {doc.title} — {doc.joiner_name}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Joining: {doc.joining_date} • Location: {doc.joiner_location}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {doc.has_mismatch && (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Mismatch
                  </span>
                )}
                <Link
                  to={`/review/documents/${doc.id}`}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

