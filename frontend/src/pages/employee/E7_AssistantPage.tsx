import React from 'react';
import { AssistantPanel } from '../../components/AssistantPanel';

export const AssistantPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Onboarding AI Assistant
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ask questions about documents, joining schedule, equipment, and office arrival guidelines.
        </p>
      </div>

      <AssistantPanel />
    </div>
  );
};

