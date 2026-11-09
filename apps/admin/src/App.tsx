import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AdminLayout,
  DesignSystemPage,
  AuthProvider,
  useAuth,
  RequireRole,
  PublicOnly,
  useAdminIdleTimeout,
  AdminIdleWarningModal,
  ComingSoonPlaceholder,
  MissingLinkBanner,
} from '@abrainoconscious/ui';
import { ADMIN_AUTH_STORAGE_KEY } from '@abrainoconscious/shared';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { AdminProgramsPage } from './pages/AdminProgramsPage';
import { AdminProgramEditorPage } from './pages/AdminProgramEditorPage';
import { AdminSessionsPage } from './pages/AdminSessionsPage';
import { AdminAnnouncementsPage } from './pages/AdminAnnouncementsPage';
import { AdminStudentsPage } from './pages/AdminStudentsPage';
import { AdminAuditLogPage } from './pages/AdminAuditLogPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { AdminForgotPasswordPage } from './pages/auth/AdminForgotPasswordPage';
import { AdminResetPasswordPage } from './pages/auth/AdminResetPasswordPage';
import { AdminAuthCallbackPage } from './pages/auth/AdminAuthCallbackPage';

import { AlertTriangle, Copy, Check, RefreshCw, LogIn } from 'lucide-react';

const queryClient = new QueryClient();

