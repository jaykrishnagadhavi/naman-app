-- Migration: 20261114000001_admin_business_and_security.sql
-- Description: Step 9 Administrative Business Screens, Moderation, Settings, and Security Definer RPCs

-- ============================================================================
-- 1. Schema Alterations
-- ============================================================================

-- A. Profiles: add blocked tracking columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- B. Account Deletion Requests: add admin resolution note and processor
ALTER TABLE account_deletion_requests
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- C. Reviews: add moderation status column and update published sync
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'hidden'));

CREATE OR REPLACE FUNCTION sync_review_published_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_published := (NEW.status = 'approved');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_review_published_status ON reviews;
CREATE TRIGGER trg_sync_review_published_status
  BEFORE INSERT OR UPDATE OF status ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_review_published_status();

-- D. Site Settings: expand for Brand, Business, Legal, Helplines, Sessions, Maintenance
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{"youtube":"","instagram":"","twitter":"","linkedin":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS channel_subscriber_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gst_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  ADD COLUMN IF NOT EXISTS invoice_details JSONB NOT NULL DEFAULT '{"company_name":"ABrainoConscious","address":"","city":"","state":"","pincode":"","pan":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS currency_display TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS terms_html TEXT NOT NULL DEFAULT '<p>Terms and Conditions for ABrainoConscious. All programs and content are educational.</p>',
  ADD COLUMN IF NOT EXISTS privacy_html TEXT NOT NULL DEFAULT '<p>Privacy Policy for ABrainoConscious. We value your privacy and protect personal data.</p>',
  ADD COLUMN IF NOT EXISTS refund_policy_html TEXT NOT NULL DEFAULT '<p>Refund Policy for ABrainoConscious. Details on cancellations and eligibility.</p>',
  ADD COLUMN IF NOT EXISTS medical_disclaimer_html TEXT NOT NULL DEFAULT '<p>ABrainoConscious programs are educational in nature and are not a substitute for professional mental health care, medical therapy, or clinical diagnosis.</p>',
  ADD COLUMN IF NOT EXISTS legal_last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS support_helplines JSONB NOT NULL DEFAULT '[{"name":"Tele-MANAS","number":"14416","hours":"24/7","region":"India (National)","verified":false}]'::jsonb,
  ADD COLUMN IF NOT EXISTS allowed_live_link_hosts TEXT[] NOT NULL DEFAULT ARRAY['zoom.us', 'meet.google.com', 'youtube.com', 'youtu.be'],
  ADD COLUMN IF NOT EXISTS live_link_join_window_before_minutes INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS live_link_join_window_after_minutes INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS default_daily_session_time TEXT NOT NULL DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS idle_timeout_minutes INTEGER NOT NULL DEFAULT 30;

-- Ensure singleton row in site_settings exists
INSERT INTO site_settings (id, brand_name, support_email)
VALUES (true, 'ABrainoConscious', 'support@abrainoconcious.com')
ON CONFLICT (id) DO NOTHING;

-- E. Coupons: uppercase normalization trigger and case-insensitive uniqueness
CREATE OR REPLACE FUNCTION normalize_coupon_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := UPPER(TRIM(NEW.code));
  IF NEW.code = '' THEN
    RAISE EXCEPTION 'Coupon code cannot be empty' USING ERRCODE = '22000';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_coupon_code ON coupons;
CREATE TRIGGER trg_normalize_coupon_code
  BEFORE INSERT OR UPDATE OF code ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION normalize_coupon_code();

-- ============================================================================
-- 2. Security Helper: Assert User Is Not Blocked
-- ============================================================================
CREATE OR REPLACE FUNCTION assert_user_not_blocked(p_user_id UUID DEFAULT auth.uid())
RETURNS VOID AS $$
DECLARE
  v_is_blocked BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  SELECT is_blocked INTO v_is_blocked FROM profiles WHERE id = p_user_id;
  IF v_is_blocked IS TRUE THEN
    RAISE EXCEPTION 'ACCOUNT_BLOCKED: Your account has been paused. Please contact support.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 3. Update Existing Student-Facing RPCs to Reject Blocked Students
-- ============================================================================

-- A. enroll_free
CREATE OR REPLACE FUNCTION enroll_free(p_program_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_program programs%ROWTYPE;
  v_enrollment_id UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to enroll';
  END IF;

  -- Blocked check
  PERFORM assert_user_not_blocked(v_uid);

  SELECT * INTO v_program FROM programs WHERE id = p_program_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program not found or unavailable';
  END IF;

  IF v_program.price_paise > 0 THEN
    RAISE EXCEPTION 'This program requires a paid purchase';
  END IF;

  INSERT INTO enrollments (
    user_id,
    program_id,
    status,
    source,
    enrolled_at,
    created_at,
    updated_at
  )
  VALUES (
    v_uid,
    p_program_id,
    'active',
    'manual',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, program_id) DO UPDATE SET
    status = 'active',
    updated_at = NOW()
  RETURNING id INTO v_enrollment_id;

  RETURN jsonb_build_object(
    'ok', true,
    'enrollment_id', v_enrollment_id,
    'program_id', p_program_id,
    'program_title', v_program.title,
    'program_slug', v_program.slug
  );
END;
$$;

-- B. get_my_programs
CREATE OR REPLACE FUNCTION get_my_programs()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_programs JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Blocked check
  PERFORM assert_user_not_blocked(v_uid);

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'enrollment_id', e.id,
        'enrolled_at', e.enrolled_at,
        'status', e.status,
        'access_until', e.access_until,
        'program', jsonb_build_object(
          'id', p.id,
          'type', p.type,
          'category', p.category,
          'title', p.title,
          'slug', p.slug,
          'short_description', p.short_description,
          'thumbnail_url', p.thumbnail_url,
          'poster_image_url', p.poster_image_url,
          'cover_image_url', p.cover_image_url,
          'status', p.status,
          'starts_at', p.starts_at,
          'ends_at', p.ends_at
        )
      )
      ORDER BY e.enrolled_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_programs
  FROM enrollments e
  JOIN programs p ON p.id = e.program_id
  WHERE e.user_id = v_uid
    AND e.status = 'active'
    AND p.deleted_at IS NULL;

  RETURN v_programs;
END;
$$;

-- C. get_program_enrolled
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
  v_sessions JSONB;
  v_stats JSONB;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NOT NULL THEN
    PERFORM assert_user_not_blocked(v_uid);
  END IF;

  SELECT * INTO v_program
  FROM programs
  WHERE slug = p_slug AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_uid IS NOT NULL THEN
    SELECT * INTO v_enrollment
    FROM enrollments
    WHERE user_id = v_uid AND program_id = v_program.id AND status = 'active';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'day_number', s.day_number,
        'title', s.title,
        'description', s.description,
        'scheduled_at', s.scheduled_at,
        'live_platform', s.live_platform,
        'status', s.status,
        'task_title', s.task_title,
        'task_body', s.task_body,
        'resources', s.resources,
        'is_attended', EXISTS (
          SELECT 1 FROM session_attendance sa
          WHERE sa.session_id = s.id AND sa.user_id = v_uid
        ),
        'is_task_completed', EXISTS (
          SELECT 1 FROM task_completions tc
          WHERE tc.session_id = s.id AND tc.user_id = v_uid AND tc.completed = true
        ),
        'has_recording', EXISTS (
          SELECT 1 FROM session_links sl
          WHERE sl.session_id = s.id AND sl.recording_url IS NOT NULL
        )
      )
      ORDER BY s.day_number ASC
    ),
    '[]'::jsonb
  )
  INTO v_sessions
  FROM program_sessions s
  WHERE s.program_id = v_program.id;

  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'completed_tasks', COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM task_completions tc
        WHERE tc.session_id = s.id AND tc.user_id = v_uid AND tc.completed = true
      )
    ),
    'attended_sessions', COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM session_attendance sa
        WHERE sa.session_id = s.id AND sa.user_id = v_uid
      )
    )
  )
  INTO v_stats
  FROM program_sessions s
  WHERE s.program_id = v_program.id;

  RETURN jsonb_build_object(
    'program', row_to_json(v_program),
    'is_enrolled', (v_enrollment.id IS NOT NULL),
    'enrollment', CASE WHEN v_enrollment.id IS NOT NULL THEN row_to_json(v_enrollment) ELSE NULL END,
    'sessions', v_sessions,
    'stats', v_stats
  );
