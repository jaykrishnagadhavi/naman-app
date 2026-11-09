import React, { useState } from 'react';
import {
  Menu, X, Home, Compass, BookOpen, MessageSquare,
  Settings, LogOut, ShieldAlert, BarChart3, Users, Video,
  Calendar, CreditCard, Tag, Edit3, MessageCircle, Moon, Sun,
  Search, Sparkles, Bell, User, HelpCircle, FileText
} from 'lucide-react';
import { cn } from '@abrainoconscious/shared';
import { Button } from '../components/Button';
import { Img } from '../components/Img';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/DropdownMenu';

// 1. Landing Layout
export interface LandingLayoutProps {
  children: React.ReactNode;
  onJoin?: () => void;
  onLogin?: () => void;
  currentYear?: number;
}

export const LandingLayout: React.FC<LandingLayoutProps> = ({
  children,
  onJoin,
  onLogin,
  currentYear = 2026
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#040C0E] text-[#E1E8EA] selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#1A373E]/80 bg-[#040C0E]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo / Brand Name */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-amber-500/40 bg-black shadow">
              <Img
                id="brand/logo"
                alt="ABrainoConscious emblem"
                aspectRatio="1/1"
                className="h-full w-full object-cover scale-125"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-[#F8FAFA] group-hover:text-amber-400 transition-colors">
                ABrainoConscious
              </span>
              <span className="text-[10px] text-[#8D9FA4] -mt-1 hidden sm:block">
                Four Pillars of Personal Growth
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#8D9FA4]">
            <a href="#pillars" className="hover:text-white transition-colors">The 4 Pillars</a>
            <a href="#programs" className="hover:text-white transition-colors">Programs</a>
            <a href="#story" className="hover:text-white transition-colors">Our Story</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#channel" className="hover:text-white transition-colors">From the Channel</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#creator" className="hover:text-white transition-colors">About Naman</a>
          </nav>

          {/* CTA & Login */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              type="button"
              onClick={onLogin}
              className="text-xs font-medium text-[#8D9FA4] hover:text-white transition-colors"
            >
              Login
            </button>
            <Button size="sm" variant="primary" onClick={onJoin}>
              JOIN NOW
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#1A373E] bg-[#081619] px-4 py-4 space-y-3">
            <nav className="flex flex-col space-y-2.5 text-sm font-medium text-[#8D9FA4]">
              <a href="#pillars" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">The 4 Pillars</a>
              <a href="#programs" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Programs</a>
              <a href="#story" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Our Story</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">How It Works</a>
              <a href="#channel" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">From the Channel</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">FAQ</a>
              <a href="#creator" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">About Naman</a>
            </nav>
            <div className="pt-3 border-t border-[#1A373E] flex items-center justify-between">
              <button
                type="button"
                onClick={onLogin}
                className="text-xs text-[#8D9FA4] hover:text-white"
              >
                Already enrolled? Login
              </button>
              <Button size="sm" variant="primary" onClick={onJoin}>
                JOIN NOW
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A373E] bg-[#081619] pt-12 pb-24 sm:pb-12 text-[#8D9FA4] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-white">ABrainoConscious</span>
              </div>
              <p className="text-xs max-w-sm text-[#8D9FA4] leading-relaxed">
                Educational live challenges and structured courses helping you grow emotionally, mentally, academically, and personally. Guided by Naman.
              </p>
              <div className="text-[11px] text-[#556B71]">
                Domain: abrainoconcious.com • Built for students and lifelong learners.
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-white uppercase tracking-wider text-[11px]">Growth Pillars</h5>
              <ul className="space-y-1.5">
                <li><a href="#pillars" className="hover:text-white">Emotional Resilience</a></li>
                <li><a href="#pillars" className="hover:text-white">Mental Clarity</a></li>
                <li><a href="#pillars" className="hover:text-white">Academic Mastery</a></li>
                <li><a href="#pillars" className="hover:text-white">Personal Momentum</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-white uppercase tracking-wider text-[11px]">Platform & Legal</h5>
              <ul className="space-y-1.5">
                <li><a href="/login" className="hover:text-white">Student Portal</a></li>
                <li><a href="#faq" className="hover:text-white">Refund Policy (7 Days)</a></li>
                <li><a href="#faq" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#faq" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Mandatory Claims & Mental Health Guardrails Disclaimer */}
          <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 text-[11px] leading-relaxed text-[#8D9FA4]/80 space-y-1.5">
            <p className="font-semibold text-amber-400">Important Educational Disclaimer & Crisis Support:</p>
            <p>
              All programs, challenges, videos, and community interactions provided on ABrainoConscious are strictly educational in nature and designed for self-growth and habit building. They are <strong>not a substitute for professional mental healthcare, clinical diagnosis, psychiatry, or medical therapy</strong>. We make no guaranteed claims of specific exam ranks, marks, or career incomes.
            </p>
            <p>
              If you or someone you know is undergoing an acute psychological crisis, please contact the free national helplines immediately: <strong>Tele-MANAS (Govt. of India): 14416 or 1800-891-4416 (24x7 Toll-Free)</strong> or KIRAN at 1800-599-0019. (Verify helpline details before emergency use).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#1A373E]/60 pt-6 text-[11px]">
            <p>© {currentYear} ABrainoConscious by Naman. All rights reserved.</p>
            <p className="text-[#556B71]">All video content protected by multi-layer anti-piracy encryption.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 2. Student Layout
export interface StudentLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  userName?: string;
  userEmail?: string;
  isLoggedIn?: boolean;
  unreadCount?: number;
  onNavigate?: (path: string) => void;
  onPrefetch?: (path: string) => void;
  onToggleTheme?: () => void;
  onSignOut?: () => void;
  isDark?: boolean;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  activePath = '/',
  userName = 'Student',
  userEmail,
  isLoggedIn = false,
  unreadCount = 0,
  onNavigate,
  onPrefetch,
  onToggleTheme,
  onSignOut,
  isDark = true,
}) => {
  const desktopNavItems = [
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'My Programs', path: '/my-programs', icon: BookOpen },
    { label: 'Community', path: '/community', icon: MessageSquare },
  ];

  const mobileNavItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'My Programs', path: '/my-programs', icon: BookOpen },
    { label: 'Inbox', path: '/inbox', icon: Bell, badge: unreadCount },
    { label: isLoggedIn ? 'Profile' : 'Login', path: isLoggedIn ? '/profile' : '/login', icon: User },
  ];

  const initials = userName
    ? userName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'S';

  return (
    <div className="min-h-screen bg-[#040C0E] text-[#E1E8EA]">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-black focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Header for Desktop & Mobile */}
      <header className="sticky top-0 z-40 border-b border-[#1A373E] bg-[#081619]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate?.('/')}
              onMouseEnter={() => onPrefetch?.('/')}
              className="flex items-center gap-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded-md"
            >
              <div className="relative h-7 w-7 overflow-hidden rounded-full border border-amber-500/40 bg-black shadow shrink-0">
                <Img
                  id="brand/logo"
                  alt="ABrainoConscious emblem"
                  aspectRatio="1/1"
                  className="h-full w-full object-cover scale-125"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-base font-bold text-white tracking-tight">ABrainoConscious</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-400">APP</span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-[#8D9FA4]">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => onNavigate?.(item.path)}
                    onMouseEnter={() => onPrefetch?.(item.path)}
                    className={cn(
                      'flex items-center gap-1.5 transition-colors py-1 px-1.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500',
                      isActive ? 'text-amber-500 font-semibold' : 'hover:text-white'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Area: Search, Support, Notifications, User Menu or Auth CTAs */}
          <div className="flex items-center gap-3">
            {/* Quick Search Button */}
            <button
              type="button"
              onClick={() => onNavigate?.('/explore')}
              aria-label="Search catalog"
              className="hidden sm:flex items-center gap-2 rounded-lg border border-[#1A373E] bg-[#0E2024]/60 px-2.5 py-1 text-xs text-[#8D9FA4] hover:border-amber-500/40 hover:text-white transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-mono text-[#556B71]">⌘K</kbd>
            </button>

            {/* Need Support Link */}
            <button
              type="button"
              onClick={() => onNavigate?.('/support')}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
            >
              Support
            </button>

            {/* Notification Bell with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative rounded-lg p-1.5 text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black ring-2 ring-[#081619]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-4 border border-[#1A373E] bg-[#0E2024] text-white">
                <div className="flex items-center justify-between pb-2 border-b border-[#1A373E]">
                  <span className="font-serif text-xs font-bold text-white">
                    Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('/inbox')}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    View in Inbox &rarr;
                  </button>
                </div>
                {unreadCount > 0 ? (
                  <div className="py-4 text-center space-y-2">
                    <p className="text-xs text-[#E1E8EA]">You have {unreadCount} unread update{unreadCount > 1 ? 's' : ''}.</p>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('/inbox')}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors"
                    >
                      Open Inbox Feed
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-1">
                    <Bell className="h-6 w-6 text-[#556B71] mx-auto mb-1 stroke-1" />
                    <p className="text-xs font-medium text-[#E1E8EA]">No notifications right now.</p>
                    <p className="text-[11px] text-[#8D9FA4]">
                      When Naman announces new live calls or cohort updates, they will appear here.
                    </p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle (optional) */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
                className="hidden sm:inline-flex rounded-lg p-1.5 text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white transition-colors"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {/* User Profile or Logged-Out Join / Login */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="User menu"
                    className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#F5871F] to-[#E0760E] text-black font-bold text-xs shadow">
                      {initials}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1 border border-[#1A373E] bg-[#0E2024] text-white shadow-2xl">
                  <div className="px-3 py-2 border-b border-[#1A373E]">
                    <p className="text-xs font-semibold text-white truncate">{userName}</p>
                    {userEmail && <p className="text-[10px] text-[#8D9FA4] truncate">{userEmail}</p>}
                  </div>
                  <DropdownMenuItem onClick={() => onNavigate?.('/profile')} className="gap-2 text-xs">
                    <User className="h-3.5 w-3.5 text-amber-500" />
                    <span>Profile & WhatsApp</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate?.('/orders')} className="gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                    <span>Orders & Receipts</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate?.('/support')} className="gap-2 text-xs">
                    <HelpCircle className="h-3.5 w-3.5 text-red-400" />
                    <span>Crisis Helplines</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onSignOut}
                    className="gap-2 text-xs text-red-400 focus:bg-red-500/20 focus:text-red-300"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate?.('/login')}
                  className="text-xs font-semibold text-[#8D9FA4] hover:text-white px-2.5 py-1 transition-colors"
                >
                  Log In
                </button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onNavigate?.('/signup')}
                  className="text-xs px-3 py-1 font-bold"
                >
                  JOIN NOW
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Student Body */}
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8 outline-none">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-[#1A373E] bg-[#081619] py-2 safe-area-bottom"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate?.(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 text-[10px] font-medium transition-colors py-1 px-2',
                isActive ? 'text-amber-500 font-bold' : 'text-[#8D9FA4]'
              )}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-black">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// 3. Admin Layout
