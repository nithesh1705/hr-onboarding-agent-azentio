import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Calendar as CalendarIcon, AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';

export const I6_Calendar: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/provisioning/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group requests by joining date
  const grouped = requests.reduce((acc: Record<string, any[]>, req) => {
    const d = req.joining_date || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(req);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">IT Fulfillment Calendar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Scheduled cohorts and hardware delivery deadlines by joining date
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading schedule...</div>
      ) : sortedDates.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          No scheduled joiners.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const cohort = grouped[date];
            const readyCount = cohort.filter((c) => c.status === 'DELIVERED').length;
            const blockedCount = cohort.filter((c) => c.status === 'BLOCKED_BY_PREJOIN').length;

            return (
              <div
                key={date}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Joining Date: {date}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cohort.length} new hire{cohort.length > 1 ? 's' : ''} scheduled
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {readyCount} Delivered
                    </span>
                    {blockedCount > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {blockedCount} Blocked by Docs
                      </span>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {cohort.map((req) => (
                    <div
                      key={req.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {req.joiner_name}
                          <span className="text-xs text-slate-400">({req.department})</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Profile: {req.laptop_tier || 'MacBook Pro'} • Readiness: {req.readiness_percentage}%
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={req.status} />
                        <Link
                          to={`/it/requests/${req.id}`}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded flex items-center gap-1"
                        >
                          Fulfill <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

