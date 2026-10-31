import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { AppShell } from './nav/AppShell';

// Auth & Shared
import { SignIn } from './pages/auth/SignIn';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { AccountPage } from './pages/shared/AccountPage';
import { NotFoundPage, UnauthorizedPage } from './pages/shared/ErrorPages';

// Employee Pages
import { MyOnboarding } from './pages/employee/E1_MyOnboarding';
import { Checklist } from './pages/employee/E2_Checklist';
import { Documents } from './pages/employee/E3_Documents';
import { Policies } from './pages/employee/E4_Policies';
import { Equipment } from './pages/employee/E5_Equipment';
import { FirstDay } from './pages/employee/E6_FirstDay';
import { AssistantPage } from './pages/employee/E7_AssistantPage';
import { Profile } from './pages/employee/E8_Profile';

// HR Admin Pages
import { HRDashboard } from './pages/hr/H1_Dashboard';
import { JoinersList } from './pages/hr/H2_Joiners';
import { JoinerDetail } from './pages/hr/H3_JoinerDetail';
import { AddJoiner } from './pages/hr/H4_AddJoiner';
import { ChangePlan } from './pages/hr/H5_ChangePlan';
import { Ingestion } from './pages/hr/H6_Ingest';
import { RequirementRules } from './pages/hr/H8_Rules';
import { HRReviews } from './pages/hr/H11_Reviews';
import { PoliciesCatalog } from './pages/hr/H12_Policies';
import { OwnersAndEscalation } from './pages/hr/H14_Owners';
import { Escalations } from './pages/hr/H15_Escalations';
import { EmployeeQuestions } from './pages/hr/H16_Followups';
import { Metrics } from './pages/hr/H18_Metrics';
import { AuditTrail } from './pages/hr/H19_Audit';

// Reviewer Pages
import { ReviewerDashboard } from './pages/reviewer/R1_Dashboard';
import { ReviewQueue } from './pages/reviewer/R2_Queue';
import { DocumentWorkspace } from './pages/reviewer/R3_Workspace';
import { ReviewHistory } from './pages/reviewer/R5_History';

// IT Admin Pages
import { ITDashboard } from './pages/it/I1_Dashboard';
import { ITRequests } from './pages/it/I2_Requests';
import { I3_RequestDetail } from './pages/it/I3_RequestDetail';
import { I5_Catalogue } from './pages/it/I5_Catalogue';
import { I6_Calendar } from './pages/it/I6_Calendar';

// System Admin Pages
import { S1_Dashboard } from './pages/admin/S1_Dashboard';
import { S2_Users } from './pages/admin/S2_Users';
import { S5_Settings } from './pages/admin/S5_Settings';
import { S7_SearchAI } from './pages/admin/S7_SearchAI';
import { S8_Audit } from './pages/admin/S8_Audit';
import { S11_DataTools } from './pages/admin/S11_DataTools';