END;
$$;

-- D. get_session_link
CREATE OR REPLACE FUNCTION get_session_link(p_session_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_session program_sessions%ROWTYPE;
  v_link session_links%ROWTYPE;
  v_enrolled BOOLEAN;
  v_is_staff BOOLEAN;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  PERFORM assert_user_not_blocked(v_uid);

  SELECT * INTO v_session FROM program_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  v_is_staff := is_staff_or_admin();

  IF NOT v_is_staff THEN
    SELECT EXISTS (
      SELECT 1 FROM enrollments
      WHERE user_id = v_uid
        AND program_id = v_session.program_id
        AND status = 'active'
    ) INTO v_enrolled;

    IF NOT v_enrolled THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_enrolled');
    END IF;
  END IF;

  SELECT * INTO v_link FROM session_links WHERE session_id = p_session_id;
  IF NOT FOUND OR v_link.live_url IS NULL OR v_link.live_url = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'link_not_ready');
  END IF;

  -- Record student attendance if not already recorded
  IF v_uid IS NOT NULL AND NOT v_is_staff THEN
    INSERT INTO session_attendance (user_id, session_id, attended_at)
    VALUES (v_uid, p_session_id, NOW())
    ON CONFLICT (user_id, session_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'session_id', p_session_id,
    'live_url', v_link.live_url,
    'platform', v_session.live_platform,
    'published_at', v_link.link_published_at
  );
END;
$$;

-- E. get_session_recording
CREATE OR REPLACE FUNCTION get_session_recording(p_session_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_session program_sessions%ROWTYPE;
  v_link session_links%ROWTYPE;
  v_enrolled BOOLEAN;
  v_is_staff BOOLEAN;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  PERFORM assert_user_not_blocked(v_uid);

  SELECT * INTO v_session FROM program_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  v_is_staff := is_staff_or_admin();

  IF NOT v_is_staff THEN
    SELECT EXISTS (
      SELECT 1 FROM enrollments
      WHERE user_id = v_uid
        AND program_id = v_session.program_id
        AND status = 'active'
    ) INTO v_enrolled;

    IF NOT v_enrolled THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_enrolled');
    END IF;
  END IF;

  SELECT * INTO v_link FROM session_links WHERE session_id = p_session_id;
  IF NOT FOUND OR v_link.recording_url IS NULL OR v_link.recording_url = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'recording_not_ready');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'session_id', p_session_id,
    'recording_url', v_link.recording_url,
    'added_at', v_link.recording_added_at
  );
END;
$$;

-- F. complete_task
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

  PERFORM assert_user_not_blocked(v_uid);

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

