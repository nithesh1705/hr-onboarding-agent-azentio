import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { AssistantPanel } from '../../components/AssistantPanel';
import { Bot, User } from 'lucide-react';

export const HRAssistant: React.FC = () => {
  const [joiners, setJoiners] = useState<any[]>([]);
  const [selectedJoinerId, setSelectedJoinerId] = useState<string>('');

  useEffect(() => {
    apiRequest('/joiners')
      .then((data) => {
        setJoiners(data || []);
        if (data && data.length > 0) {
          setSelectedJoinerId(data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bot className="w-6 h-6 text-brand-600" />
            <span>HR Policy & Onboarding Guidance Assistant</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Retrieve answers from employee-facing and HR-internal policies with role-aware grounded RAG citations.
          </p>
        </div>

        {/* Joiner Scope Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <User className="w-4 h-4 text-slate-400 ml-1" />
          <span className="text-slate-500 font-medium">Scope for Joiner:</span>
          <select
            value={selectedJoinerId}
            onChange={(e) => setSelectedJoinerId(e.target.value)}
            className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400"
          >
            {joiners.map((j) => (
              <option key={j.id} value={j.id}>
                {j.full_name} ({j.role} - {j.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      <AssistantPanel joinerId={selectedJoinerId} />
    </div>
  );
};

