import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { HelpCircle, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const EmployeeQuestions: React.FC = () => {
  const [followups, setFollowups] = useState<any[]>([]);
  const [selectedFollowup, setSelectedFollowup] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFollowups = async () => {
    try {
      const data = await apiRequest('/followups');
      setFollowups(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleSendReply = async () => {
    if (!selectedFollowup || !replyText.trim()) return;
    setReplying(true);
    try {
      await apiRequest(`/followups/${selectedFollowup.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText }),
      });
      alert('Reply sent to employee notifications.');
      setSelectedFollowup(null);
      setReplyText('');
      fetchFollowups();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-brand-600" />
          <span>Employee Questions & Reported Inquiries</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Questions unresolved by the AI assistant and discrepancies flagged by employees.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden space-y-4">
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {followups.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              No open employee inquiries or policy gaps reported.
            </div>
          ) : (
            followups.map((f) => (
              <div key={f.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {f.joiner_name || 'Anonymous Employee'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${f.status === 'Open' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {f.status}
                    </span>
                    {f.is_policy_gap && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                        Policy Gap Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    "{f.text}"
                  </p>
                  {f.reply && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px]">
                      <strong>HR Reply:</strong> {f.reply}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => {
                      setSelectedFollowup(f);
                      setReplyText(f.reply || '');
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{f.status === 'Open' ? 'Reply to Employee' : 'Edit Reply'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {selectedFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Reply to {selectedFollowup.joiner_name}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              "{selectedFollowup.text}"
            </p>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Your Answer / Guidance:
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type response to deliver to the employee's notification feed..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedFollowup(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={replying}
                className="px-4 py-1.5 rounded-lg font-bold text-white bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{replying ? 'Sending...' : 'Send Reply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

