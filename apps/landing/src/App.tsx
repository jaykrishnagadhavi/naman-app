import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './pages/LandingPage';
import { DesignSystemPage, Button } from '@abrainoconscious/ui';

const queryClient = new QueryClient();

// Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in landing app:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-white">
          <h2 className="font-serif text-3xl font-bold text-amber-500">Something unexpected occurred.</h2>
          <p className="mt-2 text-xs text-[#8D9FA4] max-w-md">
            Our team has been notified. Please reload the page or return to the home screen.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = '/')}>
              Go to Home
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 404 Page
const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-white">
    <span className="font-serif text-7xl font-bold text-amber-500">404</span>
    <h1 className="mt-4 font-serif text-2xl font-bold text-[#F8FAFA]">Page Not Found</h1>
    <p className="mt-2 text-xs text-[#8D9FA4] max-w-sm">
      The page you are looking for does not exist or has been moved.
    </p>
    <div className="mt-6">
      <Link to="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
