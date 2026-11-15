import { z } from 'zod';

export const GrowthPillarEnum = z.enum(['emotional', 'mental', 'academic', 'personal']);
export const UserRoleEnum = z.enum(['admin', 'staff', 'student']);
export const ProgramTypeEnum = z.enum(['challenge', 'course']);
export const ProgramStatusEnum = z.enum(['draft', 'published', 'live', 'completed', 'archived']);
export const SessionStatusEnum = z.enum(['scheduled', 'live', 'ended']);
export const LivePlatformEnum = z.enum(['zoom', 'meet', 'youtube', 'other']);
export const EnrollmentStatusEnum = z.enum(['active', 'refunded', 'revoked']);
export const EnrollmentSourceEnum = z.enum(['paid', 'manual', 'coupon_free']);
export const OrderStatusEnum = z.enum(['created', 'paid', 'failed', 'refunded']);
export const DiscountTypeEnum = z.enum(['percent', 'flat']);
export const AnnouncementKindEnum = z.enum(['info', 'success', 'warning', 'urgent']);
export const AnnouncementAudienceEnum = z.enum(['all', 'program', 'user']);
export const VideoStatusEnum = z.enum(['uploading', 'queued', 'transcoding', 'ready', 'failed']);

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  role: UserRoleEnum.default('student'),
  goal_tag: z.string().nullable().optional(),
  is_blocked: z.boolean().default(false),
  last_seen_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Program Schema
