-- Migration: 20261105000001_sessions_and_announcements.sql
-- Description: Step 5 Admin Live Sessions, Protected Links, Announcements, and Notification Fan-out

-- ============================================================================
-- 1. Schema Extensions for Announcements, Notifications & Session Links
-- ============================================================================

-- Announcements enhancements: fanned_out_at and is_draft
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS fanned_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN announcements.fanned_out_at IS 'Timestamp when notification fan-out was completed for scheduled announcement';
COMMENT ON COLUMN announcements.is_draft IS 'True when announcement is saved as draft and not visible to students';

-- Notifications enhancements: deduplication key
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS notification_dedupe_key TEXT UNIQUE;

COMMENT ON COLUMN notifications.notification_dedupe_key IS 'Unique idempotency key to prevent duplicate fan-out spams';

-- Session Links enhancements: published tracking and recording visibility
ALTER TABLE session_links
  ADD COLUMN IF NOT EXISTS link_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS link_published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recording_visible BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN session_links.link_published_at IS 'When the live URL was verified and published for student access';
COMMENT ON COLUMN session_links.link_published_by IS 'Admin or staff member who published the live URL';
COMMENT ON COLUMN session_links.recording_visible IS 'Whether enrolled students can view the session recording URL';

-- ============================================================================
-- 2. Performance Indexes (e.g. Next 2 hours missing link queries, fan-out)
-- ============================================================================

-- Index for sessions scheduled in the upcoming window
CREATE INDEX IF NOT EXISTS idx_program_sessions_sched_status
  ON program_sessions (scheduled_at, status)
  WHERE status = 'scheduled';

-- Index for session link publishing status lookup
CREATE INDEX IF NOT EXISTS idx_session_links_published
  ON session_links (session_id, link_published_at);

-- Index for finding announcements ready for fan-out
CREATE INDEX IF NOT EXISTS idx_announcements_fanout
  ON announcements (publish_at, fanned_out_at, is_draft)
  WHERE is_draft = false AND fanned_out_at IS NULL;

-- Index for user unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

-- ============================================================================
-- 3. Row Level Security Updates
-- ============================================================================

-- 3A. Session Links RLS:
-- Enrolled students can read session_links ONLY AFTER the link is published
-- OR if the session ended and recording_visible is true.
DROP POLICY IF EXISTS "session_links_select_enrolled" ON session_links;
CREATE POLICY "session_links_select_enrolled"
  ON session_links FOR SELECT
  USING (
    (
      has_active_enrollment(
        (SELECT ps.program_id FROM program_sessions ps WHERE ps.id = session_links.session_id)
      )
      AND (
        link_published_at IS NOT NULL
        OR (recording_visible = true AND recording_url IS NOT NULL)
      )
    )
    OR is_staff_or_admin()
  );

-- Only staff or admin can insert/update/delete session links
DROP POLICY IF EXISTS "session_links_write_staff" ON session_links;
CREATE POLICY "session_links_write_staff"
  ON session_links FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- 3B. Program Sessions RLS:
-- Staff and Admin can manage sessions, but staff CANNOT delete sessions that have attendance records
DROP POLICY IF EXISTS "sessions_write_staff" ON program_sessions;
CREATE POLICY "sessions_insert_staff"
  ON program_sessions FOR INSERT
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "sessions_update_staff"
  ON program_sessions FOR UPDATE
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "sessions_delete_staff_or_admin"
  ON program_sessions FOR DELETE
  USING (
    is_admin()
    OR (
      is_staff_or_admin()
      AND NOT EXISTS (
        SELECT 1 FROM session_attendance sa WHERE sa.session_id = program_sessions.id
      )
    )
  );

-- 3C. Announcements RLS:
-- Students can only select announcements where is_draft is false
DROP POLICY IF EXISTS "announcements_select_active" ON announcements;
CREATE POLICY "announcements_select_active"
  ON announcements FOR SELECT
  USING (
    (
      is_draft = false
      AND publish_at <= NOW()
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (
        audience = 'all'
        OR (audience = 'program' AND has_active_enrollment(program_id))
        OR (audience = 'user' AND user_id = auth.uid())
      )
    )
    OR is_staff_or_admin()
  );

-- Staff and Admin can create/update announcements, but ONLY admin can delete announcements
DROP POLICY IF EXISTS "announcements_write_staff" ON announcements;
CREATE POLICY "announcements_insert_staff"
  ON announcements FOR INSERT
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "announcements_update_staff"
  ON announcements FOR UPDATE
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "announcements_delete_admin_only"
  ON announcements FOR DELETE
  USING (is_admin());

