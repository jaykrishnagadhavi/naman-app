import React, { useState, useEffect } from 'react';
import {
  LandingLayout,
  StatsStrip,
  SectionBand,
  StoryPanel,
  EmpathyList,
  NumberedSteps,
  ModuleAccordion,
  CreatorCard,
  TestimonialCard,
  PricingCard,
  FaqAccordion,
  YouTubeVideoCard,
  PillarCard,
  PosterCard,
  ContentRail,
  BadgeTile,
  StickyCtaBar,
  JoinButton,
  Button,
  Img
} from '@abrainoconscious/ui';
import { PILLARS, type GrowthPillar } from '@abrainoconscious/shared';
import {
  ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Video, Calendar,
  Smartphone, Award, MessageSquare, HeartHandshake, Brain, GraduationCap
} from 'lucide-react';
import { LANDING_COPY } from '../data/landingCopy';

export const LandingPage: React.FC = () => {
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling past 500px (past hero)
      if (window.scrollY > 500) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleJoin = () => {
    window.location.href = 'http://localhost:5173/signup?program=21-day-mindset';
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:5173/login';
  };

  const getPillarIcon = (pillar: GrowthPillar) => {
    switch (pillar) {
      case 'emotional': return <HeartHandshake className="h-6 w-6" />;
      case 'mental': return <Brain className="h-6 w-6" />;
      case 'academic': return <GraduationCap className="h-6 w-6" />;
      case 'personal': return <Sparkles className="h-6 w-6" />;
    }
  };

  return (
    <LandingLayout onJoin={handleJoin} onLogin={handleLogin}>
      {/* 1. HERO SECTION (Dark, Cinematic, Naman Studio Photo with Gradient Overlay) */}
      <section className="relative overflow-hidden bg-[#040C0E] pt-8 pb-16 sm:py-24 border-b border-[#1A373E]">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6 z-10 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{LANDING_COPY.hero.badge}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F8FAFA] leading-[1.15]">
                {LANDING_COPY.hero.headline}
              </h1>

              <p className="text-base sm:text-lg text-[#8D9FA4] leading-relaxed max-w-xl">
                {LANDING_COPY.hero.subhead}
              </p>

              {/* Main CTAs */}
              <div className="pt-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Button
                    size="xl"
                    variant="cta"
                    onClick={handleJoin}
                    className="shadow-glow"
                  >
                    {LANDING_COPY.hero.ctaPrimary} <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="text-xs text-[#8D9FA4] hover:text-white transition-colors underline underline-offset-4"
                  >
                    {LANDING_COPY.hero.ctaSecondary}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8D9FA4] pt-1">
                  <ShieldCheck className="h-4 w-4 text-[#00A884]" />
                  <span>{LANDING_COPY.hero.trustLine}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Real Portrait with Gradient Shield */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto aspect-[16/10] sm:aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-[#1A373E] bg-[#040C0E] shadow-2xl">
                {/* Real photo of Naman */}
                <Img
                  id="naman/naman-header"
                  alt="Naman teaching with a marker ready to guide students"
                  aspectRatio="4/5"
                  priority={true}
                  focalPoint="50% 32%"
                  className="h-full w-full object-cover"
                />
                {/* Left/Bottom dark gradient overlay so text stays readable and edges fade naturally */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#040C0E] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#040C0E]/40 via-transparent to-transparent" />

                {/* Floating badge stamp */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md">
                  <div>
                    <p className="font-serif text-sm font-bold text-white">Naman</p>
                    <p className="text-[11px] text-amber-400">ABrainoConscious YouTube & Live Cohorts</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Live Mentor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS STRIP (Peterson Academy style) */}
      <StatsStrip stats={LANDING_COPY.stats} />

      {/* 3. FOUR GROWTH PILLARS OVERVIEW */}
      <section id="pillars" className="py-20 bg-[#040C0E] border-b border-[#1A373E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              The Framework
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
              Growth Across the Four Pillars
            </h2>
            <p className="text-sm text-[#8D9FA4]">
              You cannot fix exam pressure without emotional grounding. You cannot build habits with a foggy mind. We build all four together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(['emotional', 'mental', 'academic', 'personal'] as GrowthPillar[]).map((pKey) => {
              const p = PILLARS[pKey];
              return (
                <PillarCard
                  key={pKey}
                  title={p.title}
                  tagline={p.tagline}
                  description={p.description}
                  icon={getPillarIcon(pKey)}
                  programsCount={3}
                  onClick={handleJoin}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. STORY BAND (Warm Cream Paper — Art of Conversation style) */}
      <SectionBand id="story" variant="paper" className="border-b border-[#E0DBD0]">
        <div className="space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              The Real Struggles
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#142225]">
              Six Everyday Battles. One Clear Way Forward.
            </h2>
            <p className="text-sm text-[#52676B]">
              Real student scenarios told with empathy and hope. No shaming, just practical systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LANDING_COPY.storyPanels.map((panel) => (
              <StoryPanel
                key={panel.number}
                number={panel.number}
                pillar={panel.pillar}
                title={panel.title}
                beforeText={panel.beforeText}
                afterText={panel.afterText}
              />
            ))}
          </div>

          <div className="text-center pt-4">
            <Button variant="cta" size="lg" onClick={handleJoin} className="bg-amber-600 hover:bg-amber-700 text-white shadow-md">
              START YOUR SHIFT TODAY &rarr;
            </Button>
          </div>
        </div>
      </SectionBand>

      {/* 5. "LET'S TALK ABOUT YOU" (Empathy Checklist) */}
      <SectionBand variant="paper" className="border-b border-[#E0DBD0] bg-[#EFECE1]">
        <EmpathyList
          items={LANDING_COPY.empathyQuestions}
          onCtaClick={handleJoin}
        />
      </SectionBand>

      {/* 6. TRENDING RAIL (Peterson Academy 1-10 Ranked Poster Rail) */}
      <section id="programs" className="py-16 bg-[#040C0E] border-b border-[#1A373E]">
        <ContentRail
          title="Trending Cohorts & Programs"
          subtitle="Ranked by active student participation this month"
          action={
            <Button size="sm" variant="ghost" onClick={handleJoin}>
              View All &rarr;
            </Button>
          }
        >
          <PosterCard
            id="p1"
            title="The 21-Day Mind & Focus Reset"
            category="Mental & Academic"
            aspectRatio="2:3"
            rankNumber={1}
            lessonCount={21}
            pricePaise={99900}
            compareAtPricePaise={249900}
            onSelect={handleJoin}
          />
          <PosterCard
            id="p2"
            title="Emotional De-escalation Under Pressure"
            category="Emotional Pillar"
            aspectRatio="2:3"
            rankNumber={2}
            lessonCount={14}
            pricePaise={79900}
            compareAtPricePaise={199900}
            onSelect={handleJoin}
          />
          <PosterCard
            id="p3"
            title="Deep Work & Exam Mastery Protocol"
            category="Academic Pillar"
            aspectRatio="2:3"
            rankNumber={3}
            lessonCount={18}
            pricePaise={129900}
            compareAtPricePaise={299900}
            onSelect={handleJoin}
          />
          <PosterCard
            id="p4"
            title="Habit Architecture for Imperfect Days"
            category="Personal Pillar"
            aspectRatio="2:3"
            rankNumber={4}
            lessonCount={12}
            pricePaise={69900}
            compareAtPricePaise={149900}
            onSelect={handleJoin}
          />
          <PosterCard
            id="p5"
            title="Overcoming Social Anxiety & Speaking Calmly"
            category="Emotional & Personal"
            aspectRatio="2:3"
            rankNumber={5}
            lessonCount={16}
            pricePaise={89900}
            compareAtPricePaise={199900}
            onSelect={handleJoin}
          />
        </ContentRail>
      </section>

      {/* 7. HOW IT WORKS (Numbered 01 to 04) */}
      <section id="how-it-works" className="py-20 bg-[#081619] border-b border-[#1A373E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              The Daily Rhythm
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
              How the 21-Day Journey Works
            </h2>
            <p className="text-sm text-[#8D9FA4]">
              A realistic four-step daily rhythm designed for students with busy college and work hours.
            </p>
          </div>

          <NumberedSteps steps={LANDING_COPY.howItWorksSteps} />
        </div>
      </section>

      {/* 8. WHAT'S INCLUDED (Showcase Blocks) */}
      <section className="py-20 bg-[#040C0E] border-b border-[#1A373E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              The Platform Experience
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
              Everything You Need Inside One Private Space
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Calendar className="h-5 w-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-white">Daily Live Links</h4>
              <p className="text-xs text-[#8D9FA4] leading-relaxed">
                No messy WhatsApp links or lost emails. Today’s live session link appears right on your enrolled student dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Video className="h-5 w-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-white">Encrypted Private Player</h4>
              <p className="text-xs text-[#8D9FA4] leading-relaxed">
                Watch self-hosted HLS videos ad-free without YouTube recommendations distracting your focus.
              </p>
            </div>

            <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-white">Direct Announcements</h4>
              <p className="text-xs text-[#8D9FA4] leading-relaxed">
                Get real-time updates and encouragement from Naman in your personal inbox without spam.
              </p>
            </div>

            <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Award className="h-5 w-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-white">Milestone Badges & Certificates</h4>
              <p className="text-xs text-[#8D9FA4] leading-relaxed">
                Unlock verifiable digital credentials and milestone badges upon completing daily challenges.
              </p>
            </div>

            <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-white">Installable Mobile PWA</h4>
              <p className="text-xs text-[#8D9FA4] leading-relaxed">
                Save ABrainoConscious to your home screen for quick 1-tap access on Android or iOS.
              </p>
            </div>

            <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-white">Daily 15-Min Worksheets</h4>
              <p className="text-xs text-[#8D9FA4] leading-relaxed">
                Practical action templates that translate theory into tangible behavioral habits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FEATURED CURRICULUM (Expandable Module Accordion) */}
      <section className="py-20 bg-[#081619] border-b border-[#1A373E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Inside the Curriculum
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
              {LANDING_COPY.sampleFeaturedCourse.title}
            </h2>
            <p className="text-sm text-[#8D9FA4]">
              {LANDING_COPY.sampleFeaturedCourse.description}
            </p>
          </div>

          <ModuleAccordion modules={LANDING_COPY.sampleFeaturedCourse.modules} />
        </div>
      </section>

      {/* 10. LEARNING PATH & BADGES PREVIEW */}
      <section className="py-20 bg-[#040C0E] border-b border-[#1A373E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Milestones
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
              Earn Tangible Milestones as You Grow
            </h2>
            <p className="text-sm text-[#8D9FA4]">
              Small daily wins add up. Unlock badges for maintaining streaks and completing daily tasks.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <BadgeTile
              title="First Step"
              description="Enrolled in your first live challenge."
              pillar="Personal"
              isEarned={true}
              earnedDate="Day 1"
            />
            <BadgeTile
              title="7-Day Focus Streak"
              description="Submitted 7 consecutive daily workbook tasks."
              pillar="Academic"
              isEarned={true}
              earnedDate="Day 7"
            />
            <BadgeTile
              title="Emotional Grounding"
              description="Completed the full cognitive defusion framework."
              pillar="Emotional"
              isEarned={false}
            />
            <BadgeTile
              title="Challenge Finisher"
              description="Attended all live sessions and earned completion certificate."
              pillar="All Pillars"
              isEarned={false}
            />
          </div>
        </div>
      </section>

      {/* 11. "FROM THE CHANNEL" (YouTube Proof Section) */}
      <section id="channel" className="py-20 bg-[#081619] border-b border-[#1A373E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                From the YouTube Channel
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
                Start Free with Our Most Popular Deep Dives
              </h2>
              <p className="text-sm text-[#8D9FA4]">
                Over 100,000+ viewers start here. If you resonate with these, our live challenges are the next step.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="md" onClick={() => window.open('https://youtube.com', '_blank')}>
                Visit YouTube Channel &rarr;
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LANDING_COPY.channelVideos.map((video, idx) => (
              <YouTubeVideoCard
                key={idx}
                videoId={video.videoId}
                title={video.title}
                duration={video.duration}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 12. CREATOR SECTION (Uses real studio portrait of Naman) */}
      <section id="creator" className="py-20 bg-[#040C0E] border-b border-[#1A373E]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <CreatorCard />
        </div>
      </section>

      {/* 13. GROWTH TIMELINE (Curriculum evolution & free upgrades) */}
      <section className="py-20 bg-[#081619] border-b border-[#1A373E]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Continuous Improvement
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Every Program Evolves — And Your Upgrades Are Always Free
            </h3>
            <p className="text-xs text-[#8D9FA4]">
              We constantly incorporate student feedback into new worksheets and frameworks.
            </p>
          </div>

          <div className="space-y-4">
            {LANDING_COPY.growthTimeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 rounded-xl border border-[#1A373E] bg-[#0E2024] p-4 text-xs">
                <span className="font-mono font-bold text-amber-500 shrink-0">{item.version}</span>
                <span className="text-[#E1E8EA]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14. TESTIMONIALS (Clearly marked sample text) */}
      <section className="py-20 bg-[#040C0E] border-b border-[#1A373E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Student Experiences
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
              What Learners Say About Naman's Frameworks
            </h2>
            <p className="text-xs text-[#8D9FA4]">
              * Sample student testimonials reflecting real user feedback from early cohorts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LANDING_COPY.sampleTestimonials.map((t) => (
              <TestimonialCard key={t.id} item={t} />
            ))}
          </div>
        </div>
      </section>

      {/* 15. PRICING PLANS */}
      <section className="py-20 bg-[#081619] border-b border-[#1A373E]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Simple, Honest Pricing
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
              Invest in Your Mind and Daily Discipline
            </h2>
            <p className="text-sm text-[#8D9FA4]">
              No recurring monthly traps. One single payment with 7-day money-back guarantee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {LANDING_COPY.pricingPlans.map((plan, idx) => (
              <PricingCard
                key={idx}
                title={plan.title}
                badge={plan.badge}
                description={plan.description}
                pricePaise={plan.pricePaise}
                compareAtPricePaise={plan.compareAtPricePaise}
                features={plan.features}
                isFeatured={plan.isFeatured}
                ctaText={plan.ctaText}
                onJoin={handleJoin}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 16. FAQ ACCORDION */}
      <section id="faq" className="py-20 bg-[#040C0E] border-b border-[#1A373E]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Got Questions?
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA]">
              Frequently Asked Questions
            </h2>
          </div>

          <FaqAccordion items={LANDING_COPY.faqs} />
        </div>
      </section>

      {/* 17. FINAL CLOSING CTA BAND */}
      <section className="py-20 bg-gradient-to-b from-[#081619] to-[#040C0E] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#F8FAFA] leading-tight">
            Stop Navigating Four Heavy Pillars Alone.
          </h2>
          <p className="text-base text-[#8D9FA4] max-w-xl mx-auto">
            Join the next live challenge cohort today. 21 days with Naman, clear daily systems, and a community walking right alongside you.
          </p>
          <div className="pt-2">
            <JoinButton onJoin={handleJoin} onLogin={handleLogin} label="JOIN TODAY’S COHORT" size="xl" />
          </div>
        </div>
      </section>

      {/* Sticky Mobile Join Bar */}
      {showStickyBar && (
        <StickyCtaBar
          title="21-Day Live Challenge"
          pricePaise={99900}
          onJoin={handleJoin}
        />
      )}
    </LandingLayout>
  );
};

export default LandingPage;
