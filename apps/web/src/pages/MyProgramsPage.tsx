import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  useAuth,
  Button,
  ErrorDetailsAlert,
} from '@abrainoconscious/ui';
import {
  fetchMyPrograms,
  formatISTDateOnly,
  formatISTTimeOnly,
  PILLARS,
  type MyProgramItem,
} from '@abrainoconscious/shared';
import {
  BookOpen,
  Radio,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';

export const MyProgramsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const welcomeSlug = searchParams.get('welcome');
  const [showWelcome, setShowWelcome] = useState(Boolean(welcomeSlug));

  const { supabase, user } = useAuth();

  const {
    data: myPrograms = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<MyProgramItem[]>({
    queryKey: ['my-enrolled-programs'],
    queryFn: () => fetchMyPrograms(supabase),
    enabled: Boolean(user),
    staleTime: 1000 * 30,
  });

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    searchParams.delete('welcome');
    setSearchParams(searchParams, { replace: true });
  };

  const welcomeProgram = myPrograms.find((p) => p.slug === welcomeSlug);

  // Group programs
  const liveNowPrograms = myPrograms.filter((p) => p.is_live_now);
  const todayPrograms = myPrograms.filter((p) => p.has_today_session && !p.is_live_now);
  const inProgressPrograms = myPrograms.filter((p) => p.progress_pct > 0 && p.progress_pct < 100);
  const completedPrograms = myPrograms.filter((p) => p.progress_pct === 100);
  const upcomingPrograms = myPrograms.filter((p) => p.progress_pct === 0 && !p.is_live_now && !p.has_today_session);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      <Helmet>
        <title>My Programs | ABrainoConscious</title>
      </Helmet>

      {/* Celebratory Welcome Card for new enrollments */}
      {showWelcome && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-[#0E2024] to-[#081619] p-6 shadow-2xl">
          <button
            type="button"
            onClick={handleDismissWelcome}
            className="absolute top-4 right-4 text-[#8D9FA4] hover:text-white p-1"
            aria-label="Dismiss welcome message"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Enrollment Confirmed • Welcome to the Cohort!</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">
                {welcomeProgram ? welcomeProgram.title : 'Your Learning Journey Begins Now'}
              </h2>
              <p className="text-xs text-[#A0B1B5] leading-relaxed">
                You now have full access to daily live sessions, actionable worksheets, and cohort materials.
                Start with Day 1 below!
              </p>
            </div>

            <Button
              variant="cta"
              onClick={() => {
                if (welcomeProgram) {
                  navigate(`/programs/${welcomeProgram.slug}`);
                } else {
                  handleDismissWelcome();
                }
              }}
              className="shrink-0 font-bold"
            >
              Start Today's Session &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-500" />
            <h1 className="font-serif text-3xl font-bold text-white">My Learning Dashboard</h1>
          </div>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Track your cohort milestones, daily task completions, and scheduled live calls with Naman.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <ErrorDetailsAlert
          title="Unable to load enrolled programs"
          error={error}
        />
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#081619] border border-[#1A373E] p-6 space-y-4">
              <div className="h-6 w-1/3 rounded bg-[#0E2024]" />
              <div className="h-10 w-3/4 rounded bg-[#0E2024]" />
              <div className="h-4 w-1/2 rounded bg-[#0E2024]" />
            </div>
          ))}
        </div>
      ) : myPrograms.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-12 text-center space-y-4">
          <BookOpen className="h-12 w-12 text-[#556B71] mx-auto stroke-1" />
          <h2 className="font-serif text-2xl font-bold text-white">You Haven't Joined Any Programs Yet</h2>
          <p className="text-xs text-[#8D9FA4] max-w-md mx-auto leading-relaxed">
            Discover Naman’s transformative live cohort challenges and masterclass courses across Emotional Resilience,
            Mental Clarity, Academic Focus, and Personal Momentum.
          </p>
          <Button variant="cta" onClick={() => navigate('/explore')}>
            Browse Library &rarr;
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* 1. Live Now Section */}
          {liveNowPrograms.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <h2 className="font-serif text-xl font-bold text-red-400">Live Call In Progress</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveNowPrograms.map((p) => (
                  <EnrolledProgramCard key={p.enrollment_id} program={p} onOpen={() => navigate(`/programs/${p.slug}`)} />
                ))}
              </div>
            </div>
          )}

          {/* 2. Today's Sessions Section */}
          {todayPrograms.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-amber-400 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                <span>Today's Cohort Sessions</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {todayPrograms.map((p) => (
                  <EnrolledProgramCard key={p.enrollment_id} program={p} onOpen={() => navigate(`/programs/${p.slug}`)} />
                ))}
              </div>
            </div>
          )}

          {/* 3. In Progress Section */}
          {inProgressPrograms.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-white">In Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressPrograms.map((p) => (
                  <EnrolledProgramCard key={p.enrollment_id} program={p} onOpen={() => navigate(`/programs/${p.slug}`)} />
                ))}
              </div>
            </div>
          )}

          {/* 4. Upcoming / Not Started Section */}
          {upcomingPrograms.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-[#E1E8EA]">Upcoming Cohorts & Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingPrograms.map((p) => (
                  <EnrolledProgramCard key={p.enrollment_id} program={p} onOpen={() => navigate(`/programs/${p.slug}`)} />
                ))}
              </div>
            </div>
          )}

          {/* 5. Completed Section */}
          {completedPrograms.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Completed Cohorts</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedPrograms.map((p) => (
                  <EnrolledProgramCard key={p.enrollment_id} program={p} onOpen={() => navigate(`/programs/${p.slug}`)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Sub-component: Enrolled Program Card
interface EnrolledProgramCardProps {
  program: MyProgramItem;
  onOpen: () => void;
}

const EnrolledProgramCard: React.FC<EnrolledProgramCardProps> = ({ program, onOpen }) => {
  const pillar = PILLARS[program.category];
  const next = program.next_session;

  return (
    <div
      onClick={onOpen}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-6 ${
        program.is_live_now
          ? 'border-red-500/50 bg-[#0E151A] shadow-[0_0_25px_rgba(239,68,68,0.15)] hover:border-red-400'
          : program.has_today_session
          ? 'border-amber-500/50 bg-[#0A1719] shadow-[0_0_20px_rgba(245,135,31,0.1)] hover:border-amber-400'
          : 'border-[#1A373E] bg-[#081619] hover:border-[#2A5762]'
      }`}
    >
      <div className="space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${pillar.accentColor}20`,
              color: pillar.accentColor,
            }}
          >
            {pillar.title}
          </span>

          {program.is_live_now ? (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 animate-pulse">
              <Radio className="h-3 w-3" /> LIVE NOW
            </span>
          ) : program.has_today_session ? (
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              TODAY'S SESSION
            </span>
          ) : program.progress_pct === 100 ? (
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              COMPLETED
            </span>
          ) : (
            <span className="text-[11px] text-[#8D9FA4]">
              {program.type === 'challenge' ? 'Live Challenge' : 'Self-Paced'}
            </span>
          )}
        </div>

        {/* Title & Short Description */}
        <div>
          <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
            {program.title}
          </h3>
          <p className="text-xs text-[#A0B1B5] line-clamp-2 mt-1">
            {program.short_description}
          </p>
        </div>

        {/* Next Session Info */}
        {next && (
          <div className="rounded-xl border border-[#1A373E] bg-[#0A1719] p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[#8D9FA4]">
              <span className="font-mono text-[11px] text-amber-400 font-bold">DAY {next.day_number}</span>
              <span className="text-[10px] uppercase font-semibold text-[#556B71]">{next.live_platform}</span>
            </div>
            <div className="font-medium text-white line-clamp-1">{next.title}</div>
            <div className="flex items-center gap-1 text-[11px] text-[#8D9FA4] pt-0.5">
              <Clock className="h-3 w-3 text-amber-400 shrink-0" />
              <span>{formatISTTimeOnly(next.scheduled_at)}</span>
              <span>•</span>
              <span>{formatISTDateOnly(next.scheduled_at)}</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#8D9FA4]">Progress</span>
            <span className="font-mono font-bold text-white">{program.progress_pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#0E2024] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
              style={{ width: `${program.progress_pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#556B71]">
            <span>{program.completed_sessions} of {program.total_sessions} completed</span>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-5 mt-4 border-t border-[#1A373E]/60 flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-400 group-hover:underline flex items-center gap-1">
          {program.is_live_now ? 'Join Live Stream' : 'Open Program Dashboard'}
        </span>
        <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default MyProgramsPage;
