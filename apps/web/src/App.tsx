import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentLayout, DesignSystemPage } from '@abrainoconscious/ui';
import {
  HomePage, ExplorePage, ProgramPreviewPage, ProgramLearnPage,
  CourseWatchPage, CrisisSupportPage, MyProgramsPage, InboxPage,
  CommunityPage, BadgesPage, OrdersPage, ProfilePage, LoginPage, SignupPage
} from './pages/WebPages';

const queryClient = new QueryClient();

// Error Boundary
interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  public static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Web App error:', error, errorInfo);
  }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-white">
          <h2 className="font-serif text-2xl font-bold text-amber-500">Something went wrong.</h2>
          <button className="mt-4 rounded bg-amber-500 px-4 py-2 text-xs font-bold text-black" onClick={() => window.location.reload()}>
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
    <a href="/" className="mt-4 text-xs text-amber-400 underline">Return Home</a>
  </div>
);

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);

  // If in design-system, render full design system
  if (location.pathname === '/design-system') {
    return <DesignSystemPage />;
  }

  // Wrap standard routes in StudentLayout
  return (
    <StudentLayout
      activePath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onToggleTheme={() => setIsDark(!isDark)}
      isDark={isDark}
      userName="Priya"
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/programs/:slug" element={<ProgramPreviewPage />} />
        <Route path="/my-programs" element={<MyProgramsPage />} />
        <Route path="/programs/:slug/learn" element={<ProgramLearnPage />} />
        <Route path="/courses/:slug/watch/:lessonId" element={<CourseWatchPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/support" element={<CrisisSupportPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </StudentLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