export const ProgramSchema = z.object({
  id: z.string().uuid(),
  type: ProgramTypeEnum,
  category: GrowthPillarEnum,
  title: z.string().min(1),
  slug: z.string().min(1),
  short_description: z.string(),
  description: z.string(),
  cover_image_url: z.string().nullable().optional(),
  cover_image_alt: z.string().nullable().optional(),
  poster_image_url: z.string().nullable().optional(),
  poster_image_alt: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  thumbnail_alt: z.string().nullable().optional(),
  promo_video_url: z.string().nullable().optional(),
  price_paise: z.number().int().nonnegative(),
  compare_at_price_paise: z.number().int().nonnegative().nullable().optional(),
  status: ProgramStatusEnum.default('draft'),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  enrollment_deadline: z.string().datetime().nullable().optional(),
  max_seats: z.number().int().positive().nullable().optional(),
  is_featured: z.boolean().default(false),
  is_trending_pinned: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  tags: z.array(z.string()).default([]),
  what_you_will_learn: z.array(z.string()).default([]),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  deleted_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Program Session Schema
export const ProgramSessionSchema = z.object({
  id: z.string().uuid(),
  program_id: z.string().uuid(),
  day_number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  scheduled_at: z.string().datetime(),
  live_platform: LivePlatformEnum.default('zoom'),
  status: SessionStatusEnum.default('scheduled'),
  task_title: z.string().nullable().optional(),
  task_body: z.string().nullable().optional(),
  resources: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Session Link Schema (Protected URL)
export const SessionLinkSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  live_url: z.string().url().nullable().optional(),
  recording_url: z.string().url().nullable().optional(),
  link_published_at: z.string().datetime().nullable().optional(),
  link_published_by: z.string().uuid().nullable().optional(),
  recording_visible: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Coupon Schema
export const CouponSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  discount_type: DiscountTypeEnum,
  value: z.number().int().positive(),
  max_uses: z.number().int().positive().nullable().optional(),
  used_count: z.number().int().nonnegative().default(0),
  per_user_limit: z.number().int().positive().default(1),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime().nullable().optional(),
  applicable_program_ids: z.array(z.string().uuid()).nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Order Schema
export const OrderSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  program_id: z.string().uuid().nullable().optional(),
  bundle_id: z.string().uuid().nullable().optional(),
  razorpay_order_id: z.string().nullable().optional(),
  amount_paise: z.number().int().nonnegative(),
  discount_paise: z.number().int().nonnegative().default(0),
  coupon_id: z.string().uuid().nullable().optional(),
  status: OrderStatusEnum.default('created'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Payment Schema
export const PaymentSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  razorpay_payment_id: z.string().nullable().optional(),
  razorpay_signature: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  amount_paise: z.number().int().nonnegative(),
  status: z.string().default('captured'),
  raw_payload: z.record(z.unknown()).default({}),
  captured_at: z.string().datetime().nullable().optional(),
  refunded_amount_paise: z.number().int().nonnegative().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Announcement Schema
export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  kind: AnnouncementKindEnum.default('info'),
  audience: AnnouncementAudienceEnum.default('all'),
  program_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  cta_label: z.string().nullable().optional(),
  cta_url: z.string().nullable().optional(),
  is_pinned: z.boolean().default(false),
  publish_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable().optional(),
  fanned_out_at: z.string().datetime().nullable().optional(),
  is_draft: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Step 5 Form & RPC Schemas
export const SaveSessionRpcPayloadSchema = z.object({
  p_program_id: z.string().uuid('Please select a valid challenge program'),
  p_day_number: z.number().int().positive('Day number must be positive'),
  p_title: z.string().trim().min(1, 'Session title is required'),
  p_scheduled_at: z.string().datetime({ message: 'Valid scheduled ISO timestamp required' }),
  p_session_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  p_description: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  p_live_platform: LivePlatformEnum.default('zoom'),
  p_status: SessionStatusEnum.default('scheduled'),
  p_task_title: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  p_task_body: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  p_resources: z
    .array(
      z.object({
        title: z.string().min(1, 'Resource title required'),
        url: z.string().url('Resource URL must be valid'),
      })
    )
    .default([]),
  p_live_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))
    .refine((val) => !val || val.startsWith('https://'), {
      message: 'Live URL must start with https://',
    }),
  p_recording_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))
    .refine((val) => !val || val.startsWith('https://'), {
      message: 'Recording URL must start with https://',
    }),
  p_recording_visible: z.boolean().default(false),
  p_is_link_published: z.boolean().default(false),
  p_notify_enrollees: z.boolean().default(false),
});

export type SaveSessionRpcPayload = z.infer<typeof SaveSessionRpcPayloadSchema>;

export const GenerateScheduleRpcPayloadSchema = z.object({
  p_program_id: z.string().uuid('Please select a valid challenge program'),
  p_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  p_daily_time_ist: z.string().min(1, 'Daily time is required'),
  p_total_days: z.number().int().min(1, 'At least 1 day required').max(100, 'Maximum 100 days'),
  p_overwrite: z.boolean().default(false),
});

export type GenerateScheduleRpcPayload = z.infer<typeof GenerateScheduleRpcPayloadSchema>;

export const AnnouncementPayloadSchema = z.object({
  title: z.string().trim().min(1, 'Announcement title is required').max(200, 'Title exceeds 200 characters'),
  body: z.string().trim().min(1, 'Announcement body cannot be empty').max(50000, 'Body exceeds 50,000 characters'),
  kind: AnnouncementKindEnum.default('info'),
  audience: AnnouncementAudienceEnum.default('all'),
  program_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  user_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  cta_label: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  cta_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => !v || v.startsWith('https://') || v.startsWith('/'), {
      message: 'CTA URL must start with https:// or /',
    }),
  is_pinned: z.boolean().default(false),
  publish_at: z.string().datetime({ message: 'Valid publish_at ISO timestamp required' }),
  expires_at: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  is_draft: z.boolean().default(false),
});

export type AnnouncementPayload = z.infer<typeof AnnouncementPayloadSchema>;

export const SessionEditorFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  day_number: z.number().int().positive('Day number must be positive'),
  scheduled_at: z.string().min(1, 'Scheduled date and time are required'),
  live_platform: LivePlatformEnum.default('zoom'),
  status: SessionStatusEnum.default('scheduled'),
  description: z.string().optional().nullable(),
  task_title: z.string().optional().nullable(),
  task_body: z.string().optional().nullable(),
  resources: z.array(z.object({
    title: z.string().min(1, 'Resource title required'),
    url: z.string().url('Must be a valid URL starting with https://')
  })).default([]),
  live_url: z.string().url('Must be a valid URL').startsWith('https://', 'Live URL must start with https://').optional().or(z.literal('')).nullable(),
  recording_url: z.string().url('Must be a valid URL').startsWith('https://', 'Recording URL must start with https://').optional().or(z.literal('')).nullable(),
  recording_visible: z.boolean().default(false),
  is_link_published: z.boolean().default(false),
});

export type SessionEditorFormData = z.infer<typeof SessionEditorFormSchema>;

export const ScheduleGeneratorFormSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  daily_time_ist: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm (24hr)'),
  total_days: z.number().int().min(1, 'At least 1 day').max(100, 'Maximum 100 days'),
  overwrite: z.boolean().default(false),
});

