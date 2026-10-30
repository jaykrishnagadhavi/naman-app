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
