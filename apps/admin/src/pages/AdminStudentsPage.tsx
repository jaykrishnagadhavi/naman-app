import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  useAuth,
  Button,
  ErrorDetailsAlert,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Badge,
} from '@abrainoconscious/ui';
import {
  adminEnrollStudent,
  adminRevokeStudentEnrollment,
  adminSetBlockedStatus,
  fetchAdminStudents,
  fetchAdminStudentDetail,
  handleAccountDeletionRequest,
  formatDateIST,
  generateCsv,
  downloadCsv,
  GrowthPillarEnum,
} from '@abrainoconscious/shared';
import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  Phone,
  Calendar,
  ShieldAlert,
  BookOpen,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserX,
  Send,
} from 'lucide-react';

interface ProgramOption {
  id: string;
  title: string;
  slug: string;
  type: string;
}

export const AdminStudentsPage: React.FC = () => {
  const { supabase, profile: currentAdminProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'students' | 'deletions'>('students');

  // Filter and Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<string>('all');
  const [pillarFilter, setPillarFilter] = useState('');
  const [noEnrollmentOnly, setNoEnrollmentOnly] = useState(false);
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selection for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modals & Drawers
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deletionNoteModalOpen, setDeletionNoteModalOpen] = useState(false);

  // Form states for enroll modal
  const [targetStudentForEnroll, setTargetStudentForEnroll] = useState<any>(null);
  const [targetEmailOrId, setTargetEmailOrId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [accessUntil, setAccessUntil] = useState('');
  const [sendNotification, setSendNotification] = useState(true);

  // Form states for revoke modal
  const [enrollmentToRevoke, setEnrollmentToRevoke] = useState<{
    id: string;
    studentName: string;
    programTitle: string;
  } | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Form states for block modal
  const [studentToBlock, setStudentToBlock] = useState<{
    id: string;
    name: string;
    currentlyBlocked: boolean;
  } | null>(null);
  const [blockReason, setBlockReason] = useState('');

  // Form state for student detail modal
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Deletion request resolution
  const [activeDeletionRequest, setActiveDeletionRequest] = useState<any>(null);
  const [deletionResolutionStatus, setDeletionResolutionStatus] = useState<
    'processing' | 'completed' | 'rejected'
  >('completed');
  const [deletionAdminNote, setDeletionAdminNote] = useState('');

  // 1. Fetch Students Query (Server-Paginated)
  const offset = (currentPage - 1) * pageSize;
  const isBlockedParam =
    blockedFilter === 'blocked' ? true : blockedFilter === 'active' ? false : undefined;

  const {
    data: studentsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      'admin-students-paginated',
      searchQuery,
      selectedProgramFilter,
      isBlockedParam,
      pillarFilter,
      noEnrollmentOnly,
      joinedFrom,
      joinedTo,
      sortBy,
      sortOrder,
      pageSize,
      offset,
    ],
    queryFn: () =>
      fetchAdminStudents(supabase, {
        search: searchQuery,
        programId: selectedProgramFilter || undefined,
        isBlocked: isBlockedParam,
        goalPillar: pillarFilter || undefined,
        noEnrollment: noEnrollmentOnly,
        joinedFrom: joinedFrom || undefined,
        joinedTo: joinedTo || undefined,
        sortBy,
        sortOrder,
        limit: pageSize,
        offset,
      }),
    staleTime: 1000 * 30,
  });

  const students = studentsData?.students || [];
  const totalStudentsCount = studentsData?.total_count || 0;
  const totalPages = Math.ceil(totalStudentsCount / pageSize) || 1;

  // 2. Fetch Programs for Dropdowns
  const { data: programs = [] } = useQuery<ProgramOption[]>({
    queryKey: ['admin-programs-options'],
    queryFn: async () => {
      const { data, error: prErr } = await supabase
        .from('programs')
        .select('id, title, slug, type')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      if (prErr) throw prErr;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // 3. Fetch Student Detail Query (when drawer is open)
  const { data: activeStudentDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin-student-detail', activeStudentId],
    queryFn: () => fetchAdminStudentDetail(supabase, activeStudentId!),
    enabled: !!activeStudentId && detailModalOpen,
  });

  // 4. Fetch Account Deletion Requests
  const {
    data: deletionRequests = [],
    refetch: refetchDeletions,
    isLoading: isLoadingDeletions,
  } = useQuery({
    queryKey: ['admin-deletion-requests'],
    queryFn: async () => {
      const { data, error: dErr } = await supabase
        .from('account_deletion_requests')
        .select(`
          id,
          user_id,
          reason,
          status,
          admin_note,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (dErr) throw dErr;
      return data || [];
    },
    enabled: activeTab === 'deletions',
  });

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!targetEmailOrId.trim()) throw new Error('Student email or User ID is required');
      if (!selectedProgramId) throw new Error('Please select a program');

      const res = await adminEnrollStudent(supabase, {
        userEmailOrId: targetEmailOrId.trim(),
        programId: selectedProgramId,
        accessUntil: accessUntil ? new Date(accessUntil).toISOString() : null,
        sendNotification,
      });

      if (!res.ok) {
        throw new Error(res.error || 'Failed to enroll student');
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students-paginated'] });
      if (activeStudentId) {
        queryClient.invalidateQueries({ queryKey: ['admin-student-detail', activeStudentId] });
      }
      setEnrollModalOpen(false);
      resetEnrollForm();
    },
  });

  // Revoke Mutation
  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!enrollmentToRevoke) return;
      const res = await adminRevokeStudentEnrollment(supabase, {
        enrollmentId: enrollmentToRevoke.id,
        reason: revokeReason || undefined,
      });

      if (!res.ok) {
        throw new Error(res.error || 'Failed to revoke enrollment');
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students-paginated'] });
      if (activeStudentId) {
        queryClient.invalidateQueries({ queryKey: ['admin-student-detail', activeStudentId] });
      }
      setRevokeModalOpen(false);
      setEnrollmentToRevoke(null);
      setRevokeReason('');
    },
  });

  // Block/Unblock Mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!studentToBlock) return;
      const res = await adminSetBlockedStatus(supabase, {
        userId: studentToBlock.id,
        blocked: !studentToBlock.currentlyBlocked,
        reason: blockReason || undefined,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students-paginated'] });
      if (activeStudentId) {
        queryClient.invalidateQueries({ queryKey: ['admin-student-detail', activeStudentId] });
      }
      setBlockModalOpen(false);
      setStudentToBlock(null);
      setBlockReason('');
    },
  });

  // Deletion Request Status Mutation
  const deletionMutation = useMutation({
    mutationFn: async () => {
      if (!activeDeletionRequest) return;
      return handleAccountDeletionRequest(supabase, {
        requestId: activeDeletionRequest.id,
        status: deletionResolutionStatus,
        note: deletionAdminNote || undefined,
      });
    },
    onSuccess: () => {
      refetchDeletions();
      setDeletionNoteModalOpen(false);
      setActiveDeletionRequest(null);
      setDeletionAdminNote('');
    },
  });

  const resetEnrollForm = () => {
    setTargetStudentForEnroll(null);
    setTargetEmailOrId('');
    setSelectedProgramId(programs[0]?.id || '');
    setAccessUntil('');
    setSendNotification(true);
  };

  const handleOpenEnrollForStudent = (s: any) => {
    setTargetStudentForEnroll(s);
    setTargetEmailOrId(s.email || s.id);
    setSelectedProgramId(programs[0]?.id || '');
    setEnrollModalOpen(true);
  };

  const handleOpenRevoke = (enrollmentId: string, studentName: string, programTitle: string) => {
    setEnrollmentToRevoke({
      id: enrollmentId,
      studentName,
      programTitle,
    });
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  const handleOpenBlockDialog = (id: string, name: string, currentlyBlocked: boolean) => {
    setStudentToBlock({ id, name, currentlyBlocked });
    setBlockReason(currentlyBlocked ? '' : 'Terms of service or conduct violation');
    setBlockModalOpen(true);
  };

  const handleOpenDetailDrawer = (studentId: string) => {
    setActiveStudentId(studentId);
    setDetailModalOpen(true);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // CSV Export with Injection Protection (CWE-1236)
  const handleExportCsv = async () => {
    if (totalStudentsCount > 1000) {
      const proceed = window.confirm(
        `Exporting ${totalStudentsCount} records. This might take a few moments. Proceed?`
      );
      if (!proceed) return;
    }

    // Fetch records to export
    const exportResult = await fetchAdminStudents(supabase, {
      search: searchQuery,
      programId: selectedProgramFilter || undefined,
      isBlocked: isBlockedParam,
      goalPillar: pillarFilter || undefined,
      noEnrollment: noEnrollmentOnly,
      joinedFrom: joinedFrom || undefined,
      joinedTo: joinedTo || undefined,
      limit: 1000,
      offset: 0,
    });

    const headers = [
      'Student ID',
      'Full Name',
      'Phone',
      'Role',
      'Account Status',
      'Joined Date (IST)',
      'Last Seen',
      'Enrollments Count',
      'Enrolled Programs',
    ];

    const rows = exportResult.students.map((s) => [
      s.id,
      s.full_name || 'Anonymous',
      s.phone || '',
      s.role,
      s.is_blocked ? 'Suspended' : 'Active',
      formatDateIST(s.created_at),
      s.last_seen_at ? formatDateIST(s.last_seen_at) : 'Never',
      s.enrolment_count,
      s.enrolled_programs.map((p) => p.title).join('; '),
    ]);

    const csvData = generateCsv(headers, rows);
    const filename = `students-directory-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csvData);

    // Audit Log Entry for CSV export
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      actor_id: user?.id,
      actor_role: currentAdminProfile?.role || 'admin',
      action: 'students.export_csv',
      entity: 'profiles',
      entity_id: 'export',
      diff: { count: exportResult.students.length, filters: { searchQuery, selectedProgramFilter } },
    });
  };

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkMessage = () => {
    if (selectedStudentIds.length === 1) {
      const student = students.find((s) => s.id === selectedStudentIds[0]);
      navigate(`/announcements?studentId=${student?.id}&studentName=${encodeURIComponent(student?.full_name || 'Student')}`);
    } else {
      navigate('/announcements');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Students & Enrollments
            </h1>
          </div>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Directory of registered students, cohort allocations, manual enrollments, account status, and GDPR requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              if (activeTab === 'deletions') refetchDeletions();
            }}
            disabled={isFetching || isLoadingDeletions}
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

          <Button
            size="sm"
            onClick={() => {
              resetEnrollForm();
              setEnrollModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            <span>Enrol in Program</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-[#1A373E]">
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-[#8D9FA4] hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Student Directory ({totalStudentsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deletions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'deletions'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-[#8D9FA4] hover:text-white'
          }`}
        >
          <UserX className="h-4 w-4 text-rose-400" />
          <span>Account Deletion Requests</span>
        </button>
      </div>

      {activeTab === 'students' ? (
        <>
          {/* Search & Filters Filter Bar */}
          <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8D9FA4]" />
                <input
                  type="text"
                  placeholder="Search name, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8D9FA4] focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Program Filter */}
              <div>
                <select
                  value={selectedProgramFilter}
                  onChange={(e) => {
                    setSelectedProgramFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">All Programs</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Status Filter */}
              <div>
                <select
                  value={blockedFilter}
                  onChange={(e) => {
                    setBlockedFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="all">Status: All Students</option>
                  <option value="active">Active Only</option>
                  <option value="blocked">Suspended Only</option>
                </select>
              </div>

              {/* Growth Pillar Filter */}
              <div>
                <select
                  value={pillarFilter}
                  onChange={(e) => {
                    setPillarFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">All Growth Pillars</option>
                  {GrowthPillarEnum.options.map((pillar) => (
                    <option key={pillar} value={pillar}>
                      {pillar.charAt(0).toUpperCase() + pillar.slice(1)} Pillar
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Date & Unenrolled Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1A373E]/60 text-xs text-[#8D9FA4]">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={noEnrollmentOnly}
                    onChange={(e) => {
                      setNoEnrollmentOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded border-[#1A373E] bg-[#0E2024] text-amber-500 focus:ring-amber-500"
                  />
                  <span>Unenrolled students only</span>
                </label>

                <div className="flex items-center gap-2">
                  <span>Joined:</span>
                  <input
                    type="date"
                    value={joinedFrom}
                    onChange={(e) => {
                      setJoinedFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded border border-[#1A373E] bg-[#0E2024] px-2 py-1 text-white text-[11px]"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={joinedTo}
                    onChange={(e) => {
                      setJoinedTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded border border-[#1A373E] bg-[#0E2024] px-2 py-1 text-white text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded border border-[#1A373E] bg-[#0E2024] px-2 py-1 text-white text-[11px]"
                >
                  <option value="created_at">Joined Date</option>
                  <option value="full_name">Name</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="rounded border border-[#1A373E] bg-[#0E2024] px-2 py-1 text-white text-[11px]"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedStudentIds.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
              <span className="font-semibold">
                {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkMessage}
                  className="border-amber-500/40 bg-amber-500/20 text-amber-200 hover:bg-amber-500 hover:text-black text-xs h-7"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  <span>Message Selected</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedStudentIds([])}
                  className="border-amber-500/30 text-amber-300 hover:text-white text-xs h-7"
                >
                  <span>Deselect All</span>
                </Button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {isError && (
            <div className="space-y-2">
              <ErrorDetailsAlert
                title="Failed to Load Students Directory"
                error={error}
              />
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry Loading
              </Button>
            </div>
          )}

          {/* Students Table */}
          <div className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={students.length > 0 && selectedStudentIds.length === students.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-[#1A373E] bg-[#0E2024] text-amber-500 focus:ring-amber-500"
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Role & Status</th>
                    <th className="py-3 px-4 font-semibold">Growth Goals</th>
                    <th className="py-3 px-4 font-semibold">Active Enrollments</th>
                    <th className="py-3 px-4 font-semibold">Joined Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A373E]/50 text-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#8D9FA4]">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                        <span>Loading students directory...</span>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#8D9FA4]">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div className="font-semibold text-white">No students found</div>
                        <div className="text-[11px] mt-1">
                          Try clearing filters or search queries to broaden your directory search.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-[#0E2024]/40 transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-500/5' : ''
                          }`}
                          onClick={() => handleOpenDetailDrawer(student.id)}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3.5 px-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStudent(student.id)}
                              className="rounded border-[#1A373E] bg-[#0E2024] text-amber-500 focus:ring-amber-500"
                            />
                          </td>

                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#1A373E] flex items-center justify-center font-bold text-amber-400 shrink-0">
                                {student.full_name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-white hover:underline truncate">
                                  {student.full_name || 'Anonymous Student'}
                                </div>
                                <div className="text-[11px] text-[#8D9FA4] font-mono truncate">
                                  {student.phone || student.id.slice(0, 13)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Status */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant={student.role === 'admin' ? 'amber' : 'neutral'}
                                className="text-[10px] capitalize"
                              >
                                {student.role}
                              </Badge>
                              {student.is_blocked ? (
                                <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[11px] text-emerald-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5" />
                                  Active
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Growth Goals */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {student.goal_pillars && student.goal_pillars.length > 0 ? (
                                student.goal_pillars.map((pillar) => (
                                  <span
                                    key={pillar}
                                    className="rounded bg-[#1A373E]/60 px-1.5 py-0.5 text-[10px] text-[#8D9FA4] capitalize"
                                  >
                                    {pillar}
                                  </span>
                                ))
                              ) : student.goal_tag ? (
                                <span className="text-[11px] text-[#8D9FA4] truncate">
                                  {student.goal_tag}
                                </span>
                              ) : (
                                <span className="text-[#8D9FA4] italic text-[11px]">—</span>
                              )}
                            </div>
                          </td>

                          {/* Active Enrollments */}
                          <td className="py-3.5 px-4">
                            {student.enrolled_programs && student.enrolled_programs.length > 0 ? (
                              <div className="space-y-1">
                                {student.enrolled_programs.slice(0, 2).map((prog) => (
                                  <div
                                    key={prog.program_id}
                                    className="flex items-center gap-1 text-[11px] text-[#E1E8EA] truncate max-w-[180px]"
                                  >
                                    <BookOpen className="h-3 w-3 text-amber-500 shrink-0" />
                                    <span className="truncate">{prog.title}</span>
                                  </div>
                                ))}
                                {student.enrolled_programs.length > 2 && (
                                  <span className="text-[10px] text-amber-400/80">
                                    +{student.enrolled_programs.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#8D9FA4] italic text-[11px]">No cohort</span>
                            )}
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-[#8D9FA4] whitespace-nowrap">
                            {formatDateIST(student.created_at)}
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEnrollForStudent(student)}
                                className="h-7 px-2 border-[#1A373E] bg-[#0E2024] text-[11px] text-amber-400 hover:text-white"
                                title="Enrol Student"
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                <span>Enrol</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleOpenBlockDialog(
                                    student.id,
                                    student.full_name || 'Student',
                                    student.is_blocked
                                  )
                                }
                                className={`h-7 px-2 border-[#1A373E] bg-[#0E2024] text-[11px] ${
                                  student.is_blocked
                                    ? 'text-emerald-400 hover:text-emerald-300'
                                    : 'text-rose-400 hover:text-rose-300'
                                }`}
                                title={student.is_blocked ? 'Unblock Student' : 'Suspend Account'}
                              >
                                <ShieldAlert className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#1A373E] px-4 py-3 text-xs text-[#8D9FA4]">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-[#1A373E] bg-[#0E2024] px-2 py-1 text-white text-[11px]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>of {totalStudentsCount} students</span>
              </div>

              <div className="flex items-center gap-2">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 w-7 p-0 border-[#1A373E] bg-[#0E2024]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 w-7 p-0 border-[#1A373E] bg-[#0E2024]"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Tab 2: Account Deletion Requests */
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Manual Auth Deletion Required</div>
              <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                Marking an account deletion request as "completed" updates the student's resolution record. Actual permanent deletion of the credentials and login token from Supabase Auth must be conducted in the Supabase Dashboard until automated identity lifecycle pruning is connected in a later step.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Reason Provided</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Admin Notes</th>
                  <th className="py-3 px-4 font-semibold">Requested At</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A373E]/50 text-white">
                {isLoadingDeletions ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8D9FA4]">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                      <span>Loading deletion requests...</span>
                    </td>
                  </tr>
                ) : deletionRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8D9FA4]">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                      <span>No pending account deletion requests.</span>
                    </td>
                  </tr>
                ) : (
                  deletionRequests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-[#0E2024]/40">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {req.profiles?.full_name || 'Anonymous Student'}
                        </div>
                        <div className="text-[11px] text-[#8D9FA4] font-mono">{req.user_id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#8D9FA4] max-w-xs">
                        {req.reason || 'No specific reason given.'}
                      </td>
                      <td className="py-3.5 px-4">
                        {req.status === 'rejected' ? (
                          <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            rejected
                          </span>
                        ) : (
                          <Badge
                            variant={
                              req.status === 'completed'
                                ? 'teal'
                                : req.status === 'processing'
                                ? 'amber'
                                : 'outline'
                            }
                            className="capitalize text-[10px]"
                          >
                            {req.status}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#8D9FA4] max-w-xs truncate">
                        {req.admin_note || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-[#8D9FA4] whitespace-nowrap">
                        {formatDateIST(req.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveDeletionRequest(req);
                            setDeletionResolutionStatus(req.status === 'pending' ? 'processing' : req.status);
                            setDeletionAdminNote(req.admin_note || '');
                            setDeletionNoteModalOpen(true);
                          }}
                          className="h-7 text-[11px] border-[#1A373E] bg-[#0E2024] text-amber-400"
                        >
                          <span>Manage</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          Detail Modal / Drawer: Full Student Profile, Attendance, and Actions
         ========================================================================= */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center justify-between">
              <span>Student Profile & Journey</span>
              {activeStudentDetail?.profile?.is_blocked && (
                <span className="rounded-md px-2 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Account Suspended
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Comprehensive learner record, contact channels, cohort history, and attendance telemetry.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {isLoadingDetail || !activeStudentDetail ? (
              <div className="py-12 text-center text-[#8D9FA4]">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                <span>Loading profile telemetry...</span>
              </div>
            ) : (
              <>
                {/* Profile Header & Contact Channels */}
                <div className="rounded-xl border border-[#1A373E] bg-[#0E2024] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-amber-500/20 text-amber-400 font-serif text-lg font-bold flex items-center justify-center shrink-0">
                      {activeStudentDetail.profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">
                        {activeStudentDetail.profile?.full_name || 'Anonymous Student'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#8D9FA4] mt-0.5">
                        <span className="font-mono">{activeStudentDetail.profile?.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeStudentDetail.profile?.id, 'id')}
                          className="hover:text-white"
                          title="Copy User ID"
                        >
                          {copiedField === 'id' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeStudentDetail.profile?.phone && (
                      <a
                        href={`https://wa.me/${activeStudentDetail.profile.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDetailModalOpen(false);
                        navigate(
                          `/announcements?studentId=${activeStudentDetail.profile?.id}&studentName=${encodeURIComponent(
                            activeStudentDetail.profile?.full_name || 'Student'
                          )}`
                        );
                      }}
                      className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-black text-xs"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      <span>Message Student</span>
                    </Button>
                  </div>
                </div>

                {/* Engagement Stats Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-center">
                    <div className="text-xl font-bold text-amber-400">
                      {activeStudentDetail.enrollments?.length || 0}
                    </div>
                    <div className="text-[10px] text-[#8D9FA4] uppercase mt-0.5">Cohort Programs</div>
                  </div>
                  <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-center">
                    <div className="text-xl font-bold text-emerald-400">
                      {activeStudentDetail.attendance_count || 0}
                    </div>
                    <div className="text-[10px] text-[#8D9FA4] uppercase mt-0.5">Sessions Attended</div>
                  </div>
                  <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-center">
                    <div className="text-xl font-bold text-cyan-400">
                      {activeStudentDetail.tasks_completed_count || 0}
                    </div>
                    <div className="text-[10px] text-[#8D9FA4] uppercase mt-0.5">Tasks Completed</div>
                  </div>
                  <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-center">
                    <div className="text-xl font-bold text-white">₹0</div>
                    <div className="text-[10px] text-[#8D9FA4] uppercase mt-0.5">Total Paid</div>
                  </div>
                </div>

                {/* Enrolled Programs List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#8D9FA4] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-amber-500" />
                      <span>Active Program Enrollments</span>
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEnrollForStudent(activeStudentDetail.profile)}
                      className="h-6 text-[10px] border-[#1A373E] bg-[#0E2024] text-amber-400"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      <span>Add Enrollment</span>
                    </Button>
                  </div>

                  {activeStudentDetail.enrollments?.length === 0 ? (
                    <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-4 text-center text-xs text-[#8D9FA4]">
                      This student is not currently enrolled in any cohorts.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeStudentDetail.enrollments.map((e: any) => (
                        <div
                          key={e.id}
                          className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">{e.program_title}</div>
                            <div className="text-[11px] text-[#8D9FA4] flex items-center gap-2 mt-0.5">
                              <span>Enrolled: {formatDateIST(e.enrolled_at)}</span>
                              <span>•</span>
                              <span className="capitalize">{e.source} access</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={e.status === 'active' ? 'teal' : 'neutral'}
                              className="text-[10px] capitalize"
                            >
                              {e.status}
                            </Badge>
                            {e.status === 'active' && (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  handleOpenRevoke(
                                    e.id,
                                    activeStudentDetail.profile?.full_name || 'Student',
                                    e.program_title
                                  )
                                }
                                className="h-6 px-2 text-[10px]"
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Session Attendance */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#8D9FA4] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>Recent Live Attendance History</span>
                  </h4>
                  {activeStudentDetail.attendance_history?.length === 0 ? (
                    <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-center text-xs text-[#8D9FA4]">
                      No recorded session joins yet.
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-lg border border-[#1A373E] bg-[#040C0E] p-2">
                      {activeStudentDetail.attendance_history.map((att: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-[#0E2024]"
                        >
                          <span className="text-white font-medium">
                            Day {att.day_number}: {att.session_title}
                          </span>
                          <span className="text-[#8D9FA4]">{formatDateIST(att.attended_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Account Status Card */}
                <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-xs">Account Moderation Status</div>
                    <div className="text-[11px] text-[#8D9FA4] mt-0.5">
                      {activeStudentDetail.profile?.is_blocked
                        ? `Account paused. Reason: "${activeStudentDetail.profile?.blocked_reason || 'Administrative review'}"`
                        : 'Account in good standing with active platform access.'}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={activeStudentDetail.profile?.is_blocked ? 'primary' : 'danger'}
                    onClick={() =>
                      handleOpenBlockDialog(
                        activeStudentDetail.profile.id,
                        activeStudentDetail.profile.full_name || 'Student',
                        activeStudentDetail.profile.is_blocked
                      )
                    }
                    className="text-xs"
                  >
                    {activeStudentDetail.profile?.is_blocked ? 'Unblock Student' : 'Suspend Account'}
                  </Button>
                </div>
              </>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailModalOpen(false)}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Close Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Enrol Student Modal
         ========================================================================= */}
      <Dialog open={enrollModalOpen} onOpenChange={setEnrollModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-500" />
              <span>Enrol Student in Program</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Manually provision cohort membership with immediate dashboard access.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {targetStudentForEnroll && (
              <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-2.5 text-xs text-[#8D9FA4]">
                Enrolling learner: <span className="text-white font-semibold">{targetStudentForEnroll.full_name || targetStudentForEnroll.email}</span>
              </div>
            )}
            {enrollMutation.isError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {(enrollMutation.error as Error).message}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Student Email or User ID *
              </label>
              <input
                type="text"
                placeholder="student@example.com or uuid"
                value={targetEmailOrId}
                onChange={(e) => setTargetEmailOrId(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white placeholder-[#8D9FA4] focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Target Program Cohort *
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Select a program...</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Access Valid Until (Optional)
              </label>
              <input
                type="date"
                value={accessUntil}
                onChange={(e) => setAccessUntil(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
              <span className="text-[10px] text-[#8D9FA4] mt-0.5 block">
                Leave blank for standard lifetime / full cohort access.
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-white pt-1">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="rounded border-[#1A373E] bg-[#0E2024] text-amber-500 focus:ring-amber-500"
              />
              <span>Send welcome notification in student dashboard</span>
            </label>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEnrollModalOpen(false)}
              disabled={enrollMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending || !targetEmailOrId || !selectedProgramId}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Confirm Enrollment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Revoke Enrollment Modal
         ========================================================================= */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-rose-900/40 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2 text-rose-400">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              <span>Revoke Student Enrollment</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              This will immediately lock all session links, recordings, and lessons for this student.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-xs space-y-1">
              <div className="text-[#8D9FA4]">
                Student: <span className="font-semibold text-white">{enrollmentToRevoke?.studentName}</span>
              </div>
              <div className="text-[#8D9FA4]">
                Program: <span className="font-semibold text-white">{enrollmentToRevoke?.programTitle}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Revocation Reason (Optional audit note)
              </label>
              <textarea
                rows={3}
                placeholder="Reason for revoking access (e.g. administrative refund, cohort transfer)..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] p-3 text-xs text-white placeholder-[#8D9FA4] focus:outline-none focus:border-rose-500/50"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokeModalOpen(false)}
              disabled={revokeMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
              className="text-xs"
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Confirm Revocation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Block / Unblock Student Modal
         ========================================================================= */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle
              className={`font-serif text-xl font-bold flex items-center gap-2 ${
                studentToBlock?.currentlyBlocked ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
              <span>
                {studentToBlock?.currentlyBlocked ? 'Unblock Student Account' : 'Suspend Student Account'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              {studentToBlock?.currentlyBlocked
                ? 'Restores platform login and unlocks enrolled cohort live sessions.'
                : 'Suspends student access across all apps. Student will see a paused account notice.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-xs">
              <div className="text-[#8D9FA4]">
                Target: <span className="font-semibold text-white">{studentToBlock?.name}</span>
              </div>
            </div>

            {!studentToBlock?.currentlyBlocked && (
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                  Reason for Suspension (Required) *
                </label>
                <textarea
                  rows={3}
                  placeholder="State the reason for blocking this account..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] p-3 text-xs text-white placeholder-[#8D9FA4] focus:outline-none focus:border-rose-500/50"
                />
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBlockModalOpen(false)}
              disabled={blockMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={studentToBlock?.currentlyBlocked ? 'primary' : 'danger'}
              onClick={() => blockMutation.mutate()}
              disabled={
                blockMutation.isPending ||
                (!studentToBlock?.currentlyBlocked && (!blockReason || blockReason.trim().length < 3))
              }
              className="text-xs"
            >
              {blockMutation.isPending
                ? 'Processing...'
                : studentToBlock?.currentlyBlocked
                ? 'Confirm Unblock'
                : 'Confirm Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Account Deletion Request Resolution Modal
         ========================================================================= */}
      <Dialog open={deletionNoteModalOpen} onOpenChange={setDeletionNoteModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <UserX className="h-5 w-5 text-rose-400" />
              <span>Update Deletion Request</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Update the administrative processing status and notes for this data deletion request.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">Status</label>
              <select
                value={deletionResolutionStatus}
                onChange={(e) => setDeletionResolutionStatus(e.target.value as any)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="processing">In Progress / Processing</option>
                <option value="completed">Completed (Confirmed)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">Admin Resolution Note</label>
              <textarea
                rows={3}
                placeholder="Optional resolution details (e.g. user confirmed, identity pruned manually)..."
                value={deletionAdminNote}
                onChange={(e) => setDeletionAdminNote(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] p-3 text-xs text-white placeholder-[#8D9FA4] focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletionNoteModalOpen(false)}
              disabled={deletionMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => deletionMutation.mutate()}
              disabled={deletionMutation.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
            >
              {deletionMutation.isPending ? 'Updating...' : 'Save Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudentsPage;