export type ScheduleGeneratorFormData = z.infer<typeof ScheduleGeneratorFormSchema>;

export const AnnouncementComposerFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title exceeds 200 characters'),
  body: z.string().min(1, 'Body is required').max(50000, 'Body exceeds 50,000 characters'),
  kind: AnnouncementKindEnum.default('info'),
  audience: AnnouncementAudienceEnum.default('all'),
  program_id: z.string().uuid().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  cta_label: z.string().max(50, 'CTA label too long').optional().nullable(),
  cta_url: z.string().url('Must be a valid URL').optional().or(z.literal('')).nullable(),
  is_pinned: z.boolean().default(false),
  publish_now: z.boolean().default(true),
  publish_at: z.string().optional(),
  expires_at: z.string().optional().nullable(),
  is_draft: z.boolean().default(false),
});

export type AnnouncementComposerFormData = z.infer<typeof AnnouncementComposerFormSchema>;

// Site Settings Schema
export const SiteSettingsSchema = z.object({
  id: z.literal(true),
  brand_name: z.string().default('ABrainoConscious'),
  support_email: z.string().email().default('support@abrainoconscious.com'),
  support_whatsapp: z.string().nullable().optional(),
  gst_number: z.string().nullable().optional(),
  legal_text: z.string().nullable().optional(),
  maintenance_mode: z.boolean().default(false),
  razorpay_mode: z.enum(['test', 'live']).default('test'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ==========================================
// Step 3: Authentication & Onboarding Schemas
// ==========================================

export const IndianPhoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;

export const SignupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name (at least 2 characters)')
    .max(100, 'Full name must be under 100 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Please accept the Terms of Service and Privacy Policy to continue',
    }),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Please enter your password'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const MagicLinkSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),
});

export type MagicLinkInput = z.infer<typeof MagicLinkSchema>;

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(8, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ReferralSourceEnum = z.enum(['youtube', 'instagram', 'friend', 'other']);
export type ReferralSource = z.infer<typeof ReferralSourceEnum>;

export const OnboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name')
    .max(100),
  phone: z
    .string()
    .trim()
    .regex(IndianPhoneRegex, 'Please enter a valid 10-digit Indian phone number (+91)'),
  goalPillars: z
    .array(GrowthPillarEnum)
    .min(1, 'Please select at least one growth pillar to work on'),
  referralSource: ReferralSourceEnum,
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export const ProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must have at least 2 characters')
    .max(100),
  phone: z
    .string()
    .trim()
    .regex(IndianPhoneRegex, 'Please enter a valid 10-digit Indian phone number (+91)')
    .optional()
    .or(z.literal('')),
  goalPillars: z.array(GrowthPillarEnum).optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(8, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const AccountDeletionRequestSchema = z.object({
  reason: z.string().trim().max(500, 'Reason must be under 500 characters').optional(),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'Please check the box to confirm your deletion request',
  }),
});

export type AccountDeletionRequestInput = z.infer<typeof AccountDeletionRequestSchema>;

// ============================================================================
// Program Form Schema (Admin Step 4)
// ============================================================================

