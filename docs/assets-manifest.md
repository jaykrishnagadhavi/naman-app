# Assets Manifest — ABrainoConscious

This manifest catalogs all photographic and brand assets found in `assets/photos/`, their technical dimensions, focal points, visual inspection notes, quality flags, and recommended platform uses.

---

## 1. Inventory Summary

| Folder | Status | File Count | Notes |
| :--- | :--- | :--- | :--- |
| `assets/photos/brand/` | Present | 1 file | High-contrast circular identity badge (`logo.jpg`) |
| `assets/photos/naman/` | Present | 1 file | Studio hero portrait of Naman with marker (`naman-header.jpg`) |
| `assets/photos/programs/` | **Empty** | 0 files | Needs program thumbnails (16:9), posters (2:3), and wide banners |
| `assets/photos/community/` | **Empty** | 0 files | Needs student testimonials (1:1), session snapshots (16:9) |
| `assets/photos/CAPTIONS.txt` | **Missing**| 0 files | Authoritative captions file not provided; using visual analysis |

---

## 2. File-by-File Analysis

### 1. `brand/logo.jpg`
- **Dimensions:** 1280 × 720 px
- **Aspect Ratio & Orientation:** 16:9 Landscape
- **File Size:** 110.5 KB
- **Who / What is Shown:** High-contrast monochrome portrait of Naman centered inside an energetic circular saffron-amber (`#F5871F`) grunge-textured seal against a pure black background (`#000000`).
- **Quality Notes:**
  - Resolution is 1280 × 720 (720p).
  - Clean edge definition, crisp texture on the circular graphic, strong contrast on the monochrome portrait.
  - Meets the 1200px minimum width requirement (1280px wide).
- **Best Focal Point:** `50% 50%` (center of the circular emblem)
- **Recommended Use:**
  - Brand logotype icon and channel avatar
  - Social proof and channel endorsement badges
  - Creator watermark and certificate stamp
- **Art Direction & CSS Rule:** When cropped into a circular avatar (`1:1`), position at `50% 50%` to keep the full face and amber ring centered.

---

### 2. `naman/naman-header.jpg`
- **Dimensions:** 1280 × 720 px
- **Aspect Ratio & Orientation:** 16:9 Landscape
- **File Size:** 42.0 KB
- **Who / What is Shown:** Naman in a white crewneck t-shirt against a clean pure black backdrop (`#000000`), looking directly into the camera with an open, approachable mentor expression. In the foreground, he holds a green marker pen pointed toward the viewer, as if interacting with an invisible glassboard.
- **Quality Notes:**
  - Resolution is 1280 × 720 (720p).
  - Excellent natural studio lighting with warm key tones on Naman's face and white shirt.
  - Pure black background makes it ideal for seamless dark theme integration (`#040C0E` / `#051012`) without hard rectangular image borders.
  - Meets the 1200px threshold (1280px wide); will be generated at 480px and 960px without upscaling past 1280px.
- **Best Focal Point:** `50% 32%` (Naman's eyes and facial expression)
- **Recommended Use:**
  - **Landing Hero Section:** Positioned right-aligned or layered behind the primary headline, blended with a dark gradient overlay (`linear-gradient(to right, #040c0e 45%, transparent 100%)`) on desktop, and a bottom/top vignette on mobile so headlines stay 100% legible.
  - **Creator Section (`CreatorCard`):** Primary biographical portrait.
  - **Free Preview / YouTube Showcase:** Background accent for the mentor-friend identity.
- **Art Direction & CSS Rule:** Always preserve `object-position: 50% 32%` to avoid cutting off Naman's head. Never overlay high-density text over his face.

---

## 3. Required Photos to Add & Target Specifications

Because `programs/` and `community/` are currently empty, the platform uses elegant procedural SVG and CSS gradient placeholders. To replace these placeholders with real assets in future steps, add the following files to `assets/photos/`:

### A. Program Covers & Posters (`assets/photos/programs/`)
1. **Course 16:9 Thumbnails:**
   - **Target Size:** `1920 × 1080 px` (minimum `1280 × 720 px`), JPG or WebP under 2 MB.
   - **Recommended Files:**
     - `programs/emotional-mastery-thumb.jpg` (Emotional pillar course)
     - `programs/mental-clarity-thumb.jpg` (Mental pillar challenge)
     - `programs/academic-focus-thumb.jpg` (Academic pillar course)
     - `programs/personal-habits-thumb.jpg` (Personal growth challenge)
2. **Trending & Rail Posters (2:3 ratio):**
   - **Target Size:** `1200 × 1800 px` (minimum `800 × 1200 px`), 2:3 portrait orientation.
   - **Recommended Files:**
     - `programs/emotional-mastery-poster.jpg`
     - `programs/mental-clarity-poster.jpg`
     - `programs/academic-focus-poster.jpg`
     - `programs/personal-habits-poster.jpg`
3. **Wide Hero Banners (21:9 or 2.4:1 ratio):**
   - **Target Size:** `2400 × 1000 px`, landscape, dark mood lighting or dark margins for text placement.
   - **Recommended Files:**
     - `programs/hero-banner-main.jpg`

### B. Community & Testimonials (`assets/photos/community/`)
1. **Student Avatars / Testimonial Portraits:**
   - **Target Size:** `600 × 600 px` (1:1 square), clean headshots.
   - **Recommended Files:**
     - `community/student-arjun.jpg`
     - `community/student-priya.jpg`
     - `community/student-rohit.jpg`
     - `community/student-ananya.jpg`
2. **Community Live Session Snapshots:**
   - **Target Size:** `1920 × 1080 px`, showing Zoom/meet grid calls or student notes/workbooks in warm natural light.
   - **Recommended Files:**
     - `community/live-session-call.jpg`
     - `community/study-group-discussion.jpg`

---

## 4. Quality & Processing Rules Enforced in Pipeline

1. **No Upscaling:** Images are downscaled to responsive target widths (480, 960, 1600, 2400). If an original is 1280px wide (like `naman-header.jpg`), renditions at 1600 and 2400 are omitted to preserve crispness.
2. **Dual Modern Formats:** Generates both modern `AVIF` (highest compression efficiency) and `WebP` (universal support).
3. **Blur-Up Data Placeholders:** A base64 inline blurred thumbnail (~20px wide) is embedded into the generated index for zero-layout-shift instant loading.
4. **Idempotence:** Running `pnpm images` multiple times produces consistent, deterministic results without modifying any files in `assets/photos/`.

