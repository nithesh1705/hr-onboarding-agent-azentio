import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Laptop, Filter, Search, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const ITRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [kindFilter, setKindFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await apiRequest('/provisioning');
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = requests.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = r.item_name.toLowerCase().includes(s) || r.joiner_name.toLowerCase().includes(s);
    const matchKind = kindFilter === 'All' || r.kind === kindFilter;
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchKind && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Laptop className="w-6 h-6 text-brand-600" />
          <span>Provisioning Requests Queue</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage hardware inventory assignments, Google Workspace accounts, and access groups.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search request or joiner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="All">All Types</option>
              <option value="LAPTOP">Laptops</option>
              <option value="EMAIL">Email Accounts</option>
              <option value="ACCESS">Tool Bundles</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="All">All Statuses</option>
              <option value="Requested">Ready (Requested)</option>
              <option value="Waiting">Waiting on Dependencies</option>
              <option value="In Progress">In Progress</option>
              <option value="Fulfilled">Fulfilled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Item & Kind</th>
                <th className="py-3 px-4">Joiner</th>
                <th className="py-3 px-4">Target Due Date</th>
                <th className="py-3 px-4">Dependency State</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {r.item_name}
                    </span>
                    <span className="text-[11px] font-mono text-brand-600">{r.kind}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <span className="font-semibold block">{r.joiner_name}</span>
                    <span className="text-[11px] text-slate-400">{r.joiner_role} • {r.joiner_location}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {r.due_date}
                  </td>
                  <td className="py-3.5 px-4">
                    {r.dependencies_met ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Fulfill
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {r.blocked_reason || 'Waiting on HR record'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/it/requests/${r.id}`}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    >
                      Open
                    </Link>
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