-- G. register_payment_interest
CREATE OR REPLACE FUNCTION register_payment_interest(p_program_id UUID, p_email TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_clean_email TEXT;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NOT NULL THEN
    PERFORM assert_user_not_blocked(v_uid);
  END IF;

  v_clean_email := LOWER(TRIM(p_email));
  IF v_clean_email = '' OR v_clean_email NOT LIKE '%_@__%.__%' THEN
    RAISE EXCEPTION 'Invalid email address provided';
  END IF;

  INSERT INTO payment_interest (
    program_id,
    user_id,
    email,
    created_at
  )
  VALUES (
    p_program_id,
    v_uid,
    v_clean_email,
    NOW()
  )
  ON CONFLICT (program_id, email) DO UPDATE SET
    user_id = COALESCE(payment_interest.user_id, EXCLUDED.user_id);

  RETURN jsonb_build_object(
    'ok', true,
    'program_id', p_program_id,
    'email', v_clean_email
  );
END;
$$;

-- ============================================================================
-- 4. Admin Security Definer Functions
-- ============================================================================

-- A. admin_list_students
CREATE OR REPLACE FUNCTION admin_list_students(
  p_search TEXT DEFAULT NULL,
  p_filter_program_id UUID DEFAULT NULL,
  p_filter_joined_from TIMESTAMPTZ DEFAULT NULL,
  p_filter_joined_to TIMESTAMPTZ DEFAULT NULL,
  p_filter_is_blocked BOOLEAN DEFAULT NULL,
  p_filter_goal_pillar TEXT DEFAULT NULL,
  p_filter_no_enrollment BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit INT;
  v_offset INT;
  v_total_count BIGINT;
  v_students JSONB;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin or staff role required' USING ERRCODE = '42501';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_offset := GREATEST(COALESCE(p_offset, 0), 0);

  -- Count total matching rows
  SELECT COUNT(DISTINCT p.id)
  INTO v_total_count
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN enrollments e ON e.user_id = p.id
  WHERE (
    p_search IS NULL OR p_search = '' OR
    p.full_name ILIKE '%' || p_search || '%' OR
    u.email ILIKE '%' || p_search || '%' OR
    p.phone ILIKE '%' || p_search || '%'
  )
  AND (p_filter_program_id IS NULL OR e.program_id = p_filter_program_id)
  AND (p_filter_joined_from IS NULL OR p.created_at >= p_filter_joined_from)
  AND (p_filter_joined_to IS NULL OR p.created_at <= p_filter_joined_to)
  AND (p_filter_is_blocked IS NULL OR p.is_blocked = p_filter_is_blocked)
  AND (
    p_filter_goal_pillar IS NULL OR p_filter_goal_pillar = '' OR
    p_filter_goal_pillar = ANY(p.goal_pillars) OR
    p.goal_tag ILIKE '%' || p_filter_goal_pillar || '%'
  )
  AND (
    p_filter_no_enrollment IS NULL OR
    (p_filter_no_enrollment IS TRUE AND NOT EXISTS (
      SELECT 1 FROM enrollments ex WHERE ex.user_id = p.id
    ))
  );

  -- Retrieve paginated list
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'full_name', s.full_name,
        'email', s.email,
        'phone', s.phone,
        'avatar_url', s.avatar_url,
        'role', s.role,
        'goal_tag', s.goal_tag,
        'goal_pillars', s.goal_pillars,
        'is_blocked', s.is_blocked,
        'blocked_reason', s.blocked_reason,
        'blocked_at', s.blocked_at,
        'last_seen_at', s.last_seen_at,
        'created_at', s.created_at,
        'enrolment_count', s.enrolment_count,
        'total_paid_paise', 0,
        'enrolled_programs', s.enrolled_programs
      )
    ),
    '[]'::jsonb
  )
  INTO v_students
  FROM (
    SELECT
      p.id,
      p.full_name,
      u.email,
      p.phone,
      p.avatar_url,
      p.role,
      p.goal_tag,
      p.goal_pillars,
      p.is_blocked,
      p.blocked_reason,
      p.blocked_at,
      p.last_seen_at,
      p.created_at,
      COUNT(DISTINCT e.id) AS enrolment_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'program_id', prog.id,
            'title', prog.title,
            'status', e.status
          )
        ) FILTER (WHERE prog.id IS NOT NULL),
        '[]'::jsonb
      ) AS enrolled_programs
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    LEFT JOIN enrollments e ON e.user_id = p.id
    LEFT JOIN programs prog ON prog.id = e.program_id
    WHERE (
      p_search IS NULL OR p_search = '' OR
      p.full_name ILIKE '%' || p_search || '%' OR
      u.email ILIKE '%' || p_search || '%' OR
      p.phone ILIKE '%' || p_search || '%'
    )
    AND (p_filter_program_id IS NULL OR e.program_id = p_filter_program_id)
    AND (p_filter_joined_from IS NULL OR p.created_at >= p_filter_joined_from)
    AND (p_filter_joined_to IS NULL OR p.created_at <= p_filter_joined_to)
    AND (p_filter_is_blocked IS NULL OR p.is_blocked = p_filter_is_blocked)
    AND (
      p_filter_goal_pillar IS NULL OR p_filter_goal_pillar = '' OR
      p_filter_goal_pillar = ANY(p.goal_pillars) OR
      p.goal_tag ILIKE '%' || p_filter_goal_pillar || '%'
    )
    AND (
      p_filter_no_enrollment IS NULL OR
      (p_filter_no_enrollment IS TRUE AND NOT EXISTS (
        SELECT 1 FROM enrollments ex WHERE ex.user_id = p.id
      ))
    )
    GROUP BY p.id, u.email
    ORDER BY
      CASE WHEN p_sort_by = 'full_name' AND p_sort_order = 'asc' THEN p.full_name END ASC,
      CASE WHEN p_sort_by = 'full_name' AND p_sort_order = 'desc' THEN p.full_name END DESC,
      CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at END ASC,
      CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN p.created_at END DESC,
      p.created_at DESC
    LIMIT v_limit
    OFFSET v_offset
  ) s;

  RETURN jsonb_build_object(
    'total_count', v_total_count,
    'students', v_students,
    'limit', v_limit,
    'offset', v_offset
  );
END;
$$;

-- B. admin_get_student
CREATE OR REPLACE FUNCTION admin_get_student(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile JSONB;
  v_enrollments JSONB;
  v_attendance_count BIGINT;
  v_tasks_completed_count BIGINT;
  v_attendance_history JSONB;
  v_orders JSONB;
  v_payments JSONB;
  v_deletion_request JSONB;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin or staff role required' USING ERRCODE = '42501';
  END IF;

  -- 1. Profile
  SELECT jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'email', u.email,
    'phone', p.phone,
    'avatar_url', p.avatar_url,
    'role', p.role,
    'goal_tag', p.goal_tag,
    'goal_pillars', p.goal_pillars,
    'is_blocked', p.is_blocked,
    'blocked_reason', p.blocked_reason,
    'blocked_at', p.blocked_at,
    'last_seen_at', p.last_seen_at,
    'created_at', p.created_at
  )
  INTO v_profile
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Enrollments
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'program_id', e.program_id,
        'program_title', prog.title,
        'program_slug', prog.slug,
        'program_type', prog.type,
        'status', e.status,
        'source', e.source,
        'enrolled_at', e.enrolled_at,
        'access_until', e.access_until
      )
      ORDER BY e.enrolled_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_enrollments
  FROM enrollments e
  JOIN programs prog ON prog.id = e.program_id
  WHERE e.user_id = p_user_id;

  -- 3. Attendance & Task counts
  SELECT COUNT(*) INTO v_attendance_count
  FROM session_attendance WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_tasks_completed_count
  FROM task_completions WHERE user_id = p_user_id AND completed = true;

  -- 4. Recent attendance history
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'session_id', s.id,
        'session_title', s.title,
        'day_number', s.day_number,
        'program_title', prog.title,
        'attended_at', sa.attended_at
      )
      ORDER BY sa.attended_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_attendance_history
  FROM session_attendance sa
  JOIN program_sessions s ON s.id = sa.session_id
  JOIN programs prog ON prog.id = s.program_id
  WHERE sa.user_id = p_user_id
  LIMIT 20;

  -- 5. Orders & Payments (Empty for now during payments hold)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'amount_paise', o.amount_paise,
        'status', o.status,
        'created_at', o.created_at
      )
    ),
    '[]'::jsonb
  )
  INTO v_orders
  FROM orders o
  WHERE o.user_id = p_user_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', py.id,
        'amount_paise', py.amount_paise,
        'status', py.status,
        'created_at', py.created_at
      )
    ),
    '[]'::jsonb
  )
  INTO v_payments
  FROM payments py
  JOIN orders o ON o.id = py.order_id
  WHERE o.user_id = p_user_id;

  -- 6. Deletion request
  SELECT jsonb_build_object(
    'id', dr.id,
    'status', dr.status,
    'reason', dr.reason,
    'admin_note', dr.admin_note,
    'created_at', dr.created_at,
    'updated_at', dr.updated_at
  )
  INTO v_deletion_request
  FROM account_deletion_requests dr
  WHERE dr.user_id = p_user_id
  ORDER BY dr.created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'enrollments', v_enrollments,
    'attendance_count', v_attendance_count,
    'tasks_completed_count', v_tasks_completed_count,
    'attendance_history', v_attendance_history,
    'orders', v_orders,
    'payments', v_payments,
    'deletion_request', v_deletion_request
  );
