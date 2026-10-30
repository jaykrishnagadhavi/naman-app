import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HeroBanner, ContentRail, PosterCard, CategoryChips,
  SearchBar, BadgeTile, Button
} from '@abrainoconscious/ui';
import { CRISIS_HELPLINES } from '@abrainoconscious/shared';
import {
  Radio, Play, CheckCircle2,
  PhoneCall, Clock, Lock
} from 'lucide-react';

// 1. Student Home Page
export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      {/* Dynamic Hero Banner */}
      <HeroBanner
        variant="live-now"
        title="Live Challenge Day 4: Emotional Regulation Before Heavy Study Sprints"
        subtitle="Naman is live on Zoom right now breaking down the 90-second cognitive grounding protocol."
        programTitle="21-Day Mindset Reset"
        onAction={() => alert('Launching today’s live Zoom session link (attendance verified)...')}
      />

      {/* Pinned Announcement */}
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-[#0E2024] to-[#081619] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-black font-bold text-xs">
            📢
          </span>
          <div>
            <h4 className="text-xs font-bold text-white">New Daily Task Published</h4>
            <p className="text-[11px] text-[#8D9FA4]">Day 4 active workbook is ready in your enrolled programs.</p>
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={() => navigate('/my-programs')}>
          Open Daily Task &rarr;
        </Button>
      </div>

      {/* Continue Learning Row */}
      <ContentRail title="Continue Learning" subtitle="Pick up right where you left off">
        <PosterCard
          id="c1"
          title="The 21-Day Mindset & Focus Challenge"
          category="Mental & Academic"
          aspectRatio="16:9"
          lessonCount={21}
          progressPercent={45}
          onSelect={() => navigate('/programs/21-day-mindset/learn')}
        />
        <PosterCard
          id="c2"
          title="Emotional De-escalation Under Pressure"
          category="Emotional"
          aspectRatio="16:9"
          lessonCount={12}
          progressPercent={80}
          onSelect={() => navigate('/courses/emotional-deescalation/watch/lesson-3')}
        />
      </ContentRail>

      {/* Trending Challenges */}
      <ContentRail title="Trending Cohorts" subtitle="Live programs starting soon">
        <PosterCard
          id="t1"
          title="Deep Work & Exam Mastery Protocol"
          category="Academic"
          aspectRatio="2:3"
          rankNumber={1}
          lessonCount={18}
          pricePaise={129900}
          onSelect={() => navigate('/programs/deep-work-exam-mastery')}
        />
        <PosterCard
          id="t2"
          title="Habit Architecture for Busy Students"
          category="Personal"
          aspectRatio="2:3"
          rankNumber={2}
          lessonCount={14}
          pricePaise={89900}
          onSelect={() => navigate('/programs/habit-architecture')}
        />
        <PosterCard
          id="t3"
          title="Social Anxiety & Confident Speech"
          category="Emotional"
          aspectRatio="2:3"
          rankNumber={3}
          lessonCount={16}
          pricePaise={99900}
          onSelect={() => navigate('/programs/confident-speech')}
        />
      </ContentRail>
    </div>
  );
};

// 2. Explore Library Page
export const ExplorePage: React.FC = () => {
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#F8FAFA]">Explore Programs</h1>
        <p className="text-xs text-[#8D9FA4] mt-1">Browse live cohorts and video courses across the four pillars.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CategoryChips selectedCategory={selectedPillar} onSelectCategory={setSelectedPillar} />
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <PosterCard
          id="exp-1"
          title="21-Day Mind & Focus Reset"
          category="Mental"
          aspectRatio="2:3"
          lessonCount={21}
          pricePaise={99900}
          onSelect={() => navigate('/programs/21-day-mindset')}
        />
        <PosterCard
          id="exp-2"
          title="Exam Pressure Protocol"
          category="Academic"
          aspectRatio="2:3"
          lessonCount={18}
          pricePaise={129900}
          onSelect={() => navigate('/programs/exam-pressure')}
        />
        <PosterCard
          id="exp-3"
          title="Emotional Grounding in 90 Seconds"
          category="Emotional"
          aspectRatio="2:3"
          lessonCount={12}
          pricePaise={79900}
          onSelect={() => navigate('/programs/emotional-grounding')}
        />
        <PosterCard
          id="exp-4"
          title="Habit Stacking Architecture"
          category="Personal"
          aspectRatio="2:3"
          lessonCount={14}
          pricePaise={89900}
          onSelect={() => navigate('/programs/habit-stacking')}
        />
      </div>
    </div>
  );
};

