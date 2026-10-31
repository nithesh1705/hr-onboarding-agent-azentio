import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { Users, Shield, ArrowRight } from 'lucide-react';

export const OwnersAndEscalation: React.FC = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/owners')
      .then((data) => setOwners(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-600" />
          <span>Department Owners & Escalation Chains</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Functional task owners, backup assignees (Level 2), and department heads (Level 3).
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Function</th>
                <th className="py-3 px-4">Department / Hub</th>
                <th className="py-3 px-4">Primary Task Owner (L1)</th>
                <th className="py-3 px-4">Backup Owner (L2: +24h)</th>
                <th className="py-3 px-4">Department Head (L3: +48h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {owners.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {o.function_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {o.department}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-brand-600 dark:text-brand-400 block">{o.owner_name}</span>
                    <span className="text-slate-400 text-[11px]">{o.owner_email}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{o.backup_owner_name || '—'}</span>
                    <span className="text-slate-400 text-[11px]">{o.backup_owner_email}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{o.dept_head_name || '—'}</span>
                    <span className="text-slate-400 text-[11px]">{o.dept_head_email}</span>
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