END;
$$;

-- C. admin_set_blocked
CREATE OR REPLACE FUNCTION admin_set_blocked(
  p_user_id UUID,
  p_blocked BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_id UUID;
  v_old_blocked BOOLEAN;
  v_clean_reason TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Administrator role required to block or unblock students' USING ERRCODE = '42501';
  END IF;

  v_caller_id := auth.uid();
  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot modify your own account blocked status' USING ERRCODE = '22000';
  END IF;

  SELECT is_blocked INTO v_old_blocked FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target student profile not found' USING ERRCODE = 'P0002';
  END IF;

  v_clean_reason := NULLIF(TRIM(p_reason), '');
  IF p_blocked IS TRUE AND v_clean_reason IS NULL THEN
    v_clean_reason := 'Administrative moderation review';
  END IF;

  UPDATE profiles
  SET
    is_blocked = p_blocked,
    blocked_reason = CASE WHEN p_blocked IS TRUE THEN v_clean_reason ELSE NULL END,
    blocked_at = CASE WHEN p_blocked IS TRUE THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Audit log
  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id,
    diff,
    created_at
  )
  VALUES (
    v_caller_id,
    'admin',
    CASE WHEN p_blocked IS TRUE THEN 'student.blocked' ELSE 'student.unblocked' END,
    'profiles',
    p_user_id::text,
    jsonb_build_object(
      'is_blocked', p_blocked,
      'previous_blocked', v_old_blocked,
      'reason', v_clean_reason
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', p_user_id,
    'is_blocked', p_blocked,
    'reason', v_clean_reason
  );
END;
$$;

-- D. admin_list_orders
CREATE OR REPLACE FUNCTION admin_list_orders(
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit INT;
  v_offset INT;
  v_total_count BIGINT;
  v_orders JSONB;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Administrator role required to view orders and financial records' USING ERRCODE = '42501';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_offset := GREATEST(COALESCE(p_offset, 0), 0);

  SELECT COUNT(*)
  INTO v_total_count
  FROM orders o
  LEFT JOIN profiles p ON p.id = o.user_id
  LEFT JOIN auth.users u ON u.id = o.user_id
  LEFT JOIN programs prog ON prog.id = o.program_id
  WHERE (
    p_search IS NULL OR p_search = '' OR
    p.full_name ILIKE '%' || p_search || '%' OR
    u.email ILIKE '%' || p_search || '%' OR
    o.razorpay_order_id ILIKE '%' || p_search || '%'
  );

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'user_id', o.user_id,
        'student_name', p.full_name,
        'student_email', u.email,
        'program_id', o.program_id,
        'program_title', prog.title,
        'razorpay_order_id', o.razorpay_order_id,
        'amount_paise', o.amount_paise,
        'discount_paise', o.discount_paise,
        'status', o.status,
        'created_at', o.created_at
      )
      ORDER BY o.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_orders
  FROM (
    SELECT o.*, p.full_name, u.email, prog.title
    FROM orders o
    LEFT JOIN profiles p ON p.id = o.user_id
    LEFT JOIN auth.users u ON u.id = o.user_id
    LEFT JOIN programs prog ON prog.id = o.program_id
    WHERE (
      p_search IS NULL OR p_search = '' OR
      p.full_name ILIKE '%' || p_search || '%' OR
      u.email ILIKE '%' || p_search || '%' OR
      o.razorpay_order_id ILIKE '%' || p_search || '%'
    )
    ORDER BY o.created_at DESC
    LIMIT v_limit
    OFFSET v_offset
  ) o;

  RETURN jsonb_build_object(
    'total_count', v_total_count,
    'orders', v_orders,
    'limit', v_limit,
    'offset', v_offset
  );
END;
$$;

-- E. admin_revenue_stats
CREATE OR REPLACE FUNCTION admin_revenue_stats(p_range TEXT DEFAULT '30d')
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_revenue BIGINT := 0;
  v_today_revenue BIGINT := 0;
  v_seven_days_revenue BIGINT := 0;
  v_thirty_days_revenue BIGINT := 0;
  v_total_orders BIGINT := 0;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Administrator role required to view revenue statistics' USING ERRCODE = '42501';
  END IF;

  SELECT
    COALESCE(SUM(amount_paise), 0),
    COUNT(*)
  INTO v_total_revenue, v_total_orders
  FROM orders
  WHERE status = 'paid';

  SELECT COALESCE(SUM(amount_paise), 0) INTO v_today_revenue
  FROM orders WHERE status = 'paid' AND created_at >= (NOW() - INTERVAL '1 day');

  SELECT COALESCE(SUM(amount_paise), 0) INTO v_seven_days_revenue
  FROM orders WHERE status = 'paid' AND created_at >= (NOW() - INTERVAL '7 days');

  SELECT COALESCE(SUM(amount_paise), 0) INTO v_thirty_days_revenue
  FROM orders WHERE status = 'paid' AND created_at >= (NOW() - INTERVAL '30 days');

  RETURN jsonb_build_object(
    'total_revenue_paise', v_total_revenue,
    'today_revenue_paise', v_today_revenue,
    'seven_days_revenue_paise', v_seven_days_revenue,
    'thirty_days_revenue_paise', v_thirty_days_revenue,
    'total_orders', v_total_orders,
    'conversion_rate', 0.0
  );
END;
$$;

-- F. admin_attendance_report
CREATE OR REPLACE FUNCTION admin_attendance_report(
  p_program_id UUID,
  p_session_id UUID DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_enrolled BIGINT;
  v_sessions JSONB;
  v_students JSONB;
  v_avg_attendance_rate NUMERIC := 0.0;
  v_avg_task_rate NUMERIC := 0.0;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin or staff role required' USING ERRCODE = '42501';
  END IF;

  -- 1. Total enrolled students for this program
  SELECT COUNT(DISTINCT user_id)
  INTO v_total_enrolled
  FROM enrollments
  WHERE program_id = p_program_id AND status = 'active';

  -- 2. Per-session attendance & task completions
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'session_id', s.id,
        'day_number', s.day_number,
        'title', s.title,
        'scheduled_at', s.scheduled_at,
        'status', s.status,
        'total_enrolled', v_total_enrolled,
        'attended_count', COALESCE(att.attended_cnt, 0),
        'attendance_rate_percent', CASE WHEN v_total_enrolled > 0
          THEN ROUND((COALESCE(att.attended_cnt, 0)::numeric / v_total_enrolled) * 100, 1)
          ELSE 0.0 END,
        'tasks_completed_count', COALESCE(tc.tasks_cnt, 0),
        'task_completion_rate_percent', CASE WHEN v_total_enrolled > 0
          THEN ROUND((COALESCE(tc.tasks_cnt, 0)::numeric / v_total_enrolled) * 100, 1)
          ELSE 0.0 END
      )
      ORDER BY s.day_number ASC
    ),
    '[]'::jsonb
  )
  INTO v_sessions
  FROM program_sessions s
  LEFT JOIN (
    SELECT session_id, COUNT(*) AS attended_cnt
    FROM session_attendance
    GROUP BY session_id
  ) att ON att.session_id = s.id
  LEFT JOIN (
    SELECT session_id, COUNT(*) AS tasks_cnt
    FROM task_completions
    WHERE completed = true
    GROUP BY session_id
  ) tc ON tc.session_id = s.id
  WHERE s.program_id = p_program_id
    AND (p_session_id IS NULL OR s.id = p_session_id);

  -- 3. Per-student engagement breakdown
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'user_id', st.user_id,
        'full_name', st.full_name,
        'email', st.email,
        'phone', st.phone,
        'enrolled_at', st.enrolled_at,
        'total_sessions', st.total_prog_sessions,
        'sessions_attended', st.sessions_attended,
        'attendance_rate_percent', st.att_rate,
        'tasks_completed', st.tasks_completed,
        'task_completion_rate_percent', st.task_rate,
        'is_low_engagement', (st.att_rate < 30.0 OR st.task_rate < 30.0)
      )
      ORDER BY st.att_rate DESC, st.full_name ASC
    ),
    '[]'::jsonb
  )
  INTO v_students
  FROM (
    SELECT
      e.user_id,
      p.full_name,
      u.email,
      p.phone,
      e.enrolled_at,
      (SELECT COUNT(*) FROM program_sessions ps WHERE ps.program_id = p_program_id) AS total_prog_sessions,
      COUNT(DISTINCT sa.session_id) AS sessions_attended,
      CASE WHEN (SELECT COUNT(*) FROM program_sessions ps WHERE ps.program_id = p_program_id) > 0
        THEN ROUND((COUNT(DISTINCT sa.session_id)::numeric / (SELECT COUNT(*) FROM program_sessions ps WHERE ps.program_id = p_program_id)) * 100, 1)
        ELSE 0.0 END AS att_rate,
      COUNT(DISTINCT tc.session_id) FILTER (WHERE tc.completed = true) AS tasks_completed,
      CASE WHEN (SELECT COUNT(*) FROM program_sessions ps WHERE ps.program_id = p_program_id) > 0
        THEN ROUND((COUNT(DISTINCT tc.session_id) FILTER (WHERE tc.completed = true)::numeric / (SELECT COUNT(*) FROM program_sessions ps WHERE ps.program_id = p_program_id)) * 100, 1)
        ELSE 0.0 END AS task_rate
    FROM enrollments e
    JOIN profiles p ON p.id = e.user_id
    LEFT JOIN auth.users u ON u.id = e.user_id
    LEFT JOIN program_sessions ps ON ps.program_id = p_program_id
    LEFT JOIN session_attendance sa ON sa.session_id = ps.id AND sa.user_id = e.user_id
    LEFT JOIN task_completions tc ON tc.session_id = ps.id AND tc.user_id = e.user_id
    WHERE e.program_id = p_program_id AND e.status = 'active'
    GROUP BY e.user_id, p.full_name, u.email, p.phone, e.enrolled_at
  ) st;

  -- 4. Calculate overall averages
  SELECT
    COALESCE(ROUND(AVG((s->>'attendance_rate_percent')::numeric), 1), 0.0),
    COALESCE(ROUND(AVG((s->>'task_completion_rate_percent')::numeric), 1), 0.0)
  INTO v_avg_attendance_rate, v_avg_task_rate
  FROM jsonb_array_elements(v_sessions) s;

  RETURN jsonb_build_object(
    'summary', jsonb_build_object(
      'program_id', p_program_id,
      'total_enrolled', v_total_enrolled,
      'avg_attendance_rate', v_avg_attendance_rate,
      'avg_task_rate', v_avg_task_rate
    ),
    'sessions', v_sessions,
    'students', v_students
  );
