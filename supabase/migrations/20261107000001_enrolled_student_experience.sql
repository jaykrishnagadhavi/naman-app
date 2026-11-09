-- Migration: 20261107000001_enrolled_student_experience.sql
-- Description: Step 8 Enrolled Student Experience: task_completions, payment_interest,
-- and SECURITY DEFINER RPCs for enrolled dashboards, join live links, recordings, free enrollment,
-- admin enrollment management, and real-time inbox/notifications.

-- ============================================================================
-- 1. Task Completions Table (Per-session student action item tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, session_id)
);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_completions_select_owner_or_staff" ON task_completions;
CREATE POLICY "task_completions_select_owner_or_staff"
  ON task_completions FOR SELECT
  USING (auth.uid() = user_id OR is_staff_or_admin());

DROP POLICY IF EXISTS "task_completions_insert_owner" ON task_completions;
CREATE POLICY "task_completions_insert_owner"
  ON task_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "task_completions_update_owner" ON task_completions;
CREATE POLICY "task_completions_update_owner"
  ON task_completions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "task_completions_delete_owner" ON task_completions;
CREATE POLICY "task_completions_delete_owner"
  ON task_completions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_task_completions_user_session
  ON task_completions (user_id, session_id);

-- ============================================================================
-- 2. Payment Interest Table (Capture student interest while payments are paused)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email CITEXT NOT NULL,
  phone TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, email)
);

ALTER TABLE payment_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_interest_select" ON payment_interest;
CREATE POLICY "payment_interest_select"
  ON payment_interest FOR SELECT
  USING (is_staff_or_admin() OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

DROP POLICY IF EXISTS "payment_interest_insert" ON payment_interest;
CREATE POLICY "payment_interest_insert"
  ON payment_interest FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "payment_interest_staff_update" ON payment_interest;
CREATE POLICY "payment_interest_staff_update"
  ON payment_interest FOR UPDATE
  USING (is_staff_or_admin());

CREATE INDEX IF NOT EXISTS idx_payment_interest_program_email
  ON payment_interest (program_id, email);

-- ============================================================================
-- 3. Update protect_enrollments trigger to allow trusted procedures
-- ============================================================================
CREATE OR REPLACE FUNCTION protect_enrollments()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If invoked in psql without JWT, service_role, by admin, or inside trusted enrollment procedure
  IF auth.role() IS NULL
     OR (auth.jwt() ->> 'role' = 'service_role')
     OR is_admin()
     OR current_setting('app.trusted_enrollment', true) = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  RAISE EXCEPTION 'Unauthorized: Direct enrollment modifications are restricted to administrators and checkout services';
END;
$$;

-- ============================================================================
-- 4. Free Program Enrollment RPC (enroll_free)
-- ============================================================================
CREATE OR REPLACE FUNCTION enroll_free(p_program_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_program programs%ROWTYPE;
  v_existing enrollments%ROWTYPE;
  v_enrollment_id UUID;
  v_active_seats INTEGER;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to enroll';
  END IF;

  SELECT * INTO v_program
  FROM programs
  WHERE id = p_program_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program not found';
  END IF;

  IF v_program.status NOT IN ('published', 'live') THEN
    RAISE EXCEPTION 'Program is not currently open for enrollment';
  END IF;

  IF v_program.price_paise > 0 THEN
    RAISE EXCEPTION 'Program requires payment and cannot be enrolled for free';
  END IF;

  IF v_program.enrollment_deadline IS NOT NULL AND NOW() > v_program.enrollment_deadline THEN
    RAISE EXCEPTION 'Enrollment deadline for this program has passed';
  END IF;

  IF v_program.max_seats IS NOT NULL THEN
    SELECT COUNT(*) INTO v_active_seats
    FROM enrollments
    WHERE program_id = p_program_id AND status = 'active';

    IF v_active_seats >= v_program.max_seats THEN
      RAISE EXCEPTION 'Cohort is full. No seats remaining';
    END IF;
  END IF;

  -- Check existing enrollment
  SELECT * INTO v_existing
  FROM enrollments
  WHERE user_id = v_uid AND program_id = p_program_id;

  IF FOUND AND v_existing.status = 'active' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_enrolled', true,
      'enrollment_id', v_existing.id,
      'slug', v_program.slug
    );
  END IF;

  -- Allow trusted enrollment inside trigger
  PERFORM set_config('app.trusted_enrollment', 'true', true);

  INSERT INTO enrollments (
    user_id,
    program_id,
    status,
    enrolled_at,
    source,
    access_until
  )
  VALUES (
    v_uid,
    p_program_id,
    'active',
    NOW(),
    'coupon_free',
    v_program.ends_at
  )
  ON CONFLICT (user_id, program_id) DO UPDATE SET
    status = 'active',
    access_until = EXCLUDED.access_until,
    updated_at = NOW()
  RETURNING id INTO v_enrollment_id;

  -- Insert welcome notification
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    link_url
  ) VALUES (
    v_uid,
    'Welcome to ' || v_program.title || '!',
    'Your free enrollment is active. Explore your dashboard and get ready for Day 1.',
    'enrollment',
    '/my-programs?welcome=' || v_program.slug
  );

  RETURN jsonb_build_object(
    'ok', true,
    'already_enrolled', false,
    'enrollment_id', v_enrollment_id,
    'slug', v_program.slug
  );
