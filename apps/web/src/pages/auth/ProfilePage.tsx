import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Button } from '@abrainoconscious/ui';
import {
  ProfileUpdateSchema,
  ChangePasswordSchema,
  AccountDeletionRequestSchema,
  type GrowthPillar
} from '@abrainoconscious/shared';
import {
  User as UserIcon,
  Mail,
  Camera,
  KeyRound,
  ShieldAlert,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  HeartHandshake,
  Brain,
  GraduationCap
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, supabase, refreshProfile, signOut, signOutEverywhere, updatePassword } = useAuth();

  // Basic Profile Edit
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPillars, setSelectedPillars] = useState<GrowthPillar[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Avatar Upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Change Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Account Deletion Request
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setSelectedPillars((profile.goal_pillars as GrowthPillar[]) || []);
    }
  }, [profile]);

  // Determine connected providers
  const isGoogleOnly =
    user?.app_metadata?.provider === 'google' &&
    (!user?.identities || !user.identities.some((id) => id.provider === 'email'));

  const togglePillar = (pillar: GrowthPillar) => {
    if (selectedPillars.includes(pillar)) {
      setSelectedPillars(selectedPillars.filter((p) => p !== pillar));
    } else {
      setSelectedPillars([...selectedPillars, pillar]);
    }
  };

  const getPillarIcon = (pillar: GrowthPillar) => {
    switch (pillar) {
      case 'emotional':
        return <HeartHandshake className="h-4 w-4" />;
      case 'mental':
        return <Brain className="h-4 w-4" />;
      case 'academic':
        return <GraduationCap className="h-4 w-4" />;
      case 'personal':
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    const validation = ProfileUpdateSchema.safeParse({
      fullName,
      phone: phone.trim(),
      goalPillars: selectedPillars,
    });

    if (!validation.success) {
      setProfileError(validation.error.issues[0]?.message || 'Please check your inputs.');
      return;
    }

    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          goal_pillars: selectedPillars,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        setProfileError(error.message);
        setSavingProfile(false);
        return;
      }

      await refreshProfile();
      setProfileSuccess(true);
      setSavingProfile(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
      setSavingProfile(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarError(null);

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Avatar image must be under 2MB.');
      return;
    }

    // Validate type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validMimes.includes(file.type)) {
      setAvatarError('Avatar must be a JPEG, PNG, WebP, or AVIF image.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setAvatarError(uploadError.message);
        setUploadingAvatar(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateProfileError) {
        setAvatarError(updateProfileError.message);
        setUploadingAvatar(false);
        return;
      }

      await refreshProfile();
      setUploadingAvatar(false);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to upload avatar.');
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    const validation = ChangePasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!validation.success) {
      setPasswordError(validation.error.issues[0]?.message || 'Please verify passwords.');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message);
        setSavingPassword(false);
        return;
      }

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setSavingPassword(false);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password.');
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleSignOutEverywhere = async () => {
    if (window.confirm('This will immediately terminate your session across all devices and browsers. Proceed?')) {
      await signOutEverywhere();
      navigate('/login', { replace: true });
    }
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    const validation = AccountDeletionRequestSchema.safeParse({
      reason: deleteReason,
      confirm: confirmDelete,
    });

    if (!validation.success) {
      setDeleteError(validation.error.issues[0]?.message || 'Please confirm your request.');
      return;
    }

    if (!user) return;

    setSubmittingDelete(true);
    try {
      const { error } = await supabase.from('account_deletion_requests').insert({
        user_id: user.id,
        reason: deleteReason.trim() || null,
        status: 'pending',
      });

      if (error) {
        setDeleteError(error.message);
        setSubmittingDelete(false);
        return;
      }

      setDeleteSuccess(true);
      setSubmittingDelete(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to submit request.');
      setSubmittingDelete(false);
    }
  };

  const pillarKeys: GrowthPillar[] = ['emotional', 'mental', 'academic', 'personal'];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-white">Student Account & Preferences</h1>
        <p className="text-xs text-[#8D9FA4] mt-1">
          Manage your personal details, learning pillar focus, security credentials, and session controls.
        </p>
      </div>

      {/* 1. Profile & Avatar Card */}
      <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 sm:p-8 space-y-6">
        <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-amber-500" />
          <span>Personal Details</span>
        </h2>

        {/* Avatar Section */}
        <div className="flex items-center gap-4 border-b border-[#1A373E] pb-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0E2024] to-[#132A30] border-2 border-[#1A373E] overflow-hidden text-amber-500 font-bold text-2xl">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Student Avatar'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{(fullName || user?.email || 'S').charAt(0).toUpperCase()}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-black shadow-md hover:bg-amber-400 disabled:opacity-50"
              title="Upload new avatar"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">Profile Photo</h4>
            <p className="text-xs text-[#8D9FA4]">
              Square format recommended. Max 2MB (JPEG, PNG, WebP).
            </p>
            {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
            {uploadingAvatar && <p className="text-xs text-amber-400">Uploading new avatar...</p>}
          </div>
        </div>

        {profileSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Profile details updated successfully.</span>
          </div>
        )}

        {profileError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E]/50 px-3.5 py-2.5 text-xs text-[#8D9FA4] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white">
              Phone Number <span className="text-[#8D9FA4] font-normal">(for live session WhatsApp alerts)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Goal Pillars */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-white">Your Growth Pillars Focus</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {pillarKeys.map((key) => {
                const isSelected = selectedPillars.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePillar(key)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-amber-500/40 bg-amber-500/20 text-white'
                        : 'border-[#1A373E] bg-[#040C0E] text-[#8D9FA4] hover:bg-[#0E2024]'
                    }`}
                  >
                    {getPillarIcon(key)}
                    <span className="capitalize">{key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" disabled={savingProfile} size="sm">
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Connected Sign-in Methods */}
      <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 sm:p-8 space-y-4">
        <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-500" />
          <span>Connected Sign-In Methods</span>
        </h2>
        <p className="text-xs text-[#8D9FA4]">
          Identity providers linked to your ABrainoConscious student account.
        </p>

        <div className="space-y-2 pt-1">
          {user?.identities?.map((identity) => (
            <div
              key={identity.id}
              className="flex items-center justify-between rounded-xl border border-[#1A373E] bg-[#040C0E] p-3.5 text-xs"
            >
              <div className="flex items-center gap-2.5">
                {identity.provider === 'google' ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-bold text-[10px]">
                    G
                  </div>
                ) : (
                  <Mail className="h-4 w-4 text-amber-400" />
                )}
                <span className="font-semibold text-white capitalize">{identity.provider} Account</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                CONNECTED
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Password Management (Hidden for Google-only users) */}
      {!isGoogleOnly && (
        <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 sm:p-8 space-y-4">
          <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-500" />
            <span>Change Password</span>
          </h2>
          <p className="text-xs text-[#8D9FA4]">
            Update your account password. Must be at least 8 characters.
          </p>

          {passwordSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Password successfully updated.</span>
            </div>
          )}

          {passwordError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">New Password</label>
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      )}

      {/* 4. Session & Security Controls */}
      <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 sm:p-8 space-y-4">
        <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <span>Active Sessions & Security</span>
        </h2>
        <p className="text-xs text-[#8D9FA4]">
          Sign out of this browser or terminate sessions on all devices if you suspect unauthorized access.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-1.5">
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Current Browser</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOutEverywhere}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:border-red-500/40"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Sign Out of All Devices</span>
          </Button>
        </div>
      </div>

      {/* 5. Danger Zone: Request Account Deletion */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 sm:p-8 space-y-4">
        <h2 className="font-serif text-lg font-bold text-red-400 flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          <span>Delete Account</span>
        </h2>
        <p className="text-xs text-[#8D9FA4] leading-relaxed">
          Requesting account deletion queues your account for review by our support team. Your enrollments,
          progress records, and access tokens will be decommissioned.
        </p>

        {deleteSuccess ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 space-y-1">
            <p className="font-semibold text-white">Deletion Request Submitted</p>
            <p className="text-[11px] text-[#8D9FA4]">
              Our administrator team has received your request and will process it shortly.
            </p>
          </div>
        ) : !showDeleteDialog ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            Request Account Deletion...
          </Button>
        ) : (
          <form onSubmit={handleRequestDeletion} className="space-y-4 pt-2 max-w-md animate-in fade-in">
            {deleteError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {deleteError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">
                Reason for leaving <span className="text-[#8D9FA4] font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Let us know how we could have helped you better..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] p-3 text-xs text-white placeholder-[#556B71] focus:border-red-500 focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#1A373E] bg-[#040C0E] text-red-500 focus:ring-red-500"
              />
              <span className="text-xs text-[#8D9FA4]">
                I understand that this action is permanent and my course access will be revoked.
              </span>
            </label>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submittingDelete}
                className="bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                {submittingDelete ? 'Submitting...' : 'Confirm Deletion Request'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
