# Student Live Sessions & Enrolled Experience Architecture

This document describes the technical architecture, security guarantees, lifecycle mechanics, and real-time synchronization powering the **Enrolled Student Experience** (Step 8) for ABrainoConscious.

---

## 1. Security Model: Protected Links Isolation

Live session links (`live_url`) and recording links (`recording_url`) are critical digital assets. Under no circumstances are raw URLs exposed through public tables, program detail endpoints, or rendered in student page DOMs prior to user interaction.

### Isolation Rules
1. **Database Isolation (`session_links` table)**:
   - Live and recording URLs are isolated in `public.session_links` with Row Level Security (RLS) restricting direct `SELECT` access exclusively to administrators and staff (`is_staff_or_admin()`).
   - Normal student clients querying `programs` or `program_sessions` receive metadata only (e.g. `has_live_link`, `has_recording`), never raw URLs.

2. **On-Demand Resolution via SECURITY DEFINER RPC**:
   - `get_session_link(p_session_id UUID)`: Evaluates user enrollment and temporal join window before returning `{ ok: true, live_url: "...", platform: "zoom" }`.
   - `get_session_recording(p_session_id UUID)`: Verifies enrollment before returning `{ ok: true, recording_url: "..." }`.

3. **Client Opening Sanitation**:
   - Live session links are opened programmatically in new tabs using strict security attributes:
     ```typescript
     window.open(liveUrl, '_blank', 'noopener,noreferrer');
     ```
   - This prevents target meeting platforms (Zoom, Google Meet, YouTube Live) from obtaining `window.opener` references back into the application context.

---

## 2. Join Window Mechanics

To prevent link leakage, early unhosted joins, and unauthorized re-use, access to live session links is governed by a strict temporal join window:

| Condition | Window State | Access Result |
| :--- | :--- | :--- |
| `status = 'live'` | **Immediately Open** | Full access granted regardless of scheduled time. |
| Time < `scheduled_at - 60 minutes` | **Too Early** | Refused. Returns `opens_at = scheduled_at - 60min` and countdown. |
| `scheduled_at - 60 min` $\le$ Time $\le$ `scheduled_at + 6 hours` | **Open Window** | Access granted; attendance logged automatically. |
| Time > `scheduled_at + 6 hours` | **Session Ended** | Refused. Returns status `ended`. Recording prompted if available. |

### Friendly Refusal Handling
If a student clicks "Join Live" outside the valid window:
- A calm, branded modal or notification is displayed indicating exact IST opening time (`opens_at`).
- Live countdown timers compute remaining duration until the 60-minute pre-session window opens.

---

## 3. Automatic Attendance Tracking

When a student clicks "Join Live" and `get_session_link` approves access:
1. An idempotent record is inserted into `public.session_attendance`:
   ```sql
   INSERT INTO session_attendance (user_id, session_id, joined_at)
   VALUES (v_uid, p_session_id, NOW())
   ON CONFLICT (user_id, session_id) DO NOTHING;
   ```
2. The student's cohort progress recalculates immediately:
   - Full schedule roadmap marks the session with a green checkmark (`Attended`).
   - Overall cohort progress percentage updates dynamically.

---

## 4. The 4-Step Daily Growth Checklist

For cohort challenges (e.g. *21-Day Mind & Emotion Mastery*), every active day is structured into four transformative steps (SPEC Section 9):

```
+-----------------------------------------------------------------------------------+
|                           YOUR DAILY GROWTH CHECKLIST                            |
+-------------------+--------------------+--------------------+---------------------+
| 1. Watch          | 2. Do Today's Task | 3. Attend Live     | 4. Community Circle |
| Daily core video  | Interactive task   | Live coaching call | Share takeaways     |
| & contemplation   | completion toggle  | with Naman         | with cohort peers   |
+-------------------+--------------------+--------------------+---------------------+
```

### Daily Task Completion
- Students check off daily exercises via `complete_task(p_session_id UUID, p_completed BOOLEAN)`.
- Updates `public.task_completions` with user ID, session ID, and timestamp.
- Client maintains localStorage cache fallback ensuring offline resilience and snappy UI response.

### Certificate of Completion Milestone
- Certificate eligibility is tracked in real-time: requires **$\ge$ 80% attendance and task completion**.
- Milestone banner provides visual progress ring and remaining session counts.

---

## 5. Learning Dashboard (`/my-programs`)

The student learning sanctuary (`/my-programs`) organizes all enrolled content into priority rails:
- **Welcome Celebration**: Triggered upon joining via `?welcome=<slug>`. Displays celebratory banner and direct "Start Today's Session" CTA.
- **Live Now**: Glowing amber ring for sessions currently in progress.
- **Today's Sessions**: Programs with live calls scheduled for today in Indian Standard Time (IST).
- **In Progress**: Ongoing cohorts with interactive progress rings.
- **Upcoming**: Future cohorts with starts-at countdowns.
- **Completed**: Finished programs with access to archives and certificates.

---

## 6. Real-Time Inbox & Announcements (`/inbox`)

The inbox combines global broadcast announcements and direct personal student notifications into an unified feed:
- **Real-Time WebSockets**: Subscribes to Postgres CDC via `supabase.channel('student-inbox-feed')` on tables `announcements` and `notifications`.
- **Tab Visibility & Fallback Polling**: Triggers background refetch on `visibilitychange` (when tab regains focus) and maintains a 60-second fallback polling interval.
- **Unread Badge Synchronization**: The desktop top navigation bell and mobile bottom navigation bar display real-time unread count badges.
- **Category Filters**: Tabs for `All`, `Unread`, `Announcements`, and `Live Links`.

---

## 7. Temporary Payment On-Hold Architecture

While payment gateways (Step 7) are finalized:
- Checkout pages (`/checkout/:slug`) for paid programs render the primary CTA as disabled:
  ```
  [ PAYMENTS OPEN VERY SOON ]
  Admissions Opening Very Soon
  ```
- **Priority Interest Registration**: Students submit their email and optional WhatsApp number to reserve a waitlist slot. Handled via `registerPaymentInterest` and stored in `public.payment_interest` (with local storage fallback).
- **Free Program Join**: Programs with `price_paise = 0` continue to enroll atomically via `enrollInFreeProgram` (`enroll_free` RPC) and route directly to `/my-programs?welcome=<slug>`.

---

## 8. Admin Student Management (`/students`)

Administrators and staff manage student access through the dedicated `/students` panel in `apps/admin`:
- **Directory Search**: Search students by name, email, phone number, or profile UUID.
- **Manual Enrollment Modal**: Allows staff to allocate any student profile to any cohort or course with optional expiry dates (`access_until`) and automated welcome notifications (`admin_enroll` RPC).
- **Access Revocation**: Staff can revoke active enrollments with an optional administrative reason (`admin_revoke_enrollment` RPC). Revoked students receive immediate notification and encounter the calm "Your Cohort Access Has Ended" state upon visiting the program.

