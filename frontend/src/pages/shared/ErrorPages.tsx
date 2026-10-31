import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, HelpCircle, AlertOctagon } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
        The onboarding page or resource you are looking for does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        Return to Home
      </Link>
    </div>
  );
};

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">403 - Access Restricted</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
        Your active role does not have authorization to view this section under the RBAC policy specifications. Use the Demo Quick-Switch in the top navigation to switch roles.
      </p>
      <Link
        to="/"
        className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        Go to Role Workspace
      </Link>
    </div>
  );
};