-- ============================================================================
-- 4. Rate Limiting & Safety for Announcements
-- ============================================================================

CREATE OR REPLACE FUNCTION check_announcement_safety_and_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count INT;
BEGIN
  -- 1. Body validation
  IF NEW.body IS NULL OR length(trim(NEW.body)) = 0 THEN
    RAISE EXCEPTION 'Announcement body cannot be empty';
  END IF;

  IF length(NEW.body) > 50000 THEN
    RAISE EXCEPTION 'Announcement body exceeds maximum allowed size (50,000 characters)';
  END IF;

  -- 2. Rate limit: max 20 announcements per hour per admin/staff
  IF auth.uid() IS NOT NULL THEN
    SELECT COUNT(*) INTO v_recent_count
    FROM audit_log
    WHERE actor_id = auth.uid()
      AND entity = 'announcements'
      AND action IN ('create', 'INSERT')
      AND created_at >= NOW() - INTERVAL '1 hour';

    IF v_recent_count >= 20 THEN
      RAISE EXCEPTION 'Rate limit exceeded: you may create at most 20 announcements per hour';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_announcement_safety ON announcements;
CREATE TRIGGER trg_check_announcement_safety
  BEFORE INSERT ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION check_announcement_safety_and_rate_limit();

-- ============================================================================
-- 5. Stored Procedures / RPCs for Step 5
-- ============================================================================

