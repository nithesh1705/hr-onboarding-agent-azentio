import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { ChecklistTable, TaskItem } from '../../components/ChecklistTable';
import { Download, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Checklist: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const joiner = await apiRequest('/joiners/me');
      const data = await apiRequest(`/joiners/${joiner.id}/tasks`);
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAction = (actionType: string, task: TaskItem) => {
    if (actionType === 'upload') {
      navigate('/me/documents');
    } else if (actionType === 'acknowledge') {
      const code = task.linked_policy_code || (task.rule_code === 'SEC-ACK-01' ? 'SEC-POL-001' : '');
      if (code) {
        navigate(`/me/policies?code=${code}`);
      } else {
        navigate('/me/policies');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-brand-600" />
            <span>My Onboarding Checklist</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete all required pre-joining tasks and track responsible department owners.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" />
        </div>
      ) : (
        <ChecklistTable
          tasks={tasks}
          onAction={handleAction}
          onRefresh={fetchTasks}
        />
      )}
    </div>
  );
};

