import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { AlertTriangle, Send, CheckCircle2, Clock } from 'lucide-react';

export const Escalations: React.FC = () => {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEscalations = async () => {
    try {
      const data = await apiRequest('/escalations');
      setEscalations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const handleAction = async (taskId: string, action: string) => {
    try {
      await apiRequest(`/escalations/${taskId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      alert(`Action ${action} executed successfully.`);
      fetchEscalations();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          <span>Delayed Approvals & Escalations</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Level 1-3 escalation triggers for overdue onboarding approvals and blocked downstream tasks.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Task & Requirement</th>
                <th className="py-3 px-4">Joiner</th>
                <th className="py-3 px-4">Assigned Owner</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Downstream Blocked</th>
                <th className="py-3 px-4 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {escalations.map((e) => (
                <tr key={e.task_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.escalation_level === 3
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : e.escalation_level === 2
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      Level {e.escalation_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {e.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {e.joiner_name} ({e.joiner_department})
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <span className="font-medium block">{e.owner_name}</span>
                    <span className="text-slate-400 text-[11px]">{e.owner_function}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-600 font-bold">
                    {e.due_date}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                    {e.downstream_blocked_count} tasks
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAction(e.task_id, 'NUDGE')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Nudge
                      </button>
                      <button
                        onClick={() => handleAction(e.task_id, 'RESOLVE')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Resolve
                      </button>
                    </div>
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