END;
$$;

-- ============================================================================
-- 5. Student Enrolled Programs Dashboard RPC (get_my_programs)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_my_programs()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  WITH user_enrollments AS (
    SELECT
      e.id AS enrollment_id,
      e.program_id,
      e.status AS enrollment_status,
      e.enrolled_at,
      e.access_until,
      e.source,
      p.title,
      p.slug,
      p.type,
      p.category,
      p.short_description,
      p.cover_image_url,
      p.poster_image_url,
      p.thumbnail_url,
      p.starts_at,
      p.ends_at,
      p.status AS program_status
    FROM enrollments e
    JOIN programs p ON e.program_id = p.id
    WHERE e.user_id = v_uid
      AND e.status = 'active'
      AND (e.access_until IS NULL OR e.access_until > NOW())
      AND p.deleted_at IS NULL
  ),
  session_stats AS (
    SELECT
      ue.program_id,
      COUNT(ps.id) AS total_sessions,
      COUNT(DISTINCT tc.session_id) FILTER (WHERE tc.completed = true) AS completed_tasks,
      COUNT(DISTINCT sa.session_id) AS attended_sessions
    FROM user_enrollments ue
    LEFT JOIN program_sessions ps ON ue.program_id = ps.program_id
    LEFT JOIN task_completions tc ON ps.id = tc.session_id AND tc.user_id = v_uid AND tc.completed = true
    LEFT JOIN session_attendance sa ON ps.id = sa.session_id AND sa.user_id = v_uid
    GROUP BY ue.program_id
  ),
  next_sessions AS (
    SELECT DISTINCT ON (ue.program_id)
      ue.program_id,
      ps.id AS next_session_id,
      ps.day_number AS next_session_day_number,
      ps.title AS next_session_title,
      ps.scheduled_at AS next_session_scheduled_at,
      ps.live_platform AS next_session_live_platform,
      ps.status AS next_session_status
    FROM user_enrollments ue
    JOIN program_sessions ps ON ue.program_id = ps.program_id
    WHERE ps.status IN ('live', 'scheduled')
      AND ps.scheduled_at >= NOW() - INTERVAL '2 hours'
    ORDER BY ue.program_id, (ps.status = 'live') DESC, ps.scheduled_at ASC
  ),
  live_sessions AS (
    SELECT DISTINCT ue.program_id
    FROM user_enrollments ue
    JOIN program_sessions ps ON ue.program_id = ps.program_id
    WHERE ps.status = 'live'
       OR (ps.status = 'scheduled' AND NOW() >= ps.scheduled_at - INTERVAL '15 minutes' AND NOW() <= ps.scheduled_at + INTERVAL '2 hours')
  ),
  today_sessions AS (
    SELECT DISTINCT ue.program_id
    FROM user_enrollments ue
    JOIN program_sessions ps ON ue.program_id = ps.program_id
    WHERE (ps.scheduled_at AT TIME ZONE 'Asia/Kolkata')::DATE = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'enrollment_id', ue.enrollment_id,
        'program_id', ue.program_id,
        'title', ue.title,
        'slug', ue.slug,
        'type', ue.type,
        'category', ue.category,
        'short_description', ue.short_description,
        'cover_image_url', ue.cover_image_url,
        'poster_image_url', ue.poster_image_url,
        'thumbnail_url', ue.thumbnail_url,
        'starts_at', ue.starts_at,
        'ends_at', ue.ends_at,
        'program_status', ue.program_status,
        'enrolled_at', ue.enrolled_at,
        'access_until', ue.access_until,
        'source', ue.source,
        'status', ue.enrollment_status,
        'total_sessions', COALESCE(ss.total_sessions, 0),
        'completed_sessions', GREATEST(COALESCE(ss.completed_tasks, 0), COALESCE(ss.attended_sessions, 0)),
        'progress_pct', CASE
          WHEN COALESCE(ss.total_sessions, 0) = 0 THEN 0
          ELSE LEAST(100, ROUND((GREATEST(COALESCE(ss.completed_tasks, 0), COALESCE(ss.attended_sessions, 0))::NUMERIC / ss.total_sessions::NUMERIC) * 100))
        END,
        'next_session', CASE
          WHEN ns.next_session_id IS NOT NULL THEN jsonb_build_object(
            'id', ns.next_session_id,
            'day_number', ns.next_session_day_number,
            'title', ns.next_session_title,
            'scheduled_at', ns.next_session_scheduled_at,
            'live_platform', ns.next_session_live_platform,
            'status', ns.next_session_status
          )
          ELSE NULL
        END,
        'is_live_now', (ls.program_id IS NOT NULL),
        'has_today_session', (ts.program_id IS NOT NULL)
      )
      ORDER BY
        (ls.program_id IS NOT NULL) DESC,
        (ts.program_id IS NOT NULL) DESC,
        ue.enrolled_at DESC
    ),
    '[]'::jsonb
  ) INTO v_result
  FROM user_enrollments ue
  LEFT JOIN session_stats ss ON ue.program_id = ss.program_id
  LEFT JOIN next_sessions ns ON ue.program_id = ns.program_id
  LEFT JOIN live_sessions ls ON ue.program_id = ls.program_id
  LEFT JOIN today_sessions ts ON ue.program_id = ts.program_id;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- 6. Enrolled Program Journey Detail RPC (get_program_enrolled)
