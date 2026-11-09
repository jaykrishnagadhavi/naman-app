import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  Video,
  Eye,
  RefreshCw,
  Users,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { useAuth, StudentSessionCard, ErrorDetailsAlert } from '@abrainoconscious/ui';
import {
  formatIST,
  validateLiveUrl,
  detectLivePlatform,
  isSessionStartingSoonWithoutLink,
  type AppErrorDetails,
  extractAppError,
} from '@abrainoconscious/shared';

export interface TodaySessionData {
  id: string;
  program_id: string;
  program_title: string;
  program_slug: string;
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
  enrolled_count: number;
}

export interface AdminTodaySessionWidgetProps {
  programId?: string; // If provided, limits to this program; otherwise shows today's active challenge sessions
  onOpenEditor?: (sessionId: string) => void;
  className?: string;
}

export const AdminTodaySessionWidget: React.FC<AdminTodaySessionWidgetProps> = ({
  programId,
  onOpenEditor,
  className = '',
}) => {
  const { supabase } = useAuth();
  const [sessions, setSessions] = useState<TodaySessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppErrorDetails | string | null>(null);

  // Active session being managed in the widget
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Link input & publish modal states
  const [linkInput, setLinkInput] = useState('');
  const [notifyEnrollees, setNotifyEnrollees] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [reNotifyPrompt, setReNotifyPrompt] = useState(false);

  // Recording modal state
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingInput, setRecordingInput] = useState('');
  const [recordingVisible, setRecordingVisible] = useState(true);
  const [savingRecording, setSavingRecording] = useState(false);

  // Student Preview modal state
  const [showStudentPreview, setShowStudentPreview] = useState(false);

  // Fetch today's sessions
  const fetchTodaySessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Query challenges
      let query = supabase
        .from('program_sessions')
        .select(`
          id,
          program_id,
          day_number,
          title,
          description,
          scheduled_at,
          live_platform,
          status,
          task_title,
          task_body,
          resources,
          programs!inner (
            id,
            title,
            slug,
            type,
            status
          )
        `)
        .order('scheduled_at', { ascending: true });

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data: sessionRows, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      if (!sessionRows || sessionRows.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Filter for today's sessions or nearest upcoming live session
      // In IST, "today" covers from start of today to end of today in IST
      const now = new Date();
      const istDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
      }).format(now); // YYYY-MM-DD

      // Fetch links for these sessions
      const sessionIds = sessionRows.map((s) => s.id);
      const { data: linksRows } = await supabase
        .from('session_links')
        .select('*')
        .in('session_id', sessionIds);

      const linksMap = new Map((linksRows || []).map((l) => [l.session_id, l]));

      // Fetch enrollment count per program
      const programIds = Array.from(new Set(sessionRows.map((s) => s.program_id)));
      const { data: enrollmentCounts } = await supabase
        .from('enrollments')
        .select('program_id')
        .eq('status', 'active')
        .in('program_id', programIds);

      const enrollmentMap = new Map<string, number>();
      for (const enr of enrollmentCounts || []) {
        enrollmentMap.set(enr.program_id, (enrollmentMap.get(enr.program_id) || 0) + 1);
      }

      const formatted: TodaySessionData[] = sessionRows.map((row) => {
        const link = linksMap.get(row.id);
        const prog = Array.isArray(row.programs) ? row.programs[0] : row.programs;
        return {
          id: row.id,
          program_id: row.program_id,
          program_title: prog?.title || 'Challenge Program',
          program_slug: prog?.slug || '',
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
          enrolled_count: enrollmentMap.get(row.program_id) || 0,
        };
      });

      // Filter for sessions matching today in IST, or the next scheduled/live session
      const todaySessions = formatted.filter((s) => {
        const sessionDateIST = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
        }).format(new Date(s.scheduled_at));
        return sessionDateIST === istDateStr || s.status === 'live';
      });

      // If no session matches today exactly, fall back to the closest scheduled upcoming session
      const finalSessions = todaySessions.length > 0 ? todaySessions : formatted.slice(0, 3);

      setSessions(finalSessions);
      if (finalSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(finalSessions[0].id);
        setLinkInput(finalSessions[0].live_url || '');
      }
    } catch (err) {
      console.error('Failed to load today sessions:', err);
      setError(extractAppError(err, 'Could not load today sessions'));
    } finally {
      setLoading(false);
    }
  }, [supabase, programId, selectedSessionId]);

  useEffect(() => {
    fetchTodaySessions();
  }, [fetchTodaySessions]);

  // Realtime subscription on program_sessions and session_links
  useEffect(() => {
    const channel = supabase
      .channel('admin-today-sessions-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'program_sessions' },
        () => {
          fetchTodaySessions();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_links' },
        () => {
          fetchTodaySessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchTodaySessions]);

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  useEffect(() => {
    if (activeSession) {
      setLinkInput(activeSession.live_url || '');
    }
  }, [activeSession?.id, activeSession?.live_url]);

  // Handle Publish / Save Link
  const handlePublishLink = async (forceRenotify = false) => {
    if (!activeSession) return;

    const validation = validateLiveUrl(linkInput);
    if (!validation.valid) {
      setError(validation.error || 'Please enter a valid https:// live meeting URL');
      return;
    }

    // If link was already published and user is editing it, prompt if not explicitly answering
    if (activeSession.link_published_at && !forceRenotify && !reNotifyPrompt) {
      setReNotifyPrompt(true);
      return;
    }

    try {
      setPublishing(true);
      setError(null);
      setPublishSuccessMessage(null);

      // Call publish_session_link RPC
      const { data, error: rpcErr } = await (supabase.rpc as any)('publish_session_link', {
        p_session_id: activeSession.id,
        p_live_url: linkInput.trim(),
        p_notify_enrollees: notifyEnrollees,
        p_force_renotify: forceRenotify,
      });

      if (rpcErr) throw rpcErr;

      const notifiedCount = data?.notified_count ?? (notifyEnrollees ? activeSession.enrolled_count : 0);
      setPublishSuccessMessage(
        notifyEnrollees
          ? `Live link published and dispatched to ${notifiedCount} enrolled students!`
          : 'Live link saved and published silently without notification.'
      );
      setReNotifyPrompt(false);
      await fetchTodaySessions();
    } catch (err) {
      console.error('Failed to publish live link:', err);
      setError(extractAppError(err, 'Could not publish live link'));
    } finally {
      setPublishing(false);
    }
  };

  // Change Session Status: Mark Live / Mark Ended
  const handleUpdateStatus = async (newStatus: 'live' | 'ended') => {
    if (!activeSession) return;

    try {
      setLoading(true);
      setError(null);

      const { error: updErr } = await supabase
        .from('program_sessions')
        .update({ status: newStatus })
        .eq('id', activeSession.id);

      if (updErr) throw updErr;

      // If marking ended, prompt to add recording URL
      if (newStatus === 'ended') {
        setShowRecordingModal(true);
        setRecordingInput(activeSession.recording_url || '');
        setRecordingVisible(activeSession.recording_visible);
      }

      await fetchTodaySessions();
    } catch (err) {
      console.error('Failed to update session status:', err);
      setError(extractAppError(err, 'Could not update session status'));
    } finally {
      setLoading(false);
    }
  };

  // Save Recording URL
  const handleSaveRecording = async () => {
    if (!activeSession) return;

    if (recordingInput && !recordingInput.startsWith('https://')) {
      setError('Recording URL must start with https://');
      return;
    }

    try {
      setSavingRecording(true);
      setError(null);

      const { error: updErr } = await supabase
        .from('session_links')
        .update({
          recording_url: recordingInput.trim() || null,
          recording_visible: recordingVisible,
        })
        .eq('session_id', activeSession.id);

      if (updErr) throw updErr;

      setShowRecordingModal(false);
      await fetchTodaySessions();
    } catch (err) {
      console.error('Failed to save recording:', err);
      setError(extractAppError(err, 'Could not save recording'));
    } finally {
      setSavingRecording(false);
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className={`rounded-2xl border border-[#1A373E] bg-[#081619] p-6 text-white ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm font-medium text-[#8D9FA4]">Loading today's session controller...</span>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={`rounded-2xl border border-[#1A373E] bg-[#081619] p-6 text-center text-white ${className}`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          <Calendar className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-serif text-lg font-bold text-white">No Live Sessions Scheduled for Today</h3>
        <p className="mt-1 text-xs text-[#8D9FA4] max-w-md mx-auto">
          All cohort challenges are up to date. You can generate or manage future cohort schedules in the Sessions manager.
        </p>
      </div>
    );
  }

  const isLinkMissingSoon = isSessionStartingSoonWithoutLink(
    activeSession.scheduled_at,
    activeSession.live_url,
    activeSession.link_published_at,
    120
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        activeSession.status === 'live'
          ? 'border-amber-500/60 bg-gradient-to-br from-[#0A2024] via-[#081619] to-[#040C0E] shadow-[0_0_35px_rgba(245,135,31,0.2)]'
          : isLinkMissingSoon
          ? 'border-red-500/50 bg-gradient-to-br from-red-950/40 via-[#081619] to-[#040C0E]'
          : 'border-[#1A373E] bg-gradient-to-br from-[#091D21] via-[#081619] to-[#040C0E]'
      } p-6 text-white ${className}`}
    >
      {/* Missing Link Warning Header (Starts within 2 hrs & no link) */}
      {isLinkMissingSoon && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-2 text-xs font-semibold text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 animate-bounce" />
            <span>CRITICAL: Live link is missing and session begins in less than 2 hours!</span>
          </div>
          <span className="font-mono text-white">{formatIST(activeSession.scheduled_at, true)}</span>
        </div>
      )}

      {/* Header & Program Switcher if multiple challenges today */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1A373E]/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
              TODAY'S LIVE CONTROL
            </span>
            <span className="font-mono text-xs text-[#8D9FA4]">
              {activeSession.program_title}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h2 className="font-serif text-2xl font-bold text-white">
              Day {activeSession.day_number}: {activeSession.title}
            </h2>
            {activeSession.status === 'live' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 animate-pulse">
                <Radio className="h-3.5 w-3.5" />
                COHORT LIVE NOW
              </span>
            ) : activeSession.status === 'ended' ? (
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                Session Completed
              </span>
            ) : (
              <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                Scheduled Today
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#8D9FA4]">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              {formatIST(activeSession.scheduled_at, true)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              {activeSession.enrolled_count} Active Enrolled Students
            </span>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {sessions.length > 1 && (
            <select
              value={activeSession.id}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="rounded-xl border border-[#1A373E] bg-[#081619] px-3 py-2 text-xs text-white"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Day {s.day_number} - {s.program_title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowStudentPreview(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A373E] bg-[#0E2024] px-3.5 py-2 text-xs font-semibold text-amber-400 hover:border-amber-500/40 hover:bg-[#132A30] transition-all"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview as Student</span>
          </button>

          {onOpenEditor && (
            <button
              type="button"
              onClick={() => onOpenEditor(activeSession.id)}
              className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#132A30] transition-all"
            >
              Full Details
            </button>
          )}
        </div>
      </div>

      {/* Notifications & Error messages */}
      {error && (
        <ErrorDetailsAlert
          error={error}
          onDismiss={() => setError(null)}
          className="mt-4"
        />
      )}

      {publishSuccessMessage && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{publishSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPublishSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Core Live Link Controller Strip */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Link Paste & Publish */}
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-amber-400" />
                Live Session URL (Zoom, Google Meet, or YouTube)
              </span>
              {activeSession.link_published_at ? (
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Link is live for {activeSession.enrolled_count} students
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-400">
                  Link not yet published
                </span>
              )}
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://us02web.zoom.us/j/... or https://meet.google.com/..."
                  className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-4 py-2.5 font-mono text-xs text-white placeholder-[#8D9FA4] focus:border-amber-500 focus:outline-none"
                />
                {linkInput && (
                  <span className="absolute right-3 top-2.5 rounded bg-[#10272B] px-2 py-0.5 text-[10px] uppercase font-bold text-amber-400">
                    {detectLivePlatform(linkInput)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handlePublishLink(false)}
                disabled={publishing || !linkInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all shrink-0"
              >
                {publishing ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-black" />
                ) : (
                  <Send className="h-4 w-4 text-black" />
                )}
                <span>{activeSession.link_published_at ? 'Update & Publish' : 'Publish Live Link'}</span>
              </button>
            </div>
          </div>

          {/* Toggle: Notify Enrolled Students */}
          <div className="flex items-center justify-between rounded-xl border border-[#1A373E] bg-[#051113] p-3">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="notifyEnrolleesToggle"
                checked={notifyEnrollees}
                onChange={(e) => setNotifyEnrollees(e.target.checked)}
                className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="notifyEnrolleesToggle" className="cursor-pointer text-xs text-[#A0B1B5]">
                <span className="font-semibold text-white">Notify enrolled students immediately</span>
                <span className="block text-[11px] text-[#8D9FA4]">
                  Fans out in-app push notifications to {activeSession.enrolled_count} active students. Deduplicated to prevent spam.
                </span>
              </label>
            </div>

            {activeSession.live_url && (
              <a
                href={activeSession.live_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline shrink-0"
              >
                <span>Test Link</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Big Cohort Actions (Mark Live, Mark Ended, Recording) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-xl border border-[#1A373E] bg-[#051113] p-4 space-y-3">
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            Cohort Session Lifecycle
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleUpdateStatus('live')}
              disabled={activeSession.status === 'live'}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                activeSession.status === 'live'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 cursor-default'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${activeSession.status === 'live' ? 'animate-pulse' : ''}`} />
              <span>Mark Live</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateStatus('ended')}
              disabled={activeSession.status === 'ended'}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                activeSession.status === 'ended'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                  : 'bg-[#152B30] hover:bg-[#1E3B42] text-white border border-[#234A54]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark Ended</span>
            </button>
          </div>

          {/* Recording Status & Action */}
          <div className="pt-2 border-t border-[#1A373E]/60">
            {activeSession.recording_url ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8D9FA4] flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-amber-400" />
                  Recording saved ({activeSession.recording_visible ? 'Visible' : 'Hidden'})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordingModal(true);
                    setRecordingInput(activeSession.recording_url || '');
                    setRecordingVisible(activeSession.recording_visible);
                  }}
                  className="text-amber-400 hover:underline text-[11px] font-semibold"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowRecordingModal(true);
                  setRecordingInput('');
                  setRecordingVisible(true);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#234A54] hover:border-amber-500/40 bg-[#081619] px-3 py-2 text-xs font-semibold text-[#8D9FA4] hover:text-white transition-all"
              >
                <Video className="h-3.5 w-3.5 text-amber-400" />
                <span>Add Class Recording URL</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Re-Notify Confirmation Modal */}
      {reNotifyPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#081619] p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Live Link Modified</h3>
                <p className="text-xs text-[#8D9FA4]">A live link has already been published for this session.</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#C5D5D8] leading-relaxed">
              Do you want to re-notify all {activeSession.enrolled_count} active students with the new link, or update it silently in place?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReNotifyPrompt(false);
                  handlePublishLink(false); // update silently without spamming
                }}
                className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#132A30]"
              >
                Update Silently
              </button>
              <button
                type="button"
                onClick={() => {
                  setReNotifyPrompt(false);
                  handlePublishLink(true); // force re-notify
                }}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400"
              >
                Re-Notify All Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording URL Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#1A373E] bg-[#081619] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A373E]/60 pb-3">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-amber-400" />
                <h3 className="font-serif text-lg font-bold text-white">Session Recording URL</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordingModal(false)}
                className="text-[#8D9FA4] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Recording URL (HTTPS)
                </label>
                <input
                  type="url"
                  value={recordingInput}
                  onChange={(e) => setRecordingInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-4 py-2.5 font-mono text-xs text-white placeholder-[#8D9FA4] focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#1A373E] bg-[#051113] p-3">
                <input
                  type="checkbox"
                  id="recordingVisibleToggle"
                  checked={recordingVisible}
                  onChange={(e) => setRecordingVisible(e.target.checked)}
                  className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="recordingVisibleToggle" className="cursor-pointer text-xs text-[#A0B1B5]">
                  <span className="font-semibold text-white">Make recording visible to enrolled students now</span>
                  <span className="block text-[11px] text-[#8D9FA4]">
                    If unchecked, recording remains private until you review and enable it.
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRecordingModal(false)}
                className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#132A30]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRecording}
                disabled={savingRecording}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50"
              >
                {savingRecording ? 'Saving...' : 'Save Recording'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student View Live Preview Modal */}
      {showStudentPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-amber-500/40 bg-[#040C0E] p-6 text-white shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#1A373E] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-400" />
                <h3 className="font-serif text-lg font-bold text-white">Student Dashboard Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentPreview(false)}
                className="text-[#8D9FA4] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#8D9FA4]">
              This is the exact component rendered inside the student portal (<code className="text-amber-400 font-mono">app.abrainoconcious.com</code>) using real database data and draft status.
            </p>

            <StudentSessionCard
              dayNumber={activeSession.day_number}
              title={activeSession.title}
              scheduledAt={activeSession.scheduled_at}
              livePlatform={activeSession.live_platform}
              status={activeSession.status}
              description={activeSession.description}
              taskTitle={activeSession.task_title}
              taskBody={activeSession.task_body}
              resources={activeSession.resources}
              liveUrl={linkInput || activeSession.live_url}
              recordingUrl={activeSession.recording_url}
              recordingVisible={activeSession.recording_visible}
              isPreview={true}
            />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowStudentPreview(false)}
                className="rounded-xl bg-[#152B30] hover:bg-[#1E3B42] px-5 py-2 text-xs font-semibold text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