export interface AdminLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (path: string) => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
  userName?: string;
  userRole?: string | null;
  environmentName?: 'local' | 'staging' | 'production';
  isTestMode?: boolean;
  onSignOut?: () => void;
}

interface AdminNavGroup {
  groupName: string;
  items: {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    restrictedToAdmin?: boolean;
    badge?: string;
  }[];
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activePath = '/',
  onNavigate,
  onToggleTheme,
  isDark = true,
  userName = 'Naman',
  userRole = 'admin',
  environmentName = 'local',
  isTestMode = true,
  onSignOut,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isStaff = userRole === 'staff';

  const navGroups: AdminNavGroup[] = [
    {
      groupName: 'Core',
      items: [
        { label: 'Overview', path: '/', icon: BarChart3 },
        { label: 'Programs', path: '/programs', icon: BookOpen },
      ],
    },
    {
      groupName: 'Management',
      items: [
        { label: 'Live Sessions', path: '/sessions', icon: Calendar },
        { label: 'Courses', path: '/courses', icon: Video },
        { label: 'Announcements', path: '/announcements', icon: MessageSquare },
        { label: 'Students', path: '/students', icon: Users },
        { label: 'Payments', path: '/payments', icon: CreditCard, restrictedToAdmin: true },
        { label: 'Coupons', path: '/coupons', icon: Tag, restrictedToAdmin: true },
      ],
    },
    {
      groupName: 'Site',
      items: [
        { label: 'Landing Editor', path: '/landing-editor', icon: Edit3 },
        { label: 'Community', path: '/community', icon: MessageCircle },
        { label: 'Reviews', path: '/reviews', icon: Sparkles },
      ],
    },
    {
      groupName: 'System',
      items: [
        { label: 'Team & Roles', path: '/team', icon: Users, restrictedToAdmin: true },
        { label: 'Settings', path: '/settings', icon: Settings, restrictedToAdmin: true },
        { label: 'Anti-Piracy', path: '/piracy', icon: ShieldAlert },
        { label: 'Audit Log', path: '/audit-log', icon: ShieldAlert, restrictedToAdmin: true },
      ],
    },
  ];

