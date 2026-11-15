import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useAuth,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Badge,
  ErrorDetailsAlert,
} from '@abrainoconscious/ui';
import {
  manageTeamApi,
  formatDateIST,
  ROLE_PERMISSIONS,
} from '@abrainoconscious/shared';
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Lock,
  UserX,
  Edit2,
  Copy,
  Check,
  Info,
} from 'lucide-react';

export const AdminTeamPage: React.FC = () => {
  const { supabase, profile, user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  // Form states
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'staff'>('staff');
  const [activeMember, setActiveMember] = useState<any>(null);
  const [newRole, setNewRole] = useState<'admin' | 'staff' | 'student'>('staff');
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // 1. RBAC Guard: Admin Only
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-[#081619] p-8 shadow-2xl space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            Team permissions and role allocations are restricted exclusively to Administrators. Staff members do not have permission to manage team privileges.
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch Team Members List
  const {
    data: teamData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-team-list'],
    queryFn: () => manageTeamApi(supabase, { action: 'list_team' }),
    staleTime: 1000 * 30,
  });

  const teamMembers = teamData?.team || [];

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      setActionError(null);
      const res = await manageTeamApi(supabase, {
        action: 'add_member',
        email: addEmail.trim(),
        role: addRole,
      });

      if (res && res.error) {
        throw new Error(res.message || res.error);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
      setAddModalOpen(false);
      setAddEmail('');
      setAddRole('staff');
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to add team member');
    },
  });

  // Change Role Mutation
  const changeRoleMutation = useMutation({
    mutationFn: async () => {
      if (!activeMember) return;
      setActionError(null);
      const res = await manageTeamApi(supabase, {
        action: 'change_role',
        user_id: activeMember.id,
        new_role: newRole,
      });

      if (res && res.error) {
        throw new Error(res.message || res.error);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
      setChangeRoleModalOpen(false);
      setActiveMember(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to change role');
    },
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: async () => {
      if (!activeMember) return;
      setActionError(null);
      const res = await manageTeamApi(supabase, {
        action: 'remove_member',
        user_id: activeMember.id,
      });

      if (res && res.error) {
        throw new Error(res.message || res.error);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-list'] });
      setRemoveModalOpen(false);
      setActiveMember(null);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to remove member');
    },
  });

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Team & Role-Based Access
            </h1>
          </div>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Manage administrative personnel, staff invitations, and operational permission boundaries.
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
            size="sm"
            onClick={() => {
              setActionError(null);
              setAddEmail('');
              setAddRole('staff');
              setAddModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            <span>Add Member</span>
          </Button>
        </div>
      </div>

      {isError && (
        <div className="space-y-2">
          <ErrorDetailsAlert
            title="Failed to Load Team Members"
            error={error}
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Team Members Table */}
      <div className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619]">
        <div className="p-4 border-b border-[#1A373E] bg-[#0E2024]/40 font-semibold text-xs text-white">
          Active Studio Administrators & Staff
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
              <tr>
                <th className="py-3 px-4 font-semibold">Team Member</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Assigned Role</th>
                <th className="py-3 px-4 font-semibold">Added On</th>
                <th className="py-3 px-4 font-semibold">Last Active</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A373E]/50 text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8D9FA4]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading team directory...</span>
                  </td>
                </tr>
              ) : teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8D9FA4]">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div>No team members configured.</div>
                  </td>
                </tr>
              ) : (
                teamMembers.map((member: any) => {
                  const isCurrent = member.id === currentUser?.id;
                  return (
                    <tr key={member.id} className="hover:bg-[#0E2024]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#1A373E] flex items-center justify-center font-bold text-amber-400 shrink-0">
                            {member.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{member.full_name || 'Team Member'}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8D9FA4] font-mono">{member.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#E1E8EA]">{member.email || '—'}</span>
                          {member.email && (
                            <button
                              type="button"
                              onClick={() => handleCopy(member.email)}
                              className="text-[#8D9FA4] hover:text-white"
                              title="Copy Email"
                            >
                              {copiedEmail === member.email ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={member.role === 'admin' ? 'amber' : 'neutral'}
                          className="text-[10px] capitalize"
                        >
                          {member.role}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-[#8D9FA4] whitespace-nowrap">
                        {formatDateIST(member.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-[#8D9FA4] whitespace-nowrap">
                        {member.last_seen_at ? formatDateIST(member.last_seen_at) : 'Never'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isCurrent}
                            onClick={() => {
                              setActionError(null);
                              setActiveMember(member);
                              setNewRole(member.role === 'admin' ? 'staff' : 'admin');
                              setChangeRoleModalOpen(true);
                            }}
                            className={`h-7 px-2 border-[#1A373E] bg-[#0E2024] text-[11px] text-amber-400 hover:text-white ${
                              isCurrent ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                            title={isCurrent ? 'You cannot modify your own role' : 'Change Role'}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            <span>Role</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isCurrent}
                            onClick={() => {
                              setActionError(null);
                              setActiveMember(member);
                              setRemoveModalOpen(true);
                            }}
                            className={`h-7 px-2 border-rose-900/40 text-rose-400 hover:bg-rose-500 hover:text-white text-[11px] ${
                              isCurrent ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                            title={isCurrent ? 'You cannot remove yourself' : 'Remove Member'}
                          >
                            <UserX className="h-3 w-3" />
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
      </div>

      {/* Role Permission Matrix Table */}
      <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-amber-500" />
          <h3 className="font-serif text-base font-bold text-white">
            Role Permission Matrix (RBAC)
          </h3>
        </div>
        <p className="text-xs text-[#8D9FA4]">
          Studio privileges are partitioned strictly by role. Staff members manage content and broadcasts, while sensitive financial and administrative security functions require Administrator privileges.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Feature Area</th>
                <th className="py-2.5 px-3 font-semibold">Scope</th>
                <th className="py-2.5 px-3 font-semibold text-center">Administrator</th>
                <th className="py-2.5 px-3 font-semibold text-center">Staff</th>
                <th className="py-2.5 px-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A373E]/50 text-white">
              {ROLE_PERMISSIONS.map((perm, idx) => (
                <tr key={idx} className="hover:bg-[#0E2024]/30">
                  <td className="py-2.5 px-3 font-semibold">{perm.feature}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[10px]">
                      {perm.category}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {perm.admin ? (
                      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-[#8D9FA4]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {perm.staff ? (
                      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-[#8D9FA4] text-xs font-mono">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#8D9FA4] text-[11px]">{perm.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          Add Team Member Modal
         ========================================================================= */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-500" />
              <span>Invite Team Member</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Add administrative personnel or staff moderators to Naman Studio.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {actionError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="colleague@abrainoconcious.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white placeholder-[#8D9FA4] focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Assigned Role *
              </label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as any)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="staff">Staff (Programs, Sessions & Announcements)</option>
                <option value="admin">Administrator (Full Access & Settings)</option>
              </select>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <div className="font-semibold text-white">Login Instructions:</div>
              <p className="mt-0.5 text-amber-200/90 leading-relaxed text-[11px]">
                Invited members should sign in at <strong className="text-white">admin.{import.meta.env.VITE_ROOT_DOMAIN || 'abrainoconcious.com'}</strong> using Google OAuth or magic link with this exact email address. No password email is sent.
              </p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddModalOpen(false)}
              disabled={addMemberMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => addMemberMutation.mutate()}
              disabled={addMemberMutation.isPending || !addEmail.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
            >
              {addMemberMutation.isPending ? 'Provisioning...' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Change Role Modal
         ========================================================================= */}
      <Dialog open={changeRoleModalOpen} onOpenChange={setChangeRoleModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" />
              <span>Modify Team Role</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Update operational privileges for this team member.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {actionError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-xs space-y-1">
              <div>
                Member: <span className="font-semibold text-white">{activeMember?.full_name || 'Member'}</span>
              </div>
              <div>
                Current Role: <span className="font-semibold text-amber-400 capitalize">{activeMember?.role}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                New Role Assignment *
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="staff">Staff (Content & Sessions Only)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangeRoleModalOpen(false)}
              disabled={changeRoleMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => changeRoleMutation.mutate()}
              disabled={changeRoleMutation.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
            >
              {changeRoleMutation.isPending ? 'Updating...' : 'Confirm Role Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Remove Member Modal
         ========================================================================= */}
      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-rose-900/40 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-rose-400 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              <span>Remove Team Member</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Revoke administrative access and return account permissions to standard student role.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {actionError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-xs space-y-1">
              <div>
                Member: <span className="font-semibold text-white">{activeMember?.full_name || 'Member'}</span>
              </div>
              <div>
                Email: <span className="text-[#8D9FA4] font-mono">{activeMember?.email}</span>
              </div>
            </div>

            <p className="text-xs text-rose-300 leading-relaxed">
              This will immediately lock the user out of the Studio dashboard. Their account will remain in Supabase as a standard student.
            </p>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRemoveModalOpen(false)}
              disabled={removeMemberMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => removeMemberMutation.mutate()}
              disabled={removeMemberMutation.isPending}
              className="text-xs"
            >
              {removeMemberMutation.isPending ? 'Removing...' : 'Confirm Removal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeamPage;
