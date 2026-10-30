# Antigravity Master Prompt v2: ABrainoConscious Platform

Save this whole document as `docs/SPEC.md` in the repo. Every build step tells Antigravity to read it first. It supersedes v1.

---

## 0. ROLE AND GOAL

You are a senior full-stack engineer and product designer. Build a production-ready, three-surface platform for **ABrainoConscious**, a creator brand run by **Naman**: a public landing page, a student app, and an admin panel where Naman controls everything without touching code.

Work in steps. After each step: run the app, fix errors, summarise what was built, list anything I must configure manually (keys, dashboard settings), then stop and wait. Never leave placeholder logic or fake data in finished features. Ask me nothing unless truly blocked; make sensible decisions and record them in `DECISIONS.md`.

## 1. PRODUCT OVERVIEW

- **abrainoconcious.com**: the public landing page. Story-led, premium, built to convert visitors into students
- **app.abrainoconcious.com**: the student app. Browse, pay, join live sessions, watch courses, get messages from Naman
- **admin.abrainoconcious.com**: private dashboard for Naman and invited staff. Create challenges and courses, publish the daily live link, send announcements, manage students, payments, coupons, content and the landing page itself

The domain spelling is configurable: use env var `ROOT_DOMAIN=abrainoconcious.com` everywhere, never hardcode it.

**The learner journey:** discover on the landing page, sign up, browse the library, join a challenge or buy a course through Razorpay, land on the app showing what they bought, open today's live link or the next video, do the daily task, read Naman's messages, earn badges, finish, get a certificate.

**Brand, audience and voice (applies to all copy, imagery and design; overrides any niche assumed elsewhere in this spec)**

- ABrainoConscious is a **YouTube channel and self-growth education platform** that helps people grow **emotionally, mentally, academically and personally**. The platform turns the channel's free content into structured live challenges and courses
- **Four growth pillars: Emotional, Mental, Academic, Personal.** Use them as the program category system (`programs.category` is one of `emotional | mental | academic | personal`, plus free-form tags), as the library chips and rows, as landing page sections, and as badge and quiz groupings
- **Audience (confirm with Naman):** mostly students and young professionals in India, many arriving from YouTube on a phone, plus a global audience. People who want clarity, confidence, focus and direction
- **Voice:** a warm, honest mentor-friend. Calm confidence, simple conversational English, light Hinglish only where it feels natural, never preachy, no hype, no fake urgency or countdown tricks, no shaming. Short sentences. Empathy first, then the way forward
- **Claims guardrails:** no medical or therapy claims, no promises of guaranteed results, income or grades. State clearly that programs are educational and not a substitute for professional mental-health care. Add this to the footer and to emotional-pillar program pages, and include an admin-editable 'Need support right now?' page listing crisis helplines (default for India: Tele-MANAS 14416; verify before launch)
- **Channel as proof:** the landing page carries a 'From the channel' section with featured YouTube videos (admin pastes links; embed with privacy-enhanced, lazy-loaded players), the subscriber count, a 'Start free' path (a free preview lesson or free challenge day), and links to the channel in the creator section. Allow only the YouTube embed domain in the landing page CSP for this
- **Story and empathy content** should reflect everyday struggles across the four pillars (exam pressure, overthinking, procrastination, self-doubt, loneliness, career confusion, building habits), told with respect and hope. The 'Let's talk about YOU' questions and the before-and-after story must be drawn from these
- **Imagery:** real people, warm natural light, calm and hopeful. Avoid clinical or medical looks and stock cliches such as lone silhouettes on mountains
- **Headline direction:** the promise is growth across all four pillars. Propose three headline and subhead options in `DESIGN.md` for Naman to pick from, and keep every line of copy editable from the admin panel

## 2. DESIGN BRIEF: A BLEND OF TWO REFERENCES

**References (study them, never copy them)**

