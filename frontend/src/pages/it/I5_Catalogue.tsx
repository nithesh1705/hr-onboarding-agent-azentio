import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Laptop, Key, Plus, Shield, Search } from 'lucide-react';

export const I5_Catalogue: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'HARDWARE' | 'SOFTWARE' | 'ROLE_BUNDLE'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const fetchCatalogue = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/provisioning/catalogue');
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(item => {
    if (filter !== 'ALL' && item.category !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) &&
        !item.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">IT Service Catalogue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Standard hardware profiles, software licenses, and role-based access bundles
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['ALL', 'HARDWARE', 'SOFTWARE', 'ROLE_BUNDLE'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Items' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalogue..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading catalogue...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          No catalogue items found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {item.category === 'HARDWARE' ? <Laptop className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {item.code}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{item.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                  {item.description || 'Standard profile specification'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Lead time: {item.lead_time_days || 5} days</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

