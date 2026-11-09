# Architectural & Design Decisions (Step 1)
## ABrainoConscious Platform

---

## 1. Monorepo Scaffold & Tech Stack Architecture

- **Package Manager:** `pnpm` workspace v12 with `pnpm-workspace.yaml` isolating apps and shared packages.
- **Applications:**
  - `apps/landing` (Port 5175): Public marketing and conversion surface (`abrainoconcious.com`).
  - `apps/web` (Port 5173): Student portal with library, watch player, and community (`app.abrainoconcious.com`).
  - `apps/admin` (Port 5174): Creator control room for Naman (`admin.abrainoconcious.com`).
- **Packages:**
  - `packages/ui`: Shared React component library built with Tailwind CSS and Radix UI primitives.
  - `packages/shared`: Shared TypeScript types, Zod schemas, typed env loaders, and formatting utilities.
- **Services & Database:**
  - `services/video`: Placeholder README and ops specifications for the VPS Docker Compose stack (tusd, Fastify, FFmpeg, BullMQ, Redis, Caddy).
  - `supabase/`: Configured for upcoming database migrations and Edge Functions in Step 2.
- **Port Allocation:** Root script `pnpm dev` concurrently launches all three applications on their assigned ports (5173, 5174, 5175).

---

## 2. Image Pipeline Architecture (`pnpm images`)

- **Sharp Idempotent Engine:** Reads raw photographs from `assets/photos/` without modifying originals.
- **No Upscaling Rule:** Original source images (`logo.jpg` and `naman-header.jpg`) are 1280 × 720 px. Renditions are generated at 480px and 960px. Renditions at 1600px and 2400px are excluded to prevent artificial pixel interpolation and blurring.
- **Dual Next-Gen Formats:** Each rendition is encoded into both `AVIF` (effort 4, quality 75) and `WebP` (quality 80), keeping outputs under ~65 KB.
- **Instant Blur-Up Placeholders:** Each photo generates an embedded base64 WebP micro-thumbnail (~20px wide) directly into `generated-images.ts` and `index.json`, providing zero layout shift (CLS).
- **Public Mirroring:** Script automatically synchronizes generated images into each app's `public/img` directory for instantaneous static loading in development and production builds.

---

## 3. Visual System & The Hybrid Design Blend

Following `docs/design-research/`, the UI combines the strengths of Peterson Academy and Art of Conversation:
1. **Peterson Academy Influence:**
   - Cinematic base palette: Near-black teal (`#040C0E`), surface layers (`#081619`, `#0E2024`, `#152B30`).
   - Content presentation: Horizontal scrolling content rails with snap-scroll and arrows, 1-10 ranked Trending poster cards (`2:3` aspect ratio), generous vertical whitespace.
2. **Art of Conversation Influence:**
   - Emotional storytelling: Alternating warm cream paper bands (`#F7F4EB` background, `#EFECE1` cards) for the 6-panel everyday struggle stories and the 5 "Let's talk about YOU" empathy questions.
   - Conversion mechanics: 4 numbered how-it-works steps, numbered module cards (`01`, `02`, `03`), and persistent mobile `StickyCtaBar` appearing when users scroll past the hero.
3. **Naman Brand Chromatic Anchor:**
   - Primary Accent: Sampled saffron-amber (`#F5871F` / `#E87A00`) directly from Naman's circular logo badge, used for all primary CTAs, active badges, and focus rings.

---

## 4. Brand Copy & Audience Assumptions

- **Audience:** Indian students (university, competitive exams) and early-career professionals feeling mental fatigue, procrastination, and self-doubt, supplemented by global diaspora seekers.
- **Voice Guidelines:** The warm, honest mentor-friend. Grounded, conversational, calm, and jargon-free. Strictly no fake urgency, ticking red timer gimmicks, or guilt-tripping shame narratives.
- **Headline Choice:**
  - Selected Option 1: *"Master your mind, emotions, studies and habits — with a friend in your corner."*
  - Rationale: Transparently sets expectations across all four pillars while positioning Naman as a supportive, accessible mentor rather than an untouchable guru.
