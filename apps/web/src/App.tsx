import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import {
  StudentLayout,
  DesignSystemPage,
  AuthProvider,
  useAuth,
  RequireAuth,
  PublicOnly
} from '@abrainoconscious/ui';
import { WEB_AUTH_STORAGE_KEY, fetchUnreadCounts } from '@abrainoconscious/shared';
import { useQuery } from '@tanstack/react-query';
import {
  HomePage,
  ExplorePage,
  ProgramPreviewPage,
  CheckoutPage,
  ProgramLearnPage,
  CourseWatchPage,
  MyProgramsPage,
  InboxPage,
  CommunityPage,
  BadgesPage,
  OrdersPage
} from './pages/WebPages';
import {
  TermsPage,
  PrivacyPage,
  RefundPolicyPage,
  SupportPage,
} from './pages/PublicLegalPages';
import { Wrench, ShieldAlert } from 'lucide-react';
import { SignupPage } from './pages/auth/SignupPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { ProfilePage } from './pages/auth/ProfilePage';

const queryClient = new QueryClient();

// Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Web App error:', error, errorInfo);
  }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-white">
          <h2 className="font-serif text-2xl font-bold text-amber-500">Something went wrong.</h2>
          <button
            className="mt-4 rounded bg-amber-500 px-4 py-2 text-xs font-bold text-black"
            onClick={() => window.location.reload()}
          >
            Reload Application
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
    <h2 className="mt-2 text-xl font-bold">Page Not Found</h2>
    <a href="/" className="mt-4 text-xs text-amber-400 underline">
      Return Home
    </a>
  </div>
);

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);
  const { user, profile, signOut, supabase } = useAuth();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Student Unread Announcements & Notifications Count
  const { data: unreadData } = useQuery({
    queryKey: ['student-unread-counts', user?.id],
    queryFn: () => fetchUnreadCounts(supabase),
    enabled: Boolean(user),
    staleTime: 1000 * 30,
  });

  // Public Site Settings (Maintenance mode and brand details)
  const { data: publicSettings } = useQuery({
    queryKey: ['web-site-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('maintenance_mode, brand_name, support_email')
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60,
  });

  // Maintenance Mode Guard (Admin and staff retain access)
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'staff';
  const isAuthPath = location.pathname.startsWith('/login') || location.pathname.startsWith('/auth');

  if (publicSettings?.maintenance_mode && !isPrivileged && !isAuthPath) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-white">
        <div className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-[#081619] p-8 shadow-2xl space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mx-auto">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Under Scheduled Maintenance</h1>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            {publicSettings?.brand_name || 'ABrainoConscious'} is currently undergoing routine maintenance to upgrade our live session and streaming infrastructure. We will be back online shortly.
          </p>
          <div className="pt-2 text-[11px] text-[#556B71]">
            Need assistance? Email{' '}
            <a
              href={`mailto:${publicSettings?.support_email || 'support@abrainoconscious.com'}`}
              className="text-amber-400 underline"
            >
              {publicSettings?.support_email || 'support@abrainoconscious.com'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Blocked Student Paused Screen
  if (user && profile?.is_blocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-white">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-[#081619] p-8 shadow-2xl space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mx-auto">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Account Temporarily Suspended</h1>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            Your student account access has been paused by an administrator.
            {profile?.blocked_reason && (
              <span className="block mt-2 font-mono text-[11px] text-rose-300">
                Reason: "{profile.blocked_reason}"
              </span>
            )}
          </p>
          <p className="text-xs text-[#8D9FA4]">
            If you believe this is in error or wish to appeal, please contact support.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <a
              href={`mailto:${publicSettings?.support_email || 'support@abrainoconscious.com'}`}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400"
            >
              Contact Support
            </a>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-xl border border-[#1A373E] px-4 py-2 text-xs text-[#8D9FA4] hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (location.pathname === '/design-system') {
    return <DesignSystemPage />;
  }

  // Standalone Auth Screens (Render outside StudentLayout for pristine split/focused styling)
  const isAuthStandalone = [
    '/signup',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/auth/callback',
    '/onboarding',
  ].some((path) => location.pathname.startsWith(path));

  if (isAuthStandalone) {
    return (
      <Routes>
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <SignupPage />
            </PublicOnly>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnly>
              <ForgotPasswordPage />
            </PublicOnly>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
      </Routes>
    );
  }

  const currentUserName = profile?.full_name || user?.user_metadata?.full_name || 'Student';

  // Standard student portal routes inside StudentLayout
  return (
    <StudentLayout
      activePath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onToggleTheme={() => setIsDark(!isDark)}
      isDark={isDark}
      userName={currentUserName}
      userEmail={user?.email}
      isLoggedIn={!!user}
      unreadCount={unreadData?.total_unread || 0}
      onSignOut={() => signOut()}
    >
      <Routes>
        {/* Public & Preview Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/programs/:slug" element={<ProgramPreviewPage />} />
        <Route
          path="/checkout/:slug"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />

        {/* Authenticated Routes */}
        <Route
          path="/my-programs"
          element={
            <RequireAuth>
              <MyProgramsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/programs/:slug/learn"
          element={
            <RequireAuth>
              <ProgramLearnPage />
            </RequireAuth>
          }
        />
        <Route
          path="/courses/:slug/watch/:lessonId"
          element={
            <RequireAuth>
              <CourseWatchPage />
            </RequireAuth>
          }
        />
        <Route
          path="/inbox"
          element={
            <RequireAuth>
              <InboxPage />
            </RequireAuth>
          }
        />
        <Route
          path="/community"
          element={
            <RequireAuth>
              <CommunityPage />
            </RequireAuth>
          }
        />
        <Route
          path="/badges"
          element={
            <RequireAuth>
              <BadgesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </StudentLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider storageKey={WEB_AUTH_STORAGE_KEY}>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
