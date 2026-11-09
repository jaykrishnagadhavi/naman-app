-- Migration: 20261105000002_fix_session_and_announcement_audit.sql
-- Description: Fix audit_log column references (actor -> actor_id), add save_session_with_links alias, and support pin_until

-- ============================================================================
-- 1. Announcements column enhancements (pin_until)
-- ============================================================================
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS pin_until TIMESTAMPTZ;

COMMENT ON COLUMN announcements.pin_until IS 'Optional timestamp until which the announcement remains pinned';

-- ============================================================================
-- 2. Fix Announcement Safety & Rate Limiting Trigger Function
-- ============================================================================
CREATE OR REPLACE FUNCTION check_announcement_safety_and_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INT;
BEGIN
  -- 1. Validation
  IF NEW.title IS NULL OR length(trim(NEW.title)) = 0 THEN
    RAISE EXCEPTION 'Announcement title cannot be empty';
  END IF;

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

-- ============================================================================
-- 3. Stored Procedure: save_session_with_links
-- ============================================================================
CREATE OR REPLACE FUNCTION save_session_with_links(
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
  p_recording_visible BOOLEAN DEFAULT false,
  p_is_link_published BOOLEAN DEFAULT false,
  p_notify_enrollees BOOLEAN DEFAULT false
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
  v_prev_live_url TEXT;
  v_notified_count INT := 0;
  v_enrollment RECORD;
  v_dedupe_key TEXT;
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

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Session with id % not found', p_session_id;
    END IF;

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
  SELECT link_published_at, link_published_by, live_url
  INTO v_published_at, v_published_by, v_prev_live_url
  FROM session_links
  WHERE session_id = v_session_id;

  IF p_is_link_published AND p_live_url IS NOT NULL AND length(trim(p_live_url)) > 0 THEN
    -- Only update link_published_at when transitioning from unpublished to published,
    -- or when live URL changes while published
    IF v_published_at IS NULL OR (v_prev_live_url IS DISTINCT FROM trim(p_live_url)) THEN
      v_published_at := NOW();
      v_published_by := auth.uid();
    END IF;
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

  -- 3. Fan out notification if live link published and notification requested
  IF p_notify_enrollees AND p_is_link_published AND p_live_url IS NOT NULL AND length(trim(p_live_url)) > 0 THEN
    FOR v_enrollment IN
      SELECT e.user_id
      FROM enrollments e
      WHERE e.program_id = v_session.program_id
        AND e.status = 'active'
    LOOP
      v_dedupe_key := 'session_link:' || v_session_id::text || ':' || v_enrollment.user_id::text;

      INSERT INTO notifications (
        user_id,
        title,
        body,
        type,
        link_url,
        notification_dedupe_key
      )
      VALUES (
        v_enrollment.user_id,
        'Live session link ready: ' || v_session.title,
        'The live link for Day ' || v_session.day_number || ' is now available. Click to join when the session begins.',
        'session_link',
        p_live_url,
        v_dedupe_key
      )
      ON CONFLICT (notification_dedupe_key) DO NOTHING;

      IF FOUND THEN
        v_notified_count := v_notified_count + 1;
      END IF;
    END LOOP;
  END IF;

  -- 4. Audit log entry with actor_id (not actor)
  INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (
    auth.uid(),
    CASE WHEN p_session_id IS NULL THEN 'create' ELSE 'update' END,
    'program_sessions',
    v_session_id::text,
    jsonb_build_object(
      'title', v_session.title,
      'day_number', v_session.day_number,
      'status', v_session.status,
      'has_live_link', (v_links.live_url IS NOT NULL),
      'link_published', (v_links.link_published_at IS NOT NULL),
      'recording_visible', v_links.recording_visible,
      'notified_count', v_notified_count
    )
  );

  RETURN jsonb_build_object(
    'session', row_to_json(v_session),
    'links', row_to_json(v_links),
    'notified_count', v_notified_count
  );
END;
$$;

-- Alias function: upsert_session_with_links forwards to save_session_with_links
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
  p_recording_visible BOOLEAN DEFAULT false,
  p_is_link_published BOOLEAN DEFAULT false,
  p_notify_enrollees BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN save_session_with_links(
    p_program_id := p_program_id,
    p_day_number := p_day_number,
    p_title := p_title,
    p_scheduled_at := p_scheduled_at,
    p_session_id := p_session_id,
    p_description := p_description,
    p_live_platform := p_live_platform,
    p_status := p_status,
    p_task_title := p_task_title,
    p_task_body := p_task_body,
    p_resources := p_resources,
    p_live_url := p_live_url,
    p_recording_url := p_recording_url,
    p_recording_visible := p_recording_visible,
    p_is_link_published := p_is_link_published,
    p_notify_enrollees := p_notify_enrollees
  );
END;
$$;

-- ============================================================================
-- 4. Fix publish_session_link audit_log reference
-- ============================================================================
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
  v_links session_links%ROWTYPE;
  v_notified_count INT := 0;
  v_enrollment RECORD;
  v_dedupe_key TEXT;
  v_existing_published_at TIMESTAMPTZ;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied: staff or admin role required';
  END IF;

  IF p_live_url IS NULL OR NOT (trim(p_live_url) ~* '^https://') THEN
    RAISE EXCEPTION 'Live URL must be a valid secure URL starting with https://';
  END IF;

  SELECT * INTO v_session FROM program_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session with id % not found', p_session_id;
  END IF;

  SELECT link_published_at INTO v_existing_published_at
  FROM session_links
  WHERE session_id = p_session_id;

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
    link_published_by = EXCLUDED.link_published_by,
    updated_at = NOW()
  RETURNING * INTO v_links;

  IF p_notify_enrollees THEN
    FOR v_enrollment IN
      SELECT e.user_id
      FROM enrollments e
      WHERE e.program_id = v_session.program_id
        AND e.status = 'active'
    LOOP
      IF p_force_renotify THEN
        v_dedupe_key := 'session_link:' || p_session_id::text || ':' || v_enrollment.user_id::text || ':' || extract(epoch from now())::int;
      ELSE
        v_dedupe_key := 'session_link:' || p_session_id::text || ':' || v_enrollment.user_id::text;
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
        v_enrollment.user_id,
        'Live session link ready: ' || v_session.title,
        'The live link for Day ' || v_session.day_number || ' is now available. Click to join when the session begins.',
        'session_link',
        p_live_url,
        v_dedupe_key
      )
      ON CONFLICT (notification_dedupe_key) DO NOTHING;

      IF FOUND THEN
        v_notified_count := v_notified_count + 1;
      END IF;
    END LOOP;
  END IF;

  -- Audit log entry with actor_id
  INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (
    auth.uid(),
    'publish_session_link',
    'program_sessions',
    p_session_id::text,
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
    'live_url', v_links.live_url,
    'published_at', v_links.link_published_at,
    'notified_count', v_notified_count
  );