- **Claims Guardrails & Crisis Protocol:**
  - Strictly educational self-development platform; explicitly not clinical psychotherapy or psychiatric care.
  - No guaranteed exam marks, rank outcomes, or salary promises.
  - Emergency helplines (Tele-MANAS `14416`, KIRAN `1800-599-0019`) integrated into landing footer, web app `/support`, and emotional course headers. (Flagged for Naman to verify before launch).

---

## 5. Self-Hosted Video & Anti-Piracy Sizing Assumptions

- **Content Sizing:** 12 hours of launch content across 360p, 480p, and 720p HLS renditions requires ~25 GB of encrypted segment storage, plus ~50 GB for incoming raw video buffers.
- **Bandwidth Consumption:** 100 students completing a 12-hour 720p course consume ~1.3 TB monthly transfer.
- **Target Infrastructure:** Ubuntu 24.04 VPS with 4 vCPUs, 8 GB RAM, 200 GB+ NVMe SSD, and 4 TB+ monthly transfer (India/Singapore datacenter).
- **Security Boundaries:** Encrypted AES-128 HLS with tokenized key distribution, 1 active stream limit per account, segment download rate limiting (3-4x real time), and dynamic forensic watermarking with watermark session tracing.

---

## 6. Database Architecture & Protected Links Pattern (Step 2)

- **Protected Links by Design:**
  - `program_sessions` and `lessons` contain public metadata (title, description, timing, schedule, sort order).
  - Secret join URLs (`live_url`, `recording_url`) are stored exclusively in `session_links` (`session_id` FK).
  - Secret lesson media (`video_id`, `content_url`, `attachments`, `subtitles`) are stored exclusively in `lesson_media` (`lesson_id` FK).
  - Non-enrolled users and public visitors can query `program_sessions` and `lessons` without risk of leaking live Zoom/Meet/YouTube links or proprietary video IDs.
  - Access to `session_links` and `lesson_media` is strictly guarded by Row Level Security (RLS) calling `has_active_enrollment(program_id)` or `can_view_lesson(lesson_id)`.
- **Publishing Integrity Constraints:**
  - Enforced via database CHECK constraint:
    `CHECK (status != 'published' OR (price_paise IS NOT NULL AND thumbnail_url IS NOT NULL AND poster_image_url IS NOT NULL))`
  - Guarantees zero runtime visual bugs or missing card assets on the public landing page or web app library rails.
- **Single-Row `site_settings` Table:**
  - Primary key is boolean `id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true)`, guaranteeing exactly one platform configuration row.
- **Atomic Idempotent Enrollment (`grant_enrollment`):**
  - Stored procedure executes in a single serializable transaction: verifies order, records payment, creates unique enrollment (`user_id, program_id`), records coupon redemption, creates congratulatory student notification, and returns enrollment row. Safe against concurrent webhook delivery and repeated client redirects.
- **Role & Security Definer Functions:**
  - `is_admin()`, `is_staff_or_admin()`, `has_active_enrollment()`, `can_view_lesson()` set strict `search_path = public` to prevent search path hijacking.
  - Profile privilege elevation (`profiles.role`, `is_blocked`) and direct enrollment modifications are locked by triggers that disallow client updates. Only service role or verified admins can modify roles or enrollments.

---

## 7. Multi-Admin Seeding & Remote Safety (ADMIN_EMAILS)

- **Multiple Admins via Comma-Separated `ADMIN_EMAILS`:**
  - Transitioned the administrative seed script from a single `ADMIN_EMAIL` to a parsed, trimmed, lowercased, and de-duplicated list in `ADMIN_EMAILS`.
  - Maintained backward compatibility by falling back to `ADMIN_EMAIL` if `ADMIN_EMAILS` is missing or undefined.
- **Passwordless Admin Bootstrap:**
  - Seeded admin accounts are created with email confirmed and without initial passwords. Admins authenticate via secure Google OAuth or Supabase Magic Link, preventing static credential leaks.
  - Idempotent execution: if the auth user or admin profile already exists, no destructive updates are performed.
- **Remote Project Safety Guardrails:**
  - The seed script verifies that `SUPABASE_URL` matches the CLI linked project ref (`supabase/.temp/project-ref` or `supabase/.temp/linked-project.json`).
  - Refuses execution if a mismatch is detected to prevent accidental mutations against incorrect environments.
  - Requires explicit confirmation via `--yes` when executing against remote databases.
