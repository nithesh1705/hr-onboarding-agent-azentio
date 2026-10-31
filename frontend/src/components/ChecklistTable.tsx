import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import {
  HelpCircle,
  Upload,
  ShieldCheck,
  CheckCircle,
  Eye,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  X
} from 'lucide-react';
import { apiRequest } from '../api/client';

export interface TaskItem {
  id: string;
  rule_code: string;
  title: string;
  category: string;
  owner_function: string;
  owner_name: string;
  due_date: string;
  status: string;
  is_blocking: boolean;
  linked_policy_code?: string;
  blocked_by?: Array<{ id: string; title: string; status: string; owner: string }>;
  why_explanation?: string;
  is_manual?: boolean;
}

interface ChecklistTableProps {
  tasks: TaskItem[];
  onAction?: (actionType: string, task: TaskItem) => void;
  onRefresh?: () => void;
  readOnly?: boolean;
}

export const ChecklistTable: React.FC<ChecklistTableProps> = ({
  tasks,
  onAction,
  onRefresh,
  readOnly = false,
}) => {
  const [selectedTaskForWhy, setSelectedTaskForWhy] = useState<any>(null);
  const [loadingWhy, setLoadingWhy] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const openWhyDrawer = async (task: TaskItem) => {
    setLoadingWhy(true);
    setSelectedTaskForWhy(task);
    try {
      const explanation = await apiRequest(`/tasks/${task.id}/explain`);
      setSelectedTaskForWhy({ ...task, ...explanation });
    } catch {
      // Use fallback
      setSelectedTaskForWhy(task);
    } finally {
      setLoadingWhy(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(tasks.map((t) => t.category)))];

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search checklist items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-300"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4">Item & Rule</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Blocked By</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500">
                  No checklist items found matching criteria.
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{t.title}</span>
                      {t.is_blocking && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                          Blocking
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-slate-500">{t.rule_code}</span>
                      <button
                        onClick={() => openWhyDrawer(t)}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Why?</span>
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                    {t.category}
                  </td>

                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs">
                    <span className="font-medium">{t.owner_name}</span>
                    <span className="text-slate-400 text-[11px] block">{t.owner_function}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs font-mono">
                    {t.due_date}
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge status={t.status} size="sm" />
                  </td>

                  <td className="py-3 px-4 text-xs">
                    {t.blocked_by && t.blocked_by.length > 0 ? (
                      <div className="space-y-1">
                        {t.blocked_by.map((b) => (
                          <div
                            key={b.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px]"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>{b.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {!readOnly && (
                      <div className="flex items-center justify-end gap-1.5">
                        {t.category === 'Document' && t.status !== 'Completed' && (
                          <button
                            onClick={() => onAction && onAction('upload', t)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:hover:bg-brand-900 dark:text-brand-300 flex items-center gap-1"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </button>
                        )}
                        {t.category === 'Compliance' && t.status !== 'Completed' && (
                          <button
                            onClick={() => onAction && onAction('acknowledge', t)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 dark:text-indigo-300 flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Acknowledge</span>
                          </button>
                        )}
                        <button
                          onClick={() => openWhyDrawer(t)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Why is this here? Drawer */}
      {selectedTaskForWhy && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Why is this requirement here?
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTaskForWhy(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedTaskForWhy.rule_code}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedTaskForWhy.title}
                  </h4>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Rule Explanation
                  </h5>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedTaskForWhy.why_explanation || selectedTaskForWhy.explanation}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Due Date Derivation
                  </h5>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedTaskForWhy.due_date_logic || `Targeted due date is ${selectedTaskForWhy.due_date}.`}
                  </p>
                </div>

                {selectedTaskForWhy.blocked_by && selectedTaskForWhy.blocked_by.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                      Depends On (Blockers)
                    </h5>
                    <div className="space-y-2">
                      {selectedTaskForWhy.blocked_by.map((b: any) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/40 text-xs"
                        >
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {b.title}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Owner: {b.owner} | Status: {b.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTaskForWhy.blocks_downstream && selectedTaskForWhy.blocks_downstream.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
                      Blocks Downstream
                    </h5>
                    <div className="space-y-2">
                      {selectedTaskForWhy.blocks_downstream.map((d: any) => (
                        <div
                          key={d.id}
                          className="p-3 rounded-lg border border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/40 text-xs"
                        >
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {d.title}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Owner: {d.owner} | Status: {d.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                <button
                  onClick={() => setSelectedTaskForWhy(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

