import React from 'react';
import { X, ExternalLink, BookOpen, ShieldCheck } from 'lucide-react';

export interface Citation {
  chunk_id: string;
  policy_code: string;
  title: string;
  section: string;
  page: number;
  snippet: string;
}

interface CitationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  isOpen,
  onClose,
  citation,
}) => {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Policy Citation
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-2">
                {citation.policy_code}
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {citation.title}
              </h4>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                Section: {citation.section}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Page {citation.page}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Approved Policy Chunk</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-mono text-xs whitespace-pre-wrap">
                {citation.snippet}
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-500">
              <span className="font-semibold">Chunk ID:</span> {citation.chunk_id}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