- **Zero Key Leakage:**
  - The script suppresses verbose intermediate logs and prints only a clean summary of emails and outcomes (`created`, `promoted`, `already admin`). Secret keys and passwords are never emitted.

---

## 8. Authentication & Multi-App Identity (Step 3)

- **Browser Supabase Client with PKCE Flow:**
  - Standardized on PKCE flow with persisted sessions and URL session detection across all web environments.
  - Subdomain isolation: `apps/web` uses `storageKey: 'sb-web-auth'`, while `apps/admin` uses `storageKey: 'sb-admin-auth'`. Prevents session bleeding or token contamination across subdomains.
- **Dynamic Cross-App URL Helpers:**
  - `getAppUrl()`, `getAdminUrl()`, and `getLandingUrl()` dynamically read `VITE_ROOT_DOMAIN`.
  - In development: returns `localhost:5173`, `5174`, and `5175`.
  - In production: returns `https://app.${ROOT_DOMAIN}`, `https://admin.${ROOT_DOMAIN}`, and `https://${ROOT_DOMAIN}`.
  - Eliminates hardcoded URLs everywhere, including landing page CTA buttons.
- **Strict Open-Redirect & Program Intent Preservation:**
  - Implemented `sanitizeRedirectPath` and `sanitizeProgramSlug` with hostile-input unit tests (blocking `//evil.com`, `/\evil.com`, `javascript:`, data URIs, and UNC paths).
  - Preserves intent across the entire journey: visitor clicks "Join" -> `?program=<slug>` is retained through signup, email confirmation, Google OAuth, and onboarding -> lands directly on `/programs/<slug>`.
- **Pre-Created Admin OAuth Preservation:**
  - Updated triggers `handle_new_user()` and `handle_user_updated()`: when an administrator pre-created via `seed:admin` signs in with Google for the first time, their existing `profiles.role = 'admin'` is strictly preserved and never downgraded to `student`. Verified via pgTAP test suite.
- **Admin Security Defenses:**
  - Immediate role verification in `RequireRole` and `AdminLoginPage`: non-admin / non-staff users are immediately presented with an unmistakable "Access Denied" screen, automatically signed out, and prohibited from rendering admin views.
  - 30-minute idle session timeout with a 28-minute advance warning modal (`useAdminIdleTimeout`).
  - Client-side login throttling after 5 consecutive failed attempts (60-second cooldown timer).
  - Optional TOTP authenticator MFA (AAL2) via Supabase MFA APIs.
- **Onboarding & Deletion Request Data Architecture:**
  - Added `onboarding_completed_at`, `terms_accepted_at`, `goal_pillars TEXT[]`, and `referral_source` to `profiles`.
  - Created `account_deletion_requests` table with strict RLS (students insert and read own requests; admins read and update).

## Step 4: Admin Shell & Programs Manager Architecture (2026-11-04)