Before designing anything, open both sites with the browser agent, scroll every section at desktop width and at a 390px mobile viewport, take screenshots, and record fonts, colours, spacing, section order, motion and CTA placement in `DESIGN.md`:

- https://petersonacademy.com/ : premium, cinematic, streaming-library feel
- https://www.artofconversation.in/ : story-led, relatable, conversion-focused single-program page

Do not copy their text, logos, illustrations, photos, badge art or code. Take structure, pacing and feel only. Every asset and line of copy is original to ABrainoConscious, and all copy must be editable from the admin panel.

**What we take from Peterson Academy**

- A dark, cinematic, near-black teal base (their theme colour is `#040c0e`), restrained and premium, generous spacing, large elegant headlines
- Landing sequence: hero with one big promise, one CTA and a trust line (money-back guarantee) -> stats strip (students, programs, lessons) -> a Trending rail of ranked poster cards (1 to 10) -> the creator section with a big portrait -> What's included showcase blocks -> community preview -> learning path with earnable badges -> testimonial quotes -> plans and pricing -> FAQ accordion -> sticky bottom Enroll bar on mobile
- Library: search, category chips, horizontal rows per category, poster cards with a Preview action, a preview panel with trailer, lesson count and instructor
- App feel: a streaming-style home with a hero banner, rows, progress rings on cards, and a minimal sign-in
- Learning tools: optional quizzes, progress tracking, badges for milestones, a community feed with private messages

**What we take from Art of Conversation**

- Story-led persuasion: a relatable before-and-after story told in illustrated panels, followed by a 'Let's talk about YOU' block of empathy questions the visitor silently answers yes to
- A 'How it works' section in four numbered steps (watch, do the exercise, attend live, practise in the community)
- A numbered module list (01, 02, 03...) with a short plain-language description each, in expandable cards
- A version timeline showing the program keeps improving and upgrades are free
- A creator bio with credentials and links to podcast, YouTube and Instagram
- Friendly conversational microcopy with Indian context, humour allowed and never cringe. A JOIN NOW button after every major section and a quiet 'Already a member? Login' link beside primary CTAs. An FAQ covering access duration, live vs self-paced, clearing doubts and free upgrades

**The blend: the ABrainoConscious look**

- Dark by default, with warm cream 'paper' bands on the landing page for the storytelling sections, so the page alternates between cinematic and warm. The student app supports light and dark
- Palette: near-black teal base, deep teal and charcoal surfaces, a warm amber or saffron accent for CTAs and highlights, off-white text. Fix exact values in `DESIGN.md` after studying the references
- Type: an elegant serif for headlines and numbers, a clean humanist sans for UI and body, no more than two families, loaded with good fallbacks
- Imagery: original illustrations and posters. Poster-style program cards (cover, title, lesson count, progress ring). Tasteful gradient fallbacks when no image is uploaded
- Motion: subtle, 200 to 300 ms, fade-and-rise on scroll, hover lift on rails, always respecting reduced-motion
- Mobile first: sticky bottom CTA bar on the landing page, bottom navigation in the app, large tap targets
- Accessibility: AA contrast even on dark, visible focus rings, keyboard navigation, captions-ready player
- The admin panel is cleaner and more utilitarian but shares the same tokens, in dark and light

## 3. TECH STACK (fixed)

- React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, Radix primitives
- Supabase: Postgres, Auth (email/password + Google OAuth), Row Level Security, Storage (images and attachments only), Realtime, Edge Functions (Deno)
- Razorpay (Orders API, Checkout.js, Webhooks), Resend for email, Vercel for the three web apps
- Self-hosted video service on our own VPS (section 11). No third-party video, streaming or DRM provider
- pnpm monorepo:

```
/apps/landing   -> abrainoconcious.com
/apps/web       -> app.abrainoconcious.com
/apps/admin     -> admin.abrainoconcious.com
/packages/ui    -> shared components, Tailwind preset, design tokens
/packages/shared-> types, Zod schemas, Supabase client factory, utils
/services/video -> self-hosted video stack (Docker)
/supabase       -> migrations, seed.sql, edge functions, config.toml
```