END;
$$;

-- G. admin_dashboard_stats
CREATE OR REPLACE FUNCTION admin_dashboard_stats(p_range TEXT DEFAULT '30d')
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_programs_by_status JSONB;
  v_signups_chart JSONB;
  v_enrolments_chart JSONB;
  v_active_enrolments BIGINT;
  v_sessions_today JSONB;
  v_missing_links_count BIGINT;
  v_payment_interest JSONB;
  v_top_programs JSONB;
  v_pending_reviews BIGINT;
  v_pending_deletions BIGINT;
  v_blocked_students BIGINT;
  v_overall_attendance_rate NUMERIC := 0.0;
  v_interval INTERVAL;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin or staff role required' USING ERRCODE = '42501';
  END IF;

  v_interval := CASE
    WHEN p_range = '7d' THEN INTERVAL '7 days'
    WHEN p_range = '90d' THEN INTERVAL '90 days'
    WHEN p_range = 'all' THEN INTERVAL '10 years'
    ELSE INTERVAL '30 days'
  END;

  -- 1. Programs by status
  SELECT jsonb_build_object(
    'draft', COUNT(*) FILTER (WHERE status = 'draft'),
    'published', COUNT(*) FILTER (WHERE status = 'published'),
    'live', COUNT(*) FILTER (WHERE status = 'live'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'archived', COUNT(*) FILTER (WHERE status = 'archived')
  )
  INTO v_programs_by_status
  FROM programs
  WHERE deleted_at IS NULL;

  -- 2. Signups chart
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', d.day::date,
        'count', COALESCE(cnt.c, 0)
      )
      ORDER BY d.day ASC
    ),
    '[]'::jsonb
  )
  INTO v_signups_chart
  FROM generate_series(
    CURRENT_DATE - (CASE WHEN p_range = '7d' THEN 6 WHEN p_range = '90d' THEN 89 ELSE 29 END),
    CURRENT_DATE,
    '1 day'::interval
  ) d(day)
  LEFT JOIN (
    SELECT created_at::date AS dt, COUNT(*) AS c
    FROM profiles
    WHERE created_at >= (NOW() - v_interval)
    GROUP BY created_at::date
  ) cnt ON cnt.dt = d.day::date;

  -- 3. Enrolments chart
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', d.day::date,
        'count', COALESCE(cnt.c, 0)
      )
      ORDER BY d.day ASC
    ),
    '[]'::jsonb
  )
  INTO v_enrolments_chart
  FROM generate_series(
    CURRENT_DATE - (CASE WHEN p_range = '7d' THEN 6 WHEN p_range = '90d' THEN 89 ELSE 29 END),
    CURRENT_DATE,
    '1 day'::interval
  ) d(day)
  LEFT JOIN (
    SELECT enrolled_at::date AS dt, COUNT(*) AS c
    FROM enrollments
    WHERE enrolled_at >= (NOW() - v_interval)
    GROUP BY enrolled_at::date
  ) cnt ON cnt.dt = d.day::date;

  -- 4. Active enrolments total
  SELECT COUNT(*) INTO v_active_enrolments
  FROM enrollments WHERE status = 'active';

  -- 5. Sessions Today (IST timezone date match or next 24h)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'day_number', s.day_number,
        'title', s.title,
        'scheduled_at', s.scheduled_at,
        'status', s.status,
        'program_title', prog.title,
        'program_slug', prog.slug,
        'has_link', (sl.live_url IS NOT NULL AND sl.live_url != ''),
        'live_url', sl.live_url
      )
      ORDER BY s.scheduled_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_sessions_today
  FROM program_sessions s
  JOIN programs prog ON prog.id = s.program_id
  LEFT JOIN session_links sl ON sl.session_id = s.id
  WHERE s.scheduled_at::date = CURRENT_DATE
    AND prog.deleted_at IS NULL;

  -- 6. Missing links count (starts within 2 hours with no live link)
  SELECT COUNT(*)
  INTO v_missing_links_count
  FROM program_sessions s
  JOIN programs prog ON prog.id = s.program_id
  LEFT JOIN session_links sl ON sl.session_id = s.id
  WHERE s.status = 'scheduled'
    AND s.scheduled_at >= NOW()
    AND s.scheduled_at <= (NOW() + INTERVAL '2 hours')
    AND (sl.live_url IS NULL OR sl.live_url = '')
    AND prog.deleted_at IS NULL;

  -- 7. Payment Interest demand per program
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'program_id', prog.id,
        'program_title', prog.title,
        'program_type', prog.type,
        'price_paise', prog.price_paise,
        'count', pi_cnt.cnt
      )
      ORDER BY pi_cnt.cnt DESC
    ),
    '[]'::jsonb
  )
  INTO v_payment_interest
  FROM (
    SELECT program_id, COUNT(*) AS cnt
    FROM payment_interest
    GROUP BY program_id
  ) pi_cnt
  JOIN programs prog ON prog.id = pi_cnt.program_id
  WHERE prog.deleted_at IS NULL;

  -- 8. Top programs by enrolments
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'program_id', prog.id,
        'title', prog.title,
        'category', prog.category,
        'type', prog.type,
        'status', prog.status,
        'enrolments_count', COALESCE(e_cnt.cnt, 0)
      )
      ORDER BY e_cnt.cnt DESC NULLS LAST
    ),
    '[]'::jsonb
  )
  INTO v_top_programs
  FROM programs prog
  LEFT JOIN (
    SELECT program_id, COUNT(*) AS cnt
    FROM enrollments
    WHERE status = 'active'
    GROUP BY program_id
  ) e_cnt ON e_cnt.program_id = prog.id
  WHERE prog.deleted_at IS NULL
  LIMIT 5;

  -- 9. Counts for Needs Attention
  SELECT COUNT(*) INTO v_pending_reviews
  FROM reviews WHERE status = 'pending';

  SELECT COUNT(*) INTO v_pending_deletions
  FROM account_deletion_requests WHERE status = 'pending';

  SELECT COUNT(*) INTO v_blocked_students
  FROM profiles WHERE is_blocked = true;

  -- 10. Overall attendance rate
  SELECT COALESCE(
    ROUND(
      (COUNT(sa.id)::numeric / GREATEST(COUNT(DISTINCT e.id), 1)) * 100,
      1
    ),
    0.0
  )
  INTO v_overall_attendance_rate
  FROM session_attendance sa
  JOIN program_sessions ps ON ps.id = sa.session_id
  JOIN enrollments e ON e.program_id = ps.program_id AND e.status = 'active';

  RETURN jsonb_build_object(
    'programs_by_status', v_programs_by_status,
    'signups_chart', v_signups_chart,
    'enrolments_chart', v_enrolments_chart,
    'active_enrolments_total', v_active_enrolments,
    'sessions_today', v_sessions_today,
    'missing_links_count', v_missing_links_count,
    'overall_attendance_rate', v_overall_attendance_rate,
    'payment_interest_by_program', v_payment_interest,
    'top_programs', v_top_programs,
    'needs_attention', jsonb_build_object(
      'missing_links_count', v_missing_links_count,
      'pending_reviews_count', v_pending_reviews,
      'pending_deletion_requests_count', v_pending_deletions,
      'blocked_students_count', v_blocked_students
    )
  );
