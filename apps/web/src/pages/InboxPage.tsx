import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  useAuth,
  Button,
  ErrorDetailsAlert,
  AnnouncementBanner,
  AnnouncementInboxCard,
} from '@abrainoconscious/ui';
import {
  fetchInbox,
  markItemAsRead,
  markAllItemsAsRead,
  type InboxItem,
} from '@abrainoconscious/shared';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Radio,
} from 'lucide-react';

export const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { supabase, user } = useAuth();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'announcements' | 'live'>('all');
  const [dismissedBannerIds, setDismissedBannerIds] = useState<Set<string>>(new Set());

  // 1. Fetch inbox items
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<InboxItem[]>({
    queryKey: ['student-inbox-items', user?.id],
    queryFn: () => fetchInbox(supabase),
    enabled: Boolean(user),
    staleTime: 1000 * 30,
  });

  // 2. Realtime subscription + Tab visibility & 60s fallback polling
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('student-inbox-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['student-unread-counts'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['student-unread-counts'] });
        }
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['student-unread-counts'] });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const polling = setInterval(() => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['student-unread-counts'] });
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      clearInterval(polling);
    };
  }, [user, supabase, refetch, queryClient]);

  // Mark single item read mutation
  const readItemMutation = useMutation({
    mutationFn: async (item: InboxItem) => {
      await markItemAsRead(supabase, { id: item.id, item_type: item.item_type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-inbox-items'] });
      queryClient.invalidateQueries({ queryKey: ['student-unread-counts'] });
    },
  });

  // Mark all read mutation
  const markAllMutation = useMutation({
    mutationFn: async () => {
      await markAllItemsAsRead(supabase);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-inbox-items'] });
      queryClient.invalidateQueries({ queryKey: ['student-unread-counts'] });
    },
  });

  const handleItemClick = (item: InboxItem) => {
    if (!item.is_read) {
      readItemMutation.mutate(item);
    }
    if (item.cta_url) {
      if (item.cta_url.startsWith('http')) {
        window.open(item.cta_url, '_blank', 'noopener,noreferrer');
      } else {
        navigate(item.cta_url);
      }
    }
  };

  // Urgent and Pinned Banners
  const activeBanners = items.filter(
    (item) => (item.is_pinned || item.kind === 'urgent') && !dismissedBannerIds.has(item.id)
  );

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'unread') return !item.is_read;
    if (activeFilter === 'announcements') return item.item_type === 'announcement';
    if (activeFilter === 'live') {
      return (
        item.title.toLowerCase().includes('live') ||
        item.body.toLowerCase().includes('live') ||
        (item.cta_label && item.cta_label.toLowerCase().includes('live'))
      );
    }
    return true;
  });

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-4">
      <Helmet>
        <title>Naman's Announcements & Inbox | ABrainoConscious</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-500" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Announcements & Inbox
            </h1>
          </div>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Real-time updates, daily live call links, and cohort announcements directly from Naman.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              Mark all read
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs text-[#8D9FA4] hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Urgent or Pinned Banners */}
      {activeBanners.length > 0 && (
        <div className="space-y-3">
          {activeBanners.map((banner) => (
            <AnnouncementBanner
              key={banner.id}
              title={banner.title}
              body={banner.body}
              kind={banner.kind}
              ctaLabel={banner.cta_label}
              ctaUrl={banner.cta_url}
              isPinned={banner.is_pinned}
              onClose={() =>
                setDismissedBannerIds((prev) => new Set([...prev, banner.id]))
              }
              onCtaClick={() => handleItemClick(banner)}
            />
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-[#1A373E]">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-amber-500/20 text-amber-400 font-bold'
              : 'text-[#8D9FA4] hover:text-white'
          }`}
        >
          All ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('unread')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
            activeFilter === 'unread'
              ? 'bg-amber-500/20 text-amber-400 font-bold'
              : 'text-[#8D9FA4] hover:text-white'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.2 font-mono text-[9px] font-bold text-black">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('announcements')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            activeFilter === 'announcements'
              ? 'bg-amber-500/20 text-amber-400 font-bold'
              : 'text-[#8D9FA4] hover:text-white'
          }`}
        >
          Announcements
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('live')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors flex items-center gap-1 ${
            activeFilter === 'live'
              ? 'bg-red-500/20 text-red-400 font-bold'
              : 'text-[#8D9FA4] hover:text-white'
          }`}
        >
          <Radio className="h-3 w-3" />
          <span>Live Links</span>
        </button>
      </div>

      {/* Error state */}
      {isError && (
        <ErrorDetailsAlert
          title="Unable to load inbox"
          error={error}
        />
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#081619] border border-[#1A373E] p-4 space-y-2">
              <div className="h-4 w-1/3 rounded bg-[#0E2024]" />
              <div className="h-3 w-3/4 rounded bg-[#0E2024]" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-12 text-center space-y-3">
          <CheckCheck className="h-10 w-10 text-emerald-400 mx-auto stroke-1" />
          <h3 className="font-serif text-lg font-bold text-white">All Caught Up!</h3>
          <p className="text-xs text-[#8D9FA4] max-w-sm mx-auto">
            {activeFilter === 'unread'
              ? 'No unread messages. Check back later for live call announcements from Naman.'
              : 'No announcements matching this filter.'}
          </p>
        </div>
      ) : (
        /* Items List */
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <AnnouncementInboxCard
              key={item.id}
              title={item.title}
              body={item.body}
              kind={item.kind}
              ctaLabel={item.cta_label}
              ctaUrl={item.cta_url}
              publishAt={item.created_at}
              isPinned={item.is_pinned}
              isRead={item.is_read}
              onRead={() => handleItemClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InboxPage;
