import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Filter,
  Send,
  HelpCircle,
  FileCheck
} from 'lucide-react';

export const HRDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [joiners, setJoiners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [department, setDepartment] = useState('All');
  const [location, setLocation] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = async () => {
    try {
      const [sumData, joinersData] = await Promise.all([
        apiRequest('/dashboard/summary'),
        apiRequest('/joiners'),
      ]);
      setSummary(sumData);
      setJoiners(joinersData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNudge = async (email: string, name: string) => {
    try {
      await apiRequest('/nudges', {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: email,
          recipient_name: name,
          body: `Hi ${name}, this is a gentle reminder to complete your pending onboarding requirements.`,
        }),
      });
      alert(`Nudge reminder sent to ${name}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to send nudge');
    }
  };

  const filteredJoiners = joiners.filter((j) => {
    const matchDept = department === 'All' || j.department === department;
    const matchLoc = location === 'All' || j.location === location;
    const matchStat = statusFilter === 'All' || j.status === statusFilter;
    return matchDept && matchLoc && matchStat;
  });

  if (loading) {
    return <div className="py-20 text-center">Loading HR dashboard...</div>;
  }

  const kpis = summary?.kpis || {};
  const atRisk = summary?.at_risk_joiners || [];
  const criticalPath = summary?.critical_path;
  const distribution = summary?.readiness_distribution || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Onboarding Progress Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time readiness visibility, early risk identification, and bottleneck resolution across departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/hr/joiners/new"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
          >
            + Add New Joiner
          </Link>
          <Link
            to="/hr/ingest"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          >
            Import CSV / Excel
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Active Joiners
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {kpis.total_joiners || 0}
          </div>
          <div className="text-[11px] text-slate-400">Across 3 regional hubs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Day-1 Ready
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {kpis.day1_ready || 0}
          </div>
          <div className="text-[11px] text-slate-400">All blocking items completed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
            At Risk Joiners
          </span>
          <div className="text-2xl font-black text-rose-600">
            {kpis.at_risk_count || 0}
          </div>
          <div className="text-[11px] text-slate-400">Joining soon with open blockers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
            Unreviewed Documents
          </span>
          <div className="text-2xl font-black text-blue-600">
            {summary?.unreviewed_docs_count || 0}
          </div>
          <div className="text-[11px] text-slate-400">
            <Link to="/hr/reviews" className="hover:underline text-brand-600">
              Open queue →
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Path & Readiness Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Path Bottleneck Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Critical Path Bottleneck</span>
          </div>

          {criticalPath ? (
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {criticalPath.task_title}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Blocks <span className="font-bold text-rose-600">{criticalPath.blocks_count} tasks</span> for{' '}
                <strong>{criticalPath.joiner_name}</strong>.
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Owner: {criticalPath.owner}</span>
                <span>Due: {criticalPath.due_date}</span>
              </div>
              <Link
                to={`/hr/joiners/${criticalPath.joiner_id}`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline"
              >
                <span>Jump to joiner record</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No critical blockers identified.</p>
          )}
        </div>

        {/* Readiness Distribution Chart (Bands) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span>Readiness Distribution</span>
            </h3>
            <span className="text-xs text-slate-400">Total Joiners: {joiners.length}</span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            {distribution.map((d: any, idx: number) => {
              const colors = ['bg-rose-500', 'bg-orange-500', 'bg-blue-500', 'bg-emerald-500'];
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1"
                >
                  <div className="text-xs font-semibold text-slate-500">{d.band}</div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {d.count}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[idx % colors.length]}`}
                      style={{ width: `${joiners.length > 0 ? (d.count / joiners.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* At-Risk Joiners Attention Table */}
      {atRisk.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-4 h-4" />
              <span>At-Risk Joiners (Joining Soon with Low Readiness)</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {atRisk.map((ar: any) => (
              <div key={ar.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {ar.name} ({ar.role} • {ar.location})
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Joining: {ar.joining_date} • Primary Block: <span className="text-rose-600 font-medium">{ar.main_blocker}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {ar.readiness_score}% Ready
                  </span>
                  <button
                    onClick={() => handleNudge(ar.email || 'employee@company.com', ar.name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Nudge Joiner</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Joiners Table with Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Active Onboarding Cohort
          </h3>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Analytics">Analytics</option>
              <option value="Finance">Finance</option>
            </select>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="All">All Locations</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Remote">Remote</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="All">All Statuses</option>
              <option value="Pre-joining">Pre-joining</option>
              <option value="Day-1 Ready">Day-1 Ready</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Joiner</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Readiness</th>
                <th className="py-3 px-4">Tasks Progress</th>
                <th className="py-3 px-4">Next Blocker</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJoiners.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4">
                    <Link
                      to={`/hr/joiners/${j.id}`}
                      className="font-bold text-brand-600 dark:text-brand-400 hover:underline block"
                    >
                      {j.full_name}
                    </Link>
                    <span className="text-slate-400 text-[11px]">{j.email}</span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <span className="font-medium block">{j.role}</span>
                    <span className="text-slate-400 text-[11px]">{j.department}</span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {j.location}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-slate-200">
                    {j.joining_date}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{j.readiness_score}%</span>
                      <StatusBadge status={j.status} size="sm" />
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-emerald-600 font-semibold">
                      {j.task_counts?.completed || 0}
                    </span>
                    <span className="text-slate-400"> / {j.task_counts?.total || 0} done</span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {j.next_blocker || 'None'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/hr/joiners/${j.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <ArrowRight className="w-4 h-4 inline" />
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