// Top-Level Error Boundary with Detailed Developer Error View & Copy Details
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  copied?: boolean;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null, copied: false };
  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin App fatal error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleCopy = () => {
    const payload = JSON.stringify(
      {
        message: this.state.error?.message,
        name: this.state.error?.name,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        url: window.location.href,
        time: new Date().toISOString(),
      },
      null,
      2
    );
    navigator.clipboard?.writeText(payload);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-white">
          <div className="max-w-2xl w-full rounded-2xl border border-rose-500/30 bg-[#081619] p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Admin Application Error</h2>
                <p className="text-xs text-[#8D9FA4]">
                  An unexpected exception halted the admin dashboard renderer.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-900/40 bg-black/50 p-4 text-xs font-mono text-rose-300 space-y-2 overflow-x-auto">
              <div className="font-semibold text-rose-200">
                {this.state.error?.message || 'Unknown runtime error'}
              </div>
              {isDev && this.state.error?.stack && (
                <pre className="max-h-48 overflow-y-auto text-[11px] text-rose-400/80 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
              {isDev && this.state.errorInfo?.componentStack && (
                <details className="pt-2 text-rose-400/70 border-t border-rose-950/60">
                  <summary className="cursor-pointer hover:underline text-[11px]">Component Stack</summary>
                  <pre className="mt-1 max-h-36 overflow-y-auto text-[10px] text-rose-300 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Dashboard</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2.5 text-xs font-medium text-[#E1E8EA] hover:text-white transition-colors"
                onClick={this.handleCopy}
              >
                {this.state.copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{this.state.copied ? 'Copied Details' : 'Copy Error Details'}</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1A373E] bg-transparent px-4 py-2.5 text-xs font-medium text-[#8D9FA4] hover:text-white transition-colors ml-auto"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                <LogIn className="h-4 w-4" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// In-Page Error Boundary: renders inline inside AdminLayout so navigation remains interactive
export interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}
interface PageErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
}
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  public state: PageErrorBoundaryState = { hasError: false, error: null, errorInfo: null };
  public static getDerivedStateFromError(error: Error): Partial<PageErrorBoundaryState> {
    return { hasError: true, error };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Page error [${this.props.pageName || 'page'}]:`, error, errorInfo);
    this.setState({ errorInfo });
  }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-rose-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg font-bold text-white mb-1">
                Unable to load {this.props.pageName || 'this page'}
              </h3>
              <p className="text-xs text-rose-200/90 mb-3">
                {this.state.error?.message || 'An unexpected error occurred while rendering this view.'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors"
                >
                  Retry Page
                </button>
                <details className="text-xs text-rose-300">
                  <summary className="cursor-pointer hover:underline">Show technical details</summary>
                  <pre className="mt-2 p-3 rounded-lg bg-black/60 border border-rose-900/50 font-mono text-[11px] overflow-auto max-h-48 text-rose-300">
                    {this.state.error?.stack}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            </div>
          </div>
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
    <a href="/" className="mt-4 text-xs text-amber-400 underline">
      Return to Overview
    </a>
  </div>
);

const AdminAppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);
  const { user, profile, signOut, supabase } = useAuth();

  // Missing Link Warning Checker (Starts within 2 hours, no link) - Unconditional hooks
  const [upcomingWarningSession, setUpcomingWarningSession] = useState<{
    id: string;
    title: string;
    scheduled_at: string;
    program_title?: string;
    day_number?: number;
  } | null>(null);

  // Admin Session Idle Timeout: 30 minutes total, warning at 28 minutes
  const isAuthRoute = ['/login', '/forgot-password', '/reset-password', '/auth/callback'].some((p) =>
    location.pathname.startsWith(p)
  );

  const { showWarning, secondsRemaining, staySignedIn } = useAdminIdleTimeout({
    enabled: !isAuthRoute && !!user,
    totalTimeoutMs: 30 * 60 * 1000,
    warningThresholdMs: 28 * 60 * 1000,
  });

  useEffect(() => {
    async function checkMissingLinks() {
      if (!user || isAuthRoute) return;
      try {
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        const { data: upcoming } = await supabase
          .from('program_sessions')
          .select(`
            id,
            day_number,
            title,
            scheduled_at,
            status,
            programs (
              title
            )
          `)
          .eq('status', 'scheduled')
          .gte('scheduled_at', now.toISOString())
          .lte('scheduled_at', twoHoursLater.toISOString());

        if (!upcoming || upcoming.length === 0) {
          setUpcomingWarningSession(null);
          return;
        }

        const sessionIds = upcoming.map((s) => s.id);
        const { data: links } = await supabase
          .from('session_links')
          .select('session_id, live_url, link_published_at')
          .in('session_id', sessionIds);

        const linksMap = new Map((links || []).map((l) => [l.session_id, l]));

        const missing = upcoming.find((s) => {
          const l = linksMap.get(s.id);
          return !l || !l.live_url || !l.link_published_at;
        });

        if (missing) {
          const prog = Array.isArray(missing.programs) ? missing.programs[0] : missing.programs;
          setUpcomingWarningSession({
            id: missing.id,
            title: missing.title,
            scheduled_at: missing.scheduled_at,
            program_title: prog?.title,
            day_number: missing.day_number,
          });
        } else {
          setUpcomingWarningSession(null);
        }
      } catch (err) {
        console.error('Error checking missing session links:', err);
      }
    }

    if (!isAuthRoute && user) {
      checkMissingLinks();
      const interval = setInterval(checkMissingLinks, 60000);
      return () => clearInterval(interval);
    }
  }, [user, isAuthRoute, supabase]);

  if (location.pathname === '/design-system') {
    return <DesignSystemPage />;
  }

  // Standalone Auth Routes (Render outside AdminLayout)
  if (isAuthRoute) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly checkOnboarding={false}>
              <AdminLoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnly checkOnboarding={false}>
              <AdminForgotPasswordPage />
            </PublicOnly>
          }
        />
        <Route path="/reset-password" element={<AdminResetPasswordPage />} />
        <Route path="/auth/callback" element={<AdminAuthCallbackPage />} />
      </Routes>
    );
  }

  const currentUserName = profile?.full_name || user?.email || 'Naman (Super Admin)';
  const currentUserRole = profile?.role || 'admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const environmentName: 'local' | 'staging' | 'production' =
    import.meta.env.MODE === 'production'
      ? 'production'
      : import.meta.env.MODE === 'staging'
      ? 'staging'
      : 'local';
  const isTestMode = environmentName !== 'production';

  return (
    <>
      <RequireRole allowedRoles={['admin', 'staff']} fallbackPath="/login">
        <AdminLayout
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
          onToggleTheme={() => setIsDark(!isDark)}
          isDark={isDark}
          userName={currentUserName}
          userRole={currentUserRole}
          environmentName={environmentName}
          isTestMode={isTestMode}
          onSignOut={handleSignOut}
        >
          {/* Global Missing Live Link Warning Banner (Step 5 per SPEC Part B item 7) */}
          {upcomingWarningSession && (
            <div className="mb-6">
              <MissingLinkBanner
                sessionTitle={upcomingWarningSession.title}
                scheduledAt={upcomingWarningSession.scheduled_at}
                programTitle={upcomingWarningSession.program_title}
                dayNumber={upcomingWarningSession.day_number}
                onAddLink={() => navigate('/sessions')}
              />
            </div>
          )}

          <Routes>
            {/* Step 4 Live Routes */}
            <Route
              path="/"
              element={
                <PageErrorBoundary pageName="Overview Dashboard">
                  <AdminOverviewPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/programs"
              element={
                <PageErrorBoundary pageName="Programs Manager">
                  <AdminProgramsPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/programs/new"
              element={
                <PageErrorBoundary pageName="Program Editor">
                  <AdminProgramEditorPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/programs/:id"
              element={
                <PageErrorBoundary pageName="Program Editor">
                  <AdminProgramEditorPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/audit-log"
              element={
                <PageErrorBoundary pageName="Audit Log">
                  <AdminAuditLogPage />
                </PageErrorBoundary>
              }
            />

            {/* Step 5 Live Routes */}
            <Route
              path="/sessions"
              element={
                <PageErrorBoundary pageName="Live Sessions Controller">
                  <AdminSessionsPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/announcements"
              element={
                <PageErrorBoundary pageName="Announcements & Broadcasts">
                  <AdminAnnouncementsPage />
                </PageErrorBoundary>
              }
            />

            {/* Placeholders for Future Steps */}
            <Route
              path="/courses"
              element={
                <ComingSoonPlaceholder
                  stepNumber={10}
                  stepName="Video Course Builder"
                  title="Video Curriculum & DRM Streaming"
                  description="Pre-recorded video curriculum builder, encrypted DRM video streaming, and lesson progression will be available in Step 10."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />
            <Route
              path="/students"
              element={
                <PageErrorBoundary pageName="Students Directory">
                  <AdminStudentsPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/payments"
              element={
                <ComingSoonPlaceholder
                  stepNumber={6}
                  stepName="Payments & Checkout"
                  title="Razorpay Transactions & Invoices"
                  description="Payment capture history, order logs, GST invoicing, and refunds ledger will be available in Step 6."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />
            <Route
              path="/coupons"
              element={
                <ComingSoonPlaceholder
                  stepNumber={6}
                  stepName="Discount Engine"
                  title="Coupon Codes & Promotions"
                  description="Promotional discount creation, percentage and flat discounts, and usage caps will be available in Step 6."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />
            <Route
              path="/landing-editor"
              element={
                <ComingSoonPlaceholder
                  stepNumber={7}
                  stepName="Landing CMS"
                  title="Landing Page Visual CMS"
                  description="Live homepage content editor, hero copy modification, and visual block management will be available in Step 7."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />
            <Route
              path="/community"
              element={
                <ComingSoonPlaceholder
                  stepNumber={8}
                  stepName="Community & Moderation"
                  title="Student Community Feed"
                  description="Cohort discussion boards, post moderation, comment filtering, and report resolution will be available in Step 8."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />
            <Route
              path="/reviews"
              element={
                <ComingSoonPlaceholder
                  stepNumber={8}
                  stepName="Reviews & Wall of Love"
                  title="Testimonials & Reviews"
                  description="Student review submissions, rating approvals, and public testimonial curation will be available in Step 8."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />
            <Route
              path="/team"
              element={
                <ComingSoonPlaceholder
                  stepNumber={9}
                  stepName="Team & RBAC"
                  title="Team Management"
                  description="Staff invites, role assignment, and administrative permissions will be available in Step 9."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <ComingSoonPlaceholder
                  stepNumber={9}
                  stepName="Platform Settings"
                  title="Platform & Brand Settings"
                  description="Brand identity, support contact emails, legal policies, and maintenance mode toggles will be available in Step 9."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />
            <Route
              path="/piracy"
              element={
                <ComingSoonPlaceholder
                  stepNumber={10}
                  stepName="Forensic Anti-Piracy"
                  title="Anti-Piracy & Watermarking"
                  description="Forensic video watermarking logs, DRM violation telemetry, and IP ban management will be available in Step 10."
                  onNavigateToPrograms={() => navigate('/programs')}
                />
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AdminLayout>
      </RequireRole>

      {/* 30-Minute Idle Warning Modal */}
      <AdminIdleWarningModal
        show={showWarning}
        secondsRemaining={secondsRemaining}
        onStaySignedIn={staySignedIn}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider storageKey={ADMIN_AUTH_STORAGE_KEY}>
          <BrowserRouter>
            <AdminAppContent />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
