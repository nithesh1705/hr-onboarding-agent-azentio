import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Laptop, Mail, Key, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const Equipment: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/provisioning')
      .then((data) => setRequests(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const laptop = requests.find((r) => r.kind === 'LAPTOP');
  const email = requests.find((r) => r.kind === 'EMAIL');
  const access = requests.find((r) => r.kind === 'ACCESS');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Laptop className="w-6 h-6 text-brand-600" />
          <span>Equipment & IT Access</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track the status of your company laptop, Google Workspace email, and development tools access.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Laptop Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <StatusBadge status={laptop?.status || 'Waiting'} />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Workstation Hardware
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {laptop?.item_name || 'Standard Role-Allocated Laptop'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {laptop?.due_date || 'Day 1'}
                </span>
              </div>
              {laptop?.fulfilment_details?.asset_tag && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Asset Tag:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                    {laptop.fulfilment_details.asset_tag}
                  </span>
                </div>
              )}
              {laptop?.fulfilment_details?.serial && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Serial No:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {laptop.fulfilment_details.serial}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {laptop?.status === 'Waiting'
                  ? 'Starts automatically after HR creates your employee record.'
                  : 'Hardware imaged and prepared by IT Helpdesk.'}
              </span>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <StatusBadge status={email?.status || 'Waiting'} />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Corporate Email Account
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Google Workspace Enterprise SSO
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Email:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {email?.fulfilment_details?.email_created || email?.payload?.alias ? `${email?.payload?.alias}@company.com` : 'Pending Generation'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MFA Enforced:</span>
                <span className="font-semibold text-emerald-600">Yes (Hardware / App)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Login credentials will be sent to your personal email 24h prior to Day 1.</span>
            </div>
          </div>

          {/* Role Access Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <StatusBadge status={access?.status || 'Waiting'} />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Application Tool Bundles
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                GitHub Enterprise, Jira, Slack, AWS Dev Sandbox
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Access Prerequisites:
              </span>
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>InfoSec Policy Digital Sign-Off</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Background Verification Clearance</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Unlocked on Day 1 upon physical orientation check-in.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