END;
$$;

-- H. handle_deletion_request
CREATE OR REPLACE FUNCTION handle_deletion_request(
  p_request_id UUID,
  p_status TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_id UUID;
  v_old_status TEXT;
  v_user_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Administrator role required to handle deletion requests' USING ERRCODE = '42501';
  END IF;

  v_caller_id := auth.uid();

  IF p_status NOT IN ('processing', 'completed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be one of processing, completed, or rejected' USING ERRCODE = '22000';
  END IF;

  SELECT status, user_id INTO v_old_status, v_user_id
  FROM account_deletion_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account deletion request not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE account_deletion_requests
  SET
    status = p_status,
    admin_note = p_note,
    processed_by = v_caller_id,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Audit log
  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id,
    diff,
    created_at
  )
  VALUES (
    v_caller_id,
    'admin',
    'deletion_request.update',
    'account_deletion_requests',
    p_request_id::text,
    jsonb_build_object(
      'user_id', v_user_id,
      'previous_status', v_old_status,
      'new_status', p_status,
      'note', p_note
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'request_id', p_request_id,
    'status', p_status,
    'note', p_note
  );
END;
$$;

-- I. validate_coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_program_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_clean_code TEXT;
  v_coupon coupons%ROWTYPE;
  v_program programs%ROWTYPE;
  v_user_redemptions BIGINT := 0;
  v_discount_paise INTEGER := 0;
  v_final_price_paise INTEGER := 0;
BEGIN
  v_clean_code := UPPER(TRIM(p_code));
  IF v_clean_code = '' OR v_clean_code IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'EMPTY_CODE',
      'message', 'Please enter a coupon code'
    );
  END IF;

  -- Retrieve program
  SELECT * INTO v_program FROM programs WHERE id = p_program_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'PROGRAM_NOT_FOUND',
      'message', 'Program not found or unavailable'
    );
  END IF;

  -- Retrieve coupon
  SELECT * INTO v_coupon FROM coupons WHERE code = v_clean_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'INVALID_CODE',
      'message', 'Coupon code is invalid or does not exist'
    );
  END IF;

  -- Active check
  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'INACTIVE',
      'message', 'This coupon is no longer active'
    );
  END IF;

  -- Date checks
  IF v_coupon.valid_from > NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'NOT_YET_VALID',
      'message', 'This coupon is not valid yet'
    );
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'EXPIRED',
      'message', 'This coupon has expired'
    );
  END IF;

  -- Max uses check
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'MAX_USES_REACHED',
      'message', 'This coupon has reached its maximum redemptions limit'
    );
  END IF;

  -- Applicable programs check
  IF v_coupon.applicable_program_ids IS NOT NULL
     AND array_length(v_coupon.applicable_program_ids, 1) > 0
     AND NOT (p_program_id = ANY(v_coupon.applicable_program_ids)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'PROGRAM_NOT_ELIGIBLE',
      'message', 'This coupon cannot be applied to this program'
    );
  END IF;

  -- Per user limit check
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_redemptions
    FROM coupon_redemptions
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

    IF v_user_redemptions >= v_coupon.per_user_limit THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error_code', 'USER_LIMIT_REACHED',
        'message', 'You have already reached the redemption limit for this coupon'
      );
    END IF;
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percent' THEN
    v_discount_paise := ROUND((v_program.price_paise * v_coupon.value) / 100.0);
  ELSIF v_coupon.discount_type = 'flat' THEN
    v_discount_paise := v_coupon.value;
  END IF;

  -- Cap discount at original price
  v_discount_paise := LEAST(v_discount_paise, v_program.price_paise);
  v_final_price_paise := GREATEST(0, v_program.price_paise - v_discount_paise);

  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'value', v_coupon.value,
    'original_price_paise', v_program.price_paise,
    'discount_paise', v_discount_paise,
    'final_price_paise', v_final_price_paise,
    'message', 'Coupon applied successfully!'
  );
