import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { Shield, RefreshCw, Upload, CheckCircle2, BookOpen } from 'lucide-react';

export const PoliciesCatalog: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [reindexing, setReindexing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = async () => {
    try {
      const data = await apiRequest('/policies');
      setPolicies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleReindexAll = async () => {
    setReindexing(true);
    try {
      await apiRequest('/rag/reindex-all', { method: 'POST' });
      alert('All policies re-indexed into Elasticsearch hybrid index successfully!');
      fetchPolicies();
    } catch (err: any) {
      alert(err.message || 'Re-indexing failed');
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-600" />
            <span>Policy Governance & RAG Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage approved organizational policies indexed into Elasticsearch for AI-grounded retrieval.
          </p>
        </div>

        <button
          onClick={handleReindexAll}
          disabled={reindexing}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${reindexing ? 'animate-spin' : ''}`} />
          <span>{reindexing ? 'Reindexing Elasticsearch...' : 'Reindex All in Elasticsearch'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Policy Code</th>
                <th className="py-3 px-4">Title & Description</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Indexing State</th>
                <th className="py-3 px-4">Digital Sign Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {policies.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {p.code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {p.title}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    v{p.version}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(p.audience || []).map((aud: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {aud}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Indexed ({p.chunks_count || 4} chunks)
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.requires_ack ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        Mandatory Sign-off
                      </span>
                    ) : (
                      <span className="text-slate-400">Reference Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

