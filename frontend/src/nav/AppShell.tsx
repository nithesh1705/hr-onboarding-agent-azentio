import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Bot } from 'lucide-react';
import { AssistantPanel } from '../components/AssistantPanel';
import { useAuth } from '../auth/AuthContext';

export const AppShell: React.FC = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <TopBar
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          collapsed={collapsed}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Grounded Assistant Widget — EXCLUSIVELY FOR NEW JOINERS (EMPLOYEE) */}
      {user?.role === 'EMPLOYEE' && (
        <div className="fixed bottom-6 right-6 z-50">
          {assistantOpen ? (
            <div className="relative animate-in fade-in slide-in-from-bottom-5 duration-200">
              <AssistantPanel floating onClose={() => setAssistantOpen(false)} />
            </div>
          ) : (
            <button
              onClick={() => setAssistantOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xl hover:shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Bot className="w-5 h-5" />
              <span className="hidden sm:inline">Ask AI Assistant</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