END;
$$;

-- J. admin_list_reviews
CREATE OR REPLACE FUNCTION admin_list_reviews(
  p_status TEXT DEFAULT NULL,
  p_program_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit INT;
  v_offset INT;
  v_total_count BIGINT;
  v_reviews JSONB;
  v_avg_by_prog JSONB;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin or staff role required' USING ERRCODE = '42501';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_offset := GREATEST(COALESCE(p_offset, 0), 0);

  SELECT COUNT(*)
  INTO v_total_count
  FROM reviews r
  WHERE (p_status IS NULL OR p_status = '' OR r.status = p_status)
    AND (p_program_id IS NULL OR r.program_id = p_program_id);

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'program_id', r.program_id,
        'program_title', prog.title,
        'user_id', r.user_id,
        'student_name', p.full_name,
        'student_email', u.email,
        'student_avatar_url', p.avatar_url,
        'rating', r.rating,
        'title', r.title,
        'body', r.body,
        'status', r.status,
        'is_published', r.is_published,
        'created_at', r.created_at,
        'updated_at', r.updated_at
      )
      ORDER BY r.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_reviews
  FROM (
    SELECT r.*, prog.title, p.full_name, u.email, p.avatar_url
    FROM reviews r
    JOIN programs prog ON prog.id = r.program_id
    JOIN profiles p ON p.id = r.user_id
    LEFT JOIN auth.users u ON u.id = r.user_id
    WHERE (p_status IS NULL OR p_status = '' OR r.status = p_status)
      AND (p_program_id IS NULL OR r.program_id = p_program_id)
    ORDER BY r.created_at DESC
    LIMIT v_limit
    OFFSET v_offset
  ) r;

  -- Average rating per program
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'program_id', prog.id,
        'program_title', prog.title,
        'total_reviews', agg.total_rev,
        'approved_reviews', agg.appr_rev,
        'average_rating', ROUND(agg.avg_r, 1)
      )
    ),
    '[]'::jsonb
  )
  INTO v_avg_by_prog
  FROM (
    SELECT
      program_id,
      COUNT(*) AS total_rev,
      COUNT(*) FILTER (WHERE status = 'approved') AS appr_rev,
      AVG(rating) FILTER (WHERE status = 'approved') AS avg_r
    FROM reviews
    GROUP BY program_id
  ) agg
  JOIN programs prog ON prog.id = agg.program_id;

  RETURN jsonb_build_object(
    'total_count', v_total_count,
    'reviews', v_reviews,
    'avg_rating_by_program', v_avg_by_prog,
    'limit', v_limit,
    'offset', v_offset
  );
END;
$$;

