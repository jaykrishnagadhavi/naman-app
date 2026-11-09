# Admin Shell & Programs Manager Guide (Step 4)

This document provides the complete reference for the ABrainoConscious Administrator Shell, Programs Management Suite, client-side Canvas WebP image pipeline, and publication checklist guardrails.

---

## 1. Admin Shell Architecture

The admin application (`apps/admin`) runs on port `5174` (or `https://admin.${ROOT_DOMAIN}`) and operates inside the `AdminLayout` with the following structural guarantees:

### Grouped Navigation
Navigation items are grouped into four logical sections:
1. **Core:**
   - **Platform Overview (`/`):** Real-time KPI statistics fetched directly from Supabase (program counts by status, registered student count, active enrollments, upcoming live sessions, and captured revenue).
   - **Programs Manager (`/programs`):** Central catalog manager for cohorts and courses.
2. **Management:**
   - **Daily Live Sessions (`/sessions`):** Live link broadcasting controller *(Step 5)*.
   - **Courses Builder (`/courses`):** Video curriculum & DRM streaming *(Step 10)*.
   - **Announcements (`/announcements`):** Broadcast announcements & notifications *(Step 5)*.
   - **Students (`/students`):** Student roster & cohort progress *(Step 9)*.
   - **Payments (`/payments`):** Razorpay checkout logs & revenue ledger *(Step 6)*.
   - **Coupons (`/coupons`):** Promo codes & discount engine *(Step 6)*.
3. **Site:**
   - **Landing CMS (`/landing-editor`):** Visual homepage block editor *(Step 7)*.
   - **Community (`/community`):** Cohort discussion board moderation *(Step 8)*.
   - **Reviews (`/reviews`):** Testimonial curation & Wall of Love *(Step 8)*.
4. **System:**
   - **Team & Roles (`/team`):** Staff invite and RBAC manager *(Step 9)*.
   - **Platform Settings (`/settings`):** GST, brand identity, and maintenance mode *(Step 9)*.
   - **Anti-Piracy (`/piracy`):** Forensic watermarking & token violation logs *(Step 10)*.
   - **Audit Log (`/audit-log`):** Read-only immutable administrative audit trail.

### Environment & Safety Badges
- **Environment Indicator:** Clearly displays `LOCAL`, `STAGING`, or `PRODUCTION` in the top header.
- **TEST MODE Banner:** Distinct visual indicator whenever connected to non-production instances.
- **Mobile Drawer:** Full responsive support on 390px mobile viewports via hamburger overlay.
- **Idle Session Timeout:** 30-minute idle inactivity timeout with a 28-minute advance warning modal (`useAdminIdleTimeout`).

---

## 2. Programs Manager (`/programs`)

### Server-Side Filtering & Trigram Search
- **Search:** Leverages PostgreSQL trigram index `idx_programs_title_trgm` via `.ilike('title', '%keyword%')` for sub-millisecond substring matching.
- **Filters:**
  - **Type:** All, `challenge` (live cohort), `course` (self-paced).
  - **Pillars:** All, `emotional` (Resilience), `mental` (Clarity), `academic` (Mastery), `personal` (Momentum).
  - **Status:** All, `draft`, `published`, `live`, `completed`, `archived`.
  - **Placement:** All, Featured only, Standard.
- **Sorting:** By custom sort order (`sort_order`), Title, Price (INR), or Recently updated.

### Multi-View Display
1. **Table View:** Dense tabular view displaying thumbnail, title, URL slug, pillar badge, publication status, price (with strike-through compare-at), seats used/total, and IST dates.
2. **Card View:** Visual card grid featuring `PosterCard` aesthetics, category labels, price tags, and seat counters.
3. **Reorder View:** Drag-and-drop sortable list powered by `@dnd-kit/core` and `@dnd-kit/sortable`. Reordering automatically updates `sort_order` in Supabase with optimistic UI updates.

### Row Actions & Safety Checks
- **Edit:** Opens the tabbed Program Editor (`/programs/:id`).
- **Duplicate:** Instantly creates a draft duplicate named `"Copy of [Title]"` with a new unique slug (`[slug]-copy-[random]`).
- **Publish / Unpublish:**
  - If active student enrollments exist on a program, unpublishing prompts a mandatory confirmation modal explaining that existing students retain dashboard access.
  - Publishing validates all checklist rules before changing status to `published`.
- **Archive / Restore:** Soft-deletes program by setting `status = 'archived'` and recording `deleted_at`.
- **Delete (Admin-Only):** Permanently removes program row from Supabase. Requires the administrator to type the exact program title into a confirmation dialog to prevent accidental deletion. Disabled for staff accounts.

### Bulk Operations
Selecting multiple rows activates the floating action bar allowing bulk:
- Publishing (`status = 'published'`)
- Unpublishing (`status = 'draft'`)
- Archiving (`status = 'archived'`)
- Featuring / Unfeaturing (`is_featured = true/false`)
- Changing Pillar Category across all selected items

---

## 3. Program Editor (`/programs/new` and `/programs/:id`)

### Sticky Save Bar & Draft Persistence
- **Save Status:** Real-time indicator displaying `Saved` (green check), `Saving...` (spinner), or `Unsaved changes` (amber dot).
- **Autosave Drafts:** Automatically debounces save requests every 2 seconds when editing a draft.
- **Keyboard Shortcut:** `Cmd/Ctrl + S` triggers immediate manual save.
- **Exit Warning:** Native browser `beforeunload` event prevents loss of unsaved changes.

