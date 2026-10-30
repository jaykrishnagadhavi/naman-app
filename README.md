# ABrainoConscious Platform

> Self-growth education platform and creator hub for **ABrainoConscious** by **Naman**, helping students and young professionals grow across four pillars: **Emotional**, **Mental**, **Academic**, and **Personal**.

---

## 1. Monorepo Structure

```
├── apps/
│   ├── landing/    # Public conversion & storytelling site (Port 5175) -> abrainoconcious.com
│   ├── web/        # Student application & video player (Port 5173) -> app.abrainoconcious.com
│   └── admin/      # Creator control panel for Naman (Port 5174) -> admin.abrainoconcious.com
├── packages/
│   ├── ui/         # Shared design system, Tailwind preset, Radix components & Img pipeline
│   └── shared/     # Shared types, Zod schemas, typed env loaders & formatting utilities
├── services/
│   └── video/      # Self-hosted encrypted video streaming stack (Docker / tusd / FFmpeg)
├── supabase/       # Postgres migrations, seed scripts, and Edge Functions
├── assets/
│   └── photos/     # Original, uncompressed source photographs & brand assets
├── docs/
│   ├── SPEC.md             # Master platform prompt & specification
│   ├── DESIGN.md           # Brand voice, design research & design tokens
│   ├── DECISIONS.md        # Recorded architectural & copy decisions
│   ├── assets-manifest.md  # Photographic inventory & recommended usage
│   ├── design-research/    # Screenshots & extracted tokens from reference sites
│   └── screenshots/        # Mobile & desktop screenshots of landing & design system
```

---

## 2. Quickstart & Local Setup

### Prerequisites
- **Node.js:** `v22` or `v24` (Tested on `v24.11.1`)
- **pnpm:** `v12` or later

### Installation
```bash
# Install all dependencies across workspaces
pnpm install
```

### Running All Three Apps in Development
```bash
# Concurrently starts web (5173), admin (5174), and landing (5175)
pnpm dev
```
- **Landing Page:** [http://localhost:5175](http://localhost:5175)
- **Student App:** [http://localhost:5173](http://localhost:5173)
- **Admin Panel:** [http://localhost:5174](http://localhost:5174)
- **Design System Showcase:** Available on `/design-system` on any of the three ports.

### Verification & CI Quality Checks
```bash
# Typecheck all TypeScript workspaces
pnpm typecheck

# Lint with ESLint
pnpm lint

# Production build test
pnpm build
```

---

## 3. How to Add or Replace Photos

1. **Place Source Files:**
   Add new high-resolution images (`JPG`, `PNG`, or `WebP`) into `assets/photos/`:
   - `assets/photos/programs/`: Course thumbnails (16:9 at `1920x1080`), posters (2:3 at `1200x1800`), wide banners (`2400x1000`).
   - `assets/photos/community/`: Student testimonial avatars (`600x600`), live session screenshots (`1920x1080`).
   - `assets/photos/naman/`: Additional portraits or live workshop captures.
2. **Execute the Optimization Pipeline:**
   ```bash
   pnpm images
   ```
   - Automatically generates responsive `AVIF` and `WebP` files at `480` and `960` widths (never upscales).
   - Generates tiny base64 inline blur placeholders.
   - Synchronizes optimized assets to `apps/*/public/img`.
   - Generates typed index `packages/ui/src/generated-images.ts`.
3. **Render Using the Shared `Img` Component:**
   ```tsx
   import { Img } from '@abrainoconscious/ui';

   <Img
     id="naman/naman-header"
     alt="Naman teaching live cohort"
     aspectRatio="4/5"
     focalPoint="50% 32%"
   />
   ```

---

## 4. Environment Variables

Each app includes a `.env.example` file:
```env
VITE_SUPABASE_URL=https://placeholder-project.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key
VITE_ROOT_DOMAIN=abrainoconcious.com
VITE_RAZORPAY_KEY_ID=rzp_test_placeholder
VITE_VIDEO_DOMAIN=video.abrainoconcious.com
```
A typed Zod loader (`packages/shared/src/env.ts`) validates environment variables upon startup with clear errors if required keys are missing.