-- K. admin_moderate_review
CREATE OR REPLACE FUNCTION admin_moderate_review(
  p_review_id UUID,
  p_status TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_id UUID;
  v_old_status TEXT;
  v_program_id UUID;
BEGIN
  IF NOT is_staff_or_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin or staff role required' USING ERRCODE = '42501';
  END IF;

  v_caller_id := auth.uid();

  IF p_status NOT IN ('pending', 'approved', 'hidden') THEN
    RAISE EXCEPTION 'Invalid review status. Must be pending, approved, or hidden' USING ERRCODE = '22000';
  END IF;

  SELECT status, program_id INTO v_old_status, v_program_id
  FROM reviews
  WHERE id = p_review_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE reviews
  SET
    status = p_status,
    is_published = (p_status = 'approved'),
    updated_at = NOW()
  WHERE id = p_review_id;

  -- Audit log
  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id,
    diff,
    created_at
  )
  VALUES (
    v_caller_id,
    CASE WHEN is_admin() THEN 'admin' ELSE 'staff' END,
    'review.moderate',
    'reviews',
    p_review_id::text,
    jsonb_build_object(
      'program_id', v_program_id,
      'previous_status', v_old_status,
      'new_status', p_status
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'review_id', p_review_id,
    'status', p_status
  );
END;
$$;

-- L. admin_delete_review
CREATE OR REPLACE FUNCTION admin_delete_review(p_review_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_id UUID;
  v_review reviews%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Administrator role required to permanently delete reviews' USING ERRCODE = '42501';
  END IF;

  v_caller_id := auth.uid();

  SELECT * INTO v_review FROM reviews WHERE id = p_review_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM reviews WHERE id = p_review_id;

  -- Audit log
  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id,
    diff,
    created_at
  )
  VALUES (
    v_caller_id,
    'admin',
    'review.delete',
    'reviews',
    p_review_id::text,
    jsonb_build_object(
      'program_id', v_review.program_id,
      'user_id', v_review.user_id,
      'rating', v_review.rating,
      'body', v_review.body
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'review_id', p_review_id,
    'deleted', true
  );
END;
$$;

-- M. admin_update_site_settings
CREATE OR REPLACE FUNCTION admin_update_site_settings(p_settings JSONB)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_id UUID;
  v_current site_settings%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Administrator role required to update platform settings' USING ERRCODE = '42501';
  END IF;

  v_caller_id := auth.uid();

  SELECT * INTO v_current FROM site_settings WHERE id = true;

  UPDATE site_settings
  SET
    brand_name = COALESCE(p_settings->>'brand_name', brand_name),
    logo_url = CASE WHEN p_settings ? 'logo_url' THEN p_settings->>'logo_url' ELSE logo_url END,
    favicon_url = CASE WHEN p_settings ? 'favicon_url' THEN p_settings->>'favicon_url' ELSE favicon_url END,
    support_email = COALESCE(p_settings->>'support_email', support_email),
    support_whatsapp = CASE WHEN p_settings ? 'support_whatsapp' THEN p_settings->>'support_whatsapp' ELSE support_whatsapp END,
    social_links = CASE WHEN p_settings ? 'social_links' THEN p_settings->'social_links' ELSE social_links END,
    channel_subscriber_count = CASE WHEN p_settings ? 'channel_subscriber_count' THEN (p_settings->>'channel_subscriber_count')::int ELSE channel_subscriber_count END,
    gst_enabled = CASE WHEN p_settings ? 'gst_enabled' THEN (p_settings->>'gst_enabled')::boolean ELSE gst_enabled END,
    gst_number = CASE WHEN p_settings ? 'gst_number' THEN p_settings->>'gst_number' ELSE gst_number END,
    gst_rate_percent = CASE WHEN p_settings ? 'gst_rate_percent' THEN (p_settings->>'gst_rate_percent')::numeric ELSE gst_rate_percent END,
    invoice_details = CASE WHEN p_settings ? 'invoice_details' THEN p_settings->'invoice_details' ELSE invoice_details END,
    currency_display = COALESCE(p_settings->>'currency_display', currency_display),
    terms_html = COALESCE(p_settings->>'terms_html', terms_html),
    privacy_html = COALESCE(p_settings->>'privacy_html', privacy_html),
    refund_policy_html = COALESCE(p_settings->>'refund_policy_html', refund_policy_html),
    medical_disclaimer_html = COALESCE(p_settings->>'medical_disclaimer_html', medical_disclaimer_html),
    legal_last_updated = CASE WHEN (p_settings ? 'terms_html' OR p_settings ? 'privacy_html' OR p_settings ? 'refund_policy_html' OR p_settings ? 'medical_disclaimer_html') THEN NOW() ELSE legal_last_updated END,
    support_helplines = CASE WHEN p_settings ? 'support_helplines' THEN p_settings->'support_helplines' ELSE support_helplines END,
    allowed_live_link_hosts = CASE WHEN p_settings ? 'allowed_live_link_hosts' THEN ARRAY(SELECT jsonb_array_elements_text(p_settings->'allowed_live_link_hosts')) ELSE allowed_live_link_hosts END,
    live_link_join_window_before_minutes = CASE WHEN p_settings ? 'live_link_join_window_before_minutes' THEN (p_settings->>'live_link_join_window_before_minutes')::int ELSE live_link_join_window_before_minutes END,
    live_link_join_window_after_minutes = CASE WHEN p_settings ? 'live_link_join_window_after_minutes' THEN (p_settings->>'live_link_join_window_after_minutes')::int ELSE live_link_join_window_after_minutes END,
    default_daily_session_time = COALESCE(p_settings->>'default_daily_session_time', default_daily_session_time),
    maintenance_mode = CASE WHEN p_settings ? 'maintenance_mode' THEN (p_settings->>'maintenance_mode')::boolean ELSE maintenance_mode END,
    idle_timeout_minutes = CASE WHEN p_settings ? 'idle_timeout_minutes' THEN (p_settings->>'idle_timeout_minutes')::int ELSE idle_timeout_minutes END,
    updated_at = NOW()
  WHERE id = true;

  -- Audit log
  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id,
    diff,
    created_at
  )
  VALUES (
    v_caller_id,
    'admin',
    'settings.update',
    'site_settings',
    'true',
    p_settings,
    NOW()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'updated_at', NOW()
  );
END;
$$;

-- N. get_public_site_settings
CREATE OR REPLACE FUNCTION get_public_site_settings()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_settings site_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_settings FROM site_settings WHERE id = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'brand_name', 'ABrainoConscious',
      'maintenance_mode', false
    );
  END IF;

  RETURN jsonb_build_object(
    'brand_name', v_settings.brand_name,
    'logo_url', v_settings.logo_url,
    'favicon_url', v_settings.favicon_url,
    'support_email', v_settings.support_email,
    'support_whatsapp', v_settings.support_whatsapp,
    'social_links', v_settings.social_links,
    'channel_subscriber_count', v_settings.channel_subscriber_count,
    'currency_display', v_settings.currency_display,
    'terms_html', v_settings.terms_html,
    'privacy_html', v_settings.privacy_html,
    'refund_policy_html', v_settings.refund_policy_html,
    'medical_disclaimer_html', v_settings.medical_disclaimer_html,
    'legal_last_updated', v_settings.legal_last_updated,
    'support_helplines', v_settings.support_helplines,
    'allowed_live_link_hosts', v_settings.allowed_live_link_hosts,
    'maintenance_mode', v_settings.maintenance_mode,
    'default_daily_session_time', v_settings.default_daily_session_time
  );
END;
$$;

