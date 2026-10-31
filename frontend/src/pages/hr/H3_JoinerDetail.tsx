import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { ReadinessRing } from '../../components/ReadinessRing';
import { StatusBadge } from '../../components/StatusBadge';
import { ChecklistTable, TaskItem } from '../../components/ChecklistTable';
import { DocumentCard } from '../../components/DocumentCard';
import { SendFollowupModal } from '../../components/SendFollowupModal';
import {
  User,
  CheckSquare,
  FileText,
  Laptop,
  Shield,
  History,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Repeat,
  Plus,
  Send,
  Building,
  CheckCircle2,
  Mail
} from 'lucide-react';

export const JoinerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [joiner, setJoiner] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [provisioning, setProvisioning] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);

  // Manual Task modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualOwner, setManualOwner] = useState('Sarah Jenkins');
  const [manualEmail, setManualEmail] = useState('sarah.j@company.com');
  const [manualDueDate, setManualDueDate] = useState('');
  const [manualExplanation, setManualExplanation] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      const [jData, tData, dData, pData, polData, aData] = await Promise.all([
        apiRequest(`/joiners/${id}`),
        apiRequest(`/joiners/${id}/tasks`),
        apiRequest(`/joiners/${id}/documents`),
        apiRequest(`/provisioning?joiner_id=${id}`),
        apiRequest(`/joiners/${id}/policies`),
        apiRequest(`/admin/audit?actor_role=HR_ADMIN`),
      ]);
      setJoiner(jData);
      setTasks(tData || []);
      setDocuments(dData || []);
      setProvisioning(pData || []);
      setPolicies(polData || []);
      setAuditEvents((aData || []).filter((a: any) => a.joiner_id === id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateHRRecord = async () => {
    if (!id) return;
    try {
      const res = await apiRequest(`/joiners/${id}/profile/create`, { method: 'POST' });
      alert(res.message);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create HR record');
    }
  };

  const handleAddManualTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await apiRequest(`/joiners/${id}/tasks/manual`, {
        method: 'POST',
        body: JSON.stringify({
          title: manualTitle,
          owner_name: manualOwner,
          owner_email: manualEmail,
          due_date: manualDueDate || joiner.joining_date,
          why_explanation: manualExplanation || 'Manually assigned operational task by HR Admin.',
        }),
      });
      setManualModalOpen(false);
      setManualTitle('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add task');
    }
  };

  if (loading) {
    return <div className="py-20 text-center">Loading joiner record...</div>;
  }

  if (!joiner) {
    return <div className="text-center py-10">Joiner record not found.</div>;
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'checklist', label: `Checklist (${tasks.length})`, icon: CheckSquare },
    { key: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { key: 'provisioning', label: `IT Provisioning (${provisioning.length})`, icon: Laptop },
    { key: 'policies', label: `Policies (${policies.length})`, icon: Shield },
    { key: 'timeline', label: 'Audit Timeline', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Detail Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400">JOINER-{joiner.id.substring(0, 8)}</span>
            <StatusBadge status={joiner.status} />
            {joiner.hr_record_created && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Core HR Record Active
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {joiner.full_name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>{joiner.role} ({joiner.grade})</span>
            <span>•</span>
            <span>{joiner.department}</span>
            <span>•</span>
            <span>{joiner.location}</span>
            <span>•</span>
            <span>Joining Date: <strong>{joiner.joining_date}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ReadinessRing score={joiner.readiness_score} size={110} strokeWidth={9} />

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setMailModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all text-center justify-center cursor-pointer"
              title="Send follow-up email via Elastic connector"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Follow-Up Mail</span>
            </button>

            <Link
              to={`/hr/joiners/${joiner.id}/change`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 transition-all text-center justify-center"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Change Plan</span>
            </Link>

            {!joiner.hr_record_created && (
              <button
                onClick={handleCreateHRRecord}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Create HR Record</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Core Employee Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px]">Email:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{joiner.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{joiner.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Manager:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{joiner.manager_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Emergency Contact:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{joiner.emergency_contact || '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Scenario 2: Core HR Record Provisioning Trigger
                </h3>
                {joiner.hr_record_created ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Record Active in DB
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Ready to Create
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Creating the formal Core HR Record generates the employee ID and triggers downstream IT provisioning: unlocking Laptop dispatch and Google Workspace corporate email account creation.
              </p>
              {!joiner.hr_record_created && (
                <button
                  onClick={handleCreateHRRecord}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-2"
                >
                  <Building className="w-4 h-4" />
                  <span>Execute HR Record Creation & Unlock IT Provisioning</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Checklist Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed:</span>
                  <span className="font-bold text-emerald-600">{joiner.task_counts.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending:</span>
                  <span className="font-bold text-blue-600">{joiner.task_counts.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blocked:</span>
                  <span className="font-bold text-amber-600">{joiner.task_counts.blocked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Overdue:</span>
                  <span className="font-bold text-rose-600">{joiner.task_counts.overdue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setManualModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manual Task</span>
            </button>
          </div>
          <ChecklistTable tasks={tasks} onRefresh={fetchData} />
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              joinerId={joiner.id}
              onUploaded={fetchData}
            />
          ))}
        </div>
      )}

      {/* Tab 4: Provisioning */}
      {activeTab === 'provisioning' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            IT Asset Requests for {joiner.full_name}
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {provisioning.map((p) => (
              <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{p.item_name}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Kind: {p.kind} • Target Date: {p.due_date} • {p.dependencies_met ? 'Dependencies Met' : p.blocked_reason}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Policies */}
      {activeTab === 'policies' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Applicable Policies & Acknowledgement Audit
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {policies.map((pol) => (
              <div key={pol.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-brand-600 font-bold">{pol.code} v{pol.version}</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{pol.title}</div>
                </div>
                <StatusBadge status={pol.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Audit Trail for Joiner
          </h3>
          <div className="space-y-3">
            {auditEvents.length === 0 ? (
              <p className="text-slate-400">No audit events recorded yet.</p>
            ) : (
              auditEvents.map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>{a.action}</span>
                    <span className="text-slate-400 font-normal">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1">
                    Actor: {a.actor_name} ({a.actor_role}) • Trace ID: {a.trace_id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Manual Task Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Add Manual Task for {joiner.full_name}
            </h3>
            <form onSubmit={handleAddManualTask} className="space-y-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Relocation Allowance Sign-off"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={manualOwner}
                    onChange={(e) => setManualOwner(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={manualDueDate}
                    onChange={(e) => setManualDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Why is this task needed?</label>
                <textarea
                  rows={2}
                  value={manualExplanation}
                  onChange={(e) => setManualExplanation(e.target.value)}
                  placeholder="Explain why this task was manually added..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold text-white bg-brand-600 hover:bg-brand-700"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Email Modal powered by Elastic Connector */}
      <SendFollowupModal
        isOpen={mailModalOpen}
        onClose={() => {
          setMailModalOpen(false);
          fetchData();
        }}
        joinerId={joiner.id}
        joinerName={joiner.full_name}
        joinerEmail={joiner.email}
      />
    </div>
  );
};

