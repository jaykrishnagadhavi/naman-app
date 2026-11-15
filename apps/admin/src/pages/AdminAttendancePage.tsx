import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useAuth,
  Button,
  Badge,
  ErrorDetailsAlert,
} from '@abrainoconscious/ui';
import {
  fetchAdminAttendanceReport,
  formatDateIST,
  generateCsv,
  downloadCsv,
} from '@abrainoconscious/shared';
import {
  CalendarCheck,
  RefreshCw,
  Download,
  BookOpen,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const AdminAttendancePage: React.FC = () => {
  const { supabase, profile } = useAuth();

  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [lowEngagementOnly, setLowEngagementOnly] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'sessions' | 'students'>('sessions');

  // 1. Fetch Programs for Dropdown
  const { data: programs = [] } = useQuery({
    queryKey: ['admin-attendance-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, title, slug, type')
        .is('deleted_at', null)
        .order('title', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Set default program
  React.useEffect(() => {
    if (!selectedProgramId && programs.length > 0) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  // 2. Fetch Attendance Report for Selected Program
  const {
    data: reportData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-attendance-report', selectedProgramId],
    queryFn: () => fetchAdminAttendanceReport(supabase, { programId: selectedProgramId }),
    enabled: !!selectedProgramId,
    staleTime: 1000 * 30,
  });

  const summary = reportData?.summary || {
    total_enrolled: 0,
    avg_attendance_rate: 0,
    avg_task_rate: 0,
  };
  const sessions = reportData?.sessions || [];
  const students = reportData?.students || [];

  const filteredStudents = students.filter((s: any) => {
    if (lowEngagementOnly) return s.is_low_engagement;
    return true;
  });

  // CSV Export with Injection Protection (CWE-1236)
  const handleExportCsv = async () => {
    const selectedProgram = programs.find((p: any) => p.id === selectedProgramId);
    const progTitle = selectedProgram?.title || 'Program';

    if (activeView === 'sessions') {
      const headers = [
        'Day',
        'Session Title',
        'Scheduled (IST)',
        'Status',
        'Enrolled',
        'Attended',
        'Attendance %',
        'Tasks Completed',
        'Task %',
      ];
      const rows = sessions.map((s: any) => [
        s.day_number,
        s.title,
        formatDateIST(s.scheduled_at),
        s.status,
        s.total_enrolled,
        s.attended_count,
        `${s.attendance_rate_percent}%`,
        s.tasks_completed_count,
        `${s.task_completion_rate_percent}%`,
      ]);

      const csv = generateCsv(headers, rows);
      downloadCsv(`attendance-sessions-${selectedProgramId.slice(0, 8)}.csv`, csv);
    } else {
      const headers = [
        'Student Name',
        'Phone',
        'Enrolled At (IST)',
        'Sessions Attended',
        'Attendance %',
        'Tasks Completed',
        'Task %',
        'Low Engagement',
      ];
      const rows = filteredStudents.map((s: any) => [
        s.full_name || 'Anonymous Student',
        s.phone || '',
        formatDateIST(s.enrolled_at),
        s.sessions_attended,
        `${s.attendance_rate_percent}%`,
        s.tasks_completed,
        `${s.task_completion_rate_percent}%`,
        s.is_low_engagement ? 'YES' : 'NO',
      ]);

      const csv = generateCsv(headers, rows);
      downloadCsv(`attendance-students-${selectedProgramId.slice(0, 8)}.csv`, csv);
    }

    // Audit Log
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      actor_id: user?.id,
      actor_role: profile?.role || 'admin',
      action: 'attendance.export_csv',
      entity: 'session_attendance',
      entity_id: selectedProgramId,
      diff: { program: progTitle, view: activeView },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-amber-500" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Attendance & Task Reports
            </h1>
          </div>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Cohort engagement telemetry, live session joins, daily worksheet completions, and low-engagement alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="border-[#1A373E] bg-[#0E2024] text-xs text-[#8D9FA4] hover:text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Program Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#1A373E] bg-[#081619] p-4">
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          <BookOpen className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="w-full">
            <label className="block text-[11px] font-semibold text-[#8D9FA4] mb-1">
              Select Program Cohort:
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              {programs.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#1A373E] bg-[#0E2024] p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('sessions')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeView === 'sessions'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              Per-Session Breakdown
            </button>
            <button
              type="button"
              onClick={() => setActiveView('students')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeView === 'students'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              Per-Student Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4">
          <div className="text-xs text-[#8D9FA4] flex items-center justify-between">
            <span>Enrolled Students</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <div className="font-serif text-2xl font-bold text-white mt-1">
            {summary.total_enrolled}
          </div>
          <div className="text-[10px] text-[#8D9FA4] mt-0.5">Active cohort learners</div>
        </div>

        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4">
          <div className="text-xs text-[#8D9FA4] flex items-center justify-between">
            <span>Avg Live Attendance Rate</span>
            <CalendarCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-400 mt-1">
            {summary.avg_attendance_rate}%
          </div>
          <div className="text-[10px] text-[#8D9FA4] mt-0.5">Average across all scheduled days</div>
        </div>

        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4">
          <div className="text-xs text-[#8D9FA4] flex items-center justify-between">
            <span>Avg Daily Task Completion</span>
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-cyan-400 mt-1">
            {summary.avg_task_rate}%
          </div>
          <div className="text-[10px] text-[#8D9FA4] mt-0.5">Completed daily action worksheets</div>
        </div>
      </div>

      {isError && (
        <div className="space-y-2">
          <ErrorDetailsAlert
            title="Failed to Load Attendance Telemetry"
            error={error}
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Per-Session View */}
      {activeView === 'sessions' ? (
        <div className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619]">
          <div className="p-4 border-b border-[#1A373E] bg-[#0E2024]/40 font-semibold text-xs text-white">
            Daily Live Sessions Attendance Log
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
                <tr>
                  <th className="py-3 px-4 font-semibold w-16">Day</th>
                  <th className="py-3 px-4 font-semibold">Session Title</th>
                  <th className="py-3 px-4 font-semibold">Scheduled (IST)</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Attended</th>
                  <th className="py-3 px-4 font-semibold">Attendance Rate</th>
                  <th className="py-3 px-4 font-semibold">Tasks Completed</th>
                  <th className="py-3 px-4 font-semibold">Task Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A373E]/50 text-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8D9FA4]">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                      <span>Loading session statistics...</span>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8D9FA4]">
                      <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div>No sessions scheduled for this program.</div>
                    </td>
                  </tr>
                ) : (
                  sessions.map((s: any) => (
                    <tr key={s.session_id} className="hover:bg-[#0E2024]/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-amber-400">Day {s.day_number}</td>
                      <td className="py-3 px-4 font-medium text-white">{s.title}</td>
                      <td className="py-3 px-4 text-[#8D9FA4] whitespace-nowrap">
                        {formatDateIST(s.scheduled_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            s.status === 'live'
                              ? 'teal'
                              : s.status === 'ended'
                              ? 'neutral'
                              : 'outline'
                          }
                          className="text-[10px] capitalize"
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#E1E8EA]">
                        {s.attended_count} / {s.total_enrolled}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        {s.attendance_rate_percent}%
                      </td>
                      <td className="py-3 px-4 text-[#E1E8EA]">
                        {s.tasks_completed_count} / {s.total_enrolled}
                      </td>
                      <td className="py-3 px-4 font-semibold text-cyan-400">
                        {s.task_completion_rate_percent}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Per-Student View */
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-[#1A373E] bg-[#081619] p-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-white">
              <input
                type="checkbox"
                checked={lowEngagementOnly}
                onChange={(e) => setLowEngagementOnly(e.target.checked)}
                className="rounded border-[#1A373E] bg-[#0E2024] text-amber-500 focus:ring-amber-500"
              />
              <span className="text-amber-300 font-semibold">
                Show low engagement learners only (&lt; 30% attendance or task rate)
              </span>
            </label>
            <span className="text-[#8D9FA4]">
              Showing {filteredStudents.length} of {students.length} enrolled learners
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Contact</th>
                    <th className="py-3 px-4 font-semibold">Enrolled Date</th>
                    <th className="py-3 px-4 font-semibold">Sessions Attended</th>
                    <th className="py-3 px-4 font-semibold">Attendance %</th>
                    <th className="py-3 px-4 font-semibold">Tasks Completed</th>
                    <th className="py-3 px-4 font-semibold">Task %</th>
                    <th className="py-3 px-4 font-semibold text-right">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A373E]/50 text-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#8D9FA4]">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                        <span>Loading student engagement records...</span>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#8D9FA4]">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div>No enrolled students match the active filter.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st: any) => (
                      <tr key={st.user_id} className="hover:bg-[#0E2024]/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">
                          {st.full_name || 'Anonymous Learner'}
                        </td>
                        <td className="py-3 px-4 text-[#8D9FA4] font-mono">
                          {st.phone || st.user_id.slice(0, 13)}
                        </td>
                        <td className="py-3 px-4 text-[#8D9FA4] whitespace-nowrap">
                          {formatDateIST(st.enrolled_at)}
                        </td>
                        <td className="py-3 px-4 text-[#E1E8EA]">
                          {st.sessions_attended} / {st.total_sessions}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-400">
                          {st.attendance_rate_percent}%
                        </td>
                        <td className="py-3 px-4 text-[#E1E8EA]">
                          {st.tasks_completed} / {st.total_sessions}
                        </td>
                        <td className="py-3 px-4 font-semibold text-cyan-400">
                          {st.task_completion_rate_percent}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          {st.is_low_engagement ? (
                            <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Low Engagement
                            </span>
                          ) : (
                            <Badge variant="teal" className="text-[10px]">
                              Active Learner
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendancePage;
