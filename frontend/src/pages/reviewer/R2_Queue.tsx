import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { SendFollowupModal } from '../../components/SendFollowupModal';
import { FileCheck, AlertTriangle, AlertCircle, Eye, CheckCircle2, Search, Mail } from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [flagFilter, setFlagFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Mail modal state
  const [activeMailJoiner, setActiveMailJoiner] = useState<{ id: string; name: string } | null>(null);

  const fetchQueue = async () => {
    try {
      const data = await apiRequest('/reviews');
      setQueue(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleClaim = async (docId: string) => {
    try {
      await apiRequest(`/documents/${docId}/claim`, { method: 'POST' });
      alert('Document claimed successfully. Locked for 30 minutes.');
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to claim');
    }
  };

  const filtered = queue.filter((d) => {
    const s = search.toLowerCase();
    const matchSearch = d.joiner_name.toLowerCase().includes(s) || d.title.toLowerCase().includes(s);
    if (flagFilter === 'mismatch') return matchSearch && d.has_mismatch;
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-brand-600" />
          <span>Document Verification Queue</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review employee statutory submissions, examine OCR extracted fields, and resolve discrepancies.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search joiner or document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="All">All Documents</option>
              <option value="mismatch">Flagged with Mismatch</option>
            </select>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Joiner</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Validation Flags</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No documents currently waiting in queue.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {d.joiner_name}
                      </span>
                      <span className="text-slate-400 text-[11px]">{d.joiner_role} • {d.joiner_location}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {d.title} (v{d.version})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {d.joining_date}
                    </td>
                    <td className="py-3.5 px-4">
                      {d.has_mismatch ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          <AlertTriangle className="w-3 h-3" /> Mismatch Detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Clean Scan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveMailJoiner({ id: d.joiner_id, name: d.joiner_name })}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Send follow-up email to joiner via Elastic connector"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/review/documents/${d.id}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open Workspace</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Send Follow-up Modal */}
      {activeMailJoiner && (
        <SendFollowupModal
          isOpen={!!activeMailJoiner}
          onClose={() => setActiveMailJoiner(null)}
          joinerId={activeMailJoiner.id}
          joinerName={activeMailJoiner.name}
          defaultCategory="Verification"
        />
      )}
    </div>
  );
};

