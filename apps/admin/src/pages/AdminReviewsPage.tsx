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
  adminModerateReview,
  adminDeleteReview,
  formatDateIST,
} from '@abrainoconscious/shared';
import {
  Star,
  RefreshCw,
  EyeOff,
  Trash2,
  Sparkles,
  BookOpen,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const AdminReviewsPage: React.FC = () => {
  const { supabase, profile } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('');
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [reviewToDelete, setReviewToDelete] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // 1. Fetch Reviews List
  const {
    data: reviewsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-reviews-list', activeTab, selectedProgramFilter],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select(`
          id,
          program_id,
          user_id,
          rating,
          title,
          body,
          status,
          is_published,
          created_at,
          updated_at,
          programs (
            id,
            title
          ),
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }
      if (selectedProgramFilter) {
        query = query.eq('program_id', selectedProgramFilter);
      }

      const { data, error: rErr } = await query;
      if (rErr) throw rErr;

      return (data || []).map((r: any) => ({
        ...r,
        program_title: r.programs?.title || 'Program',
        student_name: r.profiles?.full_name || 'Anonymous Student',
        student_avatar_url: r.profiles?.avatar_url || null,
      }));
    },
    staleTime: 1000 * 30,
  });

  // 2. Fetch Programs for Dropdowns
  const { data: programs = [] } = useQuery({
    queryKey: ['admin-programs-reviews-filter'],
    queryFn: async () => {
      const { data, error: prErr } = await supabase
        .from('programs')
        .select('id, title')
        .is('deleted_at', null)
        .order('title', { ascending: true });
      if (prErr) throw prErr;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const reviews = reviewsData || [];

  // Mutations
  const moderateMutation = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string; status: 'approved' | 'hidden' }) => {
      return adminModerateReview(supabase, { reviewId, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-list'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return adminDeleteReview(supabase, reviewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-list'] });
      setDeleteModalOpen(false);
      setReviewToDelete(null);
    },
  });

  // Bulk Moderate Mutation
  const bulkModerateMutation = useMutation({
    mutationFn: async (status: 'approved' | 'hidden') => {
      for (const id of selectedReviewIds) {
        await adminModerateReview(supabase, { reviewId: id, status });
      }
    },
    onSuccess: () => {
      setSelectedReviewIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-list'] });
    },
  });

  // Seed sample reviews in development if empty
  const handleSeedSampleReviews = async () => {
    if (programs.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sampleReviews: Array<{
      program_id: string;
      user_id: string;
      rating: number;
      title: string;
      body: string;
      status: 'pending' | 'approved' | 'hidden';
      is_published: boolean;
    }> = [
      {
        program_id: programs[0].id,
        user_id: user.id,
        rating: 5,
        title: 'Life-changing clarity and focus sprint!',
        body: 'The daily live sessions with Naman were beyond impactful. Having the accountability and structured worksheets helped me break through months of procrastination.',
        status: 'approved',
        is_published: true,
      },
      {
        program_id: programs[0].id,
        user_id: user.id,
        rating: 4,
        title: 'Genuinely practical frameworks',
        body: 'Warm, calm, and zero hype. The emotional resilience techniques in Day 7 and Day 14 were exactly what I needed during exam prep.',
        status: 'pending',
        is_published: false,
      },
    ];

    await supabase.from('reviews').upsert(sampleReviews, { onConflict: 'program_id,user_id' });
    queryClient.invalidateQueries({ queryKey: ['admin-reviews-list'] });
  };

  const handleToggleSelectAll = () => {
    if (selectedReviewIds.length === reviews.length) {
      setSelectedReviewIds([]);
    } else {
      setSelectedReviewIds(reviews.map((r: any) => r.id));
    }
  };

  const handleToggleReview = (id: string) => {
    setSelectedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Compute Summary
  const approvedReviews = reviews.filter((r: any) => r.status === 'approved');
  const pendingReviews = reviews.filter((r: any) => r.status === 'pending');
  const averageRating =
    approvedReviews.length > 0
      ? (
          approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          approvedReviews.length
        ).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Student Reviews Moderation
            </h1>
          </div>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Review submissions queue, testimonial approval workflows, and program rating curation.
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

          {import.meta.env.DEV && reviews.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedSampleReviews}
              className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-300 hover:bg-amber-500 hover:text-black font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              <span>Seed Test Reviews</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8D9FA4]">Average Program Rating</div>
            <div className="font-serif text-2xl font-bold text-white mt-1 flex items-center gap-1.5">
              <span>{averageRating}</span>
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-[10px] text-emerald-400 mt-1">
              Based on {approvedReviews.length} approved review{approvedReviews.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8D9FA4]">Pending Moderation Queue</div>
            <div className="font-serif text-2xl font-bold text-amber-400 mt-1">
              {pendingReviews.length}
            </div>
            <div className="text-[10px] text-[#8D9FA4] mt-1">Awaiting approval or feedback review</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8D9FA4]">Total Submissions</div>
            <div className="font-serif text-2xl font-bold text-white mt-1">{reviews.length}</div>
            <div className="text-[10px] text-[#8D9FA4] mt-1">Across all published cohorts</div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['all', 'pending', 'approved', 'hidden'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#0E2024] text-[#8D9FA4] hover:text-white border border-[#1A373E]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8D9FA4] whitespace-nowrap">Cohort:</span>
          <select
            value={selectedProgramFilter}
            onChange={(e) => setSelectedProgramFilter(e.target.value)}
            className="rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="">All Programs</option>
            {programs.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedReviewIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          <span className="font-semibold">
            {selectedReviewIds.length} review{selectedReviewIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => bulkModerateMutation.mutate('approved')}
              disabled={bulkModerateMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold h-7"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              <span>Bulk Approve</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkModerateMutation.mutate('hidden')}
              disabled={bulkModerateMutation.isPending}
              className="border-amber-500/40 text-amber-200 text-xs h-7"
            >
              <EyeOff className="h-3.5 w-3.5 mr-1" />
              <span>Bulk Hide</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedReviewIds([])}
              className="border-amber-500/30 text-amber-300 hover:text-white text-xs h-7"
            >
              <span>Deselect</span>
            </Button>
          </div>
        </div>
      )}

      {isError && (
        <div className="space-y-2">
          <ErrorDetailsAlert
            title="Failed to Load Reviews"
            error={error}
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Reviews Table */}
      <div className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={reviews.length > 0 && selectedReviewIds.length === reviews.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-[#1A373E] bg-[#0E2024] text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="py-3 px-4 font-semibold">Student & Program</th>
                <th className="py-3 px-4 font-semibold">Rating</th>
                <th className="py-3 px-4 font-semibold">Review Content</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A373E]/50 text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8D9FA4]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading reviews queue...</span>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8D9FA4]">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-50 text-amber-500" />
                    <div className="font-semibold text-white">No reviews found</div>
                    <div className="text-[11px] mt-1">
                      Student reviews appear here after cohort completion.
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#0E2024]/40 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedReviewIds.includes(r.id)}
                        onChange={() => handleToggleReview(r.id)}
                        className="rounded border-[#1A373E] bg-[#0E2024] text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{r.student_name}</div>
                      <div className="text-[11px] text-[#8D9FA4] flex items-center gap-1 mt-0.5">
                        <BookOpen className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{r.program_title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-[#1A373E]'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      {r.title && <div className="font-semibold text-white mb-0.5">{r.title}</div>}
                      <p className="text-[#8D9FA4] line-clamp-2 text-xs leading-relaxed">{r.body}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          r.status === 'approved'
                            ? 'teal'
                            : r.status === 'pending'
                            ? 'amber'
                            : 'neutral'
                        }
                        className={`text-[10px] capitalize ${
                          r.status === 'pending' ? 'text-amber-300 border-amber-500/40' : ''
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D9FA4] whitespace-nowrap">
                      {formatDateIST(r.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              moderateMutation.mutate({ reviewId: r.id, status: 'approved' })
                            }
                            disabled={moderateMutation.isPending}
                            className="h-7 px-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-black text-[11px]"
                            title="Approve Review"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            <span>Approve</span>
                          </Button>
                        )}

                        {r.status !== 'hidden' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              moderateMutation.mutate({ reviewId: r.id, status: 'hidden' })
                            }
                            disabled={moderateMutation.isPending}
                            className="h-7 px-2 border-[#1A373E] text-[#8D9FA4] hover:text-white text-[11px]"
                            title="Hide Review"
                          >
                            <EyeOff className="h-3 w-3 mr-1" />
                            <span>Hide</span>
                          </Button>
                        )}

                        {profile?.role === 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewToDelete(r);
                              setDeleteModalOpen(true);
                            }}
                            className="h-7 px-2 border-rose-900/40 text-rose-400 hover:bg-rose-500 hover:text-white text-[11px]"
                            title="Permanently Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (Admin Only) */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-rose-900/40 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Permanently Delete Review</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Are you sure you want to permanently delete this student review? This action is logged in the audit history and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3">
            <div className="rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 text-xs space-y-1">
              <div>
                Student: <span className="text-white font-semibold">{reviewToDelete?.student_name}</span>
              </div>
              <div>
                Program: <span className="text-white font-semibold">{reviewToDelete?.program_title}</span>
              </div>
              <div className="text-[#8D9FA4] italic pt-1">"{reviewToDelete?.body}"</div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => deleteMutation.mutate(reviewToDelete.id)}
              disabled={deleteMutation.isPending}
              className="text-xs"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Confirm Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviewsPage;
