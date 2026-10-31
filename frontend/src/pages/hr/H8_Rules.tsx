import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { Sliders, Shield, Plus, CheckCircle2 } from 'lucide-react';

export const RequirementRules: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/rules')
      .then((data) => setRules(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-brand-600" />
          <span>Requirement & Checklist Generation Rules</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Rules driving automatic task creation, due date offsets, and departmental ownership.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Rule Code</th>
                <th className="py-3 px-4">Title & Item Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Due Offset</th>
                <th className="py-3 px-4">Blocking</th>
                <th className="py-3 px-4">Source Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {r.code}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.title}</span>
                    <span className="text-[11px] text-slate-400">{r.explanation}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {r.category}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {r.owner_function}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {r.due_offset_days} days before {r.anchor}
                  </td>
                  <td className="py-3 px-4">
                    {r.is_blocking ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Blocking
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Non-blocking</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-brand-600">
                    {r.linked_policy_code || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

