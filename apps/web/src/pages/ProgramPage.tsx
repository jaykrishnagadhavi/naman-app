import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  useAuth,
  Button,
  FaqAccordion,
  CreatorCard,
  ErrorDetailsAlert,
  YouTubeVideoCard,
  CountdownTimer,
  StudentSessionCard,
} from '@abrainoconscious/ui';
import {
  fetchProgramPublicDetail,
  fetchProgramEnrolled,
  requestSessionLiveLink,
  requestSessionRecording,
  toggleTaskCompletion,
  formatPaise,
  formatDateIST,
  formatISTDateOnly,
  formatISTTimeOnly,
  getRootDomain,
  PILLARS,
  type ProgramPublicDetail,
  type EnrolledProgramDetail,
} from '@abrainoconscious/shared';
import {
  CheckCircle2,
  Clock,
  Play,
  Share2,
  ShieldCheck,
  Star,
  Users,
  AlertTriangle,
  RefreshCw,
  Radio,
  Video,
  Award,
  FileText,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export const ProgramPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { supabase, user } = useAuth();
  const queryClient = useQueryClient();
  const rootDomain = getRootDomain();

  const [copiedLink, setCopiedLink] = useState(false);

  // Live session join states
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [sessionRefusalReason, setSessionRefusalReason] = useState<string | null>(null);

  // 1. Fetch public details (always cached)
  const {
    data: program,
    isLoading: publicLoading,
    isError: publicError,
    error: publicErr,
    refetch: refetchPublic,
    isFetching: publicFetching,
  } = useQuery<ProgramPublicDetail | null>({
    queryKey: ['public-program', slug],
    queryFn: () => (slug ? fetchProgramPublicDetail(supabase, slug) : Promise.resolve(null)),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch enrolled details if logged in
  const {
    data: enrolledData,
    isLoading: enrolledLoading,
    refetch: refetchEnrolled,
  } = useQuery<EnrolledProgramDetail | null>({
    queryKey: ['enrolled-program', slug, user?.id],
    queryFn: async () => {
      if (!slug || !user) return null;
      try {
        return await fetchProgramEnrolled(supabase, slug);
      } catch {
        return null;
      }
    },
    enabled: Boolean(slug && user),
    staleTime: 1000 * 30,
  });

  const isEnrolled = Boolean(enrolledData?.is_enrolled && enrolledData?.enrollment?.status === 'active');
  const isRevoked = Boolean(enrolledData?.is_enrolled && enrolledData?.enrollment?.status === 'revoked');

  // Task Toggle Mutation
  const taskMutation = useMutation({
    mutationFn: async ({ sessionId, completed }: { sessionId: string; completed: boolean }) => {
      return toggleTaskCompletion(supabase, sessionId, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolled-program', slug, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-enrolled-programs'] });
    },
  });

  // Join Live Session Handler
  const handleJoinLive = async (sessionId: string) => {
    setJoiningSessionId(sessionId);
    setSessionRefusalReason(null);

    try {
      const res = await requestSessionLiveLink(supabase, sessionId);

      if (!res.ok) {
        if (res.reason === 'too_early') {
          const opensAtStr = res.opens_at ? formatISTTimeOnly(res.opens_at) : '60 minutes before call';
          setSessionRefusalReason(`Live join link opens at ${opensAtStr} IST.`);
        } else if (res.reason === 'ended') {
          setSessionRefusalReason('This session has already ended. Watch the recording below.');
        } else if (res.reason === 'not_published') {
          setSessionRefusalReason('The live stream link will be published by Naman shortly.');
        } else if (res.reason === 'not_enrolled') {
          setSessionRefusalReason('An active enrollment is required to join live calls.');
        } else {
          setSessionRefusalReason('Unable to open live link right now.');
        }
        return;
      }

      if (res.live_url) {
        // Open live link in a secure new tab
        window.open(res.live_url, '_blank', 'noopener,noreferrer');
        // Refresh enrolled details to reflect attendance checkmark
        refetchEnrolled();
      }
    } catch (err: any) {
      setSessionRefusalReason(err.message || 'Error connecting to live call.');
    } finally {
      setJoiningSessionId(null);
    }
  };

  // Watch Recording Handler
  const handleWatchRecording = async (sessionId: string) => {
    try {
      const res = await requestSessionRecording(supabase, sessionId);
      if (res.ok && res.recording_url) {
        window.open(res.recording_url, '_blank', 'noopener,noreferrer');
      } else {
        alert('Recording will be uploaded and accessible shortly.');
      }
    } catch {
      alert('Unable to retrieve recording link.');
    }
  };

  // Share handler
  const handleShare = async () => {
    const shareUrl = window.location.href;
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);

    if (navigator.share) {
      try {
        await navigator.share({
          title: program?.title || 'ABrainoConscious Program',
          text: program?.short_description,
          url: shareUrl,
        });
      } catch {
        // Fall back quietly
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (err) {
        console.warn('Failed to copy link to clipboard:', err);
      }
    }
  };

  // Join button click action (Preview Mode)
  const handleJoinClick = () => {
    if (!program) return;
    if (isEnrolled) {
      navigate('/my-programs');
    } else if (user) {
      navigate(`/checkout/${program.slug}`);
    } else {
      navigate(`/signup?program=${program.slug}`);
    }
  };

  if (publicLoading || enrolledLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse py-6">
        <div className="h-8 w-48 rounded bg-[#0E2024]" />
        <div className="h-12 w-3/4 rounded bg-[#0E2024]" />
        <div className="h-4 w-1/2 rounded bg-[#0E2024]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          <div className="lg:col-span-8 space-y-6">
            <div className="aspect-video w-full rounded-2xl bg-[#0E2024]" />
            <div className="h-48 rounded-2xl bg-[#0E2024]" />
          </div>
          <div className="lg:col-span-4 h-96 rounded-2xl bg-[#0E2024]" />
        </div>
      </div>
    );
  }

  if (publicError) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4">
        <ErrorDetailsAlert
          title="Unable to load program"
          error={publicErr}
        />
        <Button variant="outline" size="sm" onClick={() => refetchPublic()} disabled={publicFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${publicFetching ? 'animate-spin' : ''}`} /> Try Again
        </Button>
      </div>
    );
  }

  // Not found or draft protected
  if (!program) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <span className="font-serif text-5xl font-bold text-amber-500">404</span>
        <h2 className="font-serif text-2xl font-bold text-white">Program Not Found</h2>
        <p className="text-xs text-[#8D9FA4]">
          This cohort or course could not be located, or is currently undergoing preparation by Naman.
        </p>
        <Button variant="primary" onClick={() => navigate('/explore')}>
          Browse Available Programs &rarr;
        </Button>
      </div>
    );
  }

  const pillarInfo = PILLARS[program.category];
  const seatsLow = typeof program.seats_left === 'number' && program.seats_left <= 10 && program.seats_left > 0;
  const isSoldOut = typeof program.seats_left === 'number' && program.seats_left === 0;

  // ============================================================================
  // MODE 1: REVOKED OR EXPIRED ACCESS STATE
  // ============================================================================
  if (isRevoked) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-[#081619] p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <h2 className="font-serif text-2xl font-bold text-white">Your Cohort Access Has Ended</h2>
          </div>
          <p className="text-xs text-[#A0B1B5] leading-relaxed">
            Your enrollment in <strong>{program.title}</strong> has concluded or been revoked by administration.
            Live call access, secret links, and cohort submissions are no longer active for this account.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/my-programs')}>
              &larr; Return to My Programs
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/support')}>
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE 2: ACTIVE ENROLLED STUDENT JOURNEY VIEW
  // ============================================================================
  if (isEnrolled && enrolledData) {
    const { sessions, today_session: todaySession, stats } = enrolledData;

    return (
      <div className="space-y-8 max-w-5xl mx-auto py-4">
        <Helmet>
          <title>{program.title} | Enrolled Student Dashboard</title>
        </Helmet>

        {/* Top Header & Breadcrumb */}
        <div className="space-y-4 border-b border-[#1A373E] pb-6">
          <button
            type="button"
            onClick={() => navigate('/my-programs')}
            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
          >
            &larr; All My Programs
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${pillarInfo.accentColor}20`,
                    color: pillarInfo.accentColor,
                  }}
                >
                  {pillarInfo.title}
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                  ACTIVE ENROLLMENT
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                {program.title}
              </h1>
            </div>

            {/* Overall Progress Widget */}
            <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-3 px-4 min-w-[200px] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8D9FA4]">Cohort Progress</span>
                <span className="font-mono font-bold text-amber-400">{stats.progress_pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#0E2024] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${stats.progress_pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#556B71]">
                <span>{stats.attended_sessions} sessions attended</span>
                <span>{stats.completed_tasks} tasks completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Journey Four-Step Daily Checklist (SPEC Section 9) */}
        <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span>Your Daily Growth Checklist</span>
            </h2>
            <span className="text-[11px] text-[#8D9FA4]">Daily rhythm for maximum transformation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Step 1: Core Lesson / Video */}
            <div className="rounded-xl border border-[#1A373E] bg-[#0A1719] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[#8D9FA4]">
                <span className="font-bold text-white text-[11px]">1. Watch</span>
                <Play className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-[#A0B1B5]">
                Absorb the day's framework, mindset models, and live case breakdowns.
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold block">Daily Foundation</span>
            </div>

            {/* Step 2: Daily Worksheet Task */}
            <div className="rounded-xl border border-[#1A373E] bg-[#0A1719] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[#8D9FA4]">
                <span className="font-bold text-white text-[11px]">2. Do Today's Task</span>
                <FileText className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-[#A0B1B5]">
                Apply the exercises in today's reflection worksheet and mark complete.
              </p>
              <span className="text-[10px] text-amber-400 font-semibold block">
                {todaySession?.task_completed ? '✓ Completed Today' : 'Pending Action'}
              </span>
            </div>

            {/* Step 3: Attend Live Call */}
            <div className="rounded-xl border border-[#1A373E] bg-[#0A1719] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[#8D9FA4]">
                <span className="font-bold text-white text-[11px]">3. Attend Live Call</span>
                <Radio className="h-3.5 w-3.5 text-red-400" />
              </div>
              <p className="text-[11px] text-[#A0B1B5]">
                Direct live morning stream with Naman. Join below when the window opens.
              </p>
              <span className="text-[10px] text-red-400 font-semibold block">
                {todaySession?.attended ? '✓ Attendance Logged' : 'Live Morning Session'}
              </span>
            </div>

            {/* Step 4: Community Reflection */}
            <div className="rounded-xl border border-[#1A373E] bg-[#0A1719] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[#8D9FA4]">
                <span className="font-bold text-white text-[11px]">4. Community Circle</span>
                <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-[#A0B1B5]">
                Share your takeaway or ask a question in the student cohort feed.
              </p>
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="text-[10px] text-amber-400 font-bold hover:underline block"
              >
                Open Community &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Refusal Reason Alert (if join live clicked outside window) */}
        {sessionRefusalReason && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Live Call Notice</p>
              <p className="mt-0.5">{sessionRefusalReason}</p>
            </div>
          </div>
        )}

        {/* Today's Featured Live Session Card */}
        {todaySession ? (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Radio className="h-5 w-5 text-amber-400" />
              <span>Today's Focus & Live Session</span>
            </h2>

            <StudentSessionCard
              dayNumber={todaySession.day_number}
              title={todaySession.title}
              scheduledAt={todaySession.scheduled_at}
              livePlatform={todaySession.live_platform as any}
              status={todaySession.status as any}
              description={todaySession.description}
              taskTitle={todaySession.task_title}
              taskBody={todaySession.task_body}
              resources={todaySession.resources}
              recordingVisible={todaySession.has_recording}
              taskCompleted={todaySession.task_completed}
              isJoining={joiningSessionId === todaySession.id}
              hasLiveLink={todaySession.has_live_link}
              onJoinLive={() => handleJoinLive(todaySession.id)}
              onWatchRecording={() => handleWatchRecording(todaySession.id)}
              onToggleTask={(completed) =>
                taskMutation.mutate({ sessionId: todaySession.id, completed })
              }
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 text-center text-xs text-[#8D9FA4]">
            No live session scheduled for today. Check the full challenge schedule below.
          </div>
        )}

        {/* Full Challenge Schedule List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A373E] pb-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>Full Cohort Schedule ({sessions.length} Days)</span>
            </h2>
            <span className="text-xs text-[#8D9FA4]">
              {stats.attended_sessions} of {sessions.length} days attended
            </span>
          </div>

          <div className="space-y-3">
            {sessions.map((sess) => {
              const isPast = sess.status === 'ended' || new Date(sess.scheduled_at) < new Date();
              return (
                <div
                  key={sess.id}
                  className="rounded-xl border border-[#1A373E] bg-[#081619] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#2A5762] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 font-mono text-xs font-bold text-amber-400 shrink-0">
                      D{sess.day_number}
                    </span>

                    <div className="space-y-0.5">
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{sess.title}</span>
                        {sess.attended && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Attended
                          </span>
                        )}
                        {sess.task_completed && (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-400">
                            <CheckCircle2 className="h-3 w-3" /> Task Done
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#8D9FA4]">
                        <span>{formatISTDateOnly(sess.scheduled_at)}</span>
                        <span>•</span>
                        <span>{formatISTTimeOnly(sess.scheduled_at)}</span>
                        <span>•</span>
                        <span className="capitalize">{sess.live_platform}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sess.has_recording ? (
                      <button
                        type="button"
                        onClick={() => handleWatchRecording(sess.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#234A54] bg-[#0E2024] px-3 py-1.5 text-xs text-white hover:bg-[#152B30] transition-colors"
                      >
                        <Video className="h-3.5 w-3.5 text-amber-400" />
                        <span>Watch Recording</span>
                      </button>
                    ) : isPast ? (
                      <span className="text-[11px] text-[#556B71]">Recording coming soon</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoinLive(sess.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition-colors"
                      >
                        <Radio className="h-3.5 w-3.5" />
                        <span>Join Live</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate Progress Card */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#081619] to-[#0A1719] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Award className="h-4 w-4" />
                <span>Certificate of Completion Milestone</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-white">
                Verifiable ABrainoConscious Growth Credential
              </h3>
              <p className="text-xs text-[#A0B1B5] max-w-lg">
                Complete at least 80% of daily challenge sessions and reflection tasks to unlock your personalized,
                digitally verifiable certificate signed by Naman.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className="text-xs text-[#8D9FA4] block">Required: 80%</span>
              <span className="font-serif text-2xl font-bold text-amber-400">
                {stats.progress_pct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE 3: PUBLIC PREVIEW MODE (When user is not enrolled or guest)
  // ============================================================================
  const extractYouTubeId = (url?: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const trailerVideoId = extractYouTubeId(program.promo_video_url);

  // JSON-LD Structured Data
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': program.type === 'challenge' ? 'Event' : 'Course',
    name: program.title,
    description: program.short_description,
    image: program.poster_image_url || program.thumbnail_url,
    offers: {
      '@type': 'Offer',
      price: program.price_paise / 100,
      priceCurrency: 'INR',
      availability: isSoldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'Organization',
      name: 'ABrainoConscious',
      url: `https://${rootDomain}`,
    },
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      <Helmet>
        <title>{program.title} | ABrainoConscious by Naman</title>
        <meta name="description" content={program.short_description} />
        <meta property="og:title" content={`${program.title} | ABrainoConscious`} />
        <meta property="og:description" content={program.short_description} />
        {program.poster_image_url && <meta property="og:image" content={program.poster_image_url} />}
        <script type="application/ld+json">{JSON.stringify(jsonLdData)}</script>
      </Helmet>

      {/* Hero Header Strip */}
      <div className="space-y-4 border-b border-[#1A373E] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${pillarInfo.accentColor}20`,
                color: pillarInfo.accentColor,
              }}
            >
              {pillarInfo.title}
            </span>
            <span className="rounded bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-[#8D9FA4] uppercase tracking-wider">
              {program.type === 'challenge' ? 'Live Cohort Challenge' : 'Masterclass Course'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-1.5 text-xs text-[#8D9FA4] hover:text-white transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Program'}</span>
          </button>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
          {program.title}
        </h1>

        <p className="text-base text-[#A0B1B5] max-w-3xl leading-relaxed">
          {program.short_description}
        </p>

        {/* Quick Meta Row */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-[#8D9FA4]">
          {program.rating_summary && program.rating_summary.review_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-white">
                {program.rating_summary.average_rating.toFixed(1)}
              </span>
              <span>({program.rating_summary.review_count} reviews)</span>
            </div>
          )}

          {program.starts_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Starts {formatDateIST(program.starts_at)}</span>
            </div>
          )}

          {typeof program.seats_left === 'number' && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-amber-400" />
              <span className={seatsLow ? 'text-amber-400 font-bold' : ''}>
                {isSoldOut ? 'Sold out' : `${program.seats_left} seats remaining`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Curriculum & Details, Right Pricing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Trailer Video (if available) or Poster Fallback */}
          {trailerVideoId ? (
            <div className="space-y-2">
              <YouTubeVideoCard
                videoId={trailerVideoId}
                title={`${program.title} Preview Trailer`}
              />
              <span className="text-[11px] text-[#556B71] block">
                Official program preview and introduction with Naman.
              </span>
            </div>
          ) : program.cover_image_url ? (
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#1A373E]">
              <img
                src={program.cover_image_url}
                alt={program.cover_image_alt || program.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          {/* What You Will Learn */}
          {program.what_you_will_learn && program.what_you_will_learn.length > 0 && (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-4">
              <h2 className="font-serif text-xl font-bold text-white">What You Will Master</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#E1E8EA]">
                {program.what_you_will_learn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Description */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-white">About This Cohort</h2>
            <div className="prose prose-invert prose-sm text-[#A0B1B5] leading-relaxed max-w-none">
              <p className="whitespace-pre-line">{program.description}</p>
            </div>
          </div>

          {/* Challenge Sessions Preview (Day by Day) */}
          {program.type === 'challenge' && program.sessions && program.sessions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-white">
                  Day-by-Day Challenge Roadmap ({program.sessions.length} Days)
                </h2>
                <span className="text-xs text-[#8D9FA4]">Daily IST Schedule</span>
              </div>

              <div className="space-y-3">
                {program.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="rounded-xl border border-[#1A373E] bg-[#081619] p-4 space-y-2 hover:border-[#2A5762] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 font-mono font-bold text-amber-400">
                        DAY {sess.day_number}
                      </span>
                      <span className="text-[#8D9FA4] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        {formatDateIST(sess.scheduled_at)}
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-white">{sess.title}</h3>
                    {sess.description && (
                      <p className="text-xs text-[#A0B1B5] leading-relaxed">{sess.description}</p>
                    )}
                    {sess.task_title && (
                      <div className="pt-2 text-xs text-amber-400 flex items-center gap-1.5 border-t border-[#1A373E]/60">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Daily Action: {sess.task_title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creator Bio */}
          <CreatorCard />

          {/* FAQs */}
          {program.faq && program.faq.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-white">Frequently Asked Questions</h2>
              <FaqAccordion items={program.faq} />
            </div>
          )}
        </div>

        {/* Right Column: Sticky Pricing & Enrol CTA Card (4 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
          <div className="rounded-2xl border border-amber-500/40 bg-[#0E2024] p-6 text-white space-y-5 shadow-2xl">
            {/* Countdown / Seats Warning */}
            {program.enrollment_deadline && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                <span className="font-bold block mb-1">Admissions Close In:</span>
                <CountdownTimer targetDate={program.enrollment_deadline} />
              </div>
            )}

            {/* Price block */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-white">
                  {program.price_paise === 0 ? 'FREE' : formatPaise(program.price_paise)}
                </span>
                {program.compare_at_price_paise && program.compare_at_price_paise > program.price_paise && (
                  <span className="text-sm text-[#8D9FA4] line-through">
                    {formatPaise(program.compare_at_price_paise)}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#8D9FA4] block">All-inclusive cohort tuition & materials</span>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              variant="cta"
              onClick={handleJoinClick}
              disabled={isSoldOut}
              className="w-full font-bold shadow-lg text-sm"
            >
              {isSoldOut ? (
                'COHORT SOLD OUT'
              ) : program.price_paise === 0 ? (
                'JOIN FOR FREE &rarr;'
              ) : user ? (
                'PROCEED TO ENROLLMENT &rarr;'
              ) : (
                'JOIN THIS PROGRAM &rarr;'
              )}
            </Button>

            {/* Guarantees & Features */}
            <div className="space-y-3 pt-2 border-t border-[#1A373E] text-xs text-[#8D9FA4]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>7-Day 100% Money-Back Guarantee</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Direct Live Morning Calls with Naman</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Actionable Structured Worksheets & Tasks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Official Verified Certificate of Completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramPage;
