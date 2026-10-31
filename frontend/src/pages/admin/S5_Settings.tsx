import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Sliders, Save, CheckCircle } from 'lucide-react';

export const S5_Settings: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/admin/settings');
      setSettings(data);
    } catch (err) {
      console.error(err);
      // Fallback default settings
      setSettings([
        { key: 'RAG_SIMILARITY_THRESHOLD', value: '0.65', description: 'Minimum cosine similarity score required before policy refusal trigger' },
        { key: 'AUTO_ESCALATION_HOURS', value: '48', description: 'Hours of pending review before automatic follow-up and notification to HR team' },
        { key: 'IT_PROVISIONING_LEAD_DAYS', value: '5', description: 'Lead time in business days for hardware provisioning prior to joining date' },
        { key: 'DEFAULT_TIMEZONE', value: 'Asia/Kolkata', description: 'Default timezone for cohort scheduling and reminder nudges' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await apiClient.post('/admin/settings', settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (index: number, val: string) => {
    const updated = [...settings];
    updated[index].value = val;
    setSettings(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings & Policies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Global thresholds for RAG refusal, escalation timers, and lead times
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 self-start disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {success && (
        <div className="p-3 text-sm rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Configuration saved successfully.
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading settings...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {settings.map((item, idx) => (
            <div key={item.key} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                  {item.key}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.description || 'Configurable system threshold'}
                </p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  className="w-full px-3 py-1.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

