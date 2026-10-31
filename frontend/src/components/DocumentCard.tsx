import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  History,
  CheckCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiRequest } from '../api/client';

export interface DocumentItem {
  id: string;
  doc_type: string;
  title: string;
  required_rule_code: string;
  status: string;
  file_url?: string;
  file_name?: string;
  version: number;
  rejection_reason?: string;
  employee_message?: string;
  extracted_values?: Record<string, any>;
  mismatches?: Array<any>;
  due_date: string;
  history?: Array<any>;
}

interface DocumentCardProps {
  doc: DocumentItem;
  joinerId: string;
  onUploaded?: () => void;
  readOnly?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  joinerId,
  onUploaded,
  readOnly = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setErrorMsg('');

    // Client-side format check
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      setErrorMsg('Unsupported format. Only PDF, JPG, and PNG files are accepted.');
      return;
    }

    // Client-side size check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds 10 MB limit. Please compress or choose a smaller file.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', doc.doc_type);

    try {
      await apiRequest(`/joiners/${joinerId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (onUploaded) onUploaded();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isAccepted = doc.status === 'Accepted';
  const hasMismatches = doc.mismatches && doc.mismatches.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
              {doc.title}
            </h4>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              v{doc.version}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rule: {doc.required_rule_code} | Due: {doc.due_date}
          </p>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Rejection / Correction Alert Banner */}
      {doc.status === 'Correction Requested' && doc.employee_message && (
        <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="text-xs text-orange-800 dark:text-orange-200">
            <span className="font-bold block">Correction Required:</span>
            {doc.employee_message}
          </div>
        </div>
      )}

      {/* Extracted Values Preview */}
      {doc.extracted_values && Object.keys(doc.extracted_values).length > 0 && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>What we read from your document:</span>
            {hasMismatches ? (
              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Discrepancy detected
              </span>
            ) : (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified clean
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
            {doc.extracted_values.full_name && (
              <div>
                <span className="text-slate-400 block text-[10px]">Name:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {doc.extracted_values.full_name}
                </span>
              </div>
            )}
            {doc.extracted_values.expiry_date && (
              <div>
                <span className="text-slate-400 block text-[10px]">Expiry Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {doc.extracted_values.expiry_date}
                </span>
              </div>
            )}
            {doc.extracted_values.document_number && (
              <div>
                <span className="text-slate-400 block text-[10px]">Doc Number:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {doc.extracted_values.document_number}
                </span>
              </div>
            )}
            {doc.extracted_values.document_category && (
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">AI Classification:</span>
                <span className="font-medium text-brand-600 dark:text-brand-400 block">
                  {doc.extracted_values.document_category} {doc.extracted_values.issuing_authority ? `• ${doc.extracted_values.issuing_authority}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Info & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-xs text-slate-500">
          {doc.file_name ? (
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-brand-600" />
              <span className="truncate max-w-[200px]">{doc.file_name}</span>
            </div>
          ) : (
            <span>PDF, JPG or PNG up to 10 MB</span>
          )}
        </div>

        {!readOnly && !isAccepted && (
          <div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors">
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Processing OCR...' : doc.file_url ? 'Replace Document' : 'Upload File'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={uploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

