export type GrowthPillar = 'emotional' | 'mental' | 'academic' | 'personal';

export interface PillarInfo {
  id: GrowthPillar;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  accentColor: string;
}

export const PILLARS: Record<GrowthPillar, PillarInfo> = {
  emotional: {
    id: 'emotional',
    title: 'Emotional Resilience',
    tagline: 'Quiet inner stability',
    description: 'Overcoming anxiety, handling loneliness, processing self-doubt, and finding calm self-compassion.',
    iconName: 'HeartHandshake',
    accentColor: '#38BDF8'
  },
  mental: {
    id: 'mental',
    title: 'Mental Clarity',
    tagline: 'Sharp focus, quiet thoughts',
    description: 'Breaking through brain fog and overthinking, mastering mental models, and cultivating deep presence.',
    iconName: 'Brain',
    accentColor: '#A78BFA'
  },
  academic: {
    id: 'academic',
    title: 'Academic Mastery',
    tagline: 'Retain more, stress less',
    description: 'Active recall systems, conquering exam pressure, beating procrastination, and structured study habits.',
    iconName: 'GraduationCap',
    accentColor: '#34D399'
  },
  personal: {
    id: 'personal',
    title: 'Personal Momentum',
    tagline: 'Habits that stick',
    description: 'Daily discipline architecture, authentic self-confidence, clear career direction, and purpose.',
    iconName: 'Sparkles',
    accentColor: '#F5871F'
  }
};

export type PillarCategory = GrowthPillar;

export const CATEGORY_LABELS: Record<PillarCategory, string> = {
  emotional: 'Emotional Resilience',
  mental: 'Mental Clarity',
  academic: 'Academic Mastery',
  personal: 'Personal Momentum',
};

export type ProgramType = 'challenge' | 'course';
export type ProgramStatus = 'draft' | 'published' | 'live' | 'completed' | 'archived';

export type ImageSrcSetMap = Record<string, string>; // e.g. { "480": "url", "960": "url", "1600": "url" }

export interface ProgramFaqItem {
  question: string;
  answer: string;
}

export interface Program {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  type: ProgramType;
  category: GrowthPillar;
  tags: string[];
  thumbnailUrl: string;
  thumbnailAlt?: string;
  thumbnailSrcset?: ImageSrcSetMap;
  posterImageUrl: string;
  posterImageAlt?: string;
  posterSrcset?: ImageSrcSetMap;
  coverImageUrl?: string;
  coverImageAlt?: string;
  coverSrcset?: ImageSrcSetMap;
  promoVideoUrl?: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  status: ProgramStatus;
  startsAt?: string;
  endsAt?: string;
  enrollmentDeadline?: string;
  maxSeats?: number;
  enrolledCount?: number;
  isFeatured?: boolean;
  isTrendingPinned?: boolean;
  sortOrder?: number;
  whatYouWillLearn?: string[];
  faq?: ProgramFaqItem[];
  lessonsCount?: number;
  durationHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'student' | 'staff' | 'admin';
  goalTag?: GrowthPillar;
}

export interface Helpline {
  name: string;
  number: string;
  hours: string;
  description: string;
  verified: boolean;
}

export const CRISIS_HELPLINES: Helpline[] = [
  {
    name: 'Tele-MANAS (Govt. of India)',
    number: '14416 / 1800-891-4416',
    hours: '24x7 Toll-Free',
    description: 'National tele-mental health programme providing free, confidential psychological counselling.',
    verified: false // verify before launch as required
  },
  {
    name: 'KIRAN Helpline',
    number: '1800-599-0019',
    hours: '24x7',
    description: 'Ministry of Social Justice 24/7 mental health rehabilitation helpline.',
    verified: false
  },
  {
    name: 'Vandrevala Foundation',
    number: '+91 9999 666 555',
    hours: '24x7 Free',
    description: 'Mental health support and suicide prevention counseling in multiple Indian languages.',
    verified: false
  }
];