END;
$$;

-- ============================================================================
-- 5. Fix fan_out_scheduled_announcements audit_log reference
-- ============================================================================
CREATE OR REPLACE FUNCTION fan_out_scheduled_announcements()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_announcement RECORD;
  v_enrollment RECORD;
  v_dedupe_key TEXT;
  v_total_announcements INT := 0;
  v_total_notifications INT := 0;
BEGIN
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

    IF v_announcement.audience = 'all' THEN
      FOR v_enrollment IN
        SELECT p.id as user_id
        FROM profiles p
        WHERE p.role = 'student'
      LOOP
        v_dedupe_key := 'announcement:' || v_announcement.id::text || ':' || v_enrollment.user_id::text;
        INSERT INTO notifications (user_id, title, body, type, link_url, notification_dedupe_key)
        VALUES (
          v_enrollment.user_id,
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
      FOR v_enrollment IN
        SELECT e.user_id
        FROM enrollments e
        WHERE e.program_id = v_announcement.program_id
          AND e.status = 'active'
      LOOP
        v_dedupe_key := 'announcement:' || v_announcement.id::text || ':' || v_enrollment.user_id::text;
        INSERT INTO notifications (user_id, title, body, type, link_url, notification_dedupe_key)
        VALUES (
          v_enrollment.user_id,
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

    -- Audit log with actor_id
    INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
    VALUES (
      auth.uid(),
      'fan_out_announcement',
      'announcements',
      v_announcement.id::text,
      jsonb_build_object('audience', v_announcement.audience, 'title', v_announcement.title)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'announcements_processed', v_total_announcements,
    'notifications_created', v_total_notifications
  );
END;
$$;

-- ============================================================================
-- 6. Fix generate_challenge_schedule audit_log reference
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_challenge_schedule(
  p_program_id UUID,
  p_start_date DATE,
  p_daily_time_ist TIME DEFAULT '07:00:00'::TIME,
  p_total_days INT DEFAULT 21,
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

  -- Audit log with actor_id
  INSERT INTO audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (
    auth.uid(),
    'generate_schedule',
    'programs',
    p_program_id::text,
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

-- ============================================================================
-- 7. Fix shift_challenge_schedule audit_log reference
-- ============================================================================
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
    p_program_id::text,
    jsonb_build_object('shift_days', p_shift_days, 'sessions_updated', v_updated_count)
  );

  RETURN jsonb_build_object(
    'success', true,
    'sessions_updated', v_updated_count
  );
END;
$$;
