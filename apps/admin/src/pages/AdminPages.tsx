import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, ImageUploader
} from '@abrainoconscious/ui';
import {
  Plus, Radio
} from 'lucide-react';

// 1. Overview Dashboard
export const AdminOverviewPage: React.FC = () => {

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-xs text-[#8D9FA4]">Live metrics across student enrollments, payments, and sessions.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-1">
          <span className="text-xs text-[#8D9FA4]">Total Revenue (All Time)</span>
          <div className="font-serif text-2xl font-bold text-amber-500">₹24,98,400</div>
          <span className="text-[10px] text-emerald-400 font-semibold">+18% this month</span>
        </div>
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-1">
          <span className="text-xs text-[#8D9FA4]">Active Enrollments</span>
          <div className="font-serif text-2xl font-bold text-white">3,420</div>
          <span className="text-[10px] text-[#8D9FA4]">Across 4 cohorts</span>
        </div>
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-1">
          <span className="text-xs text-[#8D9FA4]">Registered Students</span>
          <div className="font-serif text-2xl font-bold text-white">25,180</div>
          <span className="text-[10px] text-emerald-400 font-semibold">+140 today</span>
        </div>
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-1">
          <span className="text-xs text-[#8D9FA4]">Active Live Streams</span>
          <div className="font-serif text-2xl font-bold text-emerald-400">1 Live</div>
          <span className="text-[10px] text-[#8D9FA4]">840 concurrent</span>
        </div>
      </div>

      {/* Daily Live Link Quick Control (Most important tool per spec section 10) */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-[#0E2024] to-[#081619] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-amber-500 animate-pulse" />
            <h3 className="font-serif text-lg font-bold text-white">Today's Live Link Controller</h3>
          </div>
          <Badge variant="amber">High Priority</Badge>
        </div>
        <p className="text-xs text-[#8D9FA4]">
          Publishing updates the live link instantly on all enrolled students' dashboards.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            type="text"
            placeholder="Paste Zoom / Google Meet / YouTube Live URL"
            className="md:col-span-6 rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white"
            defaultValue="https://zoom.us/j/928192841"
          />
          <input
            type="text"
            placeholder="Today's Session Title"
            className="md:col-span-4 rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white"
            defaultValue="Day 4: Taming the Inner Critic"
          />
          <Button variant="primary" size="md" className="md:col-span-2" onClick={() => alert('Published live link!')}>
            Publish Live
          </Button>
        </div>
      </div>
    </div>
  );
};

// 2. Programs Manager
export const AdminProgramsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Programs Manager</h1>
          <p className="text-xs text-[#8D9FA4]">Manage live challenges, video courses, and cohorts.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/programs/new')}>
          <Plus className="h-4 w-4 mr-1" /> Create Program
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Pillar</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-semibold text-white">21-Day Mind & Focus Reset</TableCell>
            <TableCell>Challenge</TableCell>
            <TableCell>Mental</TableCell>
            <TableCell>₹999</TableCell>
            <TableCell><Badge variant="teal">Live</Badge></TableCell>
            <TableCell className="text-right">
              <button onClick={() => navigate('/programs/21-day-mindset')} className="text-xs text-amber-400 hover:underline">Edit</button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-white">Deep Work Protocol</TableCell>
            <TableCell>Course</TableCell>
            <TableCell>Academic</TableCell>
            <TableCell>₹1,299</TableCell>
            <TableCell><Badge variant="neutral">Published</Badge></TableCell>
            <TableCell className="text-right">
              <button onClick={() => navigate('/programs/deep-work')} className="text-xs text-amber-400 hover:underline">Edit</button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

// 3. Program Editor with ImageUploader
export const AdminProgramDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Edit Program: {id}</h1>
        <p className="text-xs text-[#8D9FA4]">Configure program details, pricing, curriculum, and multi-ratio promotional artwork.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-[#1A373E] bg-[#081619] p-6">
        <h3 className="font-serif text-base font-bold text-white">Program Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[#8D9FA4] block mb-1">Title</label>
            <input type="text" className="w-full rounded border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white" defaultValue="21-Day Mind & Focus Reset" />
          </div>
          <div>
            <label className="text-[#8D9FA4] block mb-1">Price (Paise)</label>
            <input type="number" className="w-full rounded border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white" defaultValue="99900" />
          </div>
        </div>
      </div>

      {/* Shared ImageUploader */}
      <div className="space-y-2">
        <h3 className="font-serif text-base font-bold text-white">Course Thumbnails & Promotional Artwork</h3>
        <p className="text-xs text-[#8D9FA4]">Crop to 16:9 thumbnail, 2:3 poster, or wide hero banner with live multi-surface previews.</p>
        <ImageUploader />
      </div>
    </div>
  );
};

// 4. Anti-Piracy & Watermark Tracing
export const AdminPiracyPage: React.FC = () => {
  const [traceId, setTraceId] = useState('');

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Anti-Piracy & Forensic Watermarking</h1>
        <p className="text-xs text-[#8D9FA4]">Track unauthorized screen shares, suspicious fast segment pulls, and watermark leak traces.</p>
      </div>

      {/* Forensic Watermark Trace Tool (spec section 11 & prompt item 20) */}
      <div className="rounded-xl border border-amber-500/40 bg-[#081619] p-6 space-y-4">
        <h3 className="font-serif text-base font-bold text-white">Watermark ID Leak Trace</h3>
        <p className="text-xs text-[#8D9FA4]">Enter the moving semi-transparent watermark session ID seen on a leaked video clip to find the culprit account.</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={traceId}
            onChange={(e) => setTraceId(e.target.value)}
            placeholder="e.g. WM-9281-XYZ"
            className="flex-1 rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white"
          />
          <Button variant="primary" size="md" onClick={() => alert('Tracing account...')}>
            Identify Leaker
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-6 space-y-3">
        <h3 className="font-serif text-base font-bold text-white">Active Protection Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#8D9FA4]">
          <div className="p-3 rounded border border-[#1A373E] bg-[#0E2024]">
            <span className="text-white font-semibold block">AES-128 Encryption:</span> Active on all HLS segment keys
          </div>
          <div className="p-3 rounded border border-[#1A373E] bg-[#0E2024]">
            <span className="text-white font-semibold block">Max Concurrent Streams:</span> 1 active stream per student account
          </div>
          <div className="p-3 rounded border border-[#1A373E] bg-[#0E2024]">
            <span className="text-white font-semibold block">Rate Limit:</span> Blocks downloads faster than 3x real-time
          </div>
          <div className="p-3 rounded border border-[#1A373E] bg-[#0E2024]">
            <span className="text-white font-semibold block">Origin Verification:</span> app.abrainoconcious.com locked
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Placeholders for other admin pages
export const AdminSessionsPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Live Sessions Scheduler</h1>
    <p className="text-xs text-[#8D9FA4]">Bulk schedule all 21 challenge days with live links and assignments.</p>
  </div>
);

export const AdminCoursesPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Self-Hosted Course Package Builder</h1>
    <p className="text-xs text-[#8D9FA4]">Drag-and-drop bulk video upload with resumable tus chunks and FFmpeg transcoding.</p>
  </div>
);

export const AdminAnnouncementsPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Announcements Composer</h1>
    <p className="text-xs text-[#8D9FA4]">Broadcast real-time messages to all students or specific cohorts.</p>
  </div>
);