- **Client-Side HTML5 Canvas Image Pipeline & Metadata Stripping:**
  - **Zero EXIF / Privacy Protection:** All uploaded program images are drawn onto an off-screen HTML5 2D canvas and re-encoded directly to WebP. This client-side canvas re-encoding inherently strips camera metadata, EXIF, and GPS location coordinates without requiring server-side binaries or external services.
  - **Responsive Multi-Density Renditions:** Generates 3 responsive widths (480w, 960w, 1600w for 16:9 thumbnail/cover; 320w, 640w, 1000w for 2:3 streaming poster) stored under clean paths in `program-images` bucket (`programs/{id}/{role}-{width}.webp`).
  - **Magic Bytes File Inspection:** Validates real binary headers (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF ... WEBP` for WebP) before canvas processing, rejecting renamed .exe files and malicious SVGs.
  - **Atomic Replacement Protocol:** When an asset is replaced, new files are uploaded first and verified before the database row is updated. Only after the row update succeeds are old storage paths deleted, preventing broken image URLs if network fails.
- **Publish Checklist & Guardrails:**
  - Client-side pre-flight checklist (`evaluatePublishChecklist`) checks title, unique slug, growth pillar category, 160-char short description, full description, valid price (or free), challenge schedule dates (ends_at > starts_at), thumbnail, poster, at least 3 learning outcomes, and at least 1 FAQ item.
  - Database constraint `check_published_program` acts as the ultimate gatekeeper, preventing any draft or invalid program from transitioning to `published`.
- **Admin Shell & Grouped Navigation:**
  - Clean grouped navigation with Core (Overview, Programs), Management (Sessions, Courses, Announcements, Students, Payments, Coupons), Site (Landing Editor, Community, Reviews), and System (Team & Roles, Settings, Anti-Piracy, Audit Log).
  - Role-based visibility: staff see reduced navigation (Team, Settings, and Audit Log are hidden from staff).
  - Mobile drawer support for 390px viewports.
  - Environment badges (`LOCAL`, `STAGING`, `PRODUCTION`) and `TEST MODE` banner prevent environment confusion.
- **Role Permissions & Audit Trail:**
  - Staff can view programs and edit drafts, but cannot delete programs, change prices on published programs, or publish without admin review.
  - PostgreSQL trigger `audit_programs` automatically captures all program operations (CREATE, UPDATE, DELETE) into the append-only `audit_log` table with full old/new diffs.
  - Dedicated read-only Audit Log dashboard for Super Admins.

---

## Step 5: Admin Live Sessions, Protected Links & Announcements Architecture (2026-11-05)

- **Protected Links Isolation & Zero-Leakage Guarantee:**
  - Non-secret metadata lives in `program_sessions` (title, description, IST schedule, status, platform, task title, task body, resources).
  - High-value secret join URLs (`live_url`, `recording_url`) live strictly in `session_links` (`session_id` FK).
  - Public visitors and non-enrolled students can browse curriculum schedules without ever selecting or leaking meeting links or video streams.
  - Row Level Security (RLS) on `session_links` allows student read access **only when all three conditions are satisfied**:
    1. Caller has an active enrollment (`has_active_enrollment(program_id)`).
    2. The live link has been formally published (`link_published_at IS NOT NULL`).
    3. Or the session has completed and the recording is marked visible (`recording_visible = true AND recording_url IS NOT NULL`).
- **Transactional RPC Synchronization (`upsert_session_with_links`):**
  - Session details and protected meeting links are updated inside a single PostgreSQL transaction function. If saving either `program_sessions` or `session_links` fails, the entire transaction rolls back, guaranteeing zero out-of-sync states.
- **Idempotent Fan-Out & Anti-Spam Deduplication (`publish_session_link`):**
  - When a live link is published with notification fan-out enabled, in-app notification rows are generated for all active enrollees.
  - Unique idempotency key `notification_dedupe_key` (`session_link:{sessionId}:{urlHash}:{userId}`) prevents spamming students if the publisher is clicked multiple times or network reconnects.
  - Modifying a previously published link prompts the creator: either update silently in-place without spamming, or force re-notify.
- **Scheduled Announcements Fan-Out via `pg_cron` (`fan_out_scheduled_announcements`):**
  - Announcements become visible to their audience based on `publish_at` and `expires_at` RLS windows automatically.
  - For in-app push notifications, a background SQL job runs every minute via `pg_cron` (with a safe exception fallback for cloud environments requiring dashboard extension enablement).
  - A manual "Run Fan-Out Now" RPC is provided for immediate testing.
- **2-Hour Missing Link Early Warning System:**
  - Optimized database index on `program_sessions (scheduled_at, status) WHERE status = 'scheduled'`.
  - When any upcoming challenge session begins in less than 2 hours and lacks a published live link, an unmistakable warning banner appears across all admin pages with a one-click jump to the link publisher.
- **Rate Limiting & Safety Guardrails:**
  - Database safety trigger blocks empty announcement bodies and caps bodies at 50,000 characters.
  - Creator rate limiting enforced: maximum 20 announcements per hour per creator account.

### Step 5 Bug Fixes & Resiliency Updates (2026-11-05)

- **Audit Log Column Alignment (`actor_id` vs `actor`):**
  - Resolved PostgreSQL runtime error 42703 (`column "actor" of relation "audit_log" does not exist`) across all Step 5 RPCs (`upsert_session_with_links`, `publish_session_link`, `fan_out_scheduled_announcements`, `generate_challenge_schedule`, `shift_challenge_schedule`) and the announcement safety trigger `check_announcement_safety_and_rate_limit()`.
  - Column name aligned to `actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL` as defined in the core schema (`20261031000005_content_and_audit.sql`).
- **PostgREST RPC Function Parity & Overload Resolution:**
  - Added `save_session_with_links` and unified its 16-parameter signature (`p_program_id`, `p_day_number`, `p_title`, `p_scheduled_at`, `p_session_id`, `p_description`, `p_live_platform`, `p_status`, `p_task_title`, `p_task_body`, `p_resources`, `p_live_url`, `p_recording_url`, `p_recording_visible`, `p_is_link_published`, `p_notify_enrollees`).
  - Dropped obsolete 15-parameter overload of `upsert_session_with_links` to prevent PostgREST `PGRST203` ambiguous candidate function rejections.
- **Tiptap Link Extension Conflict Resolution:**
  - In `RichTextEditor.tsx`, configured `StarterKit.configure({ link: false })` to resolve `[tiptap warn]: Duplicate extension names found: ['link']`, ensuring only the customized `Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } })` is active.
- **Transparent Technical Error Disclosure (`ErrorDetailsAlert`):**
  - Replaced generic and obfuscated error handling (`err instanceof Error ? err.message : '...'` which rendered `[object Object]` for PostgREST errors) with `extractAppError()` and `<ErrorDetailsAlert />`.
  - Directly displays PostgreSQL error codes (`42703`, `23505`, `P0001`), messages, details, and hints behind an expandable "Show details" accordion across sessions, schedule generation, shift, duplicate, and announcement forms.
- **IST Schedule Math & Calender Boundary Correctness:**
  - Scheduling engine operates natively in Indian Standard Time (`Asia/Kolkata`, UTC+5:30).
  - Schedule generation across month transitions (e.g. Oct 31 -> Nov 1) and leap years (Feb 28/29 -> Mar 1) uses UTC-normalized day offsets to prevent timezone drifts.

---

## Step 6: Student App Shell, Home, Library, Public Preview & Checkout Summary Architecture (2026-11-06)

- **Zero-Downtime Public Data Layer & RPC Fallback Strategy:**
  - Designed public data layer in `packages/shared/src/catalog.ts` (`fetchCatalog`, `fetchTrendingPrograms`, `fetchProgramPublicDetail`, `fetchPublicStats`).
  - Calls high-performance PostgreSQL RPCs (`get_catalog`, `get_trending_programs`, `get_program_public`).
  - To respect user deployment boundaries ("Do not run db:push; I will."), calls seamlessly fall back to direct Supabase PostgREST table queries (`programs`, `program_sessions`, `course_sections`, `lessons`, `reviews`) if Postgres reports `PGRST202` (function not yet migrated).
  - Both paths strictly select public non-sensitive columns, guaranteeing that `session_links` (`live_url`, `recording_url`) and `lesson_media` (`video_id`, `content_url`) are NEVER queried or leaked.
- **Client-Side Auth Singletons & Rendering Lifecycle:**
  - Supabase client is maintained as a strict module-level singleton in `packages/shared/src/supabase.ts` with dedicated storage key `sb-web-auth`.
  - Auth resolution is non-blocking: data components never invoke blocking awaits inside `onAuthStateChange`. Session state is fully resolved by `AuthProvider` before child queries fire.
- **Transparent Technical Error Disclosure (`ErrorDetailsAlert`):**
  - All catalog and program queries use `<ErrorDetailsAlert />` to surface PostgreSQL/PostgREST codes and messages transparently behind a development toggle, paired with calm user-facing inline retry buttons.
- **Accessible & Responsive Student Shell (`StudentLayout`):**
  - Integrated skip-to-content accessibility link targeting `#main-content`.
  - Top navigation includes brand logo, desktop links (Explore, My Programs, Community), quick search, support link, empty-state notification bell dropdown, and user menu dropdown with avatar initials.
  - Fixed mobile bottom navigation with Home, Explore, My Programs, Inbox, and Profile/Login.
