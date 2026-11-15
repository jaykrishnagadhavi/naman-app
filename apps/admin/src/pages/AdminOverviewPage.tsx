import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, Button, Badge, ErrorDetailsAlert } from '@abrainoconscious/ui';
import {
  fetchAdminDashboardStats,
  formatDateIST,
  formatPaise,
} from '@abrainoconscious/shared';
import { AdminTodaySessionWidget } from '../components/AdminTodaySessionWidget';
import {
  BookOpen,
  Users,
  CreditCard,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Star,
  UserX,
  ShieldAlert,
  CalendarCheck,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { supabase } = useAuth();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch real admin dashboard overview statistics
  const {
    data: stats,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-overview-stats', dateRange],
    queryFn: () => fetchAdminDashboardStats(supabase, dateRange),
    staleTime: 1000 * 30,
  });

  const programsStatus = stats?.programs_by_status || {
    draft: 0,
    published: 0,
    live: 0,
    completed: 0,
    archived: 0,
  };
  const activeEnrolments = stats?.active_enrolments_total || 0;
  const sessionsToday = stats?.sessions_today || [];
  const missingLinksCount = stats?.missing_links_count || 0;
  const attendanceRate = stats?.overall_attendance_rate || 0;
  const paymentInterest = stats?.payment_interest_by_program || [];
  const topPrograms = stats?.top_programs || [];
  const needsAttention = stats?.needs_attention || {
    missing_links_count: 0,
    pending_reviews_count: 0,
    pending_deletion_requests_count: 0,
    blocked_students_count: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <span>Studio Overview</span>
            <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Live Telemetry
            </span>
          </h1>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Real-time platform operations, active student cohorts, attendance metrics, and priority queues.
          </p>
        </div>

        {/* Date Range Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-[#1A373E] bg-[#0E2024] p-1 text-xs">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 rounded font-medium transition-colors uppercase ${
                  dateRange === r
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'text-[#8D9FA4] hover:text-white'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-[#1A373E] bg-[#0E2024] text-xs text-[#8D9FA4] hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/programs/new')}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>New Program</span>
          </Button>
        </div>
      </div>

      {isError && (
        <div className="space-y-2">
          <ErrorDetailsAlert
            title="Failed to Load Overview Statistics"
            error={error}
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Hero Widget: Today's Daily Live Session */}
      <AdminTodaySessionWidget />

      {/* Needs Attention Alert Queue */}
      {(missingLinksCount > 0 ||
        needsAttention.pending_reviews_count > 0 ||
        needsAttention.pending_deletion_requests_count > 0 ||
        needsAttention.blocked_students_count > 0) && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Operational Items Requiring Attention</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {missingLinksCount > 0 && (
              <div
                onClick={() => navigate('/sessions')}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 flex items-center justify-between cursor-pointer hover:bg-rose-500/20 transition-colors"
              >
                <div>
                  <div className="font-bold text-rose-300">Missing Live Link</div>
                  <div className="text-[11px] text-[#8D9FA4] mt-0.5">
                    {missingLinksCount} session{missingLinksCount > 1 ? 's' : ''} starting in &lt; 2h
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-rose-400" />
              </div>
            )}

            {needsAttention.pending_reviews_count > 0 && (
              <div
                onClick={() => navigate('/reviews')}
                className="rounded-lg border border-[#1A373E] bg-[#081619] p-3 flex items-center justify-between cursor-pointer hover:bg-[#0E2024] transition-colors"
              >
                <div>
                  <div className="font-bold text-white">Pending Reviews</div>
                  <div className="text-[11px] text-[#8D9FA4] mt-0.5">
                    {needsAttention.pending_reviews_count} submission{needsAttention.pending_reviews_count > 1 ? 's' : ''} to moderate
                  </div>
                </div>
                <Star className="h-4 w-4 text-amber-400" />
              </div>
            )}

            {needsAttention.pending_deletion_requests_count > 0 && (
              <div
                onClick={() => navigate('/students')}
                className="rounded-lg border border-[#1A373E] bg-[#081619] p-3 flex items-center justify-between cursor-pointer hover:bg-[#0E2024] transition-colors"
              >
                <div>
                  <div className="font-bold text-white">Data Deletion Requests</div>
                  <div className="text-[11px] text-[#8D9FA4] mt-0.5">
                    {needsAttention.pending_deletion_requests_count} pending resolution
                  </div>
                </div>
                <UserX className="h-4 w-4 text-rose-400" />
              </div>
            )}

            {needsAttention.blocked_students_count > 0 && (
              <div
                onClick={() => navigate('/students')}
                className="rounded-lg border border-[#1A373E] bg-[#081619] p-3 flex items-center justify-between cursor-pointer hover:bg-[#0E2024] transition-colors"
              >
                <div>
                  <div className="font-bold text-white">Suspended Students</div>
                  <div className="text-[11px] text-[#8D9FA4] mt-0.5">
                    {needsAttention.blocked_students_count} locked accounts
                  </div>
                </div>
                <ShieldAlert className="h-4 w-4 text-[#8D9FA4]" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Zero Revenue Card */}
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8D9FA4] text-xs mb-1">
            <span>Gross Revenue</span>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <div className="font-serif text-3xl font-bold text-white mt-1">₹0</div>
          <div className="text-[10px] text-amber-400/90 mt-2 flex items-center gap-1 font-medium">
            <Sparkles className="h-3 w-3" />
            <span>Payments coming soon</span>
          </div>
        </div>

        {/* Active Enrollments */}
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5">
          <div className="flex items-center justify-between text-[#8D9FA4] text-xs mb-1">
            <span>Active Enrollments</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-400 mt-1">
            {activeEnrolments}
          </div>
          <div className="text-[10px] text-[#8D9FA4] mt-2">Active students in cohorts</div>
        </div>

        {/* Attendance Rate */}
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5">
          <div className="flex items-center justify-between text-[#8D9FA4] text-xs mb-1">
            <span>Live Attendance Rate</span>
            <CalendarCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-cyan-400 mt-1">
            {attendanceRate}%
          </div>
          <div className="text-[10px] text-[#8D9FA4] mt-2">Average live attendance rate</div>
        </div>

        {/* Programs Count */}
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5">
          <div className="flex items-center justify-between text-[#8D9FA4] text-xs mb-1">
            <span>Catalogue Status</span>
            <BookOpen className="h-4 w-4 text-purple-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-white mt-1">
            {programsStatus.published + programsStatus.live}
          </div>
          <div className="text-[10px] text-[#8D9FA4] mt-2">
            {programsStatus.draft} drafts • {programsStatus.archived} archived
          </div>
        </div>
      </div>

      {/* Two Column Section: Demand & Top Programs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Interest Demand Panel */}
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="font-serif text-base font-bold text-white">
                Payment Interest Demand
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-mono font-semibold">
              {paymentInterest.reduce((acc: number, curr: any) => acc + curr.count, 0)} Total Leads
            </span>
          </div>

          <p className="text-xs text-[#8D9FA4]">
            Prospective learners who clicked "Notify me when payments open" grouped by cohort:
          </p>

          {paymentInterest.length === 0 ? (
            <div className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-6 text-center text-xs text-[#8D9FA4]">
              No payment interest leads recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {paymentInterest.map((item: any) => (
                <div
                  key={item.program_id}
                  className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{item.program_title}</div>
                    <div className="text-[10px] text-[#8D9FA4] mt-0.5">
                      {formatPaise(item.price_paise)} • {item.program_type}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-base font-bold text-amber-400">{item.count}</span>
                    <span className="text-[10px] text-[#8D9FA4] ml-1">leads</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Cohorts by Enrollment */}
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h3 className="font-serif text-base font-bold text-white">Top Programs by Enrolment</h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/programs')}
              className="h-6 text-[11px] border-[#1A373E] text-[#8D9FA4] hover:text-white"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {topPrograms.length === 0 ? (
            <div className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-6 text-center text-xs text-[#8D9FA4]">
              No programs enrolled yet.
            </div>
          ) : (
            <div className="space-y-2">
              {topPrograms.map((prog: any) => (
                <div
                  key={prog.program_id}
                  className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{prog.title}</div>
                    <div className="text-[10px] text-[#8D9FA4] capitalize mt-0.5">
                      {prog.category} Pillar • {prog.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {prog.status}
                    </Badge>
                    <div className="text-right font-semibold text-emerald-400">
                      {prog.enrolments_count} enrolled
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sessions Today Widget */}
      <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            <h3 className="font-serif text-base font-bold text-white">Scheduled Sessions Today</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/sessions')}
            className="h-6 text-[11px] border-[#1A373E] text-[#8D9FA4] hover:text-white"
          >
            <span>Sessions Manager</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {sessionsToday.length === 0 ? (
          <div className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-6 text-center text-xs text-[#8D9FA4]">
            No live cohort sessions scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessionsToday.map((s: any) => (
              <div
                key={s.id}
                className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-3 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">Day {s.day_number}</span>
                  {s.has_link ? (
                    <Badge variant="teal" className="text-[10px]">
                      Link Ready
                    </Badge>
                  ) : (
                    <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Missing Link
                    </span>
                  )}
                </div>
                <div className="font-semibold text-white truncate">{s.title}</div>
                <div className="text-[11px] text-[#8D9FA4] truncate">{s.program_title}</div>
                <div className="text-[10px] text-[#8D9FA4] pt-1 border-t border-[#1A373E]">
                  Scheduled: {formatDateIST(s.scheduled_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverviewPage;