// Helper Frontend Types
export interface SessionWithLink {
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
  live_url?: string | null;
  recording_url?: string | null;
  link_published_at?: string | null;
  link_published_by?: string | null;
  recording_visible?: boolean;
}

export interface ProgramWithSessions extends Program {
  sessions: SessionWithLink[];
}

export interface EnrolledProgram {
  program_id: string;
  type: ProgramType;
  category: GrowthPillar;
  title: string;
  slug: string;
  short_description: string;
  thumbnail_url: string | null;
  thumbnail_alt: string | null;
  poster_image_url: string | null;
  poster_image_alt: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  status: ProgramStatus;
  starts_at: string | null;
  ends_at: string | null;
  enrollment_status: 'active' | 'refunded' | 'revoked';
  enrolled_at: string;
  access_until: string | null;
  total_sessions: number;
  attended_sessions: number;
  total_lessons: number;
  completed_lessons: number;
}

export interface LessonWithMedia {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  duration_seconds: number;
  thumbnail_url: string | null;
  is_free_preview: boolean;
  is_published: boolean;
  release_at: string | null;
  video_id?: string | null;
  content_url?: string | null;
  attachments?: Array<{ title: string; url: string }>;
}

import type { Database } from './database.types';

export type UserRole = Database['public']['Enums']['user_role'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type AccountDeletionRequest = Database['public']['Tables']['account_deletion_requests']['Row'];
export type AccountDeletionRequestInsert = Database['public']['Tables']['account_deletion_requests']['Insert'];

export type ProgramRow = Database['public']['Tables']['programs']['Row'];
export type ProgramInsert = Database['public']['Tables']['programs']['Insert'];
export type ProgramUpdate = Database['public']['Tables']['programs']['Update'];

export type LivePlatform = Database['public']['Enums']['live_platform'];
export type SessionStatus = Database['public']['Enums']['session_status'];
export type AnnouncementKind = Database['public']['Enums']['announcement_kind'];
export type AnnouncementAudience = Database['public']['Enums']['announcement_audience'];
export type AnnouncementComputedStatus = 'draft' | 'scheduled' | 'live' | 'expired';

export type ProgramSessionRow = Database['public']['Tables']['program_sessions']['Row'];
export type ProgramSessionInsert = Database['public']['Tables']['program_sessions']['Insert'];
export type ProgramSessionUpdate = Database['public']['Tables']['program_sessions']['Update'];

export type SessionLinkRow = Database['public']['Tables']['session_links']['Row'];
export type SessionLinkInsert = Database['public']['Tables']['session_links']['Insert'];
export type SessionLinkUpdate = Database['public']['Tables']['session_links']['Update'];

export type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];
export type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert'];
export type AnnouncementUpdate = Database['public']['Tables']['announcements']['Update'];

export type AnnouncementReadRow = Database['public']['Tables']['announcement_reads']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// Step 6: Catalog & Public Program Detail Types
export interface CatalogItem {
  id: string;
  type: ProgramType;
  category: GrowthPillar;
  title: string;
  slug: string;
  short_description: string;
  description?: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_srcset?: ImageSrcSetMap | null;
  poster_image_url: string | null;
  poster_image_alt: string | null;
  poster_srcset?: ImageSrcSetMap | null;
  thumbnail_url: string | null;
  thumbnail_alt: string | null;
  thumbnail_srcset?: ImageSrcSetMap | null;
  promo_video_url?: string | null;
  price_paise: number;
  compare_at_price_paise: number | null;
  status: ProgramStatus;
  starts_at: string | null;
  ends_at: string | null;
  enrollment_deadline: string | null;
  max_seats: number | null;
  seats_left?: number | null;
  is_featured?: boolean;
  is_trending_pinned?: boolean;
  sort_order?: number;
  tags?: string[];
  what_you_will_learn?: string[] | null;
  faq?: ProgramFaqItem[] | null;
  total_sessions?: number;
  total_lessons?: number;
  is_enrolled?: boolean;
  rank?: number;
  created_at?: string;
}

export interface CatalogResult {
  items: CatalogItem[];
  total_count: number;
}

