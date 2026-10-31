import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Shield,
  Laptop,
  Compass,
  Bot,
  User,
  Users,
  FileCheck,
  UploadCloud,
  Sliders,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  History,
  Calendar,
  Layers,
  Settings,
  Database
} from 'lucide-react';
import { UserRole } from '../auth/AuthContext';

export interface NavItem {
  title: string;
  path: string;
  icon: any;
  badge?: number;
}

export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  EMPLOYEE: [
    { title: 'My Onboarding', path: '/me', icon: LayoutDashboard },
    { title: 'Checklist', path: '/me/checklist', icon: CheckSquare },
    { title: 'Documents', path: '/me/documents', icon: FileText },
    { title: 'Policies', path: '/me/policies', icon: Shield },
    { title: 'Equipment & Access', path: '/me/it-setup', icon: Laptop },
    { title: 'First-Day Guide', path: '/me/first-day', icon: Compass },
    { title: 'Ask AI Assistant', path: '/me/assistant', icon: Bot },
    { title: 'My Profile', path: '/me/profile', icon: User }
  ],
  HR_ADMIN: [
    { title: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
    { title: 'Joiners', path: '/hr/joiners', icon: Users },
    { title: 'Document Reviews', path: '/hr/reviews', icon: FileCheck },
    { title: 'Data Ingestion', path: '/hr/ingest', icon: UploadCloud },
    { title: 'Rules', path: '/hr/rules', icon: Sliders },
    { title: 'Policies', path: '/hr/policies', icon: Shield },
    { title: 'Owners & Escalation', path: '/hr/owners', icon: Users },
    { title: 'Escalations', path: '/hr/escalations', icon: AlertTriangle },
    { title: 'Employee Questions', path: '/hr/followups', icon: HelpCircle },
    { title: 'Metrics', path: '/hr/metrics', icon: BarChart3 },
    { title: 'Audit Trail', path: '/hr/audit', icon: History }
  ],
  HR_REVIEWER: [
    { title: 'Dashboard', path: '/review/dashboard', icon: LayoutDashboard },
    { title: 'Review Queue', path: '/review/queue', icon: FileCheck },
    { title: 'Decisions History', path: '/review/history', icon: History }
  ],
  IT_ADMIN: [
    { title: 'Dashboard', path: '/it/dashboard', icon: LayoutDashboard },
    { title: 'Provisioning Requests', path: '/it/requests', icon: Laptop },
    { title: 'Joining Calendar', path: '/it/calendar', icon: Calendar },
    { title: 'Catalogue', path: '/it/catalogue', icon: Layers }
  ],
  SYSTEM_ADMIN: [
    { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Users & Access', path: '/admin/users', icon: Users },
    { title: 'Settings', path: '/admin/settings', icon: Settings },
    { title: 'Search & AI (RAG)', path: '/admin/rag', icon: Bot },
    { title: 'Audit Log', path: '/admin/audit', icon: History },
    { title: 'Data Tools', path: '/admin/data', icon: Database }
  ]
};