One Supabase project serves all apps. Generate TypeScript types from the schema.

## 4. AUTH AND ROLES

**Students (app):** email and password with email verification, forgot and reset password, magic link, Google OAuth through Supabase. A database trigger creates the `profiles` row. Onboarding collects name, phone (needed for Razorpay and contact) and a short 'what do you want to work on' choice.

**Admin:** separate login. Access only if `profiles.role` is `admin` or `staff`; anyone else sees access-denied and is signed out. Roles: `admin` (Naman, full access), `staff` (content and announcements, no payments, refunds, settings or roles), `student`. The first admin is set by a seed script from env `ADMIN_EMAIL`. Role changes only through an Edge Function that checks the caller is admin. Optional TOTP 2FA, session timeout, login rate limiting.

The apps live on separate subdomains, so each handles its own session. Configure redirect URLs for local, Vercel previews and production.

## 5. DATABASE SCHEMA (Postgres migrations)

UUID keys, `created_at` and `updated_at` triggers, enums for statuses, soft deletes where noted. Money is stored in **paise (integer)**, currency `INR`.

**People and access:** `profiles` (id = auth.users.id, full\_name, phone, avatar\_url, role, goal\_tag, is\_blocked, last\_seen\_at), `enrollments` (user\_id, program\_id, status `active | refunded | revoked`, payment\_id, enrolled\_at, access\_until, source `paid | manual | coupon_free`, unique(user\_id, program\_id))

**Catalogue:** `programs` (type `challenge | course`, title, slug, short\_description, description, cover\_image\_url, poster\_image\_url, promo\_video\_url, price\_paise, compare\_at\_price\_paise, status `draft | published | live | completed | archived`, starts\_at, ends\_at, enrollment\_deadline, max\_seats, is\_featured, is\_trending\_pinned, sort\_order, category, tags, what\_you\_will\_learn jsonb, faq jsonb, deleted\_at), `program_sessions` (program\_id, day\_number, title, description, scheduled\_at, live\_url, live\_platform `zoom | meet | youtube | other`, recording\_url, status `scheduled | live | ended`, task\_title, task\_body, resources jsonb), `course_sections`, `lessons`, `bundles`, `bundle_items` (see section 11 for video fields)

**Catalogue images:** `programs` has three admin-uploaded images: `thumbnail_url` (16:9 card image), `poster_image_url` (2:3 poster for rails and Trending) and `cover_image_url` (wide hero banner), each with an `*_alt` text column. `lessons`, `course_sections` and `bundles` also have an optional `thumbnail_url`. Images live in a Supabase Storage bucket `program-images` (public read, admin and staff write only, enforced by RLS).

**Commerce:** `orders` (user\_id, program\_id, razorpay\_order\_id unique, amount\_paise, discount\_paise, coupon\_id, status `created | paid | failed | refunded`), `payments` (order\_id, razorpay\_payment\_id unique, razorpay\_signature, method, amount\_paise, status, raw\_payload, captured\_at, refunded\_amount\_paise), `coupons` (code unique, discount\_type `percent | flat`, value, max\_uses, used\_count, per\_user\_limit, valid\_from, valid\_until, applicable\_program\_ids, is\_active), `webhook_events` (provider, event\_id unique, payload, processed\_at, error)

**Engagement:** `announcements` (title, body, kind `info | success | warning | urgent`, audience `all | program | user`, program\_id, user\_id, cta\_label, cta\_url, is\_pinned, publish\_at, expires\_at), `announcement_reads`, `notifications`, `lesson_progress`, `session_attendance`, `reviews`, `certificates`, `quizzes`, `quiz_questions`, `quiz_attempts` (optional quizzes per lesson or program), `badges` and `user_badges` (milestones such as first enrollment, 7-day streak, challenge completed), `posts`, `comments`, `post_likes` (community feed per program, admin-moderated)

