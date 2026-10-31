import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { Repeat, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const ChangePlan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [joiner, setJoiner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [step, setStep] = useState<1 | 2>(1);
  const [newDate, setNewDate] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [reason, setReason] = useState('Candidate requested extended notice period from previous company.');

  // Preview Result
  const [preview, setPreview] = useState<any>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiRequest(`/joiners/${id}`)
      .then((data) => {
        setJoiner(data);
        setNewDate(data.joining_date);
        setNewRole(data.role);
        setNewDepartment(data.department);
        setNewLocation(data.location);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const res = await apiRequest(`/joiners/${id}/change/preview`, {
        method: 'POST',
        body: JSON.stringify({
          new_joining_date: newDate,
          new_role: newRole,
          new_department: newDepartment,
          new_location: newLocation,
          reason,
        }),
      });
      setPreview(res);
      setStep(2);
    } catch (err: any) {
      alert(err.message || 'Failed to preview plan change');
    }
  };

  const handleApply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      await apiRequest(`/joiners/${id}/change/apply`, {
        method: 'POST',
        body: JSON.stringify({
          new_joining_date: newDate,
          new_role: newRole,
          new_department: newDepartment,
          new_location: newLocation,
          reason,
        }),
      });
      alert('Plan change applied successfully! All dependent task deadlines have been recalculated.');
      navigate(`/hr/joiners/${id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to apply plan change');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="py-20 text-center">Loading plan details...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Repeat className="w-6 h-6 text-amber-500" />
          <span>Scenario 4: Change Onboarding Plan for {joiner.full_name}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Safely postpone or advance joining dates, revise roles, and automatically recalculate dependent deadlines.
        </p>
      </div>

      {step === 1 ? (
        /* Step 1: Change Configuration Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Step 1: Choose New Parameters
          </h3>

          <form onSubmit={handlePreview} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Current: {joiner.joining_date}
                </span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Designated Role
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Department
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Location
                </label>
                <select
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Reason for Change (Mandatory - recorded in audit trail)
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify why the joining schedule or role is changing..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm flex items-center gap-2"
              >
                <span>Calculate & Preview Diff</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Step 2: Diff Preview & Confirmation */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Step 2: Review Recalculated Plan Impact
            </h3>
            <button
              onClick={() => setStep(1)}
              className="text-slate-500 hover:underline flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit
            </button>
          </div>

          {/* Warnings Banner */}
          {preview?.warnings && preview.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Notice on In-Flight Workflows:</span>
              </div>
              {preview.warnings.map((w: string, idx: number) => (
                <p key={idx} className="text-xs">{w}</p>
              ))}
            </div>
          )}

          {/* Summary counters */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Preserved Tasks</span>
              <span className="text-xl font-black text-emerald-600">{preview?.kept_count || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Recalculated Tasks</span>
              <span className="text-xl font-black text-blue-600">{preview?.updated_count || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Date</span>
              <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200 mt-1 block">
                {preview?.new_joining_date}
              </span>
            </div>
          </div>

          {/* Updated Tasks Table */}
          {preview?.updated_tasks && preview.updated_tasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Tasks with Recalculated Deadlines:
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {preview.updated_tasks.map((u: any) => (
                  <div key={u.id} className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{u.title}</div>
                      <div className="text-[11px] text-slate-400">Owner: {u.owner}</div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="line-through text-slate-400">{u.old_due_date}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                      <span className="font-bold text-brand-600 dark:text-brand-400">{u.new_due_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-500 text-xs">
              Employee and affected department owners will receive automated notification updates.
            </span>
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{applying ? 'Applying Changes...' : 'Confirm & Recalculate All'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

