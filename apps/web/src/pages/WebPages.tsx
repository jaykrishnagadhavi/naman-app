import React from 'react';
import { useParams } from 'react-router-dom';
import { Button, BadgeTile } from '@abrainoconscious/ui';
import { CRISIS_HELPLINES } from '@abrainoconscious/shared';
import {
  Play,
  PhoneCall,
} from 'lucide-react';

// 1. Student Home Page
export { HomePage } from './HomePage';

// 2. Explore Library Page
export { ExplorePage } from './ExplorePage';

// 3. Program Preview Page
export { ProgramPage, ProgramPage as ProgramPreviewPage } from './ProgramPage';

// 3b. Checkout Summary Page
export { CheckoutPage } from './CheckoutPage';

// 4. Enrolled Student Journey Page
export { ProgramPage as ProgramLearnPage } from './ProgramPage';

// 4b. My Programs Dashboard Page
export { MyProgramsPage } from './MyProgramsPage';

// 4c. Inbox and Realtime Announcements Page
export { InboxPage } from './InboxPage';

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
