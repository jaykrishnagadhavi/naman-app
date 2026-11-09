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
  CrisisSupportPage,
  MyProgramsPage,
  InboxPage,
  CommunityPage,
  BadgesPage,
  OrdersPage
} from './pages/WebPages';
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
        <Route path="/support" element={<CrisisSupportPage />} />

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