**Site content (editable from admin):** `site_content` (key, jsonb value: hero, stats, story panels, empathy questions, how-it-works steps, version timeline, creator bio, plans copy, footer), `testimonials`, `faqs`, `site_settings` (brand name, logo, support email and WhatsApp, GST number, legal text, maintenance\_mode, razorpay\_mode)

**Operations:** `audit_log` (actor, action, entity, entity\_id, diff, ip), plus the video tables in section 11

## 6. ROW LEVEL SECURITY (critical)

Enable RLS on every table. Students read only their own profile, orders, payments, enrollments, notifications and progress. Published programs and landing content are publicly readable, but `live_url`, `recording_url`, lesson video data and attachments are readable **only with an active enrollment** (or for free-preview lessons), enforced in RLS or SECURITY DEFINER functions, not just the UI. Students can never write `enrollments`, `orders.status`, `payments` or `profiles.role`; only Edge Functions with the service role do. Admin and staff access go through `is_admin()` and `is_staff_or_admin()`. Write SQL or pgTAP tests proving a non-enrolled user cannot read a live link and a student cannot grant themselves access.

## 7. RAZORPAY PAYMENT FLOW (follow exactly)

Never trust the browser. Verify everything server-side.

1. Student clicks **Join** (must be logged in; otherwise login, then return to the same program)
2. Frontend calls Edge Function `create-order` with `program_id` and optional `coupon_code`
3. The function validates the program is joinable (published, before deadline, seats left), blocks duplicate enrollment, recomputes the price **on the server** including coupons, creates a Razorpay Order, inserts an `orders` row with status `created`, and returns `{ razorpay_order_id, amount, key_id }`. A final price of 0 skips Razorpay and enrolls directly
4. Frontend opens Razorpay Checkout.js with name, email and phone prefilled
5. On success the frontend sends `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` to Edge Function `verify-payment`
6. The function verifies the HMAC SHA256 signature (`order_id|payment_id` with the key secret), confirms with Razorpay's API that the payment is captured and the amount matches, then in **one transaction** marks the order paid, inserts the `payments` row, creates the `enrollment`, increments coupon use, creates a notification and queues a confirmation email. Idempotent
7. On success redirect to `https://app.${ROOT_DOMAIN}/my-programs?welcome=<slug>` showing a celebratory confirmation, the purchased program and its live link or first lesson
8. **Webhook backup:** `razorpay-webhook` verifies `X-Razorpay-Signature`, handles `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, and is idempotent through `webhook_events`, so a student who pays and closes the tab still gets access
9. Abandoned orders become `failed` after 30 minutes; failed payments show a clear retry screen
10. Admin can issue full or partial refunds, choosing whether to revoke access
11. Test and live modes by env var, with a visible TEST MODE banner in admin
12. Generate a downloadable invoice per payment using GST fields from settings

Secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) live only in Edge Function secrets. The client gets `RAZORPAY_KEY_ID` only.

## 8. PUBLIC LANDING PAGE (abrainoconcious.com)

Goal: convert visitors into students. Story-led, premium, fast. All text, images, FAQs and testimonials come from the database and are editable in the admin panel; programs, counts and prices are pulled live. Section order:

1. **Header:** logotype, Programs, About, FAQ, Login, and a primary Join button
2. **Hero:** large serif headline with one promise, a one-line subhead, a JOIN NOW button, a quiet 'Already a member? Login' link and a trust line (money-back guarantee). Cinematic dark background with subtle motion
3. **Stats strip:** students, programs, hours of content (live counts with editable fallbacks)
4. **Story band (cream paper):** a before-and-after story in about six illustrated panels with two original characters and a scenario relevant to Naman's niche. If the niche or tone is unclear, default to mindset and self-growth and note the assumption in `DECISIONS.md`. Create original illustrations in SVG, never reuse the references' art
5. **'Let's talk about YOU':** five or six empathy questions with an illustration, ending in a CTA
6. **Trending rail:** ranked poster cards of live programs with countdowns ('Starts in 3 days'), seats left and price
7. **How it works:** four numbered steps (watch, do the daily task, attend live, practise in the community)
8. **What's included:** showcase blocks for live sessions, daily tasks, the video player, community, certificates and installable mobile app
9. **Curriculum:** numbered module cards (01, 02, 03...) from the featured course, expandable
10. **Learning path and badges:** a preview of milestones students earn
11. **Creator section:** big portrait, bio, credentials and links to Naman's podcast, YouTube and Instagram
12. **Growth timeline:** how the program has evolved and that upgrades are free (optional, editable)
13. **Testimonials:** quotes and links to student videos
14. **Plans:** program price cards with compare-at price, guarantee badge and coupon hint
15. **FAQ accordion** and a **final CTA band**, then the footer (terms, refund policy, privacy, contact, social)

A JOIN NOW button follows every major section. On mobile, a sticky bottom Join bar appears after the hero. JOIN NOW goes to `app.${ROOT_DOMAIN}/signup?program=<slug>` and returns the student to that program after login. SEO: meta and Open Graph tags, JSON-LD, sitemap, prerendered key content, Lighthouse above 90.

## 9. STUDENT APP (app.abrainoconcious.com)

The library and program preview pages are public so visitors can look around. Login is required to pay.

- **Home:** a hero banner showing Live Now (with Join Live), or the Next Session with a countdown, or Continue Watching. Pinned announcement banner. Then rows: Live and Upcoming, Continue Learning, My Programs, Trending, Challenges, Courses, New. Poster cards show a progress ring if owned, or the price if not
- **Library:** search, category chips, filters (type, price, status), rows by category, purchased items clearly marked
- **Program page, preview mode:** trailer, promise, numbered expandable modules, schedule, what you will learn, creator, reviews, FAQ, seats left, price, coupon field, sticky Join bar. Live links, recordings and videos stay locked
- **Program page, enrolled mode:** a 'Your journey' four-step checklist (Watch, Do today's task, Attend live, Join the community), today's session card (title, time, countdown, **Join Live**, the daily task), full schedule with recordings, lessons with progress, resources and certificate progress
- **Player:** see section 11
- **Quizzes:** optional, after lessons, with saved results and retakes
- **Inbox and notifications:** Naman's announcements in real time, urgent ones as a banner and toast, a bell for new live links, 30-minute reminders and payment events
- **Community:** a feed per program with posts, comments, likes and report. Naman and staff are labelled. Admin moderates
- **Badges and streaks:** earned and locked states, such as first enrollment, 7-day streak and challenge completed
- **Orders and invoices, profile, certificates** with a public verify page `/verify/:code`, **reviews** after completion
- **Post-payment screen:** a celebratory confirmation showing the program and its live link or first lesson
- Join Live logs attendance, then opens the link in a new tab. Installable PWA with an offline shell, mobile-first throughout

## 10. ADMIN PANEL (admin.abrainoconcious.com)

Naman controls the entire platform from here.

- **Overview:** revenue (today, 7 days, 30 days, all time), signups, active enrollments, conversion, top programs, recent payments, sessions today, with a date-range filter
- **Programs manager:** create, edit, duplicate, publish, unpublish, archive. Rich text, image upload (cover and poster), pricing, seats, dates, FAQ and 'what you will learn' builders, pin to Trending, preview as student
- **Daily Live Link control (most important):** a prominent 'Today's session' widget. Paste the link, set time, title and the day's task, hit **Publish**, and it appears instantly on enrolled students' dashboards. Bulk-schedule all days up front, edit after publishing, mark live or ended, add the recording later, optionally notify students. Warn if a session starts within 2 hours with no link
- **Course builder:** section 11
- **Announcements composer:** to everyone, one program or one student; type, button, pin, schedule, expiry, preview, read counts
- **Students:** searchable table, detail drawer (enrollments, payments, attendance, progress, devices), manual enroll or revoke, block, direct message, CSV export
- **Payments:** all orders, filters, refunds, failed list, reconcile with Razorpay, CSV export. **Coupons:** percent or flat with limits, expiry and targeting
- **Landing page editor:** edit every section in section 8 (hero, stats overrides, story panels, empathy questions, steps, creator bio, timeline, plans copy, footer), plus testimonials and FAQs, with live preview and a publish button
- **Community moderation, quizzes builder, badge settings, reviews, certificates, attendance reports**
- **Emails:** edit templates (welcome, receipt, session reminder), send a test
- **Team and roles** (admin only), **Settings** (brand, support contacts, legal pages, maintenance mode, GST, TEST MODE indicator), **Piracy and Sharing** page, **audit log**
- Every list has pagination, search, sort, bulk actions, and loading, empty and error states

## 11. COURSE PACKAGES, SELF-HOSTED VIDEO AND ANTI-PIRACY

A course is a **package**: many videos sold together for one price, watched only inside our own player. About 12 hours of video at launch. **All video is self-hosted. No third-party video host, streaming service or DRM provider.**

**Course builder**

- Naman creates a course, adds sections and uploads **multiple videos** per section with drag-and-drop bulk upload, resumable, with a progress bar per video
- Each video: status (`uploading`, `queued`, `transcoding`, `ready`, `failed`), title, description, thumbnail, optional subtitles (SRT or VTT), attachments, free-preview toggle
- Reorder by drag and drop, bulk rename, publish or hide a video, replace a file without losing progress, delete with confirmation
- Release: everything on purchase, or **drip** by day, week or fixed date. Videos added later appear automatically for existing buyers
- **One purchase unlocks the whole package**, with lifetime access or a set number of months. **Bundles** combine courses and challenges at one price through the same Razorpay flow
- Per-video analytics: views, watch time, completion, drop-off

**Course thumbnails and images (admin)**

- Naman uploads the course **thumbnail** (16:9), **poster** (2:3) and an optional wide **hero banner** while packaging the course, from the course builder and the programs manager, using the shared `ImageUploader`: drag-and-drop or file picker, crop to the required ratio with zoom and reposition, JPG, PNG or WebP up to 10 MB
- A live preview shows exactly how the image will look on a rail card, the Trending poster, the landing page, the program page and the mobile app, so he can adjust before saving
- Alt text field per image. Replace or remove at any time. If no image is uploaded, show a tasteful generated gradient with the course title so nothing ever looks broken
- Upload goes to the `program-images` bucket. An Edge Function validates the real file type (magic bytes, not just the extension), strips EXIF and location metadata, and creates optimised AVIF and WebP versions at several widths with a blur placeholder. All apps render images through the shared `Img` component. Updating an image busts the cache so changes show immediately
- Each video, section and bundle can also have its own thumbnail: upload one, or pick from 3 frames auto-extracted at transcode time. The default is the first extracted frame
- A course cannot be published without a thumbnail and a poster (the publish checklist flags missing images)

**Self-hosted video server**

- `/services/video` is a Docker Compose stack on our own VPS at `video.${ROOT_DOMAIN}`: Caddy (automatic HTTPS), tusd (resumable uploads), Node/Fastify `video-api`, BullMQ + Redis, FFmpeg workers. Do not use Supabase Storage for video
- **Sizing for `DECISIONS.md`:** 12 hours on a 360p/480p/720p ladder is roughly 25 GB, plus originals, so plan 200 GB or more of SSD. One student watching everything at 720p pulls about 13 GB, so 100 students is about 1.3 TB. Recommend a VPS in or near India with 4 vCPU, 8 GB RAM and 4 TB or more monthly bandwidth. Show disk and estimated bandwidth in admin and email Naman at 80% disk
- **Upload:** Edge Function `create-video-upload` (admin only) creates the `videos` row and a short-lived upload token; the browser uploads straight to the video server with tus (2 files in parallel, mp4 mov mkv webm, size cap default 10 GB)
- **Processing:** on completion queue a job: `ffprobe`, thumbnail, FFmpeg to adaptive HLS (360p, 480p, 720p, 1080p only if the source has it), AAC audio, 6-second segments, **AES-128 encryption with a unique key per video**, master playlist. Report progress to the `videos` row for live display in admin. Retries, a Re-process button, optional deletion of originals
- **Storage:** originals, encrypted segments and keys live outside any public folder. Only `video-api` serves them through token-checked routes. No directory listing, no MP4 reachable by URL
- **Data:** `videos` (lesson\_id, original\_filename, size\_bytes, duration\_seconds, status, progress, renditions, thumbnail\_path, error), `video_keys` (key encrypted with `VIDEO_MASTER_KEY`, service role only), on `lessons`: `video_id`, `thumbnail_url`, `subtitles`, `release_at`, `is_published`; plus `course_sections`, `video_sessions`, `video_access_logs`, `piracy_flags`
- **Edge Functions:** `create-video-upload`, `get-playback`, `video-heartbeat`, `delete-video`. **Secrets:** `VIDEO_DOMAIN`, `VIDEO_TOKEN_SECRET` (shared by `get-playback` and `video-api`), `VIDEO_MASTER_KEY`, and the service role key for `video-api` only
- **Ops:** `docker-compose.yml` and a `setup.sh` for a fresh Ubuntu 24.04 VPS (firewall allowing only 80, 443 and key-only SSH, fail2ban, automatic security updates), health check, log rotation, daily backups of originals, keys and database to a destination Naman owns, and documented restore steps

**Protected player (student app)**

- Page `/courses/:slug/watch/:lessonId` with a curriculum sidebar (sections, completion ticks, locked items) and progress bar. Use `hls.js` with the token in an `Authorization` header; for native-HLS-only browsers use a short-lived signed token in the path (about 10 minutes, bound to user and device). Test on iPhone Safari, Android Chrome, desktop Chrome, Firefox, Safari and Edge
- Controls: play and pause, seek, 10-second skips, speed 0.5x to 2x, quality, subtitles, fullscreen, keyboard shortcuts, autoplay next, mark complete at 90%. Resume where left off (save position about every 10 seconds). Attachments and notes under each video
- No download button, `controlsList=nodownload`, Picture-in-Picture and remote playback disabled where the browser allows, right-click menu off

**Anti-piracy layers (implement every one)**

1. **Server-side access check.** `get-playback` verifies login, an active unexpired enrollment, and that the video is published and released (or a free preview), then returns a signed token (about 10 minutes) tied to user, video and device. The player refreshes it through `video-heartbeat`. Revoking access stops playback at the next heartbeat. No permanent URLs. Rate limit per user and IP
2. **Encrypted HLS with authenticated key delivery.** Per-video AES-128 keys are served only by a token-checked endpoint. Segments and playlists need a valid token. This blocks right-click saving, shared URLs and common downloaders (IDM, browser extensions, yt-dlp) without a valid session
3. **Anti-scraping.** Track segments per session. Cut off and flag sessions that pull far ahead of the playback position or faster than about 3 to 4 times real time. Rate limit by IP and token
4. **Watermark.** A moving, semi-transparent overlay with the student's name, partial email or phone and a unique watermark ID, changing position every few seconds. A `MutationObserver` and periodic checks pause playback and log a `piracy_flags` entry if it is removed, hidden or covered. Also burn Naman's brand logo in at transcode time. (Per-student forensic watermarking is a possible later upgrade)
5. **Device and session limits.** At most 2 devices per account and 1 active stream; a new stream ends the older one. Admin can see devices and force logout
6. **Account-sharing detection.** Flag many devices, IPs or cities in 24 hours; auto-pause at a configurable threshold and email Naman
7. **Origin locking.** The video server answers only requests from `app.${ROOT_DOMAIN}` (strict CORS, Origin and Referer checks, hotlink protection)
8. **Access logs** in `video_access_logs`, with segment counts aggregated per session
9. **Admin Piracy and Sharing page:** flagged users with evidence, warn, suspend or revoke, and a **watermark trace** tool that finds the account behind a leaked clip's watermark ID
10. **Legal layer.** Students accept terms forbidding recording and sharing at signup and checkout. Add a takedown template to the README

**Honest limits (put in the README):** self-hosted encrypted HLS is not studio-grade DRM (Widevine or FairPlay), which needs a licensed provider. A skilled paying student could still extract the stream from their own session, and nothing stops someone filming a screen with another phone. This setup blocks casual downloading and extensions, stops link and account sharing, and makes leaks traceable to an account. The playback layer can later be swapped for a DRM provider if needed.

**Acceptance tests**

- A non-enrolled user cannot get a token, playlist, segment or key, even by calling the video server or Edge Functions directly (401 or 403), and raw file paths return nothing
- An expired or refunded enrollment loses access at the next heartbeat; an admin revoke ends active streams within one heartbeat
- A non-enrolled student plays only free previews; an enrolled student sees all published lessons
- A token copied to another device, or used after expiry, stops working. Two simultaneous streams end the first
- A script fetching segments much faster than real time is cut off and flagged. Removing the watermark overlay pauses playback and logs a flag
- Uploading a 2 GB file, cutting the network and reconnecting resumes and completes. A 12-hour course processes to `ready` with live progress
- Load test: 50 concurrent viewers at 720p without buffering on the target VPS, result recorded in `DECISIONS.md`
- Adding a video to a purchased course shows it to existing students with no action

## 12. SCHEDULED JOBS

- Reminder notification and email 30 minutes before each session; alert Naman by email if a session starts in 2 hours with no link
- Expire stale orders, announcements and enrollments past `access_until`
- After completion: issue certificates, award badges and prompt for a review

## 13. SECURITY AND QUALITY

- Validate all input with Zod on client and Edge Functions; sanitise rich text with DOMPurify; rate limit sensitive functions; CORS limited to the app origins; CSP and security headers in `vercel.json`
- No secrets in the repo; `.env.example` per app and for functions; redirect URL allow-lists for localhost, previews and production
- Sentry-ready error hooks and structured logging in Edge Functions and `video-api`
- Accessibility AA, keyboard navigation, reduced motion. Performance: route-level code splitting, image optimisation, Lighthouse above 90 on landing and app
- Tests: unit tests for pricing, coupons and signature verification; integration tests for the payment flow in Razorpay test mode; one Playwright end-to-end test (signup, buy, see live link, watch a video)

## 14. BUILD STEPS

1. Scaffold, design study and design system
2. Database and RLS
3. Auth for both apps
4. Admin layout and programs manager
5. Admin daily live links and announcements
6. Student shell, library and program pages
7. Razorpay payments and redirect
8. My Programs, live links and inbox
9. Admin students, payments, coupons and refunds
10. Course builder and self-hosted video server
11. Protected player and anti-piracy
12. Quizzes, badges, community, notifications, emails, certificates and PWA
13. Landing page and landing editor
14. Testing and security review
15. Deployment, DNS, live keys and launch

After each step: run it, test it, summarise, list manual tasks, then stop and wait.

## 15. DELIVERABLES

Working code for all apps, migrations, Edge Functions and the video service. `README.md` (local setup, env vars, deploy steps for Vercel domains, VPS, DNS, Supabase Auth URLs, Google OAuth, Razorpay webhook), `DECISIONS.md`, `DESIGN.md`, and `LAUNCH_CHECKLIST.md` (live Razorpay keys, a real 1 rupee payment test, RLS check with a non-enrolled account, backups, domain and SSL verified, video load test).