// 3. Program Preview Page
export const ProgramPreviewPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-3">
        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30 uppercase">
          Live 21-Day Challenge
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white">
          The 21-Day Mind & Focus Challenge
        </h1>
        <p className="text-sm text-[#8D9FA4] leading-relaxed">
          Daily live morning calls with Naman, structured workbook assignments, and accountability across emotional, mental, academic, and personal growth.
        </p>
      </div>

      <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-4">
          <div>
            <span className="text-xs text-[#8D9FA4]">One-Time Enrollment</span>
            <div className="font-serif text-3xl font-bold text-white">₹999</div>
          </div>
          <Button size="lg" variant="cta" onClick={() => navigate('/signup?program=' + slug)}>
            JOIN THIS CHALLENGE &rarr;
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-white">What You Will Learn</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#E1E8EA]">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Active study retention protocols</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Breaking out of catastrophic mental loops</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Daily habit execution without willpower</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Live interactive Q&A sessions with Naman</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Enrolled Student Journey Page
export const ProgramLearnPage: React.FC = () => {
  const { slug } = useParams();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Enrolled Cohort ({slug})</span>
        <h1 className="font-serif text-3xl font-bold text-white mt-1">21-Day Mindset Reset Dashboard</h1>
        <p className="text-xs text-[#8D9FA4]">Day 4 of 21 • Your daily growth checklist</p>
      </div>

      {/* Today's Live Link Card */}
      <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-[#180A0E] via-[#0E151A] to-[#081619] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold text-red-400">
            <Radio className="h-4 w-4 animate-pulse" /> TODAY'S LIVE CALL IS LIVE
          </span>
          <span className="text-xs text-[#8D9FA4]">Starts at 8:00 PM IST</span>
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-white">Day 4: Taming the Inner Critic</h3>
          <p className="text-xs text-[#8D9FA4] mt-1">Join Naman for today’s live breakdown and doubt clearing.</p>
        </div>
        <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white font-bold" onClick={() => alert('Launching Zoom meeting...')}>
          <Radio className="h-4 w-4 mr-2" /> JOIN LIVE ZOOM NOW
        </Button>
      </div>

      {/* Four-Step Journey Checklist */}
      <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-4">
        <h3 className="font-serif text-lg font-bold text-white">Today's Journey Checklist</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#081619] border border-[#1A373E]">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-xs font-medium text-white">1. Watch Day 4 Core Lesson (14 Mins)</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Done</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#081619] border border-[#1A373E]">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-medium text-white">2. Complete Today’s 15-Min Worksheet</span>
            </div>
            <Button size="sm" variant="primary">Start Task</Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#081619] border border-[#1A373E]">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-red-400" />
              <span className="text-xs font-medium text-white">3. Attend Today’s Live Session</span>
            </div>
            <span className="text-[11px] text-red-400 font-semibold">Live Now</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#081619] border border-[#1A373E]">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-[#8D9FA4]" />
              <span className="text-xs font-medium text-[#8D9FA4]">4. Post in Community Reflection</span>
            </div>
            <span className="text-[11px] text-[#8D9FA4]">Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Protected Player Watch Page
export const CourseWatchPage: React.FC = () => {
  const { slug, lessonId } = useParams();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#1A373E] pb-3">
        <div>
          <h1 className="font-serif text-lg font-bold text-white">Lesson {lessonId}: Cognitive Defusion</h1>
          <p className="text-xs text-[#8D9FA4]">Course: {slug || 'Mindset Masterclass'}</p>
        </div>
        <span className="rounded bg-black/60 px-2.5 py-1 text-[11px] text-amber-400 border border-amber-500/30">
          AES-128 Encrypted HLS Player
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Player Screen */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#1A373E] bg-black shadow-2xl flex items-center justify-center">
            {/* Watermark Protection Overlay Note */}
            <div className="absolute top-4 right-4 pointer-events-none rounded bg-black/70 px-2 py-1 text-[9px] text-white/40 font-mono">
              USER: STUDENT #4928 • TAMPER PROTECTION ACTIVE
            </div>
            <div className="text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-black mx-auto shadow-glow cursor-pointer hover:scale-105 transition-transform">
                <Play className="h-8 w-8 fill-current ml-1" />
              </div>
              <p className="text-xs text-[#8D9FA4]">Self-Hosted Video Streaming Engine (`video.abrainoconcious.com`)</p>
            </div>
          </div>
        </div>

        {/* Curriculum Sidebar */}
        <div className="lg:col-span-4 rounded-2xl border border-[#1A373E] bg-[#0E2024] p-4 space-y-3">
          <h3 className="font-serif text-sm font-bold text-white">Course Curriculum</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
              1. Quieting the Inner Critic (Current)
            </div>
            <div className="p-2.5 rounded bg-[#081619] border border-[#1A373E] text-[#8D9FA4]">
              2. Breaking the Catastrophizing Loop
            </div>
            <div className="p-2.5 rounded bg-[#081619] border border-[#1A373E] text-[#8D9FA4]">
              3. The 90-Second Grounding Protocol
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 6. Crisis Support Page: "Need support right now?" (spec section 1 & prompt item 14)
export const CrisisSupportPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="rounded-2xl border border-red-500/40 bg-gradient-to-b from-red-500/10 to-[#081619] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <PhoneCall className="h-7 w-7" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Need Support Right Now?
          </h1>
        </div>
        <p className="text-sm text-[#E1E8EA] leading-relaxed">
          If you are feeling overwhelmed, distressed, or experiencing an emotional crisis, please know you do not have to carry it alone. Immediate, free, and confidential support is available 24 hours a day.
        </p>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          ⚠️ <strong>Notice:</strong> ABrainoConscious programs are educational self-growth courses, not crisis intervention or medical therapy. Please use these verified crisis helplines below. (Marked: *Verify before launch*).
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-white">Emergency & National Helplines (India)</h2>
        <div className="space-y-4">
          {CRISIS_HELPLINES.map((hl, idx) => (
            <div key={idx} className="rounded-xl border border-[#1A373E] bg-[#0E2024] p-5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-serif text-base font-bold text-white">{hl.name}</h3>
                <span className="text-xs font-mono font-bold text-amber-400 bg-black/60 px-2.5 py-1 rounded border border-white/10">
                  {hl.number}
                </span>
              </div>
              <p className="text-xs text-[#8D9FA4]">{hl.description}</p>
              <div className="flex items-center justify-between text-[11px] text-[#556B71] pt-1">
                <span>Operating Hours: {hl.hours}</span>
                <span className="text-yellow-500/80">Pending admin verification before launch</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 7. Skeletons for Other Student Pages
export const MyProgramsPage: React.FC = () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-white">My Enrolled Programs</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <PosterCard
        id="my-1"
        title="21-Day Mind & Focus Reset"
        category="Mental"
        aspectRatio="2:3"
        lessonCount={21}
        progressPercent={45}
      />
    </div>
  </div>
);

export const InboxPage: React.FC = () => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <h1 className="font-serif text-3xl font-bold text-white">Naman's Announcements</h1>
    <div className="space-y-3">
      <div className="p-4 rounded-xl border border-[#1A373E] bg-[#0E2024]">
        <h4 className="text-sm font-bold text-white">Welcome to Week 1!</h4>
        <p className="text-xs text-[#8D9FA4] mt-1">Make sure you have downloaded the Day 1 grounding worksheet.</p>
        <span className="text-[10px] text-amber-500 mt-2 block">2 days ago</span>
      </div>
    </div>
  </div>
);

export const CommunityPage: React.FC = () => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <h1 className="font-serif text-3xl font-bold text-white">Student Community Circle</h1>
    <p className="text-xs text-[#8D9FA4]">A safe space to share daily reflections and habit streaks.</p>
    <div className="p-6 rounded-xl border border-[#1A373E] bg-[#0E2024] text-center text-xs text-[#8D9FA4]">
      Community feed is active for enrolled students.
    </div>
  </div>
);

export const BadgesPage: React.FC = () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-white">Milestone Badges</h1>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <BadgeTile title="Day 1 Complete" description="Finished first daily assignment." isEarned={true} earnedDate="Oct 2026" />
      <BadgeTile title="7-Day Streak" description="Maintained active attendance for 7 days." isEarned={true} earnedDate="Oct 2026" />
      <BadgeTile title="21-Day Finisher" description="Completed the entire challenge." isEarned={false} />
      <BadgeTile title="Active Contributor" description="Shared 5 helpful reflections." isEarned={false} />
    </div>
  </div>
);

export const OrdersPage: React.FC = () => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <h1 className="font-serif text-3xl font-bold text-white">Orders & Invoices</h1>
    <div className="rounded-xl border border-[#1A373E] bg-[#0E2024] p-4 text-xs text-[#8D9FA4]">
      Order #AB-9281 • 21-Day Mindset Reset • ₹999 Paid • <span className="text-emerald-400">Captured</span>
    </div>
  </div>
);

export const ProfilePage: React.FC = () => (
  <div className="space-y-6 max-w-xl mx-auto">
    <h1 className="font-serif text-3xl font-bold text-white">Student Profile</h1>
    <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 space-y-4">
      <div>
        <label className="text-xs text-[#8D9FA4]">Full Name</label>
        <p className="text-sm font-semibold text-white">Priya Sharma</p>
      </div>
      <div>
        <label className="text-xs text-[#8D9FA4]">Phone (for WhatsApp / SMS Reminders)</label>
        <p className="text-sm font-semibold text-white">+91 98765 43210</p>
      </div>
      <div>
        <label className="text-xs text-[#8D9FA4]">Primary Growth Goal</label>
        <p className="text-sm font-semibold text-amber-400">Mental Clarity & Academic Focus</p>
      </div>
    </div>
  </div>
);

export const LoginPage: React.FC = () => (
  <div className="max-w-md mx-auto my-12 rounded-2xl border border-[#1A373E] bg-[#0E2024] p-8 space-y-6">
    <h1 className="font-serif text-2xl font-bold text-white text-center">Student Login</h1>
    <p className="text-xs text-[#8D9FA4] text-center">Enter your email and password to access your programs.</p>
    <div className="space-y-3">
      <input type="email" placeholder="Email address" className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white" />
      <input type="password" placeholder="Password" className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white" />
      <Button variant="primary" className="w-full">Sign In</Button>
    </div>
  </div>
);

export const SignupPage: React.FC = () => (
  <div className="max-w-md mx-auto my-12 rounded-2xl border border-[#1A373E] bg-[#0E2024] p-8 space-y-6">
    <h1 className="font-serif text-2xl font-bold text-white text-center">Create Your Student Account</h1>
    <p className="text-xs text-[#8D9FA4] text-center">Join thousands of students growing across the four pillars.</p>
    <div className="space-y-3">
      <input type="text" placeholder="Full name" className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white" />
      <input type="email" placeholder="Email address" className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white" />
      <input type="tel" placeholder="Phone number (for live call reminders)" className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white" />
      <input type="password" placeholder="Password" className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white" />
      <Button variant="cta" className="w-full">Join Now & Start Learning</Button>
    </div>
  </div>
);