-- CRITICAL SECURITY: Never selects or returns live_url or recording_url!
-- ============================================================================
CREATE OR REPLACE FUNCTION get_program_enrolled(p_slug TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_program programs%ROWTYPE;
  v_enrollment enrollments%ROWTYPE;
  v_is_staff BOOLEAN;
  v_sessions JSONB;
  v_today_session JSONB;
  v_total_sessions INT;
  v_attended_count INT;
  v_completed_tasks INT;
BEGIN
  v_uid := auth.uid();
  v_is_staff := is_staff_or_admin();

  SELECT * INTO v_program
  FROM programs
  WHERE slug = LOWER(p_slug)::citext AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program not found';
  END IF;

  -- Check enrollment
  IF v_uid IS NOT NULL THEN
    SELECT * INTO v_enrollment
    FROM enrollments
    WHERE user_id = v_uid AND program_id = v_program.id;
  END IF;

  IF v_enrollment.id IS NULL AND NOT v_is_staff THEN
    RETURN jsonb_build_object(
      'is_enrolled', false,
      'program', jsonb_build_object(
        'id', v_program.id,
        'slug', v_program.slug,
        'title', v_program.title,
        'price_paise', v_program.price_paise
      )
    );
  END IF;

  -- Build sessions list (NEVER returning live_url or recording_url)
  WITH session_rows AS (
    SELECT
      ps.id,
      ps.day_number,
      ps.title,
      ps.description,
      ps.scheduled_at,
      ps.live_platform,
      ps.status,
      ps.task_title,
      ps.task_body,
      ps.resources,
      (sa.id IS NOT NULL) AS attended,
      COALESCE(tc.completed, false) AS task_completed,
      (sl.recording_url IS NOT NULL AND length(trim(sl.recording_url)) > 0) AS has_recording,
      (sl.live_url IS NOT NULL AND length(trim(sl.live_url)) > 0) AS has_live_link
    FROM program_sessions ps
    LEFT JOIN session_links sl ON ps.id = sl.session_id
    LEFT JOIN session_attendance sa ON ps.id = sa.session_id AND sa.user_id = v_uid
    LEFT JOIN task_completions tc ON ps.id = tc.session_id AND tc.user_id = v_uid
    WHERE ps.program_id = v_program.id
    ORDER BY ps.day_number ASC
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'day_number', day_number,
        'title', title,
        'description', description,
        'scheduled_at', scheduled_at,
        'live_platform', live_platform,
        'status', status,
        'task_title', task_title,
        'task_body', task_body,
        'resources', resources,
        'attended', attended,
        'task_completed', task_completed,
        'has_recording', has_recording,
        'has_live_link', has_live_link
      )
    ),
    '[]'::jsonb
  ) INTO v_sessions
  FROM session_rows;

  -- Find today's session or closest upcoming session
  WITH ranked_sessions AS (
    SELECT
      ps.id,
      ps.day_number,
      ps.title,
      ps.description,
      ps.scheduled_at,
      ps.live_platform,
      ps.status,
      ps.task_title,
      ps.task_body,
      ps.resources,
      (sa.id IS NOT NULL) AS attended,
      COALESCE(tc.completed, false) AS task_completed,
      (sl.recording_url IS NOT NULL AND length(trim(sl.recording_url)) > 0) AS has_recording,
      (sl.live_url IS NOT NULL AND length(trim(sl.live_url)) > 0) AS has_live_link,
      CASE
        WHEN ps.status = 'live' THEN 1
        WHEN (ps.scheduled_at AT TIME ZONE 'Asia/Kolkata')::DATE = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE THEN 2
        WHEN ps.status = 'scheduled' AND ps.scheduled_at >= NOW() THEN 3
        ELSE 4
      END AS priority
    FROM program_sessions ps
    LEFT JOIN session_links sl ON ps.id = sl.session_id
    LEFT JOIN session_attendance sa ON ps.id = sa.session_id AND sa.user_id = v_uid
    LEFT JOIN task_completions tc ON ps.id = tc.session_id AND tc.user_id = v_uid
    WHERE ps.program_id = v_program.id
    ORDER BY priority ASC, ps.day_number ASC
    LIMIT 1
  )
  SELECT CASE
    WHEN COUNT(*) > 0 THEN jsonb_build_object(
      'id', id,
      'day_number', day_number,
      'title', title,
      'description', description,
      'scheduled_at', scheduled_at,
      'live_platform', live_platform,
      'status', status,
      'task_title', task_title,
      'task_body', task_body,
      'resources', resources,
      'attended', attended,
      'task_completed', task_completed,
      'has_recording', has_recording,
      'has_live_link', has_live_link
    )
    ELSE NULL
  END INTO v_today_session
  FROM ranked_sessions
  GROUP BY id, day_number, title, description, scheduled_at, live_platform, status, task_title, task_body, resources, attended, task_completed, has_recording, has_live_link;

  -- Stats
  SELECT
    COUNT(ps.id),
    COUNT(DISTINCT sa.session_id),
    COUNT(DISTINCT tc.session_id) FILTER (WHERE tc.completed = true)
  INTO v_total_sessions, v_attended_count, v_completed_tasks
  FROM program_sessions ps
  LEFT JOIN session_attendance sa ON ps.id = sa.session_id AND sa.user_id = v_uid
  LEFT JOIN task_completions tc ON ps.id = tc.session_id AND tc.user_id = v_uid
  WHERE ps.program_id = v_program.id;

  RETURN jsonb_build_object(
    'is_enrolled', true,
    'enrollment', jsonb_build_object(
      'id', COALESCE(v_enrollment.id, '00000000-0000-0000-0000-000000000000'::uuid),
      'status', COALESCE(v_enrollment.status::text, 'active'),
      'enrolled_at', COALESCE(v_enrollment.enrolled_at, NOW()),
      'access_until', v_enrollment.access_until,
      'source', COALESCE(v_enrollment.source::text, 'staff_bypass')
    ),
    'program', jsonb_build_object(
      'id', v_program.id,
      'title', v_program.title,
      'slug', v_program.slug,
      'type', v_program.type,
      'category', v_program.category,
      'short_description', v_program.short_description,
      'description', v_program.description,
      'cover_image_url', v_program.cover_image_url,
      'poster_image_url', v_program.poster_image_url,
      'thumbnail_url', v_program.thumbnail_url,
      'starts_at', v_program.starts_at,
      'ends_at', v_program.ends_at,
      'price_paise', v_program.price_paise,
      'status', v_program.status,
      'what_you_will_learn', v_program.what_you_will_learn,
      'faq', v_program.faq
    ),
    'sessions', v_sessions,
    'today_session', v_today_session,
    'stats', jsonb_build_object(
      'total_sessions', v_total_sessions,
      'attended_sessions', v_attended_count,
      'completed_tasks', v_completed_tasks,
      'progress_pct', CASE
        WHEN v_total_sessions = 0 THEN 0
        ELSE LEAST(100, ROUND((GREATEST(v_attended_count, v_completed_tasks)::NUMERIC / v_total_sessions::NUMERIC) * 100))
      END
    )
  );
