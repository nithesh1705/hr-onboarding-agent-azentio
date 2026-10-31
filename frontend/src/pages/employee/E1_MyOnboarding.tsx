import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { apiRequest } from '../../api/client';
import { ReadinessRing } from '../../components/ReadinessRing';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Calendar,
  MapPin,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ShieldCheck,
  Mail,
  User,
  Bot
} from 'lucide-react';

export const MyOnboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [joiner, setJoiner] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const jData = await apiRequest('/joiners/me');
      setJoiner(jData);

      const [tData, dData] = await Promise.all([
        apiRequest(`/joiners/${jData.id}/tasks`),
        apiRequest(`/joiners/${jData.id}/documents`),
      ]);
      setTasks(tData || []);
      setDocuments(dData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!joiner) {
    return <div className="text-center py-10">No onboarding profile active.</div>;
  }

  // Days to joining calculation
  const today = new Date();
  const jDate = new Date(joiner.joining_date);
  const diffDays = Math.ceil((jDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Alerts
  const corrections = documents.filter((d) => d.status === 'Correction Requested');
  const pendingPolicies = tasks.filter((t) => t.category === 'Compliance' && t.status !== 'Completed');
  const overdueTasks = tasks.filter((t) => t.status === 'Overdue');

  // Next actions: not completed and not blocked
  const nextActions = tasks
    .filter((t) => t.status === 'Pending' || t.status === 'In Progress')
    .slice(0, 4);

  // Blocked waiting on others
  const blockedTasks = tasks.filter((t) => t.status === 'Blocked');

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {diffDays > 0 ? `${diffDays} days to go until Day One` : 'Welcome to your first day!'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome aboard, {joiner.full_name}!
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-brand-100">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 opacity-75" />
                {joiner.role} ({joiner.grade}) • {joiner.department}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 opacity-75" />
                {joiner.location} Campus
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 opacity-75" />
                Manager: {joiner.manager_name}
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
            <ReadinessRing score={joiner.readiness_score} size={110} strokeWidth={9} />
          </div>
        </div>
      </div>

      {/* Priority Action Banners */}
      {corrections.length > 0 && (
        <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/80 text-orange-600 dark:text-orange-300 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-orange-900 dark:text-orange-200">
                Action Required: {corrections.length} Document(s) Need Correction
              </h4>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                {corrections[0].employee_message || 'Please review reviewer remarks and upload an updated copy.'}
              </p>
            </div>
          </div>
          <Link
            to="/me/documents"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shrink-0 text-center transition-colors"
          >
            Fix Document Now
          </Link>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/me/checklist?status=Completed"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {joiner.task_counts.completed}
          </div>
        </Link>

        <Link
          to="/me/checklist?status=Pending"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {joiner.task_counts.pending}
          </div>
        </Link>

        <Link
          to="/me/checklist?status=Blocked"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Blocked
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {joiner.task_counts.blocked}
          </div>
        </Link>

        <Link
          to="/me/checklist?status=Overdue"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {joiner.task_counts.overdue}
          </div>
        </Link>
      </div>

      {/* Grid: Next Actions + Waiting on Others */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Actions (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Next Priority Actions
            </h3>
            <Link
              to="/me/checklist"
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View full checklist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {nextActions.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                All immediate onboarding actions are up to date!
              </div>
            ) : (
              nextActions.map((t) => (
                <div
                  key={t.id}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {t.title}
                    </div>
                    <div className="text-slate-500 flex items-center gap-2 text-[11px]">
                      <span>Due: {t.due_date}</span>
                      <span>•</span>
                      <span>Owner: {t.owner_name}</span>
                    </div>
                  </div>

                  <div>
                    {t.category === 'Document' ? (
                      <Link
                        to="/me/documents"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </Link>
                    ) : t.category === 'Compliance' ? (
                      <Link
                        to="/me/policies"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Sign</span>
                      </Link>
                    ) : (
                      <StatusBadge status={t.status} size="sm" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Waiting on Others & Contacts */}
        <div className="space-y-6">
          {/* Waiting on others */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Waiting on Downstream Steps</span>
            </h3>
            <div className="space-y-3 text-xs">
              {blockedTasks.length === 0 ? (
                <p className="text-slate-400">No blocked tasks.</p>
              ) : (
                blockedTasks.map((bt) => (
                  <div
                    key={bt.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {bt.title}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Starts automatically after prerequisite tasks are approved.
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Key Contacts Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Your Onboarding Support Team
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {joiner.manager_name}
                  </div>
                  <div className="text-[11px] text-slate-500">Reporting Manager</div>
                </div>
                <a
                  href={`mailto:${joiner.manager_email}`}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    People Operations Desk
                  </div>
                  <div className="text-[11px] text-slate-500">hr-ops@company.com</div>
                </div>
                <a
                  href="mailto:hr-ops@company.com"
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

