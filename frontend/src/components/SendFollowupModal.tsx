import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Mail,
  Send,
  X,
  Sparkles,
  FileText,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';

interface SendFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinerId: string;
  joinerName: string;
  joinerEmail?: string;
  defaultCategory?: string; // e.g. "Verification" if from reviewer workspace
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  message: string;
}

export const SendFollowupModal: React.FC<SendFollowupModalProps> = ({
  isOpen,
  onClose,
  joinerId,
  joinerName,
  joinerEmail = '',
  defaultCategory
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [primaryEmail, setPrimaryEmail] = useState<string>(joinerEmail);
  const [toEmail, setToEmail] = useState<string>(joinerEmail);
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !joinerId) return;

    setLoadingTemplates(true);
    setError(null);
    setSuccessResult(null);

    apiRequest(`/followups/templates?joiner_id=${joinerId}`)
      .then((data) => {
        const tList: EmailTemplate[] = data.templates || [];
        setTemplates(tList);
        const resolvedPrimary = data.joiner_email || joinerEmail || '';
        setPrimaryEmail(resolvedPrimary);
        setToEmail(resolvedPrimary);

        // Pick preferred template (e.g. correction notice if reviewer workspace, or document reminder)
        let initial = tList[0];
        if (defaultCategory === 'Verification') {
          const correctionTpl = tList.find((t) => t.id === 'doc_correction');
          if (correctionTpl) initial = correctionTpl;
        }
        if (initial) {
          setSelectedTemplateId(initial.id);
          setSubject(initial.subject);
          setMessage(initial.message);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load pre-filled templates.');
      })
      .finally(() => {
        setLoadingTemplates(false);
      });
  }, [isOpen, joinerId, defaultCategory]);

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const chosen = templates.find((t) => t.id === tplId);
    if (chosen) {
      setSubject(chosen.subject);
      setMessage(chosen.message);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !message.trim()) {
      setError('Recipient email, subject, and message are required.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await apiRequest('/followups/send-email', {
        method: 'POST',
        body: JSON.stringify({
          joiner_id: joinerId,
          to_email: toEmail,
          subject: subject,
          message: message,
          template_id: selectedTemplateId
        })
      });

      setSuccessResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch email via Elastic connector.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Send Follow-Up Email
              </h3>
              <p className="text-xs text-slate-500">
                Recipient: <strong className="text-slate-700 dark:text-slate-300">{joinerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Elastic Connector: hr-onboarding
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {successResult ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Follow-Up Email Dispatched!
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {successResult.message}
              </p>
            </div>
            {successResult.message_id && (
              <div className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Message ID: {successResult.message_id}
              </div>
            )}
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
              >
                Close & Return to Employee Record
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Template Selector Tabs */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Select Follow-Up Template (Auto-populated with Employee Data)</span>
                {loadingTemplates && <span className="text-brand-600 lowercase font-normal flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> loading...</span>}
              </label>

              <div className="flex flex-wrap gap-1.5">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateChange(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      selectedTemplateId === t.id
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Input (Primary / Alternate Email) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Recipient Email
                  </label>
                  {toEmail !== primaryEmail && primaryEmail ? (
                    <button
                      type="button"
                      onClick={() => setToEmail(primaryEmail)}
                      className="text-[10px] text-brand-600 hover:underline font-semibold"
                    >
                      Reset to primary
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">Primary / Alternate</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    required
                    placeholder="Enter primary or alternate email id..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {toEmail !== primaryEmail ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Sending to alternate email address
                    </span>
                  ) : (
                    <span>Pre-filled with employee default email. Edit to send to an alternate ID.</span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="Subject line"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-slate-400">
                  Personalized subject automatically populated from chosen template.
                </p>
              </div>
            </div>

            {/* Email Body Message */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Message Content (Editable)
                </label>
                <span className="text-[10px] text-slate-400">
                  Formatted for clean plain text delivery
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={9}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-brand-500 resize-y"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Audited in compliance timeline</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || loadingTemplates}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending via Elastic...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Follow-Up Mail</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