export const AdminStudentsPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Students Management</h1>
    <p className="text-xs text-[#8D9FA4]">Searchable student records, device sessions, and manual enrollments.</p>
  </div>
);

export const AdminPaymentsPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Razorpay Orders & Payments</h1>
    <p className="text-xs text-[#8D9FA4]">Reconcile orders, issue full or partial refunds, export CSV.</p>
  </div>
);

export const AdminCouponsPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Discount Coupons</h1>
    <p className="text-xs text-[#8D9FA4]">Create percentage or flat discount codes with limits and valid dates.</p>
  </div>
);

export const AdminLandingEditorPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Landing Page CMS</h1>
    <p className="text-xs text-[#8D9FA4]">Edit headlines, story panels, empathy questions, FAQs, and stats live without touching code.</p>
  </div>
);

export const AdminCommunityPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Community Moderation</h1>
    <p className="text-xs text-[#8D9FA4]">Review student discussions, pin key reflections, and remove spam.</p>
  </div>
);

export const AdminReviewsPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Student Reviews</h1>
    <p className="text-xs text-[#8D9FA4]">Approve and feature student testimonials for the landing page.</p>
  </div>
);

export const AdminTeamPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Team & Roles</h1>
    <p className="text-xs text-[#8D9FA4]">Invite staff members with restricted content-only permissions.</p>
  </div>
);

export const AdminSettingsPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Platform Settings</h1>
    <p className="text-xs text-[#8D9FA4]">Brand logo, GST details, support WhatsApp, maintenance mode, and Razorpay test mode toggle.</p>
  </div>
);

export const AdminAuditLogPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="font-serif text-2xl font-bold text-white">Operations Audit Trail</h1>
    <p className="text-xs text-[#8D9FA4]">Immutable record of all admin actions, refund issuances, and link publications.</p>
  </div>
);

export const AdminLoginPage: React.FC = () => (
  <div className="max-w-md mx-auto my-16 rounded-2xl border border-[#1A373E] bg-[#081619] p-8 space-y-6">
    <h1 className="font-serif text-2xl font-bold text-white text-center">Naman Studio Admin</h1>
    <p className="text-xs text-[#8D9FA4] text-center">Staff & Admin Access Only.</p>
    <div className="space-y-3">
      <input type="email" placeholder="Admin email" className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white" />
      <input type="password" placeholder="Password" className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white" />
      <Button variant="primary" className="w-full">Sign In to Dashboard</Button>
    </div>
  </div>
);