- **Privacy-Friendly Lazy Video Trailer Loading:**
  - YouTube/Vimeo promo trailers load zero third-party tracking cookies or scripts upon page load.
  - Video iframes load via `youtube-nocookie.com` only after an explicit click on the poster preview.
- **Two-Way URL Filter Synchronization:**
  - Library (`/explore`) synchronizes all filter states (`category`, `search`, `type`, `price`, `sort`, `view`) bidirectionally with browser search params.
  - URLs can be shared, bookmarked, or refreshed without losing active filter criteria.
- **Step 7 Payment Isolation:**
  - `/checkout/:slug` enforces authentication (`RequireAuth`), displays transparent order breakdowns with Indian Rupee formatting (`formatPaise`), GST disclosures, a coupon placeholder, and an anti-piracy terms checkbox.
  - Payment execution is intentionally disabled with clear developer notice that Razorpay Checkout.js will be activated in Step 7.

---

## Step 8: Enrolled Student Experience & Admin Students Directory (2026-11-07)

- **Protected Live Links On-Demand & Temporal Join Window:**
  - Strict zero-leakage guarantee: `live_url` and `recording_url` live exclusively in the `session_links` table (protected by RLS requiring staff/admin role).
  - Enrolled students NEVER receive meeting URLs on initial page load, nor are meeting URLs rendered in HTML/DOM.
  - Links are resolved on demand via SECURITY DEFINER RPC `get_session_link(p_session_id)` when the student explicitly clicks "Join Live".
  - Temporal Join Window: Link is accessible only from 60 minutes prior to `scheduled_at` until 6 hours after `scheduled_at` (or immediately if `status = 'live'`). Outside this window, a calm branded modal informs the student of the exact IST opening time (`opens_at`) with a countdown.
  - Meeting links always open programmatically in a new browser tab with strict `window.open(url, '_blank', 'noopener,noreferrer')` isolation.
  - Clicking "Join Live" automatically and idempotently logs student attendance in `session_attendance` (`joined_at = NOW()`).
