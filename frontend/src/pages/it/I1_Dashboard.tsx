import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Laptop, Clock, CheckCircle2, AlertTriangle, ArrowRight, Calendar } from 'lucide-react';

export const ITDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([apiRequest('/it/summary'), apiRequest('/provisioning')])
      .then(([sData, rData]) => {
        setSummary(sData);
        setRequests(rData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center">Loading IT dashboard...</div>;

  const readyRequests = requests.filter((r) => r.status === 'Requested' && r.dependencies_met);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Laptop className="w-6 h-6 text-brand-600" />
            <span>IT Asset & Access Provisioning Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate laptop imaging, Google Workspace SSO account creation, and role-based tool bundles.
          </p>
        </div>

        {readyRequests.length > 0 && (
          <button
            onClick={() => navigate(`/it/requests/${readyRequests[0].id}`)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <span>Fulfill Next Ready Request</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Ready to Fulfill</span>
          <div className="text-2xl font-black text-emerald-600">
            {summary?.ready_to_fulfill || 0}
          </div>
          <span className="text-[11px] text-slate-400">Core HR Record approved</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-amber-600 uppercase">Waiting on Upstream</span>
          <div className="text-2xl font-black text-amber-600">
            {summary?.waiting_on_dependencies || 0}
          </div>
          <span className="text-[11px] text-slate-400">Blocked until HR record creation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-blue-600 uppercase">In Progress</span>
          <div className="text-2xl font-black text-blue-600">
            {summary?.in_progress || 0}
          </div>
          <span className="text-[11px] text-slate-400">Imaging & Tagging</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase">Fulfilled This Week</span>
          <div className="text-2xl font-black text-indigo-600">
            {summary?.fulfilled_this_week || 0}
          </div>
          <span className="text-[11px] text-slate-400">Ready for Day 1 handover</span>
        </div>
      </div>

      {/* Do Next: Ready Provisioning Requests */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ready for Fulfillment (Dependencies Met)</span>
          </h3>
          <Link
            to="/it/requests"
            className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>View all requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {readyRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              No unfulfilled requests currently ready. New items will unlock when HR Admins create Core HR records.
            </div>
          ) : (
            readyRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {req.item_name}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Joiner: {req.joiner_name} ({req.joiner_role} • {req.joiner_location}) • Due: {req.due_date}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={req.status} size="sm" />
                  <Link
                    to={`/it/requests/${req.id}`}
                    className="px-3 py-1.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
                  >
                    Fulfill
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

