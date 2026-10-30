import React, { useState } from 'react';
import {
  Menu, X, Home, Compass, BookOpen, MessageSquare, Award,
  Settings, LogOut, ShieldAlert, BarChart3, Users, Video,
  Calendar, CreditCard, Tag, Edit3, MessageCircle, Moon, Sun
} from 'lucide-react';
import { cn } from '@abrainoconscious/shared';
import { Button } from '../components/Button';
import { Img } from '../components/Img';

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
  onNavigate?: (path: string) => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  activePath = '/',
  userName = 'Student',
  onNavigate,
  onToggleTheme,
  isDark = true
}) => {
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'My Programs', path: '/my-programs', icon: BookOpen },
    { label: 'Community', path: '/community', icon: MessageSquare },
    { label: 'Badges', path: '/badges', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-[#040C0E] text-[#E1E8EA]">
      {/* Top Bar for Desktop */}
      <header className="sticky top-0 z-40 border-b border-[#1A373E] bg-[#081619]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => onNavigate?.('/')} className="flex items-center gap-2.5">
              <span className="font-serif text-base font-bold text-white">ABrainoConscious</span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-400">APP</span>
            </button>
            <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-[#8D9FA4]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => onNavigate?.(item.path)}
                    className={cn(
                      'flex items-center gap-1.5 transition-colors',
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('/support')}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
            >
              Need Support?
            </button>
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
                className="rounded-lg p-1.5 text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate?.('/profile')}
              className="flex items-center gap-2 text-xs font-medium text-white hover:text-amber-400"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-black font-bold text-xs">
                {userName.charAt(0)}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-[#1A373E] bg-[#081619] py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate?.(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-amber-500 font-bold' : 'text-[#8D9FA4]'
              )}
            >
              <Icon className="h-4 w-4" />
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
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activePath = '/',
  onNavigate,
  onToggleTheme,
  isDark = true
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const adminMenu = [
    { label: 'Overview', path: '/', icon: BarChart3 },
    { label: 'Programs', path: '/programs', icon: BookOpen },
    { label: 'Live Sessions', path: '/sessions', icon: Calendar },
    { label: 'Course Builder', path: '/courses', icon: Video },
    { label: 'Announcements', path: '/announcements', icon: MessageSquare },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Coupons', path: '/coupons', icon: Tag },
    { label: 'Landing Editor', path: '/landing-editor', icon: Edit3 },
    { label: 'Community', path: '/community', icon: MessageCircle },
    { label: 'Anti-Piracy & Watermark', path: '/piracy', icon: ShieldAlert },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex bg-[#040C0E] text-[#E1E8EA]">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col justify-between border-r border-[#1A373E] bg-[#081619] transition-all duration-300 z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between px-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold text-white">Naman Studio</span>
                <span className="rounded bg-red-500/20 px-1.5 py-0.2 text-[9px] font-bold text-red-400">ADMIN</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="rounded p-1 text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-0.5 px-2">
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onNavigate?.(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-[#0E2024] text-amber-500 border border-amber-500/30 font-semibold'
                      : 'text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-[#1A373E] space-y-2">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#8D9FA4] hover:bg-[#0E2024] hover:text-white"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {!collapsed && <span>Toggle Theme</span>}
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate?.('/login')}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Surface */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-[#1A373E] bg-[#081619] px-6">
          <div className="text-xs text-[#8D9FA4]">
            ABrainoConscious Management Dashboard • <span className="text-amber-400 font-semibold">Active Mode</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-white">Naman (Super Admin)</span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