- **4-Step Daily Growth Checklist & Roadmap Journey:**
  - Active cohort challenge page (`/programs/:slug`) switches to Enrolled Journey Mode:
    1. *Watch*: Daily video lesson & contemplation.
    2. *Do Today's Task*: Interactive daily exercise toggle (`complete_task` RPC / `task_completions` table).
    3. *Attend Live Call*: Next session card with IST time, countdown, platform badge, and Join Live button.
    4. *Community Circle*: One-click transition to peer discussions.
  - Interactive full cohort roadmap displaying session numbers, titles, scheduled IST times, attendance checkmarks, task checkmarks, and recording launch buttons.
  - Certificate of Completion Milestone widget tracking $\ge$ 80% attendance + task completion.
  - Revoked access state: If an enrollment is revoked, students see a calm, dignified "Your Cohort Access Has Ended" notice.
- **My Programs Sanctuary (`/my-programs`):**
  - Welcome celebration card appears upon redirect with `?welcome=<slug>`.
  - Grouped cohort sections: Live Now (pulsing badge), Today's Sessions (IST timing), In Progress (progress rings), Upcoming, and Completed.
- **Home Page Hero Dynamic Replacement (`/`):**
  - Replaces generic marketing hero for enrolled students with Live Now session or Next Session countdown, and renders "Your Active Programs" rail above discovery rows.
- **Real-Time Inbox & Push Notifications (`/inbox`):**
  - Real-time Supabase WebSocket channel (`student-inbox-feed`) listening to PostgreSQL CDC changes on `announcements` and `notifications`.
  - Background resilience: tab visibility change triggers refetch, paired with a 60-second fallback polling interval.
  - Category filters: All, Unread, Announcements, Live Links.
  - Top header bell icon and mobile navigation bar reflect synchronized unread counts.
- **Payments On-Hold & Priority Interest Waitlist:**
  - In compliance with project boundaries (Razorpay on hold), paid checkouts render the primary CTA as disabled: `PAYMENTS OPEN VERY SOON` with note `Admissions Opening Very Soon`.
  - Priority interest registration captures email and optional phone (`payment_interest` table with localStorage fallback).
  - Free programs (`price_paise = 0`) enroll atomically via `enrollInFreeProgram` (`enroll_free` RPC) and route to `/my-programs?welcome=<slug>`.
- **Admin Students Directory & Access Controls (`/students`):**
  - Directory table supporting student search across name, email, phone, and UUID.
  - Manual enrollment modal allowing staff to enroll any student profile in any program with custom expiry dates and instant welcome notifications (`admin_enroll` RPC).
  - Access revocation dialog with optional administrative reason (`admin_revoke_enrollment` RPC).