-- 5A. RPC: upsert_session_with_links
-- Transactionally saves session metadata and link fields
CREATE OR REPLACE FUNCTION upsert_session_with_links(
  p_program_id UUID,
  p_day_number INT,
  p_title TEXT,
  p_scheduled_at TIMESTAMPTZ,
  p_session_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_live_platform live_platform DEFAULT 'zoom',
  p_status session_status DEFAULT 'scheduled',
  p_task_title TEXT DEFAULT NULL,
  p_task_body TEXT DEFAULT NULL,
  p_resources JSONB DEFAULT '[]'::jsonb,
  p_live_url TEXT DEFAULT NULL,
  p_recording_url TEXT DEFAULT NULL,
  p_recording_visible BOOLEAN DEFAULT FALSE,
  p_is_link_published BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_session program_sessions%ROWTYPE;
  v_links session_links%ROWTYPE;
  v_published_at TIMESTAMPTZ;
  v_published_by UUID;
BEGIN
  -- Permission check
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied: staff or admin role required';
  END IF;

  -- URL validation: must start with https:// if provided
  IF p_live_url IS NOT NULL AND length(trim(p_live_url)) > 0 THEN
    IF NOT (trim(p_live_url) ~* '^https://') THEN
      RAISE EXCEPTION 'Live URL must be a valid secure URL starting with https://';
    END IF;
  END IF;

  IF p_recording_url IS NOT NULL AND length(trim(p_recording_url)) > 0 THEN
    IF NOT (trim(p_recording_url) ~* '^https://') THEN
      RAISE EXCEPTION 'Recording URL must be a valid secure URL starting with https://';
    END IF;
  END IF;

  -- 1. Upsert program_sessions
  IF p_session_id IS NOT NULL THEN
    UPDATE program_sessions
    SET
      day_number = p_day_number,
      title = p_title,
      description = p_description,
      scheduled_at = p_scheduled_at,
      live_platform = p_live_platform,
      status = p_status,
      task_title = p_task_title,
      task_body = p_task_body,
      resources = COALESCE(p_resources, '[]'::jsonb),
      updated_at = NOW()
    WHERE id = p_session_id
    RETURNING * INTO v_session;

    v_session_id := p_session_id;
  ELSE
    INSERT INTO program_sessions (
      program_id,
      day_number,
      title,
      description,
      scheduled_at,
      live_platform,
      status,
      task_title,
      task_body,
      resources
    )
    VALUES (
      p_program_id,
      p_day_number,
      p_title,
      p_description,
      p_scheduled_at,
      p_live_platform,
      p_status,
      p_task_title,
      p_task_body,
      COALESCE(p_resources, '[]'::jsonb)
    )
    RETURNING * INTO v_session;

    v_session_id := v_session.id;
  END IF;

  -- 2. Upsert session_links
  -- Determine link publishing timestamp
  SELECT link_published_at, link_published_by
  INTO v_published_at, v_published_by
  FROM session_links
  WHERE session_id = v_session_id;

  IF p_is_link_published AND p_live_url IS NOT NULL AND length(trim(p_live_url)) > 0 THEN
    v_published_at := COALESCE(v_published_at, NOW());
    v_published_by := COALESCE(v_published_by, auth.uid());
  ELSIF NOT p_is_link_published THEN
    v_published_at := NULL;
    v_published_by := NULL;
  END IF;

  INSERT INTO session_links (
    session_id,
    live_url,
    recording_url,
    link_published_at,
    link_published_by,
    recording_visible
  )
  VALUES (
    v_session_id,
    p_live_url,
    p_recording_url,
    v_published_at,
    v_published_by,
    p_recording_visible
  )
  ON CONFLICT (session_id) DO UPDATE
  SET
    live_url = EXCLUDED.live_url,
    recording_url = EXCLUDED.recording_url,
    link_published_at = EXCLUDED.link_published_at,
    link_published_by = EXCLUDED.link_published_by,
    recording_visible = EXCLUDED.recording_visible,
    updated_at = NOW()
  RETURNING * INTO v_links;

  -- Audit log entry
  INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (
    auth.uid(),
    CASE WHEN p_session_id IS NULL THEN 'create' ELSE 'update' END,
    'program_sessions',
    v_session_id,
    jsonb_build_object(
      'title', v_session.title,
      'day_number', v_session.day_number,
      'status', v_session.status,
      'has_live_link', (v_links.live_url IS NOT NULL),
      'link_published', (v_links.link_published_at IS NOT NULL),
      'recording_visible', v_links.recording_visible
    )
  );

  RETURN jsonb_build_object(
    'session', row_to_json(v_session),
    'links', row_to_json(v_links)
  );
END;
$$;

-- 5B. RPC: publish_session_link
-- Verifies, saves link, and optionally fans out notifications to enrolled students
CREATE OR REPLACE FUNCTION publish_session_link(
  p_session_id UUID,
  p_live_url TEXT,
  p_notify_enrollees BOOLEAN DEFAULT TRUE,
  p_force_renotify BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session program_sessions%ROWTYPE;
  v_program programs%ROWTYPE;
  v_enrollee RECORD;
  v_notified_count INT := 0;
  v_dedupe_key TEXT;
  v_existing_published_at TIMESTAMPTZ;
  v_notification_title TEXT;
  v_notification_body TEXT;
BEGIN
  -- Permission check
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied: staff or admin role required';
  END IF;

  -- Validation
  IF p_live_url IS NULL OR length(trim(p_live_url)) = 0 THEN
    RAISE EXCEPTION 'Live URL cannot be empty';
  END IF;

  IF NOT (trim(p_live_url) ~* '^https://') THEN
    RAISE EXCEPTION 'Live URL must start with https://';
  END IF;

  -- Fetch session and program
  SELECT * INTO v_session FROM program_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  SELECT * INTO v_program FROM programs WHERE id = v_session.program_id;

  -- Get existing published state
  SELECT link_published_at INTO v_existing_published_at
  FROM session_links
  WHERE session_id = p_session_id;

  -- Upsert session_links
  INSERT INTO session_links (
    session_id,
    live_url,
    link_published_at,
    link_published_by
  )
  VALUES (
    p_session_id,
    trim(p_live_url),
    NOW(),
    auth.uid()
  )
  ON CONFLICT (session_id) DO UPDATE
  SET
    live_url = EXCLUDED.live_url,
    link_published_at = NOW(),
    link_published_by = auth.uid(),
    updated_at = NOW();

  -- Fan-out notifications to active enrollees
  IF p_notify_enrollees THEN
    v_notification_title := 'Live Link Ready: ' || v_session.title;
    v_notification_body := 'Day ' || v_session.day_number || ' live session link is live for ' || v_program.title || '. Tap to join.';

    FOR v_enrollee IN
      SELECT user_id
      FROM enrollments
      WHERE program_id = v_session.program_id
        AND status = 'active'
    LOOP
      -- Unique deduplication key: session_id + link hash (or timestamp if force re-notify) + user_id
      IF p_force_renotify THEN
        v_dedupe_key := 'session_link:' || p_session_id::text || ':' || extract(epoch from now())::text || ':' || v_enrollee.user_id::text;
      ELSE
        v_dedupe_key := 'session_link:' || p_session_id::text || ':' || md5(p_live_url) || ':' || v_enrollee.user_id::text;
      END IF;

      INSERT INTO notifications (
        user_id,
        title,
        body,
        type,
        link_url,
        notification_dedupe_key
      )
      VALUES (
        v_enrollee.user_id,
        v_notification_title,
        v_notification_body,
        'session_link',
        '/programs/' || v_program.slug || '?day=' || v_session.day_number,
        v_dedupe_key
      )
      ON CONFLICT (notification_dedupe_key) DO NOTHING;

      IF FOUND THEN
        v_notified_count := v_notified_count + 1;
      END IF;
    END LOOP;
  END IF;

  -- Audit log entry
  INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (
    auth.uid(),
    'publish_session_link',
    'program_sessions',
    p_session_id,
    jsonb_build_object(
      'live_url', p_live_url,
      'notify_enrollees', p_notify_enrollees,
      'notified_count', v_notified_count,
      're_notified', (v_existing_published_at IS NOT NULL)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'notified_count', v_notified_count,
    'published_at', NOW()
  );
END;
$$;

-- 5C. RPC: fan_out_scheduled_announcements
-- Idempotent function run by pg_cron or manually by admins
CREATE OR REPLACE FUNCTION fan_out_scheduled_announcements()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_announcement RECORD;
  v_target_user RECORD;
  v_total_announcements INT := 0;
  v_total_notifications INT := 0;
  v_dedupe_key TEXT;
BEGIN
  -- Find all published, non-draft announcements where publish_at has passed and not yet fanned out
  FOR v_announcement IN
    SELECT a.*
    FROM announcements a
    WHERE a.is_draft = false
      AND a.fanned_out_at IS NULL
      AND a.publish_at <= NOW()
      AND (a.expires_at IS NULL OR a.expires_at > NOW())
    ORDER BY a.publish_at ASC
  LOOP
    v_total_announcements := v_total_announcements + 1;

    -- Fan out according to audience
    IF v_announcement.audience = 'all' THEN
      FOR v_target_user IN
        SELECT id AS user_id FROM profiles WHERE is_blocked = false AND role = 'student'
      LOOP
        v_dedupe_key := 'announcement:' || v_announcement.id::text || ':' || v_target_user.user_id::text;
        INSERT INTO notifications (user_id, title, body, type, link_url, notification_dedupe_key)
        VALUES (
          v_target_user.user_id,
          v_announcement.title,
          substring(regexp_replace(v_announcement.body, '<[^>]+>', '', 'g') from 1 for 150),
          'announcement',
          COALESCE(v_announcement.cta_url, '/inbox'),
          v_dedupe_key
        )
        ON CONFLICT (notification_dedupe_key) DO NOTHING;

        IF FOUND THEN
          v_total_notifications := v_total_notifications + 1;
        END IF;
      END LOOP;

    ELSIF v_announcement.audience = 'program' AND v_announcement.program_id IS NOT NULL THEN
      FOR v_target_user IN
        SELECT user_id FROM enrollments WHERE program_id = v_announcement.program_id AND status = 'active'
      LOOP
        v_dedupe_key := 'announcement:' || v_announcement.id::text || ':' || v_target_user.user_id::text;
        INSERT INTO notifications (user_id, title, body, type, link_url, notification_dedupe_key)
        VALUES (
          v_target_user.user_id,
          v_announcement.title,
          substring(regexp_replace(v_announcement.body, '<[^>]+>', '', 'g') from 1 for 150),
          'announcement',
          COALESCE(v_announcement.cta_url, '/inbox'),
          v_dedupe_key
        )
        ON CONFLICT (notification_dedupe_key) DO NOTHING;

        IF FOUND THEN
          v_total_notifications := v_total_notifications + 1;
        END IF;
      END LOOP;

    ELSIF v_announcement.audience = 'user' AND v_announcement.user_id IS NOT NULL THEN
      v_dedupe_key := 'announcement:' || v_announcement.id::text || ':' || v_announcement.user_id::text;
      INSERT INTO notifications (user_id, title, body, type, link_url, notification_dedupe_key)
      VALUES (
        v_announcement.user_id,
        v_announcement.title,
        substring(regexp_replace(v_announcement.body, '<[^>]+>', '', 'g') from 1 for 150),
        'announcement',
        COALESCE(v_announcement.cta_url, '/inbox'),
        v_dedupe_key
      )
      ON CONFLICT (notification_dedupe_key) DO NOTHING;

      IF FOUND THEN
        v_total_notifications := v_total_notifications + 1;
      END IF;
    END IF;

    -- Mark announcement as fanned out
    UPDATE announcements
    SET fanned_out_at = NOW()
    WHERE id = v_announcement.id;

    -- Audit log
    INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
    VALUES (
      auth.uid(),
      'fan_out_announcement',
      'announcements',
      v_announcement.id,
      jsonb_build_object('audience', v_announcement.audience, 'title', v_announcement.title)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'announcements_processed', v_total_announcements,
    'notifications_created', v_total_notifications
  );
END;
$$;

-- 5D. RPC: generate_challenge_schedule
-- Batch creates program_sessions rows starting from p_start_date with default IST daily time
CREATE OR REPLACE FUNCTION generate_challenge_schedule(
  p_program_id UUID,
  p_start_date DATE,
  p_daily_time_ist TIME,
  p_total_days INT,
  p_overwrite BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_day INT;
  v_scheduled_at TIMESTAMPTZ;
  v_created_sessions INT := 0;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied: staff or admin role required';
  END IF;

  IF p_total_days < 1 OR p_total_days > 100 THEN
    RAISE EXCEPTION 'Total days must be between 1 and 100';
  END IF;

  -- Check existing days
  SELECT COUNT(*) INTO v_count FROM program_sessions WHERE program_id = p_program_id;

  IF v_count > 0 AND NOT p_overwrite THEN
    RAISE EXCEPTION 'Program already has % sessions. Set overwrite=true to regenerate.', v_count;
  END IF;

  IF v_count > 0 AND p_overwrite THEN
    -- Check if any session has attendance
    IF EXISTS (
      SELECT 1 FROM session_attendance sa
      JOIN program_sessions ps ON ps.id = sa.session_id
      WHERE ps.program_id = p_program_id
    ) THEN
      RAISE EXCEPTION 'Cannot regenerate schedule: students have already attended sessions in this challenge.';
    END IF;

    DELETE FROM program_sessions WHERE program_id = p_program_id;
  END IF;

  -- Generate sessions
  FOR v_day IN 1..p_total_days LOOP
    -- Compute timestamp in IST (+05:30)
    -- Combining (p_start_date + (v_day - 1) days) and p_daily_time_ist at 'Asia/Kolkata'
    v_scheduled_at := ((p_start_date + (v_day - 1) * INTERVAL '1 day')::date || ' ' || p_daily_time_ist::text)::timestamp AT TIME ZONE 'Asia/Kolkata';

    INSERT INTO program_sessions (
      program_id,
      day_number,
      title,
      scheduled_at,
      status,
      live_platform,
      resources
    )
    VALUES (
      p_program_id,
      v_day,
      'Day ' || v_day,
      v_scheduled_at,
      'scheduled',
      'zoom',
      '[]'::jsonb
    );

    v_created_sessions := v_created_sessions + 1;
  END LOOP;

  -- Audit log
  INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (
    auth.uid(),
    'generate_schedule',
    'programs',
    p_program_id,
    jsonb_build_object(
      'total_days', p_total_days,
      'start_date', p_start_date,
      'daily_time_ist', p_daily_time_ist,
      'sessions_created', v_created_sessions
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'sessions_created', v_created_sessions
  );
END;
$$;

-- 5E. RPC: shift_challenge_schedule
-- Shifts all session scheduled_at timestamps by p_shift_days
CREATE OR REPLACE FUNCTION shift_challenge_schedule(
  p_program_id UUID,
  p_shift_days INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INT;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied: staff or admin role required';
  END IF;

  UPDATE program_sessions
  SET
    scheduled_at = scheduled_at + (p_shift_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE program_id = p_program_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (
    auth.uid(),
    'shift_schedule',
    'programs',
    p_program_id,
    jsonb_build_object('shift_days', p_shift_days, 'sessions_updated', v_updated_count)
  );

  RETURN jsonb_build_object(
    'success', true,
    'sessions_updated', v_updated_count
  );
END;
$$;

-- ============================================================================
-- 6. pg_cron Scheduled Job Setup (Safely guarded)
-- ============================================================================

DO $$
BEGIN
  -- Attempt to enable pg_cron extension if not present
  CREATE EXTENSION IF NOT EXISTS "pg_cron";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension notice: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule existing job if present
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fan-out-scheduled-announcements') THEN
      PERFORM cron.unschedule('fan-out-scheduled-announcements');
    END IF;

    -- Schedule every minute
    PERFORM cron.schedule(
      'fan-out-scheduled-announcements',
      '* * * * *',
      'SELECT fan_out_scheduled_announcements()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END $$;

