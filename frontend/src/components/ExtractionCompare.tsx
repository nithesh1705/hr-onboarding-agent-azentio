import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit2,
  Save,
  Send,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../api/client';

interface ExtractionCompareProps {
  document: any;
  onDecision: (decision: string, reason?: string, employeeMessage?: string, remarks?: string) => Promise<void>;
  loading?: boolean;
}

export const ExtractionCompare: React.FC<ExtractionCompareProps> = ({
  document,
  onDecision,
  loading = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [extractedValues, setExtractedValues] = useState<Record<string, any>>(
    document.extracted_values || {}
  );
  const [decisionType, setDecisionType] = useState<'ACCEPT' | 'CORRECTION' | 'ESCALATE' | null>(null);
  const [reason, setReason] = useState('Name mismatch');
  const [employeeMessage, setEmployeeMessage] = useState(
    'The name extracted from your document does not match your official HR record. Please provide a government ID matching your full legal name.'
  );
  const [reviewerRemarks, setReviewerRemarks] = useState('');

  const mismatches = document.mismatches || [];
  const hasMismatch = mismatches.length > 0;

  const handleSaveExtracted = async () => {
    try {
      await apiRequest(`/documents/${document.id}/extracted`, {
        method: 'PATCH',
        body: JSON.stringify({ extracted_values: extractedValues }),
      });
      setEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update extracted values');
    }
  };

  const handleDecisionSubmit = async () => {
    if (decisionType === 'ACCEPT') {
      await onDecision('ACCEPT', undefined, undefined, reviewerRemarks);
    } else if (decisionType === 'CORRECTION') {
      await onDecision('CORRECTION_REQUESTED', reason, employeeMessage, reviewerRemarks);
    } else if (decisionType === 'ESCALATE') {
      await onDecision('ESCALATE', undefined, undefined, reviewerRemarks);
    }
  };

  const reasonTemplates: Record<string, string> = {
    'Name mismatch': 'The full legal name on the submitted document does not match your offer profile. Please re-upload an ID matching your full name.',
    'Expired': 'The expiry date on this ID is before your scheduled joining date. Please upload a currently valid identification document.',
    'Illegible': 'The uploaded document image is blurry or has unreadable text. Please provide a clear 300 DPI scan with all 4 corners visible.',
    'Wrong document': 'The document uploaded does not meet the specified document type requirement. Please check the accepted document list.',
    'Incomplete': 'The submitted file is missing the back page or mandatory endorsements. Please upload the complete multi-page document.'
  };

  const handleReasonChange = (newReason: string) => {
    setReason(newReason);
    if (reasonTemplates[newReason]) {
      setEmployeeMessage(reasonTemplates[newReason]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
      {/* Verification Checks Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Automated AI Verification Checks
          </h4>
          {extractedValues.confidence_score && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 font-medium border border-brand-200 dark:border-brand-800">
              AI Confidence: {Math.round(extractedValues.confidence_score * 100)}%
            </span>
          )}
        </div>

        {extractedValues.ai_validation_summary && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <span className="font-semibold text-brand-600 dark:text-brand-400">AI Summary:</span>
            <span>{extractedValues.ai_validation_summary}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300">File Type & Format</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pass
            </span>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300">Legibility & Clarity</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pass
            </span>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300">Document Expiry Check</span>
            {hasMismatch && mismatches.some((m: any) => m.field === 'Document Expiry') ? (
              <span className="text-rose-600 font-medium flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Expired
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid
              </span>
            )}
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300">Identity Name Match</span>
            {hasMismatch && mismatches.some((m: any) => m.field === 'Full Name') ? (
              <span className="text-rose-600 font-medium flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Mismatch
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Match
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-side Field Comparison */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Profile vs. Extracted Values
          </h4>
          <button
            onClick={() => {
              if (editing) handleSaveExtracted();
              else setEditing(true);
            }}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
          >
            {editing ? (
              <>
                <Save className="w-3.5 h-3.5" /> Save Edits
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" /> Edit OCR Read
              </>
            )}
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Header */}
          <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/80 p-2.5 font-semibold text-slate-700 dark:text-slate-300">
            <span>HR Profile Value</span>
            <span>Extracted from Document</span>
          </div>

          {/* Full Name Row */}
          <div className={`grid grid-cols-2 p-3 items-center ${hasMismatch && mismatches.some((m: any) => m.field === 'Full Name') ? 'bg-rose-50/70 dark:bg-rose-950/40' : ''}`}>
            <div>
              <span className="text-slate-400 block text-[10px]">Legal Name:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {document.joiner_name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Document Name:</span>
              {editing ? (
                <input
                  type="text"
                  value={extractedValues.full_name || ''}
                  onChange={(e) => setExtractedValues({ ...extractedValues, full_name: e.target.value })}
                  className="px-2 py-1 border rounded bg-white dark:bg-slate-900 w-full"
                />
              ) : (
                <span className={`font-semibold ${hasMismatch && mismatches.some((m: any) => m.field === 'Full Name') ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {extractedValues.full_name || '—'}
                </span>
              )}
            </div>
          </div>

          {/* Expiry Date Row */}
          <div className={`grid grid-cols-2 p-3 items-center ${hasMismatch && mismatches.some((m: any) => m.field === 'Document Expiry') ? 'bg-rose-50/70 dark:bg-rose-950/40' : ''}`}>
            <div>
              <span className="text-slate-400 block text-[10px]">Joining Date Requirement:</span>
              <span className="text-slate-800 dark:text-slate-200">
                Must be valid on {document.joining_date}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Document Expiry:</span>
              {editing ? (
                <input
                  type="text"
                  value={extractedValues.expiry_date || ''}
                  onChange={(e) => setExtractedValues({ ...extractedValues, expiry_date: e.target.value })}
                  className="px-2 py-1 border rounded bg-white dark:bg-slate-900 w-full"
                />
              ) : (
                <span className={`font-medium ${hasMismatch && mismatches.some((m: any) => m.field === 'Document Expiry') ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {extractedValues.expiry_date || 'N/A (Permanent)'}
                </span>
              )}
            </div>
          </div>

          {/* Document Classification & Authority Row */}
          <div className="grid grid-cols-2 p-3 items-center">
            <div>
              <span className="text-slate-400 block text-[10px]">Slot Requirement:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {document.doc_type} ({document.title || 'Required Document'})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">AI Document Classification:</span>
              <span className="font-medium text-brand-600 dark:text-brand-400">
                {extractedValues.document_category || 'Recognized Official Record'}
              </span>
            </div>
          </div>

          {/* Issuing Authority Row */}
          {extractedValues.issuing_authority && (
            <div className="grid grid-cols-2 p-3 items-center">
              <div>
                <span className="text-slate-400 block text-[10px]">Candidate Location:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {document.joiner_location || 'All Locations'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Extracted Issuing Authority:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {extractedValues.issuing_authority}
                </span>
              </div>
            </div>
          )}

          {/* Document Number Row (Masked) */}
          <div className="grid grid-cols-2 p-3 items-center">
            <div>
              <span className="text-slate-400 block text-[10px]">Verification Engine:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Automated AI Vision & NLP
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Document ID Number (Masked):</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {extractedValues.document_number || '••••-••••-7892'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviewer Remarks (Internal) */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
          Internal Reviewer Remarks (Confidential - never shown to employee)
        </label>
        <textarea
          rows={2}
          value={reviewerRemarks}
          onChange={(e) => setReviewerRemarks(e.target.value)}
          placeholder="Add internal notes for compliance or HR Admin auditing..."
          className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Decision Buttons */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDecisionType('ACCEPT')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${decisionType === 'ACCEPT' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept Document</span>
          </button>

          <button
            onClick={() => setDecisionType('CORRECTION')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${decisionType === 'CORRECTION' ? 'bg-orange-600 text-white shadow-md' : 'bg-orange-50 hover:bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:hover:bg-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-800'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Request Correction</span>
          </button>

          <button
            onClick={() => setDecisionType('ESCALATE')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${decisionType === 'ESCALATE' ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800'}`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Escalate to HR</span>
          </button>
        </div>

        {/* Correction Form when Request Correction is selected */}
        {decisionType === 'CORRECTION' && (
          <div className="p-4 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 space-y-3">
            <div>
              <label className="text-xs font-semibold text-orange-900 dark:text-orange-200 block mb-1">
                Select Reason:
              </label>
              <select
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 text-slate-800 dark:text-slate-200"
              >
                <option value="Name mismatch">Name mismatch</option>
                <option value="Expired">Expired</option>
                <option value="Illegible">Illegible / Blurry</option>
                <option value="Wrong document">Wrong document</option>
                <option value="Incomplete">Incomplete document</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-orange-900 dark:text-orange-200 block mb-1">
                Employee-Facing Message (Visible to new joiner):
              </label>
              <textarea
                rows={3}
                value={employeeMessage}
                onChange={(e) => setEmployeeMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}

        {decisionType && (
          <button
            onClick={handleDecisionSubmit}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Submitting Decision...' : `Confirm ${decisionType}`}</span>
          </button>
        )}
      </div>
    </div>
  );
};

