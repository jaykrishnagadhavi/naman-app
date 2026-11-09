import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '@abrainoconscious/ui';
import {
  adminEnrollStudent,
  adminRevokeStudentEnrollment,
  formatDateIST,
} from '@abrainoconscious/shared';
import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';

interface StudentProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_blocked: boolean;
  created_at: string;
  email?: string;
  enrollments: Array<{
    id: string;
    program_id: string;
    status: string;
    source: string;
    enrolled_at: string;
    access_until: string | null;
    program?: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
}

interface ProgramOption {
  id: string;
  title: string;
  slug: string;
  type: string;
}

export const AdminStudentsPage: React.FC = () => {
  const { supabase } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);

  // Form states for enroll modal
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
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

  // 1. Fetch Students
  const {
    data: students = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<StudentProfile[]>({
    queryKey: ['admin-students-list'],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          avatar_url,
          role,
          is_blocked,
          created_at,
          enrollments (
            id,
            program_id,
            status,
            source,
            enrolled_at,
            access_until,
            programs (
              id,
              title,
              slug
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      return (profiles || []).map((p: any) => ({
        ...p,
        enrollments: (p.enrollments || []).map((e: any) => ({
          ...e,
          program: Array.isArray(e.programs) ? e.programs[0] : e.programs,
        })),
      }));
    },
    staleTime: 1000 * 30,
  });

  // 2. Fetch Programs for Dropdown
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
      queryClient.invalidateQueries({ queryKey: ['admin-students-list'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-students-list'] });
      setRevokeModalOpen(false);
      setEnrollmentToRevoke(null);
      setRevokeReason('');
    },
  });

  const resetEnrollForm = () => {
    setSelectedStudent(null);
    setTargetEmailOrId('');
    setSelectedProgramId('');
    setAccessUntil('');
    setSendNotification(true);
  };

  const handleOpenEnrollForStudent = (s: StudentProfile) => {
    setSelectedStudent(s);
    setTargetEmailOrId(s.email || s.id);
    setSelectedProgramId(programs[0]?.id || '');
    setEnrollModalOpen(true);
  };

  const handleOpenRevoke = (
    enrollmentId: string,
    studentName: string,
    programTitle: string
  ) => {
    setEnrollmentToRevoke({
      id: enrollmentId,
      studentName,
      programTitle,
    });
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  // Filter students by search
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      s.id.toLowerCase().includes(q)
    );
  });

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
            Directory of registered students, cohort allocations, manual enrollments, and access controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="cta"
            size="sm"
            onClick={() => {
              resetEnrollForm();
              setSelectedProgramId(programs[0]?.id || '');
              setEnrollModalOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Enrol in Program
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <ErrorDetailsAlert
          title="Failed to load students directory"
          error={error}
        />
      )}

      {/* Search and summary bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#556B71]" />
          <input
            type="text"
            placeholder="Search by student name, phone, or UUID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#1A373E] bg-[#081619] pl-9 pr-4 py-2 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8D9FA4]">
          <span>Total Students: <strong className="text-white">{students.length}</strong></span>
          <span>•</span>
          <span>Filtered: <strong className="text-amber-400">{filteredStudents.length}</strong></span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-8 space-y-4 animate-pulse">
          <div className="h-8 w-1/3 rounded bg-[#0E2024]" />
          <div className="h-64 rounded-xl bg-[#0E2024]" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-[#556B71] mx-auto stroke-1" />
          <h3 className="font-serif text-lg font-bold text-white">No students found</h3>
          <p className="text-xs text-[#8D9FA4] max-w-md mx-auto">
            {searchQuery
              ? `No student matching "${searchQuery}". Check the name or ID.`
              : 'No students have registered yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1A373E] bg-[#081619]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#1A373E] bg-[#0A1719] text-[#8D9FA4]">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Enrolled Programs</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A373E]">
              {filteredStudents.map((s) => {
                return (
                  <tr key={s.id} className="hover:bg-[#0E2024]/60 transition-colors">
                    {/* Student Identity */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 font-bold text-black text-xs shrink-0">
                          {s.full_name ? s.full_name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            <span>{s.full_name || 'Anonymous Student'}</span>
                            {s.role === 'admin' && (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-400">
                                ADMIN
                              </span>
                            )}
                            {s.role === 'staff' && (
                              <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-400">
                                STAFF
                              </span>
                            )}
                            {s.is_blocked && (
                              <span className="rounded bg-red-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#556B71]">ID: {s.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-[#A0B1B5]">
                      <div className="space-y-0.5">
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Mail className="h-3 w-3 text-[#556B71]" />
                            <span>{s.email}</span>
                          </div>
                        )}
                        {s.phone ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone className="h-3 w-3 text-[#556B71]" />
                            <span>{s.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#556B71]">No phone</span>
                        )}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-3 text-[#8D9FA4]">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="h-3 w-3 text-[#556B71]" />
                        <span>{formatDateIST(s.created_at)}</span>
                      </div>
                    </td>

                    {/* Enrollments List */}
                    <td className="px-4 py-3">
                      {s.enrollments.length === 0 ? (
                        <span className="text-[11px] text-[#556B71]">No enrollments</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {s.enrollments.map((e) => (
                            <div
                              key={e.id}
                              className={`group inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] ${
                                e.status === 'active'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  : e.status === 'revoked'
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                  : 'border-[#1A373E] bg-[#0A1719] text-[#8D9FA4]'
                              }`}
                            >
                              <BookOpen className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[140px]">
                                {e.program?.title || 'Program'}
                              </span>
                              <span className="text-[9px] uppercase font-bold opacity-75">
                                ({e.status})
                              </span>

                              {e.status === 'active' && (
                                <button
                                  type="button"
                                  title="Revoke access"
                                  onClick={() =>
                                    handleOpenRevoke(
                                      e.id,
                                      s.full_name || 'Student',
                                      e.program?.title || 'Program'
                                    )
                                  }
                                  className="ml-1 text-rose-400 hover:text-rose-300 font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEnrollForStudent(s)}
                        className="text-[11px] px-2.5 py-1"
                      >
                        Enrol
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 1. Modal: Enrol Student in Program */}
      <Dialog open={enrollModalOpen} onOpenChange={setEnrollModalOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-500" />
              Enrol Student in Program
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Grant manual enrollment access to a live cohort challenge or masterclass course.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 text-xs">
            {enrollMutation.isError && (
              <ErrorDetailsAlert
                title="Enrollment failed"
                error={enrollMutation.error}
              />
            )}

            {/* Student ID or Email */}
            <div className="space-y-1">
              <label className="font-semibold text-white">Student Email or Profile UUID *</label>
              <input
                type="text"
                placeholder="student@example.com or user-uuid"
                value={targetEmailOrId}
                onChange={(e) => setTargetEmailOrId(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
              {selectedStudent?.full_name && (
                <p className="text-[11px] text-amber-400">
                  Target Student: {selectedStudent.full_name}
                </p>
              )}
            </div>

            {/* Program selection */}
            <div className="space-y-1">
              <label className="font-semibold text-white">Select Cohort / Course *</label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Choose a program --</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.type.toUpperCase()}] {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Access until date (optional) */}
            <div className="space-y-1">
              <label className="font-semibold text-white">Access Expiry Date (Optional)</label>
              <input
                type="date"
                value={accessUntil}
                onChange={(e) => setAccessUntil(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-[#556B71]">
                Leave empty for default lifetime or program scheduled end date.
              </span>
            </div>

            {/* Send notification toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="send-notif"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 rounded border-[#1A373E] bg-[#040C0E] text-amber-500 focus:ring-0"
              />
              <label htmlFor="send-notif" className="text-xs text-[#8D9FA4] cursor-pointer">
                Send welcome notification to student dashboard immediately
              </label>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEnrollModalOpen(false)}
              disabled={enrollMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="cta"
              size="sm"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending || !targetEmailOrId || !selectedProgramId}
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Confirm Enrollment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Confirm Revoke Enrollment */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Revoke Program Access
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              This will immediately revoke active access to daily live links and course curriculum.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 text-xs">
            {revokeMutation.isError && (
              <ErrorDetailsAlert
                title="Revocation failed"
                error={revokeMutation.error}
              />
            )}

            {enrollmentToRevoke && (
              <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 text-xs space-y-1">
                <div>Student: <strong className="text-white">{enrollmentToRevoke.studentName}</strong></div>
                <div>Program: <strong className="text-white">{enrollmentToRevoke.programTitle}</strong></div>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-white">Reason for Revocation (Logged in Audit Log)</label>
              <textarea
                rows={2}
                placeholder="e.g. Requested refund, policy violation, or duplicate account"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] p-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokeModalOpen(false)}
              disabled={revokeMutation.isPending}
            >
              Keep Access
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
              className="bg-rose-600 hover:bg-rose-500 font-bold"
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Enrollment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
