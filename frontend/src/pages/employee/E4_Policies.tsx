import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Shield, BookOpen, CheckCircle, Download, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const Policies: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [joinerId, setJoinerId] = useState<string>('');
  const [joinerName, setJoinerName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [signing, setSigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const targetCode = searchParams.get('code');
  const targetId = searchParams.get('id');

  const fetchData = async () => {
    try {
      const joiner = await apiRequest('/joiners/me');
      setJoinerId(joiner.id);
      setJoinerName(joiner.full_name || 'Employee');
      const pols = await apiRequest(`/joiners/${joiner.id}/policies`);
      setPolicies(pols || []);

      if (pols && pols.length > 0) {
        let initialPolicy = pols[0];
        if (targetCode) {
          const match = pols.find((p: any) => p.code === targetCode);
          if (match) initialPolicy = match;
        } else if (targetId) {
          const match = pols.find((p: any) => p.id === targetId);
          if (match) initialPolicy = match;
        }
        setSelectedPolicy(initialPolicy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetCode, targetId]);

  const handleAcknowledge = async () => {
    if (!selectedPolicy || !agreed) return;
    setSigning(true);
    try {
      const statement = `I, ${joinerName}, digitally acknowledge and agree to abide by the obligations of ${selectedPolicy.title} (${selectedPolicy.code} v${selectedPolicy.version}) on ${new Date().toLocaleString()}.`;
      await apiRequest(`/joiners/${joinerId}/acknowledgements`, {
        method: 'POST',
        body: JSON.stringify({
          policy_id: selectedPolicy.id,
          signature_statement: statement,
        }),
      });

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setSelectedPolicy((prev: any) => ({
        ...prev,
        status: 'Acknowledged',
        acknowledged_at: nowStr,
      }));

      setPolicies((prev) =>
        prev.map((p) =>
          p.id === selectedPolicy.id
            ? { ...p, status: 'Acknowledged', acknowledged_at: nowStr }
            : p
        )
      );

      setSuccessMessage(`Policy "${selectedPolicy.title}" successfully acknowledged!`);
      setAckModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Acknowledgement failed');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-600" />
            <span>Policies & Digital Acknowledgements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review applicable organizational governance policies and complete mandatory compliance sign-offs.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Policy List */}
        <div className="space-y-3">
          {policies.map((p) => {
            const isSelected = selectedPolicy?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPolicy(p)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-50/60 dark:bg-brand-950/60 border-brand-300 dark:border-brand-800 shadow-sm ring-1 ring-brand-400/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {p.code} v{p.version}
                  </span>
                  <StatusBadge status={p.status} size="sm" />
                </div>
                <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 mt-2">
                  {p.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Due before {p.due_date}</span>
                  {p.requires_ack && (
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      Signature required
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Policy Reader & Sign Action */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[650px] overflow-hidden">
          {selectedPolicy ? (
            <>
              {/* Reader Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                    {selectedPolicy.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {selectedPolicy.title}
                  </h3>
                </div>
                <StatusBadge status={selectedPolicy.status} />
              </div>

              {/* Reader Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {selectedPolicy.status === 'Acknowledged' && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="text-[11px]">
                      <strong>Digitally Signed:</strong> Acknowledged on{' '}
                      {selectedPolicy.acknowledged_at || 'record'}. Your acceptance is logged in the corporate compliance registry.
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                  <strong>Policy Overview:</strong> Please review the organizational standards below before completing your digital acknowledgement.
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  1. Policy Principles & Obligations
                </h4>
                <p>
                  As an incoming employee of the organization, you agree to adhere to core compliance, integrity, and ethical standards.
                  All intellectual property, codebases, workflows, and customer data are strictly confidential and proprietary to the company.
                </p>

                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  2. Acceptable Use & Zero Trust Requirements
                </h4>
                <p>
                  Employees must protect credentials, activate Multi-Factor Authentication (MFA) across all company accounts, and never transfer
                  unauthorized code, tokens, or customer records to personal or unmanaged devices.
                </p>

                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  3. Audit & Compliance Adjudication
                </h4>
                <p>
                  Periodic internal audits verify adherence to this standard. Failure to comply with mandatory policies may result in access
                  revocation and formal disciplinary review.
                </p>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 font-mono text-[11px] mt-8 text-center text-slate-500">
                  --- End of Document {selectedPolicy.code} (v{selectedPolicy.version}) ---
                </div>
              </div>

              {/* Reader Footer Action */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {selectedPolicy.status === 'Acknowledged' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed on {selectedPolicy.acknowledged_at || 'record'}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pending digital signature
                    </span>
                  )}
                </span>

                {selectedPolicy.status !== 'Acknowledged' && (
                  <button
                    onClick={() => setAckModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Digital Acknowledge</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a policy to view content and complete sign-off.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {ackModalOpen && selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Confirm Digital Acknowledgement
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You are about to digitally sign <strong>{selectedPolicy.title}</strong> ({selectedPolicy.code} v{selectedPolicy.version}).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic">
              "I confirm that I have read, understood, and agree to abide by the guidelines and obligations outlined in this policy."
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                I agree that clicking <strong>Sign & Submit</strong> constitutes my legal electronic signature under company policy.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setAckModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledge}
                disabled={signing || !agreed}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{signing ? 'Signing...' : 'Sign & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