interface GuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const RouteGuard: React.FC<GuardProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        Loading...
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }
  switch (user.role) {
    case 'EMPLOYEE':
      return <Navigate to="/me" replace />;
    case 'HR_ADMIN':
      return <Navigate to="/hr/dashboard" replace />;
    case 'HR_REVIEWER':
      return <Navigate to="/review/dashboard" replace />;
    case 'IT_ADMIN':
      return <Navigate to="/it/dashboard" replace />;
    case 'SYSTEM_ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/signin" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/login" element={<Navigate to="/signin" replace />} />

            {/* Authenticated Application Shell */}
            <Route
              path="/"
              element={
                <RouteGuard>
                  <AppShell />
                </RouteGuard>
              }
            >
              <Route index element={<RootRedirect />} />

              {/* Shared Routes */}
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="account" element={<AccountPage />} />

              {/* Employee Routes (matching NAV_CONFIG) */}
              <Route path="me" element={<RouteGuard allowedRoles={['EMPLOYEE']}><MyOnboarding /></RouteGuard>} />
              <Route path="me/checklist" element={<RouteGuard allowedRoles={['EMPLOYEE']}><Checklist /></RouteGuard>} />
              <Route path="me/documents" element={<RouteGuard allowedRoles={['EMPLOYEE']}><Documents /></RouteGuard>} />
              <Route path="me/policies" element={<RouteGuard allowedRoles={['EMPLOYEE']}><Policies /></RouteGuard>} />
              <Route path="me/it-setup" element={<RouteGuard allowedRoles={['EMPLOYEE']}><Equipment /></RouteGuard>} />
              <Route path="me/first-day" element={<RouteGuard allowedRoles={['EMPLOYEE']}><FirstDay /></RouteGuard>} />
              <Route path="me/assistant" element={<RouteGuard allowedRoles={['EMPLOYEE']}><AssistantPage /></RouteGuard>} />
              <Route path="me/profile" element={<RouteGuard allowedRoles={['EMPLOYEE']}><Profile /></RouteGuard>} />

              {/* HR Admin Routes */}
              <Route path="hr/dashboard" element={<RouteGuard allowedRoles={['HR_ADMIN']}><HRDashboard /></RouteGuard>} />
              <Route path="hr/joiners" element={<RouteGuard allowedRoles={['HR_ADMIN']}><JoinersList /></RouteGuard>} />
              <Route path="hr/joiners/new" element={<RouteGuard allowedRoles={['HR_ADMIN']}><AddJoiner /></RouteGuard>} />
              <Route path="hr/joiners/:id" element={<RouteGuard allowedRoles={['HR_ADMIN']}><JoinerDetail /></RouteGuard>} />
              <Route path="hr/add-joiner" element={<RouteGuard allowedRoles={['HR_ADMIN']}><AddJoiner /></RouteGuard>} />
              <Route path="hr/change-plan" element={<RouteGuard allowedRoles={['HR_ADMIN']}><ChangePlan /></RouteGuard>} />
              <Route path="hr/reviews" element={<RouteGuard allowedRoles={['HR_ADMIN']}><HRReviews /></RouteGuard>} />
              <Route path="hr/ingest" element={<RouteGuard allowedRoles={['HR_ADMIN']}><Ingestion /></RouteGuard>} />
              <Route path="hr/rules" element={<RouteGuard allowedRoles={['HR_ADMIN']}><RequirementRules /></RouteGuard>} />
              <Route path="hr/policies" element={<RouteGuard allowedRoles={['HR_ADMIN']}><PoliciesCatalog /></RouteGuard>} />
              <Route path="hr/owners" element={<RouteGuard allowedRoles={['HR_ADMIN']}><OwnersAndEscalation /></RouteGuard>} />
              <Route path="hr/escalations" element={<RouteGuard allowedRoles={['HR_ADMIN']}><Escalations /></RouteGuard>} />
              <Route path="hr/followups" element={<RouteGuard allowedRoles={['HR_ADMIN']}><EmployeeQuestions /></RouteGuard>} />
              <Route path="hr/metrics" element={<RouteGuard allowedRoles={['HR_ADMIN']}><Metrics /></RouteGuard>} />
              <Route path="hr/audit" element={<RouteGuard allowedRoles={['HR_ADMIN']}><AuditTrail /></RouteGuard>} />

              {/* Reviewer Routes */}
              <Route path="review/dashboard" element={<RouteGuard allowedRoles={['HR_REVIEWER', 'HR_ADMIN', 'SYSTEM_ADMIN']}><ReviewerDashboard /></RouteGuard>} />
              <Route path="review/queue" element={<RouteGuard allowedRoles={['HR_REVIEWER', 'HR_ADMIN', 'SYSTEM_ADMIN']}><ReviewQueue /></RouteGuard>} />
              <Route path="review/workspace/:id" element={<RouteGuard allowedRoles={['HR_REVIEWER', 'HR_ADMIN', 'SYSTEM_ADMIN']}><DocumentWorkspace /></RouteGuard>} />
              <Route path="review/documents/:id" element={<RouteGuard allowedRoles={['HR_REVIEWER', 'HR_ADMIN', 'SYSTEM_ADMIN']}><DocumentWorkspace /></RouteGuard>} />
              <Route path="review/history" element={<RouteGuard allowedRoles={['HR_REVIEWER', 'HR_ADMIN', 'SYSTEM_ADMIN']}><ReviewHistory /></RouteGuard>} />

              {/* IT Admin Routes */}
              <Route path="it/dashboard" element={<RouteGuard allowedRoles={['IT_ADMIN']}><ITDashboard /></RouteGuard>} />
              <Route path="it/requests" element={<RouteGuard allowedRoles={['IT_ADMIN']}><ITRequests /></RouteGuard>} />
              <Route path="it/requests/:id" element={<RouteGuard allowedRoles={['IT_ADMIN']}><I3_RequestDetail /></RouteGuard>} />
              <Route path="it/catalogue" element={<RouteGuard allowedRoles={['IT_ADMIN']}><I5_Catalogue /></RouteGuard>} />
              <Route path="it/calendar" element={<RouteGuard allowedRoles={['IT_ADMIN']}><I6_Calendar /></RouteGuard>} />

              {/* System Admin Routes */}
              <Route path="admin/dashboard" element={<RouteGuard allowedRoles={['SYSTEM_ADMIN']}><S1_Dashboard /></RouteGuard>} />
              <Route path="admin/users" element={<RouteGuard allowedRoles={['SYSTEM_ADMIN']}><S2_Users /></RouteGuard>} />
              <Route path="admin/settings" element={<RouteGuard allowedRoles={['SYSTEM_ADMIN']}><S5_Settings /></RouteGuard>} />
              <Route path="admin/rag" element={<RouteGuard allowedRoles={['SYSTEM_ADMIN']}><S7_SearchAI /></RouteGuard>} />
              <Route path="admin/audit" element={<RouteGuard allowedRoles={['SYSTEM_ADMIN']}><S8_Audit /></RouteGuard>} />
              <Route path="admin/data" element={<RouteGuard allowedRoles={['SYSTEM_ADMIN']}><S11_DataTools /></RouteGuard>} />

              {/* Aliases for convenience */}
              <Route path="employee/*" element={<Navigate to="/me" replace />} />

              {/* 404 Catch All inside Shell */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Global fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
