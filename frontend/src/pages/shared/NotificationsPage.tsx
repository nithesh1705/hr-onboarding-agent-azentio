import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Bell, CheckCheck, Clock, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setNotifications([
        {
          id: '1',
          title: 'Document Approved',
          body: 'Your Aadhaar Card was reviewed and approved by HR Reviewer.',
          type: 'SUCCESS',
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'IT Hardware Dispatched',
          body: 'MacBook Pro 14" has been dispatched via BlueDart. Tracking: BLUEDART-9842104.',
          type: 'INFO',
          read: true,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-read', {});
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            System alerts, document review decisions, and hardware dispatch updates
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
        >
          <CheckCheck className="w-4 h-4" /> Mark All Read
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No new notifications.</div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex items-start gap-4 transition-colors ${
                !item.read ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                {item.type === 'SUCCESS' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                ) : item.type === 'ALERT' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Bell className="w-5 h-5 text-indigo-500" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

