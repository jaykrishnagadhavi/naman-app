import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Copy,
  MoveRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Radio,
  X,
  Save,
  Search,
  Filter,
} from 'lucide-react';
import { useAuth, RichTextEditor, StudentSessionCard, ErrorDetailsAlert } from '@abrainoconscious/ui';
import {
  formatISTDateOnly,
  formatISTTimeOnly,
  toISTISOString,
  detectLivePlatform,
  isSessionStartingSoonWithoutLink,
  type AppErrorDetails,
  extractAppError,
  SaveSessionRpcPayloadSchema,
  GenerateScheduleRpcPayloadSchema,
} from '@abrainoconscious/shared';
import { AdminTodaySessionWidget } from '../components/AdminTodaySessionWidget';

interface ProgramOption {
  id: string;
  title: string;
  slug: string;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
}

interface SessionListItem {
  id: string;
  program_id: string;
  day_number: number;
  title: string;
  description: string | null;
  scheduled_at: string;
  live_platform: 'zoom' | 'meet' | 'youtube' | 'other';
  status: 'scheduled' | 'live' | 'ended';
  task_title: string | null;
  task_body: string | null;
  resources: Array<{ title: string; url: string }>;
  live_url: string | null;
  recording_url: string | null;
  link_published_at: string | null;
  recording_visible: boolean;
}