export interface PublicSessionItem {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  scheduled_at: string;
  live_platform: 'zoom' | 'meet' | 'youtube' | 'other';
  status: 'scheduled' | 'live' | 'ended';
  task_title: string | null;
  task_body: string | null;
  resources?: Array<{ title: string; url: string }>;
}

export interface PublicLessonItem {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  duration_seconds: number;
  is_free_preview: boolean;
  release_at: string | null;
}

export interface PublicModuleItem {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: PublicLessonItem[];
}

export interface PublicReviewItem {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  student_name: string;
}

export interface RatingSummary {
  average_rating: number;
  review_count: number;
}

export interface ProgramPublicDetail extends CatalogItem {
  sessions: PublicSessionItem[];
  modules: PublicModuleItem[];
  reviews: PublicReviewItem[];
  rating_summary: RatingSummary;
  related_programs: CatalogItem[];
}

export interface PublicStats {
  students: number;
  programs: number;
  lessons: number;
  hours: number;
}

export interface CatalogFilterParams {
  search?: string;
  type?: 'all' | 'challenge' | 'course';
  category?: 'all' | GrowthPillar;
  status?: string;
  priceFilter?: 'all' | 'free' | 'paid' | 'under_1000';
  sort?: 'sort_order' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
  limit?: number;
  offset?: number;
}

// ============================================================================
// Step 8: Enrolled Student Dashboard, Live Link & Inbox Types
// ============================================================================

export interface EnrolledSession extends PublicSessionItem {
  attended: boolean;
  task_completed: boolean;
  has_recording: boolean;
  has_live_link: boolean;
}

export interface EnrolledProgramStats {
  total_sessions: number;
  attended_sessions: number;
  completed_tasks: number;
  progress_pct: number;
}

export interface StudentEnrollmentInfo {
  id: string;
  status: 'active' | 'revoked' | 'refunded' | string;
  enrolled_at: string;
  access_until: string | null;
  source: string;
}

export interface EnrolledProgramDetail {
  is_enrolled: boolean;
  enrollment?: StudentEnrollmentInfo;
  program: ProgramPublicDetail;
  sessions: EnrolledSession[];
  today_session: EnrolledSession | null;
  stats: EnrolledProgramStats;
}

export interface NextSessionMeta {
  id: string;
  day_number: number;
  title: string;
  scheduled_at: string;
  live_platform: 'zoom' | 'meet' | 'youtube' | 'other' | string;
  status: 'scheduled' | 'live' | 'ended' | string;
}

export interface MyProgramItem {
  enrollment_id: string;
  program_id: string;
  title: string;
  slug: string;
  type: ProgramType;
  category: GrowthPillar;
  short_description: string;
  cover_image_url: string | null;
  poster_image_url: string | null;
  thumbnail_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  program_status: ProgramStatus;
  enrolled_at: string;
  access_until: string | null;
  source: string;
  status: string;
  total_sessions: number;
  completed_sessions: number;
  progress_pct: number;
  next_session: NextSessionMeta | null;
  is_live_now: boolean;
  has_today_session: boolean;
}

export interface SessionLinkResult {
  ok: boolean;
  reason?: 'unauthenticated' | 'not_enrolled' | 'not_published' | 'too_early' | 'ended' | 'not_found' | string;
  live_url?: string;
  platform?: string;
  title?: string;
  opens_at?: string;
  scheduled_at?: string;
}

export interface SessionRecordingResult {
  ok: boolean;
  reason?: 'unauthenticated' | 'not_enrolled' | 'no_recording' | 'not_found' | string;
  recording_url?: string;
  title?: string;
}

export interface InboxItem {
  id: string;
  item_type: 'announcement' | 'notification';
  kind: 'info' | 'success' | 'warning' | 'urgent';
  title: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  is_pinned: boolean;
  created_at: string;
  is_read: boolean;
}

export interface UnreadCounts {
  unread_announcements: number;
  unread_notifications: number;
  total_unread: number;
}

export interface PaymentInterestPayload {
  program_id: string;
  email: string;
  phone?: string;
}