export const ProgramFormSchema = z
  .object({
    title: z
      .string({ required_error: 'Please enter a title for your program.' })
      .trim()
      .min(3, 'Title must be at least 3 characters.')
      .max(100, 'Title cannot exceed 100 characters.'),
    slug: z
      .string({ required_error: 'Please enter a unique URL slug.' })
      .trim()
      .min(2, 'Slug must be at least 2 characters.')
      .max(80, 'Slug cannot exceed 80 characters.')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. 21-day-mindset).'),
    type: ProgramTypeEnum,
    category: GrowthPillarEnum,
    short_description: z
      .string({ required_error: 'Please enter a short description.' })
      .trim()
      .min(10, 'Short description must be at least 10 characters.')
      .max(160, 'Short description cannot exceed 160 characters for card previews.'),
    description: z
      .string({ required_error: 'Please enter a detailed program description.' })
      .trim()
      .min(10, 'Full description must be at least 10 characters.'),
    price_rupees: z
      .number({ invalid_type_error: 'Please enter a valid price in Rupees.' })
      .nonnegative('Price cannot be negative.')
      .default(0),
    compare_at_price_rupees: z
      .number({ invalid_type_error: 'Please enter a valid original price.' })
      .nonnegative('Original price cannot be negative.')
      .nullable()
      .optional(),
    is_free: z.boolean().default(false),
    max_seats: z
      .number()
      .int('Seats must be a whole number.')
      .positive('Max seats must be greater than zero.')
      .nullable()
      .optional(),
    starts_at: z.string().nullable().optional(),
    ends_at: z.string().nullable().optional(),
    enrollment_deadline: z.string().nullable().optional(),
    tags: z.array(z.string()).default([]),
    what_you_will_learn: z.array(z.string()).default([]),
    faq: z
      .array(
        z.object({
          q: z.string().trim().min(1, 'Question cannot be blank.'),
          a: z.string().trim().min(1, 'Answer cannot be blank.'),
        })
      )
      .default([]),
    promo_video_url: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+$/i.test(val);
        },
        { message: 'Please provide a valid YouTube or Vimeo trailer link.' }
      ),
    thumbnail_url: z.string().nullable().optional(),
    thumbnail_alt: z.string().trim().nullable().optional(),
    thumbnail_srcset: z.record(z.string()).nullable().optional(),
    poster_image_url: z.string().nullable().optional(),
    poster_image_alt: z.string().trim().nullable().optional(),
    poster_srcset: z.record(z.string()).nullable().optional(),
    cover_image_url: z.string().nullable().optional(),
    cover_image_alt: z.string().trim().nullable().optional(),
    cover_srcset: z.record(z.string()).nullable().optional(),
    status: ProgramStatusEnum.default('draft'),
    is_featured: z.boolean().default(false),
    is_trending_pinned: z.boolean().default(false),
    sort_order: z.number().int().default(0),
  })
  .refine(
    (data) => {
      if (typeof data.compare_at_price_rupees === 'number' && data.compare_at_price_rupees > 0) {
        return data.compare_at_price_rupees > data.price_rupees;
      }
      return true;
    },
    {
      message: 'Original compare-at price must be higher than the current price.',
      path: ['compare_at_price_rupees'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'challenge' && data.starts_at && data.ends_at) {
        return new Date(data.ends_at).getTime() > new Date(data.starts_at).getTime();
      }
      return true;
    },
    {
      message: 'Challenge end date must be after the start date.',
      path: ['ends_at'],
    }
  );

export type ProgramFormValues = z.infer<typeof ProgramFormSchema>;

// ============================================================================
// Step 9: Administrative Business Schemas
// ============================================================================

// 1. Coupon Form Schema
export const CouponFormSchema = z
  .object({
    code: z
      .string({ required_error: 'Coupon code is required.' })
      .trim()
      .min(3, 'Code must be at least 3 characters.')
      .max(30, 'Code cannot exceed 30 characters.')
      .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores.')
      .transform((val) => val.toUpperCase()),
    discount_type: z.enum(['percent', 'flat'], {
      required_error: 'Please select a discount type.',
    }),
    value: z
      .number({ invalid_type_error: 'Please enter a valid numeric value.' })
      .positive('Discount value must be greater than zero.'),
    max_uses: z
      .number({ invalid_type_error: 'Max uses must be a number.' })
      .int('Must be a whole number.')
      .positive('Max uses must be positive.')
      .nullable()
      .optional(),
    per_user_limit: z
      .number({ invalid_type_error: 'Per user limit must be a number.' })
      .int('Must be a whole number.')
      .positive('Per user limit must be at least 1.')
      .default(1),
    valid_from: z.string({ required_error: 'Start date is required.' }),
    valid_until: z.string().nullable().optional(),
    applicable_program_ids: z.array(z.string().uuid()).default([]),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.discount_type === 'percent') {
        return data.value >= 1 && data.value <= 100;
      }
      return true;
    },
    {
      message: 'Percentage discount must be between 1% and 100%.',
      path: ['value'],
    }
  )
  .refine(
    (data) => {
      if (data.valid_from && data.valid_until) {
        return new Date(data.valid_until).getTime() >= new Date(data.valid_from).getTime();
      }
      return true;
    },
    {
      message: 'Expiry date must be on or after the start date.',
      path: ['valid_until'],
    }
  );

export type CouponFormValues = z.infer<typeof CouponFormSchema>;