export const AdminSessionsPage: React.FC = () => {
  const { supabase } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Programs state (challenges only)
  const [challenges, setChallenges] = useState<ProgramOption[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  // View switch: 'today' | 'schedule'
  const [activeView, setActiveView] = useState<'today' | 'schedule'>('schedule');

  // Sessions list state
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<AppErrorDetails | string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Schedule Generator Modal
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [genStartDate, setGenStartDate] = useState('');
  const [genDailyTime, setGenDailyTime] = useState('07:00');
  const [genTotalDays, setGenTotalDays] = useState(21);
  const [genOverwrite, setGenOverwrite] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genModalError, setGenModalError] = useState<AppErrorDetails | string | null>(null);
  const [genSuccessMsg, setGenSuccessMsg] = useState<string | null>(null);

  // Shift Schedule Modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftDays, setShiftDays] = useState(1);
  const [shifting, setShifting] = useState(false);

  // Session Editor Drawer / Modal
  const [editingSession, setEditingSession] = useState<SessionListItem | null>(null);
  const [isNewSession, setIsNewSession] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [editorError, setEditorError] = useState<AppErrorDetails | string | null>(null);
  const [editorTab, setEditorTab] = useState<'form' | 'preview'>('form');

  // Editor Form fields
  const [formDayNumber, setFormDayNumber] = useState(1);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formScheduledTime, setFormScheduledTime] = useState('07:00');
  const [formPlatform, setFormPlatform] = useState<'zoom' | 'meet' | 'youtube' | 'other'>('zoom');
  const [formStatus, setFormStatus] = useState<'scheduled' | 'live' | 'ended'>('scheduled');
  const [formLiveUrl, setFormLiveUrl] = useState('');
  const [formRecordingUrl, setFormRecordingUrl] = useState('');
  const [formRecordingVisible, setFormRecordingVisible] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formTaskBody, setFormTaskBody] = useState('');
  const [formResources, setFormResources] = useState<Array<{ title: string; url: string }>>([]);

  // Inline Bulk Edit state
  const [inlineEditing, setInlineEditing] = useState(false);
  const [bulkSessions, setBulkSessions] = useState<{ [id: string]: { title: string; time: string } }>({});
  const [savingBulk, setSavingBulk] = useState(false);

  // 1. Fetch Challenge Programs
  useEffect(() => {
    async function loadChallenges() {
      try {
        setLoadingChallenges(true);
        const { data, error } = await supabase
          .from('programs')
          .select('id, title, slug, starts_at, ends_at, status')
          .eq('type', 'challenge')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const list: ProgramOption[] = data || [];
        setChallenges(list);

        const urlProgramId = searchParams.get('program');
        const matched = list.find((c) => c.id === urlProgramId);
        const activeProg = matched || (list.length > 0 ? list[0] : null);

        if (activeProg) {
          setSelectedProgramId(activeProg.id);
          if (activeProg.id !== urlProgramId) {
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev);
                next.set('program', activeProg.id);
                return next;
              },
              { replace: true }
            );
          }
          if (activeProg.starts_at) {
            setGenStartDate(new Date(activeProg.starts_at).toISOString().slice(0, 10));
          } else {
            setGenStartDate(new Date().toISOString().slice(0, 10));
          }
        } else {
          setSelectedProgramId('');
        }
      } catch (err) {
        console.error('Failed to load challenge programs:', err);
      } finally {
        setLoadingChallenges(false);
      }
    }

    loadChallenges();
  }, [supabase]);

  // 2. Fetch Sessions for Selected Program
  const fetchSessions = useCallback(async () => {
    if (!selectedProgramId) return;

    try {
      setLoadingSessions(true);
      setSessionsError(null);

      // Fetch program sessions
      const { data: sessionRows, error: sErr } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('program_id', selectedProgramId)
        .order('day_number', { ascending: true });

      if (sErr) throw sErr;

      if (!sessionRows || sessionRows.length === 0) {
        setSessions([]);
        return;
      }

      // Fetch protected session links
      const sessionIds = sessionRows.map((s) => s.id);
      const { data: linksRows, error: lErr } = await supabase
        .from('session_links')
        .select('*')
        .in('session_id', sessionIds);

      if (lErr) throw lErr;

      const linksMap = new Map((linksRows || []).map((l) => [l.session_id, l]));

      const fullList: SessionListItem[] = sessionRows.map((row) => {
        const link = linksMap.get(row.id);
        return {
          id: row.id,
          program_id: row.program_id,
          day_number: row.day_number,
          title: row.title,
          description: row.description,
          scheduled_at: row.scheduled_at,
          live_platform: row.live_platform,
          status: row.status,
          task_title: row.task_title,
          task_body: row.task_body,
          resources: Array.isArray(row.resources) ? (row.resources as any) : [],
          live_url: link?.live_url || null,
          recording_url: link?.recording_url || null,
          link_published_at: link?.link_published_at || null,
          recording_visible: link?.recording_visible ?? false,
        };
      });

      setSessions(fullList);

      // Initialize inline bulk edit state
      const bulkState: { [id: string]: { title: string; time: string } } = {};
      fullList.forEach((s) => {
        const d = new Date(s.scheduled_at);
        const timeStr = d.toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
        });
        bulkState[s.id] = { title: s.title, time: timeStr };
      });
      setBulkSessions(bulkState);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessionsError(extractAppError(err, 'Failed to load sessions'));
    } finally {
      setLoadingSessions(false);
    }
  }, [supabase, selectedProgramId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle program switch
  const handleProgramChange = (id: string) => {
    setSelectedProgramId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) {
        next.set('program', id);
      } else {
        next.delete('program');
      }
      return next;
    });
    const prog = challenges.find((c) => c.id === id);
    if (prog?.starts_at) {
      setGenStartDate(new Date(prog.starts_at).toISOString().slice(0, 10));
    } else {
      setGenStartDate(new Date().toISOString().slice(0, 10));
    }
  };

  // 3. Generate Schedule Handler (via RPC)
  const handleGenerateSchedule = async () => {
    if (!selectedProgramId) {
      setGenModalError('Please select a challenge program first.');
      return;
    }

    try {
      setGenerating(true);
      setGenModalError(null);
      setGenSuccessMsg(null);

      const timeWithSeconds = genDailyTime.length === 5 ? genDailyTime + ':00' : genDailyTime;
      const parseResult = GenerateScheduleRpcPayloadSchema.safeParse({
        p_program_id: selectedProgramId,
        p_start_date: genStartDate,
        p_daily_time_ist: timeWithSeconds,
        p_total_days: genTotalDays,
        p_overwrite: genOverwrite,
      });

      if (!parseResult.success) {
        const msg = parseResult.error.errors[0]?.message || 'Invalid schedule parameters';
        setGenModalError(msg);
        return;
      }

      const { error } = await (supabase.rpc as any)('generate_challenge_schedule', parseResult.data);

      if (error) throw error;

      setShowGeneratorModal(false);
      setGenOverwrite(false);
      const programTitle = challenges.find((c) => c.id === selectedProgramId)?.title || 'Cohort';
      setGenSuccessMsg(`Successfully generated ${genTotalDays} days for "${programTitle}".`);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to generate schedule:', err);
      setGenModalError(extractAppError(err, 'Could not generate schedule'));
    } finally {
      setGenerating(false);
    }
  };

  // 4. Shift Schedule Handler (via RPC)
  const handleShiftSchedule = async () => {
    if (!selectedProgramId) return;

    try {
      setShifting(true);
      setSessionsError(null);

      const { error } = await (supabase.rpc as any)('shift_challenge_schedule', {
        p_program_id: selectedProgramId,
        p_shift_days: shiftDays,
      });

      if (error) throw error;

      setShowShiftModal(false);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to shift schedule:', err);
      setSessionsError(extractAppError(err, 'Could not shift schedule'));
    } finally {
      setShifting(false);
    }
  };

  // 5. Open Session Editor Drawer
  const openSessionEditor = (session?: SessionListItem) => {
    setEditorError(null);
    setEditorTab('form');

    if (session) {
      setIsNewSession(false);
      setEditingSession(session);
      setFormDayNumber(session.day_number);
      setFormTitle(session.title);
      setFormDescription(session.description || '');

      // Parse IST date & time
      const sessionDate = new Date(session.scheduled_at);
      const istDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
      }).format(sessionDate);
      const istTime = sessionDate.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      });

      setFormScheduledDate(istDate);
      setFormScheduledTime(istTime);
      setFormPlatform(session.live_platform);
      setFormStatus(session.status);
      setFormLiveUrl(session.live_url || '');
      setFormRecordingUrl(session.recording_url || '');
      setFormRecordingVisible(session.recording_visible);
      setFormIsPublished(Boolean(session.link_published_at));
      setFormTaskTitle(session.task_title || '');
      setFormTaskBody(session.task_body || '');
      setFormResources(session.resources || []);
    } else {
      setIsNewSession(true);
      setEditingSession(null);
      const nextDay = sessions.length > 0 ? Math.max(...sessions.map((s) => s.day_number)) + 1 : 1;
      setFormDayNumber(nextDay);
      setFormTitle(`Day ${nextDay}`);
      setFormDescription('');
      setFormScheduledDate(new Date().toISOString().slice(0, 10));
      setFormScheduledTime('07:00');
      setFormPlatform('zoom');
      setFormStatus('scheduled');
      setFormLiveUrl('');
      setFormRecordingUrl('');
      setFormRecordingVisible(false);
      setFormIsPublished(false);
      setFormTaskTitle('');
      setFormTaskBody('');
      setFormResources([]);
    }
  };

  // 6. Save Session Editor (via transactional RPC save_session_with_links)
  const handleSaveSession = async () => {
    if (!selectedProgramId) {
      setEditorError('Please select a challenge program first.');
      return;
    }

    if (!formTitle.trim()) {
      setEditorError('Session title is required');
      return;
    }

    if (!formScheduledDate || !formScheduledTime) {
      setEditorError('Scheduled date and time are required');
      return;
    }

    try {
      setSavingSession(true);
      setEditorError(null);

      // Compute ISO timestamp in IST
      const scheduledAtIso = toISTISOString(formScheduledDate, formScheduledTime);

      const rawPayload = {
        p_program_id: selectedProgramId,
        p_day_number: formDayNumber,
        p_title: formTitle.trim(),
        p_scheduled_at: scheduledAtIso,
        p_session_id: isNewSession ? null : (editingSession?.id || null),
        p_description: formDescription.trim() || null,
        p_live_platform: formPlatform,
        p_status: formStatus,
        p_task_title: formTaskTitle.trim() || null,
        p_task_body: formTaskBody || null,
        p_resources: formResources,
        p_live_url: formLiveUrl.trim() || null,
        p_recording_url: formRecordingUrl.trim() || null,
        p_recording_visible: formRecordingVisible,
        p_is_link_published: formIsPublished,
        p_notify_enrollees: false,
      };

      const parseResult = SaveSessionRpcPayloadSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        setEditorError(parseResult.error.errors[0]?.message || 'Invalid session details');
        return;
      }

      const { error } = await (supabase.rpc as any)('save_session_with_links', parseResult.data);

      if (error) throw error;

      setEditingSession(null);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to save session:', err);
      setEditorError(extractAppError(err, 'Failed to save session'));
    } finally {
      setSavingSession(false);
    }
  };

  // 7. Duplicate Day
  const handleDuplicateSession = async (session: SessionListItem) => {
    if (!selectedProgramId) return;

    try {
      setLoadingSessions(true);
      const nextDay = Math.max(...sessions.map((s) => s.day_number)) + 1;
      const originalDate = new Date(session.scheduled_at);
      const nextDate = new Date(originalDate.getTime() + 24 * 60 * 60 * 1000);

      const rawPayload = {
        p_program_id: selectedProgramId,
        p_day_number: nextDay,
        p_title: `${session.title} (Copy)`,
        p_scheduled_at: nextDate.toISOString(),
        p_session_id: null,
        p_description: session.description,
        p_live_platform: session.live_platform,
        p_status: 'scheduled' as const,
        p_task_title: session.task_title,
        p_task_body: session.task_body,
        p_resources: session.resources,
        p_live_url: null,
        p_recording_url: null,
        p_recording_visible: false,
        p_is_link_published: false,
        p_notify_enrollees: false,
      };

      const parseResult = SaveSessionRpcPayloadSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        setSessionsError(parseResult.error.errors[0]?.message || 'Could not duplicate session');
        return;
      }

      const { error } = await (supabase.rpc as any)('save_session_with_links', parseResult.data);

      if (error) throw error;
      await fetchSessions();
    } catch (err) {
      console.error('Failed to duplicate session:', err);
      setSessionsError(extractAppError(err, 'Could not duplicate session'));
    } finally {
      setLoadingSessions(false);
    }
  };

  // 8. Delete Session
  const handleDeleteSession = async (sessionId: string, dayNumber: number) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete Day ${dayNumber}?`);
    if (!isConfirmed) return;

    try {
      setLoadingSessions(true);
      const { error } = await supabase.from('program_sessions').delete().eq('id', sessionId);
      if (error) throw error;

      await fetchSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
      setSessionsError(
        extractAppError(
          err,
          'Could not delete session. If students have already attended, only super admin can delete.'
        )
      );
    } finally {
      setLoadingSessions(false);
    }
  };

  // 9. Save Bulk Inline Edits
  const handleSaveBulkEdits = async () => {
    try {
      setSavingBulk(true);
      setSessionsError(null);

      for (const session of sessions) {
        const edited = bulkSessions[session.id];
        if (!edited) continue;

        const originalTime = new Date(session.scheduled_at).toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
        });

        if (edited.title !== session.title || edited.time !== originalTime) {
          const datePart = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
          }).format(new Date(session.scheduled_at));

          const newIso = toISTISOString(datePart, edited.time);

          const { error } = await supabase
            .from('program_sessions')
            .update({
              title: edited.title.trim(),
              scheduled_at: newIso,
            })
            .eq('id', session.id);

          if (error) throw error;
        }
      }

      setInlineEditing(false);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to save bulk edits:', err);
      setSessionsError(extractAppError(err, 'Failed to save inline edits'));
    } finally {
      setSavingBulk(false);
    }
  };

  const selectedProgram = challenges.find((c) => c.id === selectedProgramId);

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.task_title && s.task_title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Program Selector Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1A373E]/60 pb-6">
        <div>
          <div>
            <span className="text-xs font-semibold text-[#8D9FA4] uppercase tracking-wider">
              Cohort Live Room
            </span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-white">Live Sessions Controller</h1>
          <p className="mt-1 text-xs text-[#8D9FA4]">
            Manage daily cohort live streams, publish protected meeting links, and schedule daily student tasks.
          </p>
        </div>

        {/* Challenge Program Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#1A373E] bg-[#081619] px-3 py-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramChange(e.target.value)}
              disabled={loadingChallenges || challenges.length === 0}
              className="bg-transparent text-xs font-bold text-white focus:outline-none disabled:opacity-50"
            >
              {challenges.length === 0 ? (
                <option value="" className="bg-[#081619] text-white">
                  {loadingChallenges ? 'Loading cohorts...' : 'No challenges created'}
                </option>
              ) : (
                challenges.map((prog) => (
                  <option key={prog.id} value={prog.id} className="bg-[#081619] text-white">
                    {prog.title} ({prog.status})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* View Switch: Today vs Full Schedule */}
          <div className="flex rounded-xl border border-[#1A373E] bg-[#051113] p-1">
            <button
              type="button"
              onClick={() => setActiveView('today')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeView === 'today'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              Today's Control
            </button>
            <button
              type="button"
              onClick={() => setActiveView('schedule')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeView === 'schedule'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              Full Schedule ({sessions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Global Success Banner */}
      {genSuccessMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{genSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setGenSuccessMsg(null)}
            className="text-emerald-400/70 hover:text-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Global Errors */}
      {sessionsError && (
        <ErrorDetailsAlert
          error={sessionsError}
          onDismiss={() => setSessionsError(null)}
          className="mb-6"
        />
      )}

      {/* Empty State: No challenge programs created yet */}
      {!loadingChallenges && challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1A373E] bg-[#051113]/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <Calendar className="h-7 w-7 text-amber-400" />
          </div>
          <h3 className="mt-4 font-serif text-xl font-bold text-white">No Challenge Programs Found</h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-[#8D9FA4] leading-relaxed">
            Live cohort sessions are tied to <strong>Challenge</strong> programs (with fixed start and end dates). Create a challenge program first before scheduling live sessions.
          </p>
          <div className="mt-6">
            <Link
              to="/programs/new"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-all shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Create Challenge Program</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Prominent "Today's Session" Widget */}
          {selectedProgramId && (
            <AdminTodaySessionWidget
              programId={selectedProgramId}
              onOpenEditor={(id) => {
                const found = sessions.find((s) => s.id === id);
                if (found) openSessionEditor(found);
              }}
            />
          )}

          {/* Schedule Builder Toolbar & Inline Table */}
          {activeView === 'schedule' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-xl font-bold text-white">Cohort Schedule</h2>
                  <span className="rounded-full bg-[#10272B] px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                    {sessions.length} Days Planned
                  </span>
                </div>

                {/* Action Buttons: Generate, Shift, Add Day, Inline Edit */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGenModalError(null);
                      setShowGeneratorModal(true);
                    }}
                    disabled={!selectedProgramId}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title={!selectedProgramId ? 'Select a challenge program first' : undefined}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Generate Days</span>
                  </button>

                  {sessions.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowShiftModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A373E] bg-[#0E2024] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#132A30] transition-all"
                      >
                        <MoveRight className="h-3.5 w-3.5 text-amber-400" />
                        <span>Shift All Days</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (inlineEditing) {
                            handleSaveBulkEdits();
                          } else {
                            setInlineEditing(true);
                          }
                        }}
                        disabled={savingBulk}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                          inlineEditing
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'border border-[#1A373E] bg-[#0E2024] text-white hover:bg-[#132A30]'
                        }`}
                      >
                        {inlineEditing ? (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            <span>{savingBulk ? 'Saving...' : 'Save Bulk Edits'}</span>
                          </>
                        ) : (
                          <>
                            <Edit2 className="h-3.5 w-3.5 text-amber-400" />
                            <span>Bulk Edit</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => openSessionEditor()}
                    disabled={!selectedProgramId}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow"
                    title={!selectedProgramId ? 'Select a challenge program first' : undefined}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Day</span>
                  </button>
                </div>
              </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#1A373E] bg-[#081619] p-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8D9FA4]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search day by title or task..."
                className="w-full rounded-lg border border-[#1A373E] bg-[#051113] pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8D9FA4] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#8D9FA4]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[#1A373E] bg-[#051113] px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live Now</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          {/* Schedule Table */}
          {loadingSessions ? (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-8 text-center text-white">
              <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="mt-3 text-xs text-[#8D9FA4]">Loading cohort sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1A373E] bg-[#081619] p-12 text-center text-white">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-white">No Sessions Scheduled</h3>
              <p className="mt-1 text-xs text-[#8D9FA4] max-w-sm mx-auto">
                Ready to launch your cohort? Use the "Generate Days" generator above to create an automated daily schedule.
              </p>
              <button
                type="button"
                onClick={() => setShowGeneratorModal(true)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-amber-400"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Schedule</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1A373E] bg-[#081619]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1A373E] bg-[#051113] text-[#8D9FA4]">
                    <th className="px-4 py-3 font-semibold w-16">Day</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Scheduled (IST)</th>
                    <th className="px-4 py-3 font-semibold">Live Link Status</th>
                    <th className="px-4 py-3 font-semibold">Today's Task</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A373E]/60 text-white">
                  {filteredSessions.map((session) => {
                    const isMissingLink = isSessionStartingSoonWithoutLink(
                      session.scheduled_at,
                      session.live_url,
                      session.link_published_at,
                      120
                    );

                    return (
                      <tr
                        key={session.id}
                        className={`hover:bg-[#0C1E22] transition-colors ${
                          isMissingLink ? 'bg-red-950/20' : ''
                        }`}
                      >
                        {/* Day Number */}
                        <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                          #{session.day_number}
                        </td>

                        {/* Title (Inline editable or static) */}
                        <td className="px-4 py-3.5 font-medium">
                          {inlineEditing ? (
                            <input
                              type="text"
                              value={bulkSessions[session.id]?.title ?? session.title}
                              onChange={(e) =>
                                setBulkSessions({
                                  ...bulkSessions,
                                  [session.id]: {
                                    ...bulkSessions[session.id],
                                    title: e.target.value,
                                  },
                                })
                              }
                              className="w-full rounded border border-[#1A373E] bg-[#051113] px-2 py-1 text-xs text-white focus:border-amber-500"
                            />
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-white font-semibold">{session.title}</span>
                              {session.description && (
                                <span className="text-[11px] text-[#8D9FA4] line-clamp-1">
                                  {session.description}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Scheduled At (IST) */}
                        <td className="px-4 py-3.5 font-mono text-[#C5D5D8]">
                          {inlineEditing ? (
                            <input
                              type="time"
                              value={bulkSessions[session.id]?.time ?? '07:00'}
                              onChange={(e) =>
                                setBulkSessions({
                                  ...bulkSessions,
                                  [session.id]: {
                                    ...bulkSessions[session.id],
                                    time: e.target.value,
                                  },
                                })
                              }
                              className="rounded border border-[#1A373E] bg-[#051113] px-2 py-1 text-xs text-white focus:border-amber-500"
                            />
                          ) : (
                            <div className="flex flex-col">
                              <span>{formatISTDateOnly(session.scheduled_at)}</span>
                              <span className="text-[11px] text-[#8D9FA4]">
                                {formatISTTimeOnly(session.scheduled_at)}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Live Link Status */}
                        <td className="px-4 py-3.5">
                          {session.live_url ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {session.link_published_at ? 'Published' : 'Draft Saved'}
                              </span>
                            </div>
                          ) : isMissingLink ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-400 animate-pulse">
                              <AlertTriangle className="h-3 w-3" />
                              Missing Link!
                            </span>
                          ) : (
                            <span className="text-[#8D9FA4] text-[11px]">No link added</span>
                          )}
                        </td>

                        {/* Daily Task */}
                        <td className="px-4 py-3.5">
                          {session.task_title ? (
                            <span className="rounded bg-[#10272B] px-2 py-0.5 text-[11px] text-[#A0B1B5] line-clamp-1 max-w-xs">
                              {session.task_title}
                            </span>
                          ) : (
                            <span className="text-[#8D9FA4] text-[11px] italic">None</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          {session.status === 'live' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 font-bold text-red-400 animate-pulse">
                              <Radio className="h-3 w-3" />
                              Live Now
                            </span>
                          ) : session.status === 'ended' ? (
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                              Ended
                            </span>
                          ) : (
                            <span className="rounded bg-[#10272B] px-2 py-0.5 text-[#8D9FA4]">
                              Scheduled
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openSessionEditor(session)}
                              className="rounded p-1 text-[#8D9FA4] hover:bg-[#152B30] hover:text-white transition-all"
                              title="Edit Day Details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateSession(session)}
                              className="rounded p-1 text-[#8D9FA4] hover:bg-[#152B30] hover:text-amber-400 transition-all"
                              title="Duplicate Day"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(session.id, session.day_number)}
                              className="rounded p-1 text-[#8D9FA4] hover:bg-red-500/20 hover:text-red-400 transition-all"
                              title="Delete Day"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* ===================================================================== */}
      {/* 1. Schedule Generator Modal */}
      {/* ===================================================================== */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#081619] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A373E] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h3 className="font-serif text-lg font-bold text-white">Generate Challenge Days</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGeneratorModal(false);
                  setGenModalError(null);
                }}
                className="text-[#8D9FA4] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {genModalError && (
              <ErrorDetailsAlert
                error={genModalError}
                onDismiss={() => setGenModalError(null)}
                className="mt-3"
              />
            )}

            {selectedProgram ? (
              <p className="mt-3 text-xs text-[#8D9FA4] leading-relaxed">
                Batch create daily session placeholders for{' '}
                <strong className="text-white">{selectedProgram.title}</strong> with automated IST timing.
              </p>
            ) : (
              <div className="mt-3 rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-xs text-red-400">
                No challenge program is currently selected. Please select a challenge program first.
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-white block mb-1">Program Start Date (IST)</label>
                <input
                  type="date"
                  value={genStartDate}
                  onChange={(e) => setGenStartDate(e.target.value)}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white block mb-1">Default Daily Time (IST)</label>
                  <input
                    type="time"
                    value={genDailyTime}
                    onChange={(e) => setGenDailyTime(e.target.value)}
                    className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white block mb-1">Number of Days</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={genTotalDays}
                    onChange={(e) => setGenTotalDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {sessions.length > 0 && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Warning: Existing Schedule Detected ({sessions.length} days)</span>
                  </div>
                  <p className="text-[11px] text-[#C5D5D8] leading-relaxed">
                    Generating a new schedule will replace existing session rows. If students have already attended, regeneration is strictly blocked.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="genOverwriteCheckbox"
                      checked={genOverwrite}
                      onChange={(e) => setGenOverwrite(e.target.checked)}
                      className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="genOverwriteCheckbox" className="text-xs font-bold text-white cursor-pointer">
                      I confirm and want to overwrite existing days
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowGeneratorModal(false);
                  setGenModalError(null);
                }}
                className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#132A30]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateSchedule}
                disabled={generating || !selectedProgramId || (sessions.length > 0 && !genOverwrite)}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50 transition-all shadow"
              >
                {generating ? 'Generating Schedule...' : 'Generate Days'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. Shift Schedule Modal */}
      {/* ===================================================================== */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#1A373E] bg-[#081619] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A373E] pb-3">
              <div className="flex items-center gap-2">
                <MoveRight className="h-5 w-5 text-amber-400" />
                <h3 className="font-serif text-lg font-bold text-white">Shift Entire Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="text-[#8D9FA4] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-[#8D9FA4] leading-relaxed">
              Delay or advance all {sessions.length} days in this cohort challenge by N days.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold text-white block">Shift By Days</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={shiftDays}
                  onChange={(e) => setShiftDays(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. 1 or -1"
                  className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <span className="text-xs text-[#8D9FA4]">Days</span>
              </div>
              <p className="text-[11px] text-[#8D9FA4]">
                Positive numbers move sessions into the future; negative numbers advance them earlier.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#132A30]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShiftSchedule}
                disabled={shifting || shiftDays === 0}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50"
              >
                {shifting ? 'Shifting...' : 'Shift Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. Session Editor Modal / Drawer */}
      {/* ===================================================================== */}
      {(editingSession !== null || isNewSession) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-[#234A54] bg-[#081619] p-6 text-white shadow-2xl my-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1A373E] pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                  {isNewSession ? 'New Session' : `Editing Day ${formDayNumber}`}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white">
                  {formTitle || 'Untitled Day Session'}
                </h3>
              </div>

              {/* Form vs Student Preview Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-[#1A373E] bg-[#051113] p-1">
                  <button
                    type="button"
                    onClick={() => setEditorTab('form')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      editorTab === 'form'
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-[#8D9FA4] hover:text-white'
                    }`}
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      editorTab === 'preview'
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-[#8D9FA4] hover:text-white'
                    }`}
                  >
                    Preview as Student
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSession(null);
                    setIsNewSession(false);
                  }}
                  className="rounded-lg p-1.5 text-[#8D9FA4] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {editorError && (
              <ErrorDetailsAlert
                error={editorError}
                onDismiss={() => setEditorError(null)}
                className="mb-4"
              />
            )}

            {editorTab === 'preview' ? (
              <div className="space-y-4">
                <p className="text-xs text-[#8D9FA4]">
                  This is how enrolled students will experience this day's live card on their dashboard.
                </p>
                <StudentSessionCard
                  dayNumber={formDayNumber}
                  title={formTitle || `Day ${formDayNumber}`}
                  scheduledAt={toISTISOString(formScheduledDate, formScheduledTime)}
                  livePlatform={formPlatform}
                  status={formStatus}
                  description={formDescription}
                  taskTitle={formTaskTitle}
                  taskBody={formTaskBody}
                  resources={formResources}
                  liveUrl={formLiveUrl}
                  recordingUrl={formRecordingUrl}
                  recordingVisible={formRecordingVisible}
                  isPreview={true}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto pr-2">
                {/* Left Column: Metadata & Timing */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-white block mb-1">Day #</label>
                      <input
                        type="number"
                        min={1}
                        value={formDayNumber}
                        onChange={(e) => setFormDayNumber(parseInt(e.target.value, 10) || 1)}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-white block mb-1">Title</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Day 1: Neural Rewiring"
                        className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 text-xs text-white focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-1">Description (Optional)</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Short summary of today's live workshop topic..."
                      className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 text-xs text-white focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-white block mb-1">Scheduled Date (IST)</label>
                      <input
                        type="date"
                        value={formScheduledDate}
                        onChange={(e) => setFormScheduledDate(e.target.value)}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white block mb-1">Scheduled Time (IST)</label>
                      <input
                        type="time"
                        value={formScheduledTime}
                        onChange={(e) => setFormScheduledTime(e.target.value)}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-white block mb-1">Platform</label>
                      <select
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value as any)}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 text-xs text-white focus:border-amber-500"
                      >
                        <option value="zoom">Zoom</option>
                        <option value="meet">Google Meet</option>
                        <option value="youtube">YouTube Live</option>
                        <option value="other">Other Platform</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white block mb-1">Session Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 text-xs text-white focus:border-amber-500"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live Now</option>
                        <option value="ended">Ended</option>
                      </select>
                    </div>
                  </div>

                  {/* Protected Links Section */}
                  <div className="rounded-xl border border-[#1A373E] bg-[#051113] p-4 space-y-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Protected Links (Saved to session_links)
                    </span>

                    <div>
                      <label className="text-xs font-bold text-white block mb-1">
                        Live Meeting URL (HTTPS)
                      </label>
                      <input
                        type="url"
                        value={formLiveUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormLiveUrl(val);
                          const detected = detectLivePlatform(val);
                          if (detected !== 'other') setFormPlatform(detected);
                        }}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-[#1A373E] bg-[#081619] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="formIsPublishedCheck"
                        checked={formIsPublished}
                        onChange={(e) => setFormIsPublished(e.target.checked)}
                        className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor="formIsPublishedCheck" className="text-xs text-[#A0B1B5] cursor-pointer">
                        Mark live link as officially published to students
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white block mb-1">
                        Recording URL (After Session Ends)
                      </label>
                      <input
                        type="url"
                        value={formRecordingUrl}
                        onChange={(e) => setFormRecordingUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-[#1A373E] bg-[#081619] px-3.5 py-2 font-mono text-xs text-white focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="formRecordingVisibleCheck"
                        checked={formRecordingVisible}
                        onChange={(e) => setFormRecordingVisible(e.target.checked)}
                        className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor="formRecordingVisibleCheck" className="text-xs text-[#A0B1B5] cursor-pointer">
                        Make recording visible to enrolled students
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Daily Task & Resources */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white block">Today's Daily Task Title</label>
                    <input
                      type="text"
                      value={formTaskTitle}
                      onChange={(e) => setFormTaskTitle(e.target.value)}
                      placeholder="e.g. 5-Minute Morning Presence Log"
                      className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2 text-xs text-white focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">
                      Task Description & Instructions (Sanitised Rich Text)
                    </label>
                    <RichTextEditor
                      value={formTaskBody}
                      onChange={setFormTaskBody}
                      placeholder="Detailed exercises, reflection prompts, or practical homework for today..."
                      className="min-h-[180px]"
                    />
                  </div>

                  {/* Resources list */}
                  <div className="rounded-xl border border-[#1A373E] bg-[#051113] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Downloadables & Resources</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormResources([...formResources, { title: '', url: 'https://' }])
                        }
                        className="text-xs text-amber-400 hover:underline"
                      >
                        + Add Resource
                      </button>
                    </div>

                    {formResources.map((res, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={res.title}
                          onChange={(e) => {
                            const updated = [...formResources];
                            updated[idx].title = e.target.value;
                            setFormResources(updated);
                          }}
                          placeholder="Resource title"
                          className="flex-1 rounded-lg border border-[#1A373E] bg-[#081619] px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="url"
                          value={res.url}
                          onChange={(e) => {
                            const updated = [...formResources];
                            updated[idx].url = e.target.value;
                            setFormResources(updated);
                          }}
                          placeholder="https://..."
                          className="flex-1 rounded-lg border border-[#1A373E] bg-[#081619] px-2.5 py-1.5 font-mono text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formResources.filter((_, i) => i !== idx);
                            setFormResources(updated);
                          }}
                          className="text-red-400 p-1 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#1A373E] pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditingSession(null);
                  setIsNewSession(false);
                }}
                className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#132A30]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSession}
                disabled={savingSession}
                className="rounded-xl bg-amber-500 px-6 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50 transition-all shadow"
              >
                {savingSession ? 'Saving Session...' : isNewSession ? 'Create Session' : 'Save Session Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