END;
$$;

-- ============================================================================
-- 7. Join Live Session RPC (get_session_link)
-- Join window: opens 60 mins before scheduled_at, closes 6 hours after.
-- Automatically logs attendance upon successful request.
-- ============================================================================
CREATE OR REPLACE FUNCTION get_session_link(p_session_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_session program_sessions%ROWTYPE;
  v_live_url TEXT;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO v_session
  FROM program_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  -- Enrollment check
  IF NOT is_staff_or_admin() THEN
    IF NOT EXISTS (
      SELECT 1 FROM enrollments
      WHERE user_id = v_uid
        AND program_id = v_session.program_id
        AND status = 'active'
        AND (access_until IS NULL OR access_until > NOW())
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_enrolled');
    END IF;
  END IF;

  -- Secret link check
  SELECT live_url INTO v_live_url
  FROM session_links
  WHERE session_id = p_session_id;

  IF v_live_url IS NULL OR length(trim(v_live_url)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_published');
  END IF;

  -- Join window check (unless session is marked live)
  IF v_session.status != 'live' THEN
    v_window_start := v_session.scheduled_at - INTERVAL '60 minutes';
    v_window_end := v_session.scheduled_at + INTERVAL '6 hours';

    IF NOW() < v_window_start THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason', 'too_early',
        'opens_at', v_window_start,
        'scheduled_at', v_session.scheduled_at
      );
    END IF;

    IF v_session.status = 'ended' OR NOW() > v_window_end THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'ended');
    END IF;
  END IF;

  -- Log attendance idempotently
  INSERT INTO session_attendance (
    user_id,
    session_id,
    attended_at
  ) VALUES (
    v_uid,
    p_session_id,
    NOW()
  )
  ON CONFLICT (user_id, session_id) DO UPDATE SET
    attended_at = EXCLUDED.attended_at;

  RETURN jsonb_build_object(
    'ok', true,
    'live_url', v_live_url,
    'platform', v_session.live_platform,
    'title', v_session.title
  );
END;
$$;

-- ============================================================================
-- 8. Get Past Session Recording RPC (get_session_recording)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_session_recording(p_session_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_session program_sessions%ROWTYPE;
  v_recording_url TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO v_session
  FROM program_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF NOT is_staff_or_admin() THEN
    IF NOT EXISTS (
      SELECT 1 FROM enrollments
      WHERE user_id = v_uid
        AND program_id = v_session.program_id
        AND status = 'active'
        AND (access_until IS NULL OR access_until > NOW())
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_enrolled');
    END IF;
  END IF;

  SELECT recording_url INTO v_recording_url
  FROM session_links
  WHERE session_id = p_session_id;

  IF v_recording_url IS NULL OR length(trim(v_recording_url)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_recording');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'recording_url', v_recording_url,
    'title', v_session.title
  );
END;
$$;

-- ============================================================================
-- 9. Task Completion Toggle RPC (complete_task)
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_task(p_session_id UUID, p_completed BOOLEAN)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO task_completions (
    user_id,
    session_id,
    completed,
    completed_at,
    updated_at
  )
  VALUES (
    v_uid,
    p_session_id,
    p_completed,
    CASE WHEN p_completed THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (user_id, session_id) DO UPDATE SET
    completed = EXCLUDED.completed,
    completed_at = EXCLUDED.completed_at,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'ok', true,
    'session_id', p_session_id,
    'completed', p_completed
  );
END;
$$;

-- ============================================================================
-- 10. Admin Manual Enrollment RPC (admin_enroll)
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_enroll(
  p_user_email_or_id TEXT,
  p_program_id UUID,
  p_access_until TIMESTAMPTZ DEFAULT NULL,
  p_send_notification BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_target_user_id UUID;
  v_program programs%ROWTYPE;
  v_enrollment_id UUID;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'Unauthorized: administrator or staff role required';
  END IF;

  -- 1. Try resolving user by UUID
  BEGIN
    v_target_user_id := p_user_email_or_id::UUID;
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_target_user_id) THEN
      v_target_user_id := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_target_user_id := NULL;
  END;

  -- 2. If not UUID, search profiles by email in auth.users
  IF v_target_user_id IS NULL THEN
    SELECT u.id INTO v_target_user_id
    FROM auth.users u
    WHERE LOWER(u.email) = LOWER(trim(p_user_email_or_id))
    LIMIT 1;
  END IF;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email or ID: %', p_user_email_or_id;
  END IF;

  SELECT * INTO v_program
  FROM programs
  WHERE id = p_program_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program not found with ID: %', p_program_id;
  END IF;

  -- Allow trusted enrollment inside trigger
  PERFORM set_config('app.trusted_enrollment', 'true', true);

  INSERT INTO enrollments (
    user_id,
    program_id,
    status,
    source,
    access_until,
    enrolled_at,
    updated_at
  )
  VALUES (
    v_target_user_id,
    p_program_id,
    'active',
    'manual',
    p_access_until,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, program_id) DO UPDATE SET
    status = 'active',
    access_until = EXCLUDED.access_until,
    updated_at = NOW()
  RETURNING id INTO v_enrollment_id;

  -- Send notification
  IF p_send_notification THEN
    INSERT INTO notifications (
      user_id,
      title,
      body,
      type,
      link_url
    ) VALUES (
      v_target_user_id,
      'You have been enrolled in ' || v_program.title || '!',
      'Naman or an administrator has granted you access. Welcome to the cohort!',
      'enrollment',
      '/programs/' || v_program.slug
    );
  END IF;

  -- Audit log
  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    entity_name,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    CASE WHEN is_admin() THEN 'admin' ELSE 'staff' END,
    'admin_enroll',
    'enrollments',
    v_enrollment_id,
    jsonb_build_object(
      'user_id', v_target_user_id,
      'program_id', p_program_id,
      'program_title', v_program.title
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'enrollment_id', v_enrollment_id,
    'user_id', v_target_user_id,
    'program_id', p_program_id
  );
END;
$$;

-- ============================================================================
-- 11. Admin Revoke Enrollment RPC (admin_revoke_enrollment)
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_revoke_enrollment(
  p_enrollment_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment enrollments%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only administrators can revoke enrollments';
  END IF;

  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment record not found';
  END IF;

  PERFORM set_config('app.trusted_enrollment', 'true', true);

  UPDATE enrollments
  SET status = 'revoked', updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Audit log
  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    entity_name,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    'admin',
    'revoke_enrollment',
    'enrollments',
    p_enrollment_id,
    jsonb_build_object(
      'user_id', v_enrollment.user_id,
      'program_id', v_enrollment.program_id,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object('ok', true, 'enrollment_id', p_enrollment_id);
END;
$$;

-- ============================================================================
-- 12. Inbox & Notifications RPCs
-- ============================================================================
CREATE OR REPLACE FUNCTION get_inbox(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  WITH user_announcements AS (
    SELECT
      a.id,
      'announcement' AS item_type,
      a.kind,
      a.title,
      a.body,
      a.cta_label,
      a.cta_url,
      a.is_pinned,
      a.publish_at AS created_at,
      (ar.id IS NOT NULL) AS is_read
    FROM announcements a
    LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = v_uid
    WHERE a.publish_at <= NOW()
      AND (a.expires_at IS NULL OR a.expires_at > NOW())
      AND (
        a.audience = 'all'
        OR (a.audience = 'user' AND a.user_id = v_uid)
        OR (a.audience = 'program' AND EXISTS (
          SELECT 1 FROM enrollments e
          WHERE e.user_id = v_uid
            AND e.program_id = a.program_id
            AND e.status = 'active'
        ))
      )
  ),
  user_notifications AS (
    SELECT
      n.id,
      'notification' AS item_type,
      'info'::announcement_kind AS kind,
      n.title,
      n.body,
      'View' AS cta_label,
      n.link_url AS cta_url,
      false AS is_pinned,
      n.created_at,
      n.is_read
    FROM notifications n
    WHERE n.user_id = v_uid
  ),
  combined AS (
    SELECT * FROM user_announcements
    UNION ALL
    SELECT * FROM user_notifications
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'item_type', item_type,
        'kind', kind,
        'title', title,
        'body', body,
        'cta_label', cta_label,
        'cta_url', cta_url,
        'is_pinned', is_pinned,
        'created_at', created_at,
        'is_read', is_read
      )
      ORDER BY is_pinned DESC, created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_result
  FROM (
    SELECT * FROM combined
    ORDER BY is_pinned DESC, created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION get_unread_counts()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_announcements_unread INT;
  v_notifications_unread INT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object(
      'unread_announcements', 0,
      'unread_notifications', 0,
      'total_unread', 0
    );
  END IF;

  SELECT COUNT(*) INTO v_announcements_unread
  FROM announcements a
  LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = v_uid
  WHERE a.publish_at <= NOW()
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    AND ar.id IS NULL
    AND (
      a.audience = 'all'
      OR (a.audience = 'user' AND a.user_id = v_uid)
      OR (a.audience = 'program' AND EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.user_id = v_uid
          AND e.program_id = a.program_id
          AND e.status = 'active'
      ))
    );

  SELECT COUNT(*) INTO v_notifications_unread
  FROM notifications n
  WHERE n.user_id = v_uid AND n.is_read = false;

  RETURN jsonb_build_object(
    'unread_announcements', v_announcements_unread,
    'unread_notifications', v_notifications_unread,
    'total_unread', (v_announcements_unread + v_notifications_unread)
  );
END;
$$;

CREATE OR REPLACE FUNCTION mark_announcement_read(p_announcement_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  INSERT INTO announcement_reads (announcement_id, user_id, read_at)
  VALUES (p_announcement_id, v_uid, NOW())
  ON CONFLICT (announcement_id, user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  UPDATE notifications
  SET is_read = true
  WHERE id = p_notification_id AND user_id = v_uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION mark_all_read()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  -- Mark unread announcements
  INSERT INTO announcement_reads (announcement_id, user_id, read_at)
  SELECT a.id, v_uid, NOW()
  FROM announcements a
  LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = v_uid
  WHERE a.publish_at <= NOW()
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    AND ar.id IS NULL
    AND (
      a.audience = 'all'
      OR (a.audience = 'user' AND a.user_id = v_uid)
      OR (a.audience = 'program' AND EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.user_id = v_uid
          AND e.program_id = a.program_id
          AND e.status = 'active'
      ))
    )
  ON CONFLICT (announcement_id, user_id) DO NOTHING;

  -- Mark notifications
  UPDATE notifications
  SET is_read = true
  WHERE user_id = v_uid AND is_read = false;

  RETURN jsonb_build_object('ok', true);
END;
$$;