// 2. Block/Unblock Student Schema
export const BlockStudentSchema = z
  .object({
    user_id: z.string().uuid('Valid student ID required.'),
    is_blocked: z.boolean(),
    reason: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.is_blocked) {
        return !!data.reason && data.reason.length >= 3;
      }
      return true;
    },
    {
      message: 'A clear reason (at least 3 characters) is required when suspending an account.',
      path: ['reason'],
    }
  );

export type BlockStudentInput = z.infer<typeof BlockStudentSchema>;

// 3. Deletion Request Resolution Schema
export const DeletionRequestResolutionSchema = z.object({
  request_id: z.string().uuid(),
  status: z.enum(['processing', 'completed', 'rejected']),
  admin_note: z.string().trim().optional(),
});

export type DeletionRequestResolutionInput = z.infer<typeof DeletionRequestResolutionSchema>;

// 4. Helpline Entry Schema
export const HelplineEntrySchema = z.object({
  name: z.string().trim().min(1, 'Helpline name is required.'),
  number: z.string().trim().min(1, 'Phone or dial code is required.'),
  hours: z.string().trim().default('24/7'),
  region: z.string().trim().default('India (National)'),
  verified: z.boolean().default(false),
});

export type HelplineEntry = z.infer<typeof HelplineEntrySchema>;

// 5. Site Settings Form Schema
export const SiteSettingsFormSchema = z.object({
  // Brand Tab
  brand_name: z.string().trim().min(1, 'Brand name cannot be blank.').default('ABrainoConscious'),
  logo_url: z.string().nullable().optional(),
  favicon_url: z.string().nullable().optional(),
  support_email: z.string().trim().email('Please enter a valid support email address.'),
  support_whatsapp: z.string().trim().nullable().optional(),
  social_links: z
    .object({
      youtube: z.string().trim().default(''),
      instagram: z.string().trim().default(''),
      twitter: z.string().trim().default(''),
      linkedin: z.string().trim().default(''),
    })
    .default({ youtube: '', instagram: '', twitter: '', linkedin: '' }),
  channel_subscriber_count: z.number().int().nonnegative().default(0),

  // Business Tab
  gst_enabled: z.boolean().default(false),
  gst_number: z.string().trim().nullable().optional(),
  gst_rate_percent: z.number().min(0).max(100).default(18),
  invoice_details: z
    .object({
      company_name: z.string().trim().default('ABrainoConscious'),
      address: z.string().trim().default(''),
      city: z.string().trim().default(''),
      state: z.string().trim().default(''),
      pincode: z.string().trim().default(''),
      pan: z.string().trim().default(''),
    })
    .default({ company_name: 'ABrainoConscious', address: '', city: '', state: '', pincode: '', pan: '' }),
  currency_display: z.string().default('INR'),

  // Legal Pages Tab
  terms_html: z.string().default(''),
  privacy_html: z.string().default(''),
  refund_policy_html: z.string().default(''),
  medical_disclaimer_html: z.string().default(''),

  // Support Helplines Tab
  support_helplines: z.array(HelplineEntrySchema).default([]),

  // Sessions Tab
  allowed_live_link_hosts: z.array(z.string().trim()).default(['zoom.us', 'meet.google.com', 'youtube.com', 'youtu.be']),
  live_link_join_window_before_minutes: z.number().int().min(0).max(180).default(15),
  live_link_join_window_after_minutes: z.number().int().min(15).max(720).default(120),
  default_daily_session_time: z.string().default('19:00'),

  // Site / Security Tab
  maintenance_mode: z.boolean().default(false),
  idle_timeout_minutes: z.number().int().min(5).max(120).default(30),
});

export type SiteSettingsFormValues = z.infer<typeof SiteSettingsFormSchema>;

// 6. Team Member Action Schemas
export const AddTeamMemberSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').transform((e) => e.toLowerCase()),
  role: z.enum(['admin', 'staff'], { required_error: 'Role is required.' }),
});

export type AddTeamMemberInput = z.infer<typeof AddTeamMemberSchema>;

export const ChangeTeamRoleSchema = z.object({
  user_id: z.string().uuid(),
  new_role: z.enum(['admin', 'staff', 'student']),
});

export type ChangeTeamRoleInput = z.infer<typeof ChangeTeamRoleSchema>;

export const RemoveTeamMemberSchema = z.object({
  user_id: z.string().uuid(),
});

export type RemoveTeamMemberInput = z.infer<typeof RemoveTeamMemberSchema>;




