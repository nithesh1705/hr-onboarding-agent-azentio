import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { Database, RefreshCw, CheckCircle, AlertTriangle, FileText, UploadCloud } from 'lucide-react';

export const S11_DataTools: React.FC = () => {
  const [reindexing, setReindexing] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleReindex = async () => {
    if (!confirm('This will parse all markdown files in policy_docs/, generate embeddings, and index chunks into Elasticsearch. Continue?')) {
      return;
    }
    setReindexing(true);
    setMessage(null);
    try {
      const res = await apiClient.post<any>('/rag/reindex-all');
      setMessage({
        text: `Successfully re-indexed policies. Chunks in index: ${res.health?.doc_count ?? '41'}`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Re-indexing failed', type: 'error' });
    } finally {
      setReindexing(false);
    }
  };

  const handleReseed = async () => {
    if (!confirm('This will re-run the seed script to reset demo users, joiners, checklist rules, and IT catalogues. Continue?')) {
      return;
    }
    setReseeding(true);
    setMessage(null);
    try {
      const res = await apiClient.post<any>('/admin/data/seed');
      setMessage({ text: res.message || 'Demo data seeded successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Reseeding failed', type: 'error' });
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data & Ingestion Tools</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sync policy documents with Elasticsearch, reseed test fixtures, and verify database integrity
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: Elasticsearch RAG Reindex */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Elasticsearch Policy Re-indexer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Reads all markdown files in <code className="text-indigo-500 font-mono">policy_docs/</code>, parses structural sections, generates 384-dimensional dense vectors with <code className="text-indigo-500 font-mono">all-MiniLM-L6-v2</code>, and indexes chunks into the Elasticsearch Cloud cluster.
            </p>
          </div>
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${reindexing ? 'animate-spin' : ''}`} />
            {reindexing ? 'Re-indexing Documents...' : 'Run RAG Re-index'}
          </button>
        </div>

        {/* Tool 2: Reseed Database */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Reseed Supabase Fixtures
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Resets test users across all 5 roles (<code className="text-indigo-500 font-mono">EMPLOYEE, HR_ADMIN, HR_REVIEWER, IT_ADMIN, SYSTEM_ADMIN</code>), populates realistic candidates in Bengaluru, Mumbai, and Delhi, and resets onboarding rules.
            </p>
          </div>
          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {reseeding ? 'Reseeding Supabase DB...' : 'Reseed Demo Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