  // Filter groups according to role
  const visibleGroups = navGroups.map((group) => ({
    ...group,
    items: isStaff
      ? group.items.filter((item) => !item.restrictedToAdmin)
      : group.items,
  })).filter((group) => group.items.length > 0);

  const handleNavClick = (path: string) => {
    onNavigate?.(path);
    setMobileDrawerOpen(false);
  };

  const envColorClass =
    environmentName === 'production'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      : environmentName === 'staging'
      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <div className={cn('min-h-screen flex flex-col lg:flex-row bg-[#040C0E] text-[#E1E8EA]', isDark ? 'dark' : 'light')}>
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer (390px Viewport Support) */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#081619] border-r border-[#1A373E] p-4 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:hidden',
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#1A373E]">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-white">Naman Studio</span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                  isStaff
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                )}
              >
                {userRole || 'ADMIN'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="rounded p-1 text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Grouped Mobile Navigation */}
          <div className="space-y-4">
            {visibleGroups.map((group) => (
              <div key={group.groupName} className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8D9FA4]/70">
                  {group.groupName}
                </span>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path));
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNavClick(item.path)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-[#0E2024] text-amber-500 border border-amber-500/30 font-semibold'
                            : 'text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#1A373E] space-y-2">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>Toggle Theme</span>
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut || (() => handleNavClick('/login'))}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col justify-between border-r border-[#1A373E] bg-[#081619] transition-all duration-300 z-30 shrink-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="space-y-4 py-4 overflow-y-auto">
          <div className="flex items-center justify-between px-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold text-white">Naman Studio</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                    isStaff
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  )}
                >
                  {userRole || 'ADMIN'}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="rounded p-1 text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white mx-auto"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Grouped Sidebar Navigation */}
          <nav className="space-y-4 px-2">
            {visibleGroups.map((group) => (
              <div key={group.groupName} className="space-y-1">
                {!collapsed && (
                  <span className="px-3 text-[9px] font-bold uppercase tracking-wider text-[#8D9FA4]/60">
                    {group.groupName}
                  </span>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path));
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => onNavigate?.(item.path)}
                        title={collapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-[#0E2024] text-amber-500 border border-amber-500/30 font-semibold'
                            : 'text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!collapsed && item.badge && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-3 border-t border-[#1A373E] space-y-2">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={collapsed ? 'Toggle Theme' : undefined}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {!collapsed && <span>Toggle Theme</span>}
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut || (() => onNavigate?.('/login'))}
            title={collapsed ? 'Sign Out' : undefined}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Surface */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-[#1A373E] bg-[#081619] px-4 sm:px-6 gap-3">
          {/* Left: Mobile hamburger & Global Search Box */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="rounded p-1.5 text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Command-style Global Search Box (Ctrl+K placeholder per spec) */}
            <div className="relative flex-1 hidden sm:block">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8D9FA4]">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search programs, students, courses... (Ctrl+K)"
                readOnly
                onClick={() => onNavigate?.('/programs')}
                className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] py-1.5 pl-9 pr-14 text-xs text-[#E1E8EA] placeholder-[#8D9FA4]/70 cursor-pointer focus:outline-none focus:border-amber-500/50"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <kbd className="rounded border border-[#1A373E] bg-[#0E2024] px-1.5 py-0.5 text-[9px] font-mono text-[#8D9FA4]">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right: Environment Badges & User Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Test Mode Indicator */}
            {isTestMode && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="hidden xs:inline">TEST MODE</span>
              </span>
            )}

            {/* Environment Badge */}
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                envColorClass
              )}
            >
              {environmentName}
            </span>

            {/* Role Badge */}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                isStaff
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              )}
            >
              {userRole || 'ADMIN'}
            </span>

            {/* User display */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-white leading-tight">{userName}</span>
              <span className="text-[10px] text-[#8D9FA4] leading-tight">Naman Studio</span>
            </div>

            {/* Sign Out Button */}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title="Sign out of admin console"
                className="rounded-lg p-1.5 text-[#8D9FA4] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

