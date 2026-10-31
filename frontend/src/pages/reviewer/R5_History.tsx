import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { History, CheckCircle2, AlertCircle } from 'lucide-react';

export const ReviewHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/review/history')
      .then((data) => setHistory(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <History className="w-6 h-6 text-brand-600" />
          <span>My Verification Decisions</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          History of accepted documents, correction requests, and escalations.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Joiner</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Reviewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No decisions recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {h.joiner_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {h.doc_title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.decision === 'ACCEPT'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                        }`}
                      >
                        {h.decision}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {h.reason || h.remarks || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {h.reviewer}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

