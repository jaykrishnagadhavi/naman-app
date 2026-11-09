import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  useAuth,
  HeroBanner,
  ContentRail,
  PosterCard,
  StatsStrip,
  Button,
} from '@abrainoconscious/ui';
import {
  fetchTrendingPrograms,
  fetchCatalog,
  fetchPublicStats,
  fetchMyPrograms,
  getRootDomain,
  PILLARS,
  type CatalogItem,
  type PublicStats,
  type MyProgramItem,
} from '@abrainoconscious/shared';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { supabase, user } = useAuth();
  const rootDomain = getRootDomain();

  // 0. Fetch Enrolled Programs (for authenticated students)
  const { data: myPrograms = [] } = useQuery<MyProgramItem[]>({
    queryKey: ['home-my-programs', user?.id],
    queryFn: () => fetchMyPrograms(supabase),
    enabled: Boolean(user),
    staleTime: 1000 * 30,
  });

  // 1. Fetch Trending Programs (Ranked)
  const { data: trending = [], isLoading: trendingLoading } = useQuery<CatalogItem[]>({
    queryKey: ['home-trending-programs'],
    queryFn: () => fetchTrendingPrograms(supabase, 10),
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch All Published Programs
  const { data: catalogResult, isLoading: catalogLoading } = useQuery({
    queryKey: ['home-catalog-programs'],
    queryFn: () => fetchCatalog(supabase, { limit: 50, sort: 'sort_order' }),
    staleTime: 1000 * 60 * 5,
  });

  const allPrograms = catalogResult?.items || [];

  // 3. Fetch Platform Stats for Quiet Strip
  const { data: stats } = useQuery<PublicStats>({
    queryKey: ['public-platform-stats'],
    queryFn: () => fetchPublicStats(supabase),
    staleTime: 1000 * 60 * 15,
  });

  // Categorize programs for content rails
  const challenges = allPrograms.filter((p) => p.type === 'challenge');
  const courses = allPrograms.filter((p) => p.type === 'course');
  const startingSoon = allPrograms
    .filter((p) => p.starts_at && new Date(p.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());

  // Growth Pillars
  const emotionalPrograms = allPrograms.filter((p) => p.category === 'emotional');
  const mentalPrograms = allPrograms.filter((p) => p.category === 'mental');
  const academicPrograms = allPrograms.filter((p) => p.category === 'academic');
  const personalPrograms = allPrograms.filter((p) => p.category === 'personal');

  // Featured Hero Program: Soonest live challenge, or first trending, or fallback
  const heroProgram =
    startingSoon[0] ||
    trending[0] ||
    challenges[0] ||
    allPrograms[0];

  const hasLiveSessionNow = heroProgram?.status === 'live';

  return (
    <div className="space-y-12">
      <Helmet>
        <title>Student Portal | ABrainoConscious by Naman</title>
        <meta
          name="description"
          content="Transform your mindset, academic performance, emotional resilience, and daily habits with Naman's live cohorts and courses."
        />
        <meta property="og:title" content="Student Portal | ABrainoConscious" />
        <meta property="og:description" content="Four Pillars of Personal Growth with Naman." />
        <meta property="og:url" content={`https://app.${rootDomain}/`} />
      </Helmet>

      {/* Dynamic Streaming Hero Banner (Adapts for enrolled students per SPEC section 9) */}
      {myPrograms.length > 0 ? (
        (() => {
          const liveEnrolled = myPrograms.find((p) => p.is_live_now);
          const upcomingEnrolled = myPrograms.find((p) => p.next_session && new Date(p.next_session.scheduled_at) >= new Date());
          const activeEnrolled = myPrograms[0];

          if (liveEnrolled) {
            return (
              <HeroBanner
                variant="live-now"
                title={liveEnrolled.title}
                subtitle="Your cohort live session with Naman is happening right now. Click to join directly."
                programTitle={`Day ${liveEnrolled.next_session?.day_number || 'Live'} • Interactive Call`}
                onAction={() => navigate(`/programs/${liveEnrolled.slug}`)}
              />
            );
          }

          if (upcomingEnrolled && upcomingEnrolled.next_session) {
            return (
              <HeroBanner
                variant="next-session"
                title={upcomingEnrolled.title}
                subtitle={`Next up: Day ${upcomingEnrolled.next_session.day_number} • ${upcomingEnrolled.next_session.title}`}
                programTitle="Your Next Scheduled Cohort Call"
                targetDate={upcomingEnrolled.next_session.scheduled_at}
                onAction={() => navigate(`/programs/${upcomingEnrolled.slug}`)}
              />
            );
          }

          return (
            <HeroBanner
              variant="continue-watching"
              title={activeEnrolled.title}
              subtitle={`You have completed ${activeEnrolled.progress_pct}% of your challenge milestones.`}
              programTitle="Continue Learning"
              onAction={() => navigate(`/programs/${activeEnrolled.slug}`)}
            />
          );
        })()
      ) : heroProgram ? (
        <HeroBanner
          variant={hasLiveSessionNow ? 'live-now' : 'next-session'}
          title={heroProgram.title}
          subtitle={heroProgram.short_description}
          programTitle={heroProgram.type === 'challenge' ? 'Live Cohort Challenge' : 'Masterclass Course'}
          targetDate={heroProgram.starts_at || undefined}
          onAction={() => navigate(`/programs/${heroProgram.slug}`)}
        />
      ) : catalogLoading ? (
        <div className="h-48 sm:h-64 w-full rounded-2xl bg-[#0E2024] animate-pulse border border-[#1A373E]" />
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#0E2024] to-[#081619] p-8 text-white space-y-3">
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
            Welcome to ABrainoConscious
          </span>
          <h2 className="font-serif text-3xl font-bold">The Four Pillars of Personal Growth</h2>
          <p className="text-sm text-[#8D9FA4] max-w-xl">
            Explore live cohorts and structured courses in Emotional Resilience, Mental Clarity, Academic Focus, and Personal Momentum.
          </p>
          <Button variant="primary" onClick={() => navigate('/explore')}>
            Browse Library &rarr;
          </Button>
        </div>
      )}

      {/* "Your Programs" Rail for Enrolled Students */}
      {myPrograms.length > 0 && (
        <section>
          <ContentRail
            title="Your Active Programs"
            subtitle="Continue your daily challenges, worksheets, and live streams"
            action={
              <button
                type="button"
                onClick={() => navigate('/my-programs')}
                className="text-xs text-amber-400 hover:underline"
              >
                View All &rarr;
              </button>
            }
          >
            {myPrograms.map((p) => (
              <PosterCard
                key={p.enrollment_id}
                id={p.program_id}
                title={p.title}
                category={p.category}
                aspectRatio="2:3"
                coverImage={p.poster_image_url || p.thumbnail_url || undefined}
                progressPercent={p.progress_pct}
                lessonCount={p.total_sessions}
                onSelect={() => navigate(`/programs/${p.slug}`)}
              />
            ))}
          </ContentRail>
        </section>
      )}

      {/* Pinned Welcome Tip Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-[#0E2024]/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-ambient">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-black font-bold text-xs shrink-0">
            📢
          </span>
          <div>
            <h4 className="text-xs font-bold text-white">Interactive Live Cohorts Guided Directly by Naman</h4>
            <p className="text-[11px] text-[#8D9FA4]">
              Daily live calls, structured worksheets, and peer accountability across India.
            </p>
          </div>
        </div>
        <Button size="sm" variant="cta" onClick={() => navigate('/explore')}>
          Explore All Programs &rarr;
        </Button>
      </div>

      {/* 1. Peterson Academy-Style Ranked Trending Rail */}
      <section>
        <ContentRail
          title="Trending Cohorts"
          subtitle="Most popular live challenges and courses among students"
        >
          {trendingLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 w-48 sm:w-56 rounded-xl bg-[#0E2024] animate-pulse shrink-0 border border-[#1A373E]" />
            ))
          ) : trending.length > 0 ? (
            trending.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="2:3"
                rankNumber={prog.rank}
                coverImage={prog.poster_image_url || undefined}
                coverSrcset={prog.poster_srcset || undefined}
                lessonCount={prog.total_lessons || prog.total_sessions}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
              />
            ))
          ) : (
            <div className="text-xs text-[#8D9FA4] py-8 px-4">
              New cohort cohorts are being scheduled. Check out our foundational courses below.
            </div>
          )}
        </ContentRail>
      </section>

      {/* 2. Starting Soon Rail */}
      {startingSoon.length > 0 && (
        <section>
          <ContentRail
            title="Starting Soon"
            subtitle="Secure your seat before upcoming enrollment deadlines close"
          >
            {startingSoon.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="16:9"
                coverImage={prog.thumbnail_url || undefined}
                coverSrcset={prog.thumbnail_srcset || undefined}
                lessonCount={prog.total_sessions || prog.total_lessons}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
              />
            ))}
          </ContentRail>
        </section>
      )}

      {/* 3. Live Cohort Challenges */}
      {challenges.length > 0 && (
        <section>
          <ContentRail
            title="Live Cohort Challenges"
            subtitle="Transformative daily routines with live morning calls and accountability"
          >
            {challenges.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="2:3"
                coverImage={prog.poster_image_url || undefined}
                coverSrcset={prog.poster_srcset || undefined}
                lessonCount={prog.total_sessions}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
              />
            ))}
          </ContentRail>
        </section>
      )}

      {/* 4. Structured Self-Paced Courses */}
      {courses.length > 0 && (
        <section>
          <ContentRail
            title="Structured Masterclasses"
            subtitle="Deep-dive frameworks and actionable video lessons at your own pace"
          >
            {courses.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="16:9"
                coverImage={prog.thumbnail_url || undefined}
                coverSrcset={prog.thumbnail_srcset || undefined}
                lessonCount={prog.total_lessons}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
              />
            ))}
          </ContentRail>
        </section>
      )}

      {/* 5. Four Growth Pillars Rails */}
      {emotionalPrograms.length > 0 && (
        <section>
          <ContentRail
            title={PILLARS.emotional.title}
            subtitle={PILLARS.emotional.tagline}
          >
            {emotionalPrograms.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="2:3"
                coverImage={prog.poster_image_url || undefined}
                coverSrcset={prog.poster_srcset || undefined}
                lessonCount={prog.total_lessons || prog.total_sessions}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
              />
            ))}
          </ContentRail>
        </section>
      )}

      {mentalPrograms.length > 0 && (
        <section>
          <ContentRail
            title={PILLARS.mental.title}
            subtitle={PILLARS.mental.tagline}
          >
            {mentalPrograms.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="2:3"
                coverImage={prog.poster_image_url || undefined}
                coverSrcset={prog.poster_srcset || undefined}
                lessonCount={prog.total_lessons || prog.total_sessions}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
              />
            ))}
          </ContentRail>
        </section>
      )}

      {academicPrograms.length > 0 && (
        <section>
          <ContentRail
            title={PILLARS.academic.title}
            subtitle={PILLARS.academic.tagline}
          >
            {academicPrograms.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="2:3"
                coverImage={prog.poster_image_url || undefined}
                coverSrcset={prog.poster_srcset || undefined}
                lessonCount={prog.total_lessons || prog.total_sessions}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
              />
            ))}
          </ContentRail>
        </section>
      )}

      {personalPrograms.length > 0 && (
        <section>
          <ContentRail
            title={PILLARS.personal.title}
            subtitle={PILLARS.personal.tagline}
          >
            {personalPrograms.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="2:3"
                coverImage={prog.poster_image_url || undefined}
                coverSrcset={prog.poster_srcset || undefined}
                lessonCount={prog.total_lessons || prog.total_sessions}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
              />
            ))}
          </ContentRail>
        </section>
      )}

      {/* Quiet Public Stats Strip */}
      {stats && stats.students > 0 && (
        <section className="pt-6">
          <StatsStrip
            variant="dark"
            stats={[
              {
                value: `${stats.students.toLocaleString('en-IN')}+`,
                label: 'Active Students',
                detail: 'Growing across 4 pillars',
              },
              {
                value: `${stats.programs}`,
                label: 'Guided Programs',
                detail: 'Designed & taught by Naman',
              },
              {
                value: `${stats.hours}+`,
                label: 'Hours of Structured Learning',
                detail: 'Ad-free in our private player',
              },
              {
                value: '98%',
                label: 'Completion Benchmark',
                detail: 'Across live challenge cohorts',
              },
            ]}
          />
        </section>
      )}
    </div>
  );
};
