import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { UserRole } from '@abrainoconscious/shared';
import { sanitizeRedirectPath, getAppUrl } from '@abrainoconscious/shared';
import { useAuth } from './AuthProvider';
import { ShieldAlert, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';

export interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route guard requiring an active user session.
 * Preserves the current path via safe `next` parameter upon redirect to login.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  redirectTo = '/login',
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      const currentFull = `${location.pathname}${location.search}`;
      const safePath = sanitizeRedirectPath(currentFull, '/');
      const target = `${redirectTo}?next=${encodeURIComponent(safePath)}`;
      navigate(target, { replace: true });
    }
  }, [user, loading, location, redirectTo, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center text-[#E1E8EA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-xs font-medium text-[#8D9FA4]">Connecting to your sanctuary...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Route guard restricting access to specified roles (e.g., admin and staff for admin portal).
 * If user does not possess required role, renders an unmistakable Access Denied screen,
 * automatically signs them out to prevent token misuse, and never renders children.
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  children,
  fallbackPath = '/login',
}) => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!loading && !user && !denied) {
      navigate(fallbackPath, { replace: true });
      return;
    }

    if (!loading && user && profile) {
      if (!allowedRoles.includes(profile.role)) {
        setDenied(true);
        // Automatically sign out non-privileged session from the admin subdomain
        signOut().catch((err) => {
          console.warn('Auto sign-out after role check failed:', err);
        });
      }
    }
  }, [user, profile, loading, allowedRoles, fallbackPath, navigate, signOut, denied]);

  if (loading || (user && !profile && !denied)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center text-[#E1E8EA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-xs font-medium text-[#8D9FA4]">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (denied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-[#E1E8EA]">
        <div className="max-w-md space-y-6 rounded-2xl border border-red-500/30 bg-[#081619] p-8 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-white">Access Denied</h2>
            <p className="text-xs text-[#8D9FA4] leading-relaxed">
              This portal is restricted exclusively to ABrainoConscious administrators and staff.
              Your account does not possess administrative privileges.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                window.location.href = getAppUrl();
              }}
            >
              <span>Return to Student App</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-xs"
              onClick={() => {
                navigate('/login', { replace: true });
                setDenied(false);
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign In with Different Account</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile || !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
};

export interface PublicOnlyProps {
  children: React.ReactNode;
  defaultRedirect?: string;
  checkOnboarding?: boolean;
}

/**
 * Route guard for public-only auth routes (e.g. /login, /signup).
 * Redirects authenticated users to their intended destination or onboarding.
 */
export const PublicOnly: React.FC<PublicOnlyProps> = ({
  children,
  defaultRedirect = '/',
  checkOnboarding = true,
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // If checkOnboarding is enabled and user has not finished onboarding yet
      if (checkOnboarding && profile && !profile.onboarding_completed_at) {
        if (location.pathname !== '/onboarding') {
          const search = location.search;
          navigate(`/onboarding${search}`, { replace: true });
          return;
        }
      }

      const params = new URLSearchParams(location.search);
      const nextParam = params.get('next');
      const programParam = params.get('program');

      if (programParam) {
        navigate(`/programs/${programParam}`, { replace: true });
        return;
      }

      const safePath = sanitizeRedirectPath(nextParam, defaultRedirect);
      navigate(safePath, { replace: true });
    }
  }, [user, profile, loading, location, defaultRedirect, checkOnboarding, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center text-[#E1E8EA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
};
