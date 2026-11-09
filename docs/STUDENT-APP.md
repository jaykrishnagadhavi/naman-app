# ABrainoConscious Student Portal Architecture & Implementation Guide (Step 6)

This document provides the definitive technical specification, component architecture, security boundaries, and QA verification record for the ABrainoConscious Student Web Application (`apps/web` on `app.<ROOT_DOMAIN>`).

---

## 1. Overview & Scope (Step 6)

In Step 6, the student app was built out with a focus on public discovery, program preview, and enrollment readiness:
- **Student Shell & Navigation (`StudentLayout`)**: Accessible desktop top bar with user dropdown / logged-out Join CTA, notification bell with empty state, skip-to-content accessibility link, and fixed mobile bottom navigation.
- **Dynamic Streaming Home (`/`)**: Hero banner (Live Now or Soonest Live Challenge countdown), Peterson Academy-style ranked Trending Rail, Starting Soon Rail, Live Cohorts, Courses, and 4 Growth Pillars Rails, plus quiet public platform stats.
- **Full Library & Discovery (`/explore`)**: Debounced search (300ms), Growth Pillar category chips, format / price / sort dropdowns, dual view modes (Rails vs Grid), pagination ("Load More"), and two-way URL parameter synchronization.
- **Public Program Profile (`/programs/:slug`)**: High-converting public preview with privacy-friendly lazy trailers, structured "What You Will Learn" checklist, curriculum / daily challenge schedule with IST timings, creator bio, verified student reviews, FAQ accordion, emotional pillar compassionate notice, and sticky desktop / mobile join bars.
- **Checkout Summary Page (`/checkout/:slug`)**: Authenticated order breakdown with rupee formatting, GST statement, coupon area placeholder, and mandatory anti-piracy terms checkbox before proceeding to Step 7 (Razorpay).
- **Strict Protected Links Isolation**: Proved that `session_links` (`live_url`, `recording_url`) and `lesson_media` (`video_id`, `content_url`) are NEVER returned in public queries or serialized in client payloads.

---

## 2. Component & Page Architecture

```
apps/web/src/
├── App.tsx                     # Top-level Router, HelmetProvider, ErrorBoundary, AuthProvider
├── pages/
│   ├── HomePage.tsx            # Streaming hero banner, ranked rails, quiet stats strip
│   ├── ExplorePage.tsx         # Debounced search, pillar chips, filters, grid/rails toggle, URL sync
│   ├── ProgramPage.tsx         # Public preview, lazy trailer, curriculum/schedule, reviews, FAQ, JSON-LD
│   ├── CheckoutPage.tsx        # Order summary, GST notice, coupon input, anti-piracy terms checkbox
│   ├── WebPages.tsx            # Clean re-exports and placeholder pages for later steps
│   └── auth/                   # Split-screen auth pages (login, signup, callback, etc.)
```

---

## 3. Security Boundary: Zero Secret Leakage

To prevent piracy and link leakage:
1. **Public Catalog & Detail RPCs**:
   - `get_catalog`: Selects public columns from `programs` only. Computes dynamic `seats_left = max_seats - active_enrollments`.
   - `get_trending_programs`: Ranks published cohorts without exposing student identity or secret links.
   - `get_program_public`: Fetches session metadata (`day_number`, `title`, `scheduled_at`, `task_title`) and course modules (`title`, `duration_seconds`, `is_free_preview`) without joining `session_links` or `lesson_media`.
2. **Client-Side Fallback Layer**:
   - `fetchCatalog`, `fetchTrendingPrograms`, and `fetchProgramPublicDetail` in `@abrainoconscious/shared` invoke database RPCs, and gracefully fall back to direct Supabase PostgREST table queries if Postgres returns `PGRST202` (before manual remote migration push).
   - In direct queries, queries target public columns explicitly:
     `id, slug, title, short_description, description, type, category, price_paise, compare_at_price_paise, starts_at, ends_at, max_seats, tags, what_you_will_learn, faq`.
3. **Automated Leak Verification**:
   - In `e2e/student-step6-qa.spec.ts`, Playwright monitors all network traffic during program viewing and asserts:
     ```ts
     expect(body.includes('"live_url"')).toBe(false);
     expect(body.includes('"recording_url"')).toBe(false);
     ```

---

## 4. Honest Status & Routing Logic

| Program Status | Non-Admin Behavior | Enrolled Student Behavior |
| :--- | :--- | :--- |
| **`draft`** | Returns clean 404 screen ("Program Not Found") | Returns 404 (enrollments cannot exist on drafts) |
| **`published` / `live`** | Full public preview; Join button routes to `/signup?program=<slug>` (logged out) or `/checkout/<slug>` (logged in) | Shows "Go to Enrolled Dashboard →" routing to `/my-programs` |
| **`archived`** | Friendly banner: cohort concluded, registrations closed | Can access recordings and past worksheets |
| **`completed`** | Waitlist / completion banner | Can access certificates and archives |

---

## 5. SEO & Structured Data (JSON-LD)

Every public route utilizes `<Helmet>` from `react-helmet-async`:
- **Title format**: `${program.title} | ABrainoConscious by Naman`
- **Dynamic root domain**: Injected dynamically from `getRootDomain()` / `VITE_ROOT_DOMAIN`. Never hardcoded.
- **Open Graph**: `og:title`, `og:description`, `og:image`, `og:url`.
- **JSON-LD Schema**:
  - Live Challenges emit `https://schema.org/Event` with offers and provider info.
  - Courses emit `https://schema.org/Course` with lesson outlines and availability status.

---

## 6. Visual QA & Multi-Device Proof

Visual verification was captured with Playwright across both desktop (1440px) and mobile (390px) viewports:

| Viewport | Route | Artifact Screenshot |
| :--- | :--- | :--- |
| **1440x900** | `/` (Home) | `docs/qa-step6/home-desktop-1440px.png` |
| **390x844** | `/` (Home) | `docs/qa-step6/home-mobile-390px.png` |
| **1440x900** | `/explore` (Library) | `docs/qa-step6/explore-desktop-1440px.png` |
| **390x844** | `/explore` (Library) | `docs/qa-step6/explore-mobile-390px.png` |
| **1440x900** | `/programs/:slug` (Preview) | `docs/qa-step6/program-preview-desktop-1440px.png` |
| **390x844** | `/programs/:slug` (Preview) | `docs/qa-step6/program-preview-mobile-390px.png` |
| **1440x900** | `/checkout/:slug` (Summary) | `docs/qa-step6/checkout-desktop-1440px.png` |
| **390x844** | `/checkout/:slug` (Summary) | `docs/qa-step6/checkout-mobile-390px.png` |

---

## 7. Automated Test Suite Summary

- **pgTAP Database Tests**: `supabase/tests/20261106000001_public_rpcs_security.test.sql` (10 tests asserting anon access to catalog, zero leaks of `live_url` / `recording_url` / `video_id`).
- **Vitest Unit Tests**: `packages/shared/src/__tests__/catalog.test.ts` (96 total monorepo tests passing).
- **Playwright E2E Suite**: `e2e/student-step6-qa.spec.ts` (8 full end-to-end tests passing in 20.6s).
- **TypeScript Typecheck**: `pnpm --recursive run typecheck` across all 5 workspace projects (0 errors).
- **ESLint**: `pnpm lint` (0 errors).

