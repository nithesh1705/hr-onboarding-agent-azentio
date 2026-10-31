import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { FileViewer } from '../../components/FileViewer';
import { ExtractionCompare } from '../../components/ExtractionCompare';
import { SendFollowupModal } from '../../components/SendFollowupModal';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

export const DocumentWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mailModalOpen, setMailModalOpen] = useState(false);

  const fetchDoc = async () => {
    if (!id) return;
    try {
      const data = await apiRequest(`/documents/${id}`);
      setDocument(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const handleDecision = async (
    decision: string,
    reason?: string,
    employeeMessage?: string,
    remarks?: string
  ) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await apiRequest(`/documents/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          reason,
          employee_message: employeeMessage,
          reviewer_remarks: remarks,
        }),
      });
      alert(`Decision recorded: ${decision}. Notifications dispatched.`);
      navigate('/review/queue');
    } catch (err: any) {
      alert(err.message || 'Review submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center">Loading verification workspace...</div>;
  if (!document) return <div className="py-20 text-center">Document not found.</div>;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/review/queue')}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Review Workspace: {document.title}</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                (Joiner: {document.joiner_name})
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled joining: <strong>{document.joining_date}</strong> • Location: <strong>{document.joiner_location}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMailModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Follow up with this joiner via Elastic connector email"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Follow-Up Mail</span>
          </button>
        </div>
      </div>

      {/* Split View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Document File Viewer */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Original Submitted Document
          </h3>
          <FileViewer
            fileUrl={document.file_url}
            fileName={document.file_name}
            mimeType={document.mime_type}
          />
        </div>

        {/* Right: Automated Extraction & Discrepancy Adjudication */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Extraction & Verification Panel
          </h3>
          <ExtractionCompare
            document={document}
            onDecision={handleDecision}
            loading={submitting}
          />
        </div>
      </div>

      {/* Follow-up Email Modal */}
      <SendFollowupModal
        isOpen={mailModalOpen}
        onClose={() => {
          setMailModalOpen(false);
          fetchDoc();
        }}
        joinerId={document.joiner_id}
        joinerName={document.joiner_name}
        defaultCategory="Verification"
      />
    </div>
  );
};