### Editor Tabs
1. **Basics:**
   - **Type:** Challenge or Video Course (locked if active student enrollments exist).
   - **Title & Slug:** Title input automatically generates URL slug via `slugify()`. Slug has real-time uniqueness validation against PostgreSQL.
   - **Growth Pillar:** Selects one of the four core pillars.
   - **Short Description:** Counter strictly tracking `10 - 160 characters` for catalog cards.
   - **Full Description:** Rich text formatting using Tiptap and DOMPurify sanitization.
   - **Tags:** Keyword tag chips.
2. **Pricing & Seats:**
   - **Price in Rupees:** Automatically converted to paise (`rupeesToPaise`) for database storage.
   - **Free Program Toggle:** Sets price to 0 and disables payment requirement.
   - **Compare-At Price:** Optional strike-through price (must exceed base price).
   - **Max Seats:** Optional enrollment cap with seats-used indicator.
   - **Enrollment Deadline:** IST localized date/time picker.
3. **Schedule:**
   - **Challenge Dates (IST):** `starts_at` and `ends_at` with strict validation (`ends_at > starts_at`).
   - **Course Duration:** Configures lifetime or fixed-day enrollment access.
4. **Visual Assets (Images):**
   - Catalog Thumbnail (16:9)
   - Streaming Poster (2:3)
   - Wide Hero Cover (16:9 or 21:9)
5. **Content & FAQs:**
   - **What You Will Learn:** Dynamic list builder for key student outcomes (minimum 3 required for publishing).
   - **Frequently Asked Questions:** Q&A builder (minimum 1 required for publishing).
   - **Promo Video URL:** Validated YouTube or Vimeo embed preview.
6. **Visibility:**
   - Status selector (`draft`, `published`, `live`, `completed`, `archived`).
   - Featured toggle & Pin to Trending toggle.
   - Manual sort order number.
7. **Multi-Device Live Preview:**
   - PosterCard in rail preview.
   - Trending rank poster with bold serif rank number.
   - Landing page pricing card preview.
   - Mobile hero banner preview.

---

## 4. Publish Checklist Guardrails

Before any program can transition to `status = 'published'`, `evaluatePublishChecklist()` verifies 11 pre-flight checks:

| Requirement | Rule |
| :--- | :--- |
| **Title** | Non-empty, minimum 3 characters |
| **Slug** | Clean alphanumeric hyphenated slug, unique in database |
| **Pillar Category** | One of `emotional`, `mental`, `academic`, `personal` |
| **Short Description** | Between 10 and 160 characters |
| **Full Description** | Non-empty description overview |
| **Price** | Valid integer $\ge 0$ (or free toggle) |
| **Challenge Dates** | `starts_at` and `ends_at` present, with `ends_at > starts_at` (challenges only) |
| **Thumbnail** | 16:9 image asset uploaded |
| **Poster** | 2:3 image asset uploaded |
| **Learning Outcomes** | At least 3 non-empty learning takeaways |
| **FAQs** | At least 1 question and answer pair |

### Database Integrity Enforcement
The PostgreSQL database constraint `check_published_program` acts as the definitive security boundary:
```sql
CONSTRAINT check_published_program CHECK (
  status != 'published' OR (
    price_paise IS NOT NULL AND
    thumbnail_url IS NOT NULL AND
    poster_image_url IS NOT NULL
  )
)
```
Any attempt to bypass UI checks is rejected by PostgreSQL with a clear error message mapped by the client.

---

## 5. Client-Side Canvas Image Pipeline

### Security & Metadata Stripping
1. **Magic Bytes MIME Validation:**
   Before reading files, the client examines the binary file header:
   - `FF D8 FF` $\rightarrow$ `image/jpeg`
   - `89 50 4E 47 0D 0A 1A 0A` $\rightarrow$ `image/png`
   - `RIFF ... WEBP` $\rightarrow$ `image/webp`
   - Blocks renamed executables (`.exe`), scripts, and malicious SVGs.
2. **HTML5 2D Canvas Re-Encoding:**
   Files are drawn onto an off-screen HTML5 2D canvas and exported via `canvas.toBlob(..., 'image/webp', 0.85)`. This process **inherently strips all EXIF, GPS location coordinates, and camera serial numbers**.
3. **Multi-Density WebP Generation:**
   - **16:9 Assets (Thumbnail & Cover):** Renditions generated at `480px`, `960px`, and `1600px` widths.
   - **2:3 Assets (Poster):** Renditions generated at `320px`, `640px`, and `1000px` widths.
4. **Storage Organization:**
   Uploaded to Supabase Storage bucket `program-images` under clean, structured paths:
   `programs/{programId}/{kind}-{width}-{timestamp}.webp`
5. **Atomic Replacement:**
   When an image is updated:
   1. New WebP renditions are uploaded to storage under timestamped paths.
   2. Database row is updated with new URLs and `srcset` JSON map.
   3. Only after the row update succeeds are old storage files deleted.

---

## 6. Staff Role Boundaries & Audit Trail

| Capability | Super Admin (`admin`) | Staff (`staff`) |
| :--- | :---: | :---: |
| **Create Draft Programs** | Yes | Yes |
| **Edit Draft Programs** | Yes | Yes |
| **Upload Visual Assets** | Yes | Yes |
| **Modify Published Program Prices** | Yes | **No** (Locked) |
| **Publish Programs without Review** | Yes | **No** (Locked) |
| **Delete Programs** | Yes (with title confirmation) | **No** (Forbidden) |
| **Inspect System Audit Log** | Yes | **No** (Access Denied) |

### Audit Logging
PostgreSQL trigger `audit_programs` automatically captures every `INSERT`, `UPDATE`, and `DELETE` on the `programs` table into the `audit_log` table with:
- `actor_id`: User UUID
- `actor_role`: JWT role (`admin` or `staff`)
- `action`: `CREATE`, `UPDATE`, or `DELETE`
- `entity`: `'programs'`
- `diff`: Full JSON snapshot of `old` and `new` records
- `created_at`: IST timestamp

