import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Clock,
  Pin,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  Copy,
  Edit2,
  Trash2,
  RotateCcw,
  RefreshCw,
  Search,
  Eye,
  Users,
  User,
  BookOpen,
  X,
} from 'lucide-react';
import {
  useAuth,
  RichTextEditor,
  AnnouncementBanner,
  AnnouncementInboxCard,
  ErrorDetailsAlert,
} from '@abrainoconscious/ui';
import {
  formatIST,
  toISTISOString,
  getAnnouncementStatus,
  type AnnouncementKind,
  type AnnouncementAudience,
  type AnnouncementComputedStatus,
  type AppErrorDetails,
  extractAppError,
  AnnouncementPayloadSchema,
} from '@abrainoconscious/shared';

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  kind: AnnouncementKind;
  audience: AnnouncementAudience;
  program_id: string | null;
  user_id: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_pinned: boolean;
  publish_at: string;
  expires_at: string | null;
  fanned_out_at: string | null;
  is_draft: boolean;
  created_at: string;
  // Computed & join data
  program_title?: string;
  user_name?: string;
  user_email?: string;
  read_count: number;
  audience_size: number;
  read_percent: number;
  status: AnnouncementComputedStatus;
}

export const AdminAnnouncementsPage: React.FC = () => {
  const { supabase, profile } = useAuth();
  const [searchParams] = useSearchParams();

  // Active view tab: 'composer' | 'history'
  const [activeTab, setActiveTab] = useState<'composer' | 'history'>('history');

  // History state
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<AppErrorDetails | string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');

  // Programs & Users for audience targeting
  const [programsList, setProgramsList] = useState<Array<{ id: string; title: string }>>([]);
  const [studentSearchResults, setStudentSearchResults] = useState<Array<{ id: string; full_name: string; email?: string }>>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; full_name: string; email?: string } | null>(null);

  // Composer Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<AnnouncementKind>('info');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [targetProgramId, setTargetProgramId] = useState<string>('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [publishTiming, setPublishTiming] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('23:59');

  // Composer previews tab: 'banner' | 'inbox' | 'toast'
  const [previewTab, setPreviewTab] = useState<'banner' | 'inbox' | 'toast'>('banner');

  // Confirmation & action modals
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentAudienceCount, setUrgentAudienceCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<AppErrorDetails | string | null>(null);
  const [composerSuccess, setComposerSuccess] = useState<string | null>(null);

  // Manual Fan-Out run state
  const [runningFanOut, setRunningFanOut] = useState(false);
  const [fanOutResult, setFanOutResult] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  // 1. Check URL parameters for direct message shortcuts (e.g. ?new=true&audience=user&userId=xyz)
  useEffect(() => {
    const isNew = searchParams.get('new');
    const aud = searchParams.get('audience');
    const uid = searchParams.get('userId');
    const uName = searchParams.get('userName');

    if (isNew === 'true') {
      setActiveTab('composer');
      if (aud === 'user' && uid) {
        setAudience('user');
        setSelectedStudent({ id: uid, full_name: uName || 'Student', email: '' });
      }
    }
  }, [searchParams]);

  // 2. Fetch Programs list
  useEffect(() => {
    async function loadPrograms() {
      try {
        const { data } = await supabase
          .from('programs')
          .select('id, title')
          .is('deleted_at', null)
          .order('title', { ascending: true });
        setProgramsList(data || []);
      } catch (err) {
        console.error('Failed to load programs list:', err);
      }
    }
    loadPrograms();
  }, [supabase]);

  // 3. Search students for direct targeting
  useEffect(() => {
    if (!studentSearchQuery.trim() || audience !== 'user') {
      setStudentSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .ilike('full_name', `%${studentSearchQuery.trim()}%`)
          .limit(5);

        setStudentSearchResults((data as any) || []);
      } catch (err) {
        console.error('Failed to search students:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [studentSearchQuery, audience, supabase]);

  // 4. Fetch Announcements History & Read Stats
  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);

      const { data: rows, error: aErr } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          body,
          kind,
          audience,
          program_id,
          user_id,
          cta_label,
          cta_url,
          is_pinned,
          publish_at,
          expires_at,
          fanned_out_at,
          is_draft,
          created_at,
          programs (
            id,
            title
          ),
          profiles (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (aErr) throw aErr;

      if (!rows || rows.length === 0) {
        setAnnouncements([]);
        return;
      }

      // Fetch announcement reads counts
      const ids = rows.map((r) => r.id);
      const { data: readsRows } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .in('announcement_id', ids);

      const readsCountMap = new Map<string, number>();
      for (const read of readsRows || []) {
        readsCountMap.set(
          read.announcement_id,
          (readsCountMap.get(read.announcement_id) || 0) + 1
        );
      }

      // Fetch total student count for 'all' audience
      const { count: totalStudentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      const totalStudents = totalStudentsCount || 1;

      // Fetch active enrollments per program for 'program' audience
      const programIds = rows
        .map((r) => r.program_id)
        .filter((id): id is string => Boolean(id));

      const { data: enrRows } = await supabase
        .from('enrollments')
        .select('program_id')
        .eq('status', 'active')
        .in('program_id', programIds);

      const programEnrMap = new Map<string, number>();
      for (const enr of enrRows || []) {
        programEnrMap.set(enr.program_id, (programEnrMap.get(enr.program_id) || 0) + 1);
      }

      const formatted: AnnouncementItem[] = rows.map((r) => {
        const prog = Array.isArray(r.programs) ? r.programs[0] : r.programs;
        const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;

        let audSize = 1;
        if (r.audience === 'all') {
          audSize = totalStudents;
        } else if (r.audience === 'program' && r.program_id) {
          audSize = programEnrMap.get(r.program_id) || 1;
        }

        const readCount = readsCountMap.get(r.id) || 0;
        const readPercent = audSize > 0 ? Math.min(100, Math.round((readCount / audSize) * 100)) : 0;

        const status = getAnnouncementStatus({
          is_draft: r.is_draft,
          publish_at: r.publish_at,
          expires_at: r.expires_at,
        });

        return {
          id: r.id,
          title: r.title,
          body: r.body,
          kind: r.kind,
          audience: r.audience,
          program_id: r.program_id,
          user_id: r.user_id,
          cta_label: r.cta_label,
          cta_url: r.cta_url,
          is_pinned: r.is_pinned,
          publish_at: r.publish_at,
          expires_at: r.expires_at,
          fanned_out_at: r.fanned_out_at,
          is_draft: r.is_draft,
          created_at: r.created_at,
          program_title: prog?.title,
          user_name: prof?.full_name,
          read_count: readCount,
          audience_size: audSize,
          read_percent: readPercent,
          status,
        };
      });

      setAnnouncements(formatted);
    } catch (err) {
      console.error('Failed to fetch announcements history:', err);
      setHistoryError(extractAppError(err, 'Failed to load announcements history'));
    } finally {
      setLoadingHistory(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Realtime subscription on announcements & announcement_reads
  useEffect(() => {
    const channel = supabase
      .channel('admin-announcements-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchHistory();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_reads' }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchHistory]);

  // 5. Submit Announcement (Draft, Scheduled, or Now)
  const handleSaveAnnouncement = async (asDraft = false) => {
    if (!title.trim()) {
      setComposerError('Announcement title is required');
      return;
    }

    if (!body.trim() || body === '<p></p>') {
      setComposerError('Announcement body cannot be empty');
      return;
    }

    if (body.length > 50000) {
      setComposerError('Announcement body exceeds 50,000 characters');
      return;
    }

    if (audience === 'program' && !targetProgramId) {
      setComposerError('Please select a target challenge/course program');
      return;
    }

    if (audience === 'user' && !selectedStudent) {
      setComposerError('Please search and select a student recipient');
      return;
    }

    if (ctaUrl && !ctaUrl.startsWith('https://') && !ctaUrl.startsWith('/')) {
      setComposerError('CTA URL must start with https:// or be a relative app path (e.g. /programs)');
      return;
    }

    // Urgent confirmation check
    if (kind === 'urgent' && !asDraft && !showUrgentModal) {
      const estimatedCount =
        audience === 'all' ? 100 : audience === 'program' ? 25 : 1;
      setUrgentAudienceCount(estimatedCount);
      setShowUrgentModal(true);
      return;
    }

    try {
      setSubmitting(true);
      setComposerError(null);
      setComposerSuccess(null);

      // Compute publish_at
      let publishAtIso = new Date().toISOString();
      if (!asDraft && publishTiming === 'scheduled') {
        if (!scheduleDate || !scheduleTime) {
          setComposerError('Please provide a scheduled date and time');
          setSubmitting(false);
          return;
        }
        publishAtIso = toISTISOString(scheduleDate, scheduleTime);
      }

      // Compute expires_at
      let expiresAtIso: string | null = null;
      if (hasExpiry && expiryDate && expiryTime) {
        expiresAtIso = toISTISOString(expiryDate, expiryTime);
      }

      const payload = {
        title: title.trim(),
        body: body.trim(),
        kind,
        audience,
        program_id: audience === 'program' ? targetProgramId : null,
        user_id: audience === 'user' ? selectedStudent?.id : null,
        cta_label: ctaLabel.trim() || null,
        cta_url: ctaUrl.trim() || null,
        is_pinned: isPinned,
        publish_at: publishAtIso,
        expires_at: expiresAtIso,
        is_draft: asDraft,
      };

      const parseResult = AnnouncementPayloadSchema.safeParse(payload);
      if (!parseResult.success) {
        setComposerError(parseResult.error.errors[0]?.message || 'Please check announcement fields');
        setSubmitting(false);
        return;
      }
      const validPayload = parseResult.data;

      if (editingId) {
        const { error: updErr } = await supabase
          .from('announcements')
          .update(validPayload)
          .eq('id', editingId);

        if (updErr) throw updErr;
        setComposerSuccess('Announcement updated successfully!');
      } else {
        const { error: insErr } = await supabase.from('announcements').insert(validPayload);
        if (insErr) throw insErr;

        // If published immediately, trigger fan out so enrolled students receive notifications right away
        if (!asDraft && publishTiming === 'now') {
          try {
            await (supabase.rpc as any)('fan_out_scheduled_announcements');
          } catch (fanErr) {
            console.warn('Immediate fan-out error:', fanErr);
          }
        }

        setComposerSuccess(
          asDraft
            ? 'Announcement saved as draft.'
            : publishTiming === 'scheduled'
            ? 'Announcement scheduled in IST calendar.'
            : 'Announcement published! Eligible students will see it in real time.'
        );
      }

      setShowUrgentModal(false);
      resetComposerForm();
      await fetchHistory();
      setActiveTab('history');
    } catch (err) {
      console.error('Failed to submit announcement:', err);
      setComposerError(extractAppError(err, 'Could not save announcement'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetComposerForm = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setKind('info');
    setAudience('all');
    setTargetProgramId('');
    setSelectedStudent(null);
    setCtaLabel('');
    setCtaUrl('');
    setIsPinned(false);
    setPublishTiming('now');
    setScheduleDate('');
    setScheduleTime('09:00');
    setHasExpiry(false);
    setExpiryDate('');
    setExpiryTime('23:59');
    setComposerError(null);
  };

  // 6. Action Handlers: Edit, Duplicate, Unpublish, Delete, Re-send
  const handleEdit = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setBody(item.body);
    setKind(item.kind);
    setAudience(item.audience);
    setTargetProgramId(item.program_id || '');
    if (item.user_id) {
      setSelectedStudent({ id: item.user_id, full_name: item.user_name || 'Student' });
    } else {
      setSelectedStudent(null);
    }
    setCtaLabel(item.cta_label || '');
    setCtaUrl(item.cta_url || '');
    setIsPinned(item.is_pinned);

    if (item.status === 'scheduled') {
      setPublishTiming('scheduled');
      const d = new Date(item.publish_at);
      setScheduleDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d));
      setScheduleTime(
        d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
      );
    } else {
      setPublishTiming('now');
    }

    if (item.expires_at) {
      setHasExpiry(true);
      const ed = new Date(item.expires_at);
      setExpiryDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(ed));
      setExpiryTime(
        ed.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
      );
    } else {
      setHasExpiry(false);
    }

    setActiveTab('composer');
  };

  const handleDuplicate = (item: AnnouncementItem) => {
    setEditingId(null);
    setTitle(`${item.title} (Copy)`);
    setBody(item.body);
    setKind(item.kind);
    setAudience(item.audience);
    setTargetProgramId(item.program_id || '');
    setSelectedStudent(item.user_id ? { id: item.user_id, full_name: item.user_name || 'Student' } : null);
    setCtaLabel(item.cta_label || '');
    setCtaUrl(item.cta_url || '');
    setIsPinned(item.is_pinned);
    setPublishTiming('now');
    setHasExpiry(false);
    setActiveTab('composer');
  };

  const handleUnpublish = async (id: string) => {
    try {
      setLoadingHistory(true);
      const { error } = await supabase
        .from('announcements')
        .update({ is_draft: true })
        .eq('id', id);
      if (error) throw error;
      await fetchHistory();
    } catch (err) {
      console.error('Failed to unpublish announcement:', err);
      setHistoryError(extractAppError(err, 'Could not unpublish announcement'));
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!isAdmin) {
      setHistoryError('Only super admin can delete announcements.');
      return;
    }

    const confirmed = window.confirm(`Permanently delete announcement "${itemTitle}"?`);
    if (!confirmed) return;

    try {
      setLoadingHistory(true);
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await fetchHistory();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setHistoryError(extractAppError(err, 'Could not delete announcement'));
    } finally {
      setLoadingHistory(false);
    }
  };

  // 7. Manual Fan-Out Testing RPC
  const handleRunFanOutNow = async () => {
    try {
      setRunningFanOut(true);
      setFanOutResult(null);

      const { data, error } = await (supabase.rpc as any)('fan_out_scheduled_announcements');
      if (error) throw error;

      setFanOutResult(
        `Fan-out completed! Processed ${data?.announcements_processed || 0} announcements and created ${
          data?.notifications_created || 0
        } notifications.`
      );
      await fetchHistory();
    } catch (err) {
      console.error('Failed to run manual fan-out:', err);
      setFanOutResult(err instanceof Error ? `Error: ${err.message}` : 'Fan-out execution failed');
    } finally {
      setRunningFanOut(false);
    }
  };

  // Filtered announcements
  const filteredList = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesKind = kindFilter === 'all' || item.kind === kindFilter;
    const matchesAudience = audienceFilter === 'all' || item.audience === audienceFilter;
    return matchesSearch && matchesStatus && matchesKind && matchesAudience;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1A373E]/60 pb-6">
        <div>
          <div>
            <span className="text-xs font-semibold text-[#8D9FA4] uppercase tracking-wider">
              Student Communication
            </span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-white">Announcements & Broadcasts</h1>
          <p className="mt-1 text-xs text-[#8D9FA4]">
            Send instant or scheduled broadcast banners, student inbox messages, and direct 1:1 notifications.
          </p>
        </div>

        {/* Tab Switcher: Composer vs History */}
        <div className="flex rounded-xl border border-[#1A373E] bg-[#051113] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('composer')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'composer'
                ? 'bg-amber-500 text-black shadow'
                : 'text-[#8D9FA4] hover:text-white'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Composer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-black shadow'
                : 'text-[#8D9FA4] hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>History ({announcements.length})</span>
          </button>
        </div>
      </div>

      {/* Global Results & Alerts */}
      {fanOutResult && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
            <span>{fanOutResult}</span>
          </div>
          <button type="button" onClick={() => setFanOutResult(null)} className="text-amber-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* COMPOSER VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-white">
                {editingId ? 'Edit Announcement' : 'Compose Broadcast'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetComposerForm}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Clear & Create New
                </button>
              )}
            </div>

            {composerError && (
              <ErrorDetailsAlert
                error={composerError}
                onDismiss={() => setComposerError(null)}
                className="mb-4"
              />
            )}

            {composerSuccess && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-400 flex items-center justify-between">
                <span>{composerSuccess}</span>
                <button type="button" onClick={() => setComposerSuccess(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="text-xs font-bold text-white block mb-1">
                Announcement Headline / Subject
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update: Day 4 Live Class Shifted to 8:00 PM IST"
                className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-4 py-2.5 text-xs text-white placeholder-[#8D9FA4] focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Kind & Audience Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-white block mb-1">Broadcast Kind</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['info', 'success', 'warning', 'urgent'] as AnnouncementKind[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold capitalize transition-all ${
                        kind === k
                          ? k === 'urgent'
                            ? 'border-red-500 bg-red-500/20 text-red-400'
                            : k === 'warning'
                            ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                            : k === 'success'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-[#1A373E] bg-[#051113] text-[#8D9FA4] hover:text-white'
                      }`}
                    >
                      {k === 'urgent' ? (
                        <AlertOctagon className="h-3.5 w-3.5" />
                      ) : k === 'warning' ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : k === 'success' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Info className="h-3.5 w-3.5" />
                      )}
                      <span>{k}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">Target Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#051113] px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">Everyone (All Registered Students)</option>
                  <option value="program">Cohort Program Students Only</option>
                  <option value="user">Specific Student (Direct Message)</option>
                </select>
              </div>
            </div>

            {/* Audience Context Fields */}
            {audience === 'program' && (
              <div className="rounded-xl border border-[#1A373E] bg-[#051113] p-4 space-y-2">
                <label className="text-xs font-bold text-white block">Select Cohort Program</label>
                <select
                  value={targetProgramId}
                  onChange={(e) => setTargetProgramId(e.target.value)}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-2 text-xs text-white focus:border-amber-500"
                >
                  <option value="">-- Choose Program --</option>
                  {programsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#8D9FA4]">
                  Only students with an active enrollment in this program will receive this announcement.
                </p>
              </div>
            )}

            {audience === 'user' && (
              <div className="rounded-xl border border-[#1A373E] bg-[#051113] p-4 space-y-3">
                <label className="text-xs font-bold text-white block">Direct Student Recipient</label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-amber-400" />
                      <span className="font-bold text-white">{selectedStudent.full_name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="text-[#8D9FA4] hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Type student name to search..."
                      className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-2 text-xs text-white placeholder-[#8D9FA4] focus:border-amber-500"
                    />
                    {studentSearchResults.length > 0 && (
                      <div className="mt-1 divide-y divide-[#1A373E] rounded-lg border border-[#1A373E] bg-[#081619]">
                        {studentSearchResults.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(st);
                              setStudentSearchResults([]);
                              setStudentSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#10272B] flex items-center justify-between"
                          >
                            <span>{st.full_name}</span>
                            <span className="text-[10px] text-amber-400">Select</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Rich Text Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-white">Announcement Body (Rich Text)</label>
                <span className="text-[11px] text-[#8D9FA4]">
                  {body.replace(/<[^>]+>/g, '').length} / 50,000 characters
                </span>
              </div>
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Share mentorship reflections, urgent schedule adjustments, or important study reminders..."
                className="min-h-[200px]"
              />
            </div>

            {/* Optional CTA Button & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#1A373E] bg-[#051113] p-4">
              <div>
                <label className="text-xs font-bold text-white block mb-1">Optional Action Button Label</label>
                <input
                  type="text"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="e.g. Join Live Room Now"
                  className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-2 text-xs text-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">Action Button URL</label>
                <input
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://... or /programs"
                  className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-2 font-mono text-xs text-white focus:border-amber-500"
                />
              </div>
            </div>

            {/* Pin Toggle & Scheduling */}
            <div className="rounded-xl border border-[#1A373E] bg-[#051113] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinToggle"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="pinToggle" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                    <Pin className="h-3.5 w-3.5 text-amber-400" />
                    Pin to Top of Student Dashboard
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPublishTiming('now')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      publishTiming === 'now' ? 'bg-amber-500 text-black' : 'text-[#8D9FA4]'
                    }`}
                  >
                    Publish Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishTiming('scheduled')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      publishTiming === 'scheduled' ? 'bg-amber-500 text-black' : 'text-[#8D9FA4]'
                    }`}
                  >
                    Schedule Later
                  </button>
                </div>
              </div>

              {publishTiming === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1A373E]">
                  <div>
                    <label className="text-xs text-[#8D9FA4] block mb-1">Publish Date (IST)</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-1.5 font-mono text-xs text-white focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8D9FA4] block mb-1">Publish Time (IST)</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-1.5 font-mono text-xs text-white focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Optional Expiry */}
              <div className="pt-2 border-t border-[#1A373E] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="expiryToggle"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                    className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="expiryToggle" className="text-xs text-[#A0B1B5] cursor-pointer">
                    Set expiration date (automatically hides banner after time)
                  </label>
                </div>

                {hasExpiry && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-1.5 font-mono text-xs text-white focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        value={expiryTime}
                        onChange={(e) => setExpiryTime(e.target.value)}
                        className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-1.5 font-mono text-xs text-white focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Save Draft, Publish */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1A373E]">
              <span className="text-[11px] text-[#8D9FA4]">
                Rate Limit: Max 20 broadcast dispatches per hour
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveAnnouncement(true)}
                  disabled={submitting}
                  className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#132A30] transition-all"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAnnouncement(false)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <Send className="h-4 w-4 text-black" />
                  )}
                  <span>
                    {publishTiming === 'scheduled' ? 'Schedule Announcement' : 'Publish Broadcast Now'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Triple Student Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1A373E] pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-400" />
                  <span className="font-serif text-sm font-bold text-white">Live Student Preview</span>
                </div>

                <div className="flex rounded-lg border border-[#1A373E] bg-[#051113] p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('banner')}
                    className={`rounded px-2.5 py-1 font-semibold ${
                      previewTab === 'banner' ? 'bg-amber-500 text-black' : 'text-[#8D9FA4]'
                    }`}
                  >
                    Banner
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('inbox')}
                    className={`rounded px-2.5 py-1 font-semibold ${
                      previewTab === 'inbox' ? 'bg-amber-500 text-black' : 'text-[#8D9FA4]'
                    }`}
                  >
                    Inbox
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#8D9FA4] leading-relaxed">
                Renders using the exact shared production UI component students interact with on{' '}
                <code className="text-amber-400 font-mono">
                  app.{import.meta.env.VITE_ROOT_DOMAIN || 'abrainoconscious.com'}
                </code>.
              </p>

              {previewTab === 'banner' ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#8D9FA4] uppercase tracking-wider">
                    Student Dashboard Top Banner
                  </span>
                  <AnnouncementBanner
                    title={title || 'Example Announcement Title'}
                    body={body || '<p>Your announcement preview content will appear here in real time...</p>'}
                    kind={kind}
                    ctaLabel={ctaLabel || (ctaUrl ? 'Learn More' : undefined)}
                    ctaUrl={ctaUrl}
                    isPinned={isPinned}
                    isPreview={true}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#8D9FA4] uppercase tracking-wider">
                    Student Notification / Inbox Card
                  </span>
                  <AnnouncementInboxCard
                    title={title || 'Example Announcement Title'}
                    body={body || '<p>Your notification message preview...</p>'}
                    kind={kind}
                    ctaLabel={ctaLabel}
                    ctaUrl={ctaUrl}
                    isPinned={isPinned}
                    isRead={false}
                    publishAt={new Date().toISOString()}
                    isPreview={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* HISTORY TABLE VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-white">Broadcast History & Read Analytics</h2>
              <p className="text-xs text-[#8D9FA4]">
                Track student open rates, unpublish broadcasts, or re-send previous updates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunFanOutNow}
                disabled={runningFanOut}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A373E] bg-[#0E2024] px-3.5 py-2 text-xs font-semibold text-amber-400 hover:bg-[#132A30] transition-all"
                title="Trigger cron fan-out immediately for testing"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${runningFanOut ? 'animate-spin' : ''}`} />
                <span>{runningFanOut ? 'Executing...' : 'Run Fan-Out Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetComposerForm();
                  setActiveTab('composer');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-all shadow"
              >
                <Send className="h-3.5 w-3.5" />
                <span>New Announcement</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-[#1A373E] bg-[#081619] p-3">
            <div className="sm:col-span-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8D9FA4]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search announcements..."
                className="w-full rounded-lg border border-[#1A373E] bg-[#051113] pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8D9FA4] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#051113] px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Drafts</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#051113] px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Kinds</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#051113] px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Audiences</option>
                <option value="all">Everyone</option>
                <option value="program">Cohort Program</option>
                <option value="user">Direct Student</option>
              </select>
            </div>
          </div>

          {/* History Error */}
          {historyError && (
            <ErrorDetailsAlert
              error={historyError}
              onDismiss={() => setHistoryError(null)}
              className="mb-4"
            />
          )}

          {/* History Table */}
          {loadingHistory ? (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-8 text-center text-white">
              <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="mt-3 text-xs text-[#8D9FA4]">Loading announcements history...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1A373E] bg-[#081619] p-12 text-center text-white">
              <MessageSquare className="h-8 w-8 mx-auto text-amber-400" />
              <h3 className="mt-3 font-serif text-lg font-bold text-white">No Announcements Found</h3>
              <p className="mt-1 text-xs text-[#8D9FA4]">
                Create your first broadcast to communicate with enrolled challenge students.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1A373E] bg-[#081619]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1A373E] bg-[#051113] text-[#8D9FA4]">
                    <th className="px-4 py-3 font-semibold">Title & Kind</th>
                    <th className="px-4 py-3 font-semibold">Audience</th>
                    <th className="px-4 py-3 font-semibold">Timing (IST)</th>
                    <th className="px-4 py-3 font-semibold">Read Stats</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A373E]/60 text-white">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#0C1E22] transition-colors">
                      {/* Title & Kind */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{item.title}</span>
                            {item.is_pinned && (
                              <span title="Pinned">
                                <Pin className="h-3 w-3 text-amber-400" />
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              item.kind === 'urgent'
                                ? 'bg-red-500/20 text-red-400'
                                : item.kind === 'warning'
                                ? 'bg-amber-500/20 text-amber-400'
                                : item.kind === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {item.kind}
                          </span>
                        </div>
                      </td>

                      {/* Audience */}
                      <td className="px-4 py-3.5">
                        {item.audience === 'all' ? (
                          <div className="flex items-center gap-1.5 text-[#C5D5D8]">
                            <Users className="h-3.5 w-3.5 text-amber-400" />
                            <span>All Students</span>
                          </div>
                        ) : item.audience === 'program' ? (
                          <div className="flex items-center gap-1.5 text-[#C5D5D8]">
                            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="line-clamp-1">{item.program_title || 'Cohort Program'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#C5D5D8]">
                            <User className="h-3.5 w-3.5 text-blue-400" />
                            <span>{item.user_name || 'Individual Student'}</span>
                          </div>
                        )}
                      </td>

                      {/* Timing (IST) */}
                      <td className="px-4 py-3.5 font-mono text-[#8D9FA4]">
                        <div className="flex flex-col">
                          <span>{formatIST(item.publish_at, true)}</span>
                          {item.expires_at && (
                            <span className="text-[10px] text-amber-400">
                              Expires: {formatIST(item.expires_at, true)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Read Stats */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-white font-mono font-bold">
                              {item.read_count} / {item.audience_size}
                            </span>
                            <span className="text-amber-400 font-semibold">{item.read_percent}%</span>
                          </div>
                          <div className="h-1.5 w-24 rounded-full bg-[#10272B] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${item.read_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                            item.status === 'live'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.status === 'scheduled'
                              ? 'bg-blue-500/20 text-blue-400'
                              : item.status === 'draft'
                              ? 'bg-[#152B30] text-[#8D9FA4]'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded p-1 text-[#8D9FA4] hover:bg-[#152B30] hover:text-white"
                            title="Edit Announcement"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(item)}
                            className="rounded p-1 text-[#8D9FA4] hover:bg-[#152B30] hover:text-amber-400"
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {item.status === 'live' && (
                            <button
                              type="button"
                              onClick={() => handleUnpublish(item.id)}
                              className="rounded p-1 text-[#8D9FA4] hover:bg-[#152B30] hover:text-amber-400"
                              title="Unpublish (Revert to Draft)"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.title)}
                              className="rounded p-1 text-[#8D9FA4] hover:bg-red-500/20 hover:text-red-400"
                              title="Delete Announcement (Super Admin Only)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Urgent Confirmation Modal */}
      {showUrgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/50 bg-[#081619] p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                <AlertOctagon className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Confirm Urgent Broadcast</h3>
                <span className="text-xs text-red-400 font-semibold">Immediate High-Priority Dispatch</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#C5D5D8] leading-relaxed">
              This will show as a prominent, attention-grabbing banner to approximately{' '}
              <strong className="text-amber-400 font-mono">{urgentAudienceCount}</strong> student
              dashboards and immediately push notifications.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUrgentModal(false)}
                className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#132A30]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveAnnouncement(false)}
                disabled={submitting}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-500 shadow-lg shadow-red-600/30"
              >
                {submitting ? 'Publishing...' : 'Yes, Dispatch Urgent Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

