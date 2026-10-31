import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { Search, Cpu, CheckCircle2, XCircle, ArrowRight, Layers, Sliders } from 'lucide-react';

export const S7_SearchAI: React.FC = () => {
  const [query, setQuery] = useState('Which documents do I need to submit before joining?');
  const [role, setRole] = useState('EMPLOYEE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<any>(`/rag/debug/search?q=${encodeURIComponent(query)}&as_role=${role}`);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Search execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">RAG Hybrid Search Inspector</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Inspect BM25 keyword matching, dense vector cosine similarity, and Reciprocal Rank Fusion (RRF)
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSearch} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Test Policy Query</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Can I submit a colour photocopy of my PAN card?"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-xs font-medium text-slate-500 mb-1">Simulate RBAC Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="HR_ADMIN">HR_ADMIN</option>
              <option value="HR_REVIEWER">HR_REVIEWER</option>
              <option value="IT_ADMIN">IT_ADMIN</option>
              <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
            </select>
          </div>
          <div className="sm:self-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Evaluating...' : 'Run Hybrid Search'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Gate Status Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            result.gate_passed
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              {result.gate_passed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
              )}
              <div>
                <div className="font-semibold text-sm">
                  Confidence Gate: {result.gate_passed ? 'PASSED (Answer Generated)' : 'REFUSAL TRIGGERED'}
                </div>
                <div className="text-xs opacity-90">
                  Best Vector Similarity: <span className="font-mono font-bold">{(result.best_vector_score ?? 0).toFixed(4)}</span> (Threshold: 0.65) • Best BM25: <span className="font-mono font-bold">{(result.best_bm25_score ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-medium px-3 py-1 rounded bg-white/70 dark:bg-black/30 self-start sm:self-auto">
              {result.overlap_chunk_ids?.length || 0} chunk(s) in both BM25 & Dense
            </div>
          </div>

          {/* Three Column Comparison: BM25 vs Dense Vector vs Fused RRF */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: BM25 Keyword Hits */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 font-semibold text-sm text-slate-800 dark:text-slate-200">
                <Search className="w-4 h-4 text-blue-500" />
                BM25 Candidates ({result.bm25_candidates?.length || 0})
              </div>
              <div className="space-y-2">
                {result.bm25_candidates?.map((hit: any, i: number) => (
                  <div key={i} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono font-medium text-slate-700 dark:text-slate-300">
                      <span>#{i + 1} {hit.policy_code}</span>
                      <span className="text-blue-600 dark:text-blue-400">BM25: {hit.score?.toFixed(2)}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] font-medium">{hit.section}</div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                      "{hit.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Vector Hits */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 font-semibold text-sm text-slate-800 dark:text-slate-200">
                <Cpu className="w-4 h-4 text-purple-500" />
                Dense kNN Candidates ({result.vector_candidates?.length || 0})
              </div>
              <div className="space-y-2">
                {result.vector_candidates?.map((hit: any, i: number) => (
                  <div key={i} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono font-medium text-slate-700 dark:text-slate-300">
                      <span>#{i + 1} {hit.policy_code}</span>
                      <span className="text-purple-600 dark:text-purple-400">Cosine: {hit.score?.toFixed(4)}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] font-medium">{hit.section}</div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                      "{hit.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Fused Top Results */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 font-semibold text-sm text-slate-800 dark:text-slate-200">
                <Layers className="w-4 h-4 text-emerald-500" />
                RRF Fused Ranking ({result.fused_results?.length || 0})
              </div>
              <div className="space-y-2">
                {result.fused_results?.map((hit: any, i: number) => (
                  <div key={i} className={`p-3 bg-white dark:bg-slate-900 rounded-lg border text-xs space-y-1 ${
                    hit.in_both
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between font-mono font-medium text-slate-800 dark:text-slate-200">
                      <span>Rank {i + 1}: {hit.policy_code}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">RRF: {hit.fused_score?.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{hit.section}</span>
                      {hit.in_both && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Dual-Leg Match
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                      {hit.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

