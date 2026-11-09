# Creator Live Studio & Daily Session Operations Guide
## ABrainoConscious Platform — Step 5 Daily Workflow for Naman

Welcome, Naman! This guide provides the step-by-step daily routine for running live cohort challenges, publishing meeting links, uploading session recordings, and broadcasting announcements to students.

---

## 1. The Daily Live Session Workflow (30-Second Routine)

Every day of an active cohort challenge (e.g. *21-Day Mind & Focus Reset*), follow this simple routine:

### Step 1: Open Your Admin Studio
1. Open your browser and go to `https://admin.abrainoconcious.com`.
2. Sign in with your admin email and password.
3. You will immediately land on your **Platform Overview** page.

### Step 2: Today's Live Link Controller Card
At the very top of your **Overview** page (and at `https://admin.abrainoconcious.com/sessions`), you will see the **Today's Live Control** card:
- It shows today's cohort day (e.g. `DAY 4: Taming the Inner Critic`).
- It shows the scheduled time in Indian Standard Time (IST) and the number of active enrolled students.

### Step 3: Paste Your Meeting Link & Publish
1. Generate your Zoom, Google Meet, or YouTube Live meeting link as usual.
2. Paste the link into the **Live Session URL** input field.
   - The studio automatically validates that the link begins with secure `https://`.
   - The studio automatically detects whether it is Zoom, Google Meet, or YouTube.
3. Keep the checkbox **"Notify enrolled students immediately"** checked (enabled by default).
4. Click the amber **"Publish Live Link"** button.

> **What happens behind the scenes:**
> - The live link is saved securely into the protected `session_links` database table.
> - An in-app push notification is immediately fanned out to every active enrolled student.
> - The notification is automatically deduplicated: even if you press publish multiple times, students only receive **one notification**.
> - Enrolled students will immediately see the glowing "Join Live Session" button on their dashboards.

---

## 2. Managing Last-Minute Link Changes

If your meeting link changes 10 minutes before class (e.g. Zoom technical issue, switched to Google Meet):
1. Paste your new link into the **Live Session URL** field.
2. Click **"Update & Publish"**.
3. A modal will pop up asking:
   - **"Update Silently"**: Updates the join link on student dashboards without sending another push notification.
   - **"Re-Notify All Students"**: Updates the join link **and** sends an immediate notification alerting students that the meeting link has been updated.

---

## 3. During and After the Live Session

### When You Start Teaching:
- Click the red **"Mark Live"** button on the Today widget.
- This changes the cohort status to `LIVE NOW`.
- On student screens, a pulsing red badge and audio-visual indicator alert them that Naman is live right now.

### When Class Finishes:
- Click the emerald **"Mark Ended"** button on the Today widget.
- The session is marked completed.
- A dialog will pop up prompting you to add the **Session Recording URL**:
  1. Once your YouTube Unlisted or Zoom cloud recording is ready, paste the URL.
  2. Toggle **"Make recording visible to enrolled students now"** (or leave it unchecked if you want to trim/review it first).
  3. Click **"Save Recording"**.
  4. Once marked visible, enrolled students will see the **"Watch Recording"** button under that day in their curriculum schedule.

---

## 4. The 2-Hour Missing Link Safety Net

To guarantee you never leave students waiting without a link:
- If any challenge session is scheduled to begin in **less than 2 hours** and has no published live link, a prominent warning banner appears across **every single page** of your admin studio.
- The banner displays a live countdown and a one-click button: **"Paste & Publish Link"**, jumping you straight to the publisher.

---

## 5. Preview as Student (Zero Guesswork)

Before publishing tasks or links, you can test the exact student experience:
1. In the Today's Session card or the Session Editor, click **"Preview as Student"**.
2. A modal renders the exact production card that enrolled students see in the web app:
   - Day badge (`DAY 4`)
   - IST scheduled time
   - Daily task checklist and rich-text reflection prompts
   - Downloadable resources and cheat-sheets
   - Join Live / Watch Recording CTA buttons

---

## 6. Broadcasting Announcements & Mentorship Messages

Go to `https://admin.abrainoconcious.com/announcements` to send updates:

### Sending an Urgent Broadcast:
1. Click **"Composer"**.
2. Enter your subject headline (e.g. *Important: Tonight's session starts at 8:00 PM IST*).
3. Select the **Urgent** kind (pulsing red banner).
4. Select your audience:
   - **Everyone**: Dispatches to all registered students.
   - **Cohort Program Students**: Choose a specific challenge cohort.
   - **Specific Student**: Search by name or phone for direct 1:1 messages.
5. Write your message in the formatted rich-text editor.
6. Optional: Add an action button label and URL (e.g. *Join Room Now*).
7. Review the **Live Student Preview** on the right side of your screen (Banner, Inbox, and Toast previews update live as you type).
8. Click **"Publish Broadcast Now"**.
9. A safety modal will confirm: *"This will show as a prominent banner to approximately N students. Are you sure?"*
10. Click **"Yes, Dispatch Urgent Banner"**.

### Scheduling an Announcement for Later:
1. Under timing, select **"Schedule Later"**.
2. Choose the date and time in **IST** (e.g. tomorrow at 09:00 AM IST).
3. Click **"Schedule Announcement"**.
4. The system automatically fans out the broadcast when that minute arrives without you needing to be logged in.

---

## 7. Tracking Read Rates & Analytics

Under the **History** tab (`/announcements`):
- View all previous broadcasts.
- Check live **read counts** and **read percentages** (e.g. `245 / 300 students (82%)`).
- **Unpublish**: Revert a live announcement back to draft to remove it from student screens immediately.
- **Duplicate / Re-send**: One-click clone to send a reminder with fresh edits.

