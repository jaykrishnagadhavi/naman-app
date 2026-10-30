import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout, DesignSystemPage } from '@abrainoconscious/ui';
import {
  AdminOverviewPage, AdminProgramsPage, AdminProgramDetailPage, AdminSessionsPage,
  AdminCoursesPage, AdminAnnouncementsPage, AdminStudentsPage, AdminPaymentsPage,
  AdminCouponsPage, AdminLandingEditorPage, AdminCommunityPage, AdminReviewsPage,
  AdminTeamPage, AdminSettingsPage, AdminPiracyPage, AdminAuditLogPage, AdminLoginPage
} from './pages/AdminPages';

const queryClient = new QueryClient();

// Error Boundary
interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  public static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin App error:', error, errorInfo);
  }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-white">
          <h2 className="font-serif text-2xl font-bold text-amber-500">Admin error occurred.</h2>
          <button className="mt-4 rounded bg-amber-500 px-4 py-2 text-xs font-bold text-black" onClick={() => window.location.reload()}>
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// 404
const NotFoundPage = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-white">
    <span className="font-serif text-6xl font-bold text-amber-500">404</span>
    <h2 className="mt-2 text-xl font-bold">Admin Route Not Found</h2>
    <a href="/" className="mt-4 text-xs text-amber-400 underline">Return to Overview</a>
  </div>
);

const AdminAppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);

  if (location.pathname === '/design-system') {
    return <DesignSystemPage />;
  }

  return (
    <AdminLayout
      activePath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onToggleTheme={() => setIsDark(!isDark)}
      isDark={isDark}
    >
      <Routes>
        <Route path="/" element={<AdminOverviewPage />} />
        <Route path="/programs" element={<AdminProgramsPage />} />
        <Route path="/programs/:id" element={<AdminProgramDetailPage />} />
        <Route path="/sessions" element={<AdminSessionsPage />} />
        <Route path="/courses" element={<AdminCoursesPage />} />
        <Route path="/announcements" element={<AdminAnnouncementsPage />} />
        <Route path="/students" element={<AdminStudentsPage />} />
        <Route path="/payments" element={<AdminPaymentsPage />} />
        <Route path="/coupons" element={<AdminCouponsPage />} />
        <Route path="/landing-editor" element={<AdminLandingEditorPage />} />
        <Route path="/community" element={<AdminCommunityPage />} />
        <Route path="/reviews" element={<AdminReviewsPage />} />
        <Route path="/team" element={<AdminTeamPage />} />
        <Route path="/settings" element={<AdminSettingsPage />} />
        <Route path="/piracy" element={<AdminPiracyPage />} />
        <Route path="/audit-log" element={<AdminAuditLogPage />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminAppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
