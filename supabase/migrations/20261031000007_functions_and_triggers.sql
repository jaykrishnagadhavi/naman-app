-- Migration: 20261031000007_functions_and_triggers.sql
-- Description: Security functions, triggers, grant_enrollment, audit logging, and RPCs

-- 1. Helper security functions (Fixed search_path to prevent hijacking)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_blocked = false
  );
$$;

CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
      AND is_blocked = false
  );
$$;

CREATE OR REPLACE FUNCTION has_active_enrollment(p_program_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Admins and staff have implicit universal access
  IF is_staff_or_admin() THEN
    RETURN true;
  END IF;

  -- Check authenticated user's active enrollment
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = auth.uid()
      AND program_id = p_program_id
      AND status = 'active'
      AND (access_until IS NULL OR access_until > NOW())
  );
END;
$$;

CREATE OR REPLACE FUNCTION can_view_lesson(p_lesson_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_program_id UUID;
  v_is_preview BOOLEAN;
  v_is_published BOOLEAN;
BEGIN
  -- Admins and staff have implicit access
  IF is_staff_or_admin() THEN
    RETURN true;
  END IF;

  -- Fetch lesson info
  SELECT cs.program_id, l.is_free_preview, l.is_published
  INTO v_program_id, v_is_preview, v_is_published
  FROM lessons l
  JOIN course_sections cs ON l.section_id = cs.id
  WHERE l.id = p_lesson_id;

  IF NOT FOUND OR NOT v_is_published THEN
    RETURN false;
  END IF;

  -- Free previews are accessible to all
  IF v_is_preview THEN
    RETURN true;
  END IF;

  -- Otherwise, active enrollment is required
  RETURN has_active_enrollment(v_program_id);
END;
$$;

-- 2. Auth user creation trigger -> creates profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO profiles (
    id,
    full_name,
    phone,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    v_full_name,
    NEW.phone,
    v_avatar_url,
    'student'
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Security guards against privilege escalation
CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If invoked in psql without JWT (migrations/seeds), service role, or by admin, allow
  IF auth.role() IS NULL OR (auth.jwt() ->> 'role' = 'service_role') OR is_admin() THEN
    RETURN NEW;
  END IF;

  -- Prevent users from elevating their role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles';
  END IF;

  -- Prevent users from unblocking themselves
  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify user account status';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_fields();

CREATE OR REPLACE FUNCTION protect_enrollments()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If invoked in psql without JWT (migrations/seeds), service role, or by admin, allow
  IF auth.role() IS NULL OR (auth.jwt() ->> 'role' = 'service_role') OR is_admin() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  RAISE EXCEPTION 'Unauthorized: Direct enrollment modifications are restricted to administrators and checkout services';
END;
$$;

CREATE TRIGGER trg_protect_enrollments
  BEFORE INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION protect_enrollments();

-- 4. grant_enrollment (Atomic, idempotent procedure for Razorpay checkout & webhooks)
CREATE OR REPLACE FUNCTION grant_enrollment(
  p_order_id UUID,
  p_razorpay_payment_id TEXT DEFAULT NULL,
  p_razorpay_signature TEXT DEFAULT NULL,
  p_amount_paise INTEGER DEFAULT NULL,
  p_method TEXT DEFAULT 'razorpay',
  p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS enrollments
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_enrollment enrollments%ROWTYPE;
  v_bundle_item RECORD;
  v_coupon coupons%ROWTYPE;
  v_program_title TEXT;
BEGIN
  -- 1. Fetch order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found with ID %', p_order_id;
  END IF;

  -- 2. Check if order is already paid and enrollment exists
  IF v_order.status = 'paid' THEN
    IF v_order.program_id IS NOT NULL THEN
      SELECT * INTO v_enrollment FROM enrollments
      WHERE user_id = v_order.user_id AND program_id = v_order.program_id;
      IF FOUND THEN
        RETURN v_enrollment;
      END IF;
    END IF;
  END IF;

  -- 3. Record or update payment record
  IF p_razorpay_payment_id IS NOT NULL THEN
    INSERT INTO payments (
      order_id,
      razorpay_payment_id,
      razorpay_signature,
      method,
      amount_paise,
      status,
      raw_payload,
      captured_at
    )
    VALUES (
      v_order.id,
      p_razorpay_payment_id,
      p_razorpay_signature,
      p_method,
      COALESCE(p_amount_paise, v_order.amount_paise),
      'captured',
      p_raw_payload,
      NOW()
    )
    ON CONFLICT (razorpay_payment_id) DO UPDATE SET
      status = 'captured',
      updated_at = NOW()
    RETURNING * INTO v_payment;
  END IF;

  -- 4. Update order status to paid
  UPDATE orders
  SET status = 'paid', updated_at = NOW()
  WHERE id = v_order.id;

  -- 5. Record coupon redemption if coupon was applied
  IF v_order.coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons WHERE id = v_order.coupon_id FOR UPDATE;
    IF FOUND THEN
      -- Record redemption if not already logged
      INSERT INTO coupon_redemptions (
        coupon_id,
        user_id,
        order_id,
        discount_paise
      )
      VALUES (
        v_coupon.id,
        v_order.user_id,
        v_order.id,
        v_order.discount_paise
      )
      ON CONFLICT DO NOTHING;

      -- Increment used_count safely
      UPDATE coupons
      SET used_count = used_count + 1, updated_at = NOW()
      WHERE id = v_coupon.id;
    END IF;
  END IF;

  -- 6. Grant direct program enrollment
  IF v_order.program_id IS NOT NULL THEN
    SELECT title INTO v_program_title FROM programs WHERE id = v_order.program_id;

    INSERT INTO enrollments (
      user_id,
      program_id,
      status,
      payment_id,
      order_id,
      enrolled_at,
      source
    )
    VALUES (
      v_order.user_id,
      v_order.program_id,
      'active',
      v_payment.id,
      v_order.id,
      NOW(),
      CASE WHEN v_order.amount_paise = 0 THEN 'coupon_free'::enrollment_source ELSE 'paid'::enrollment_source END
    )
    ON CONFLICT (user_id, program_id) DO UPDATE SET
      status = 'active',
      access_until = NULL,
      payment_id = COALESCE(v_payment.id, enrollments.payment_id),
      order_id = v_order.id,
      updated_at = NOW()
    RETURNING * INTO v_enrollment;

    -- Add student congratulatory notification
    INSERT INTO notifications (
      user_id,
      title,
      body,
      type,
      link_url
    )
    VALUES (
      v_order.user_id,
      'Welcome to ' || COALESCE(v_program_title, 'your program') || '!',
      'Your enrollment is active. Explore your dashboard and join today’s session.',
      'enrollment',
      '/my-programs'
    );
  END IF;

  -- 7. Grant bundle enrollments if this was a bundle purchase
  IF v_order.bundle_id IS NOT NULL THEN
    FOR v_bundle_item IN
      SELECT program_id FROM bundle_items WHERE bundle_id = v_order.bundle_id
    LOOP
      SELECT title INTO v_program_title FROM programs WHERE id = v_bundle_item.program_id;

      INSERT INTO enrollments (
        user_id,
        program_id,
        status,
        payment_id,
        order_id,
        enrolled_at,
        source
      )
      VALUES (
        v_order.user_id,
        v_bundle_item.program_id,
        'active',
        v_payment.id,
        v_order.id,
        NOW(),
        'paid'::enrollment_source
      )
      ON CONFLICT (user_id, program_id) DO UPDATE SET
        status = 'active',
        access_until = NULL,
        payment_id = COALESCE(v_payment.id, enrollments.payment_id),
        order_id = v_order.id,
        updated_at = NOW()
      RETURNING * INTO v_enrollment;

      INSERT INTO notifications (
        user_id,
        title,
        body,
        type,
        link_url
      )
      VALUES (
        v_order.user_id,
        'Access unlocked: ' || COALESCE(v_program_title, 'Program'),
        'You have received full access via your bundle purchase.',
        'bundle',
        '/my-programs'
      );
    END LOOP;
  END IF;

  RETURN v_enrollment;
END;
$$;

-- 5. Generic Audit Log Trigger
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_action TEXT;
  v_entity_id TEXT;
  v_diff JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_entity_id := NEW.id::text;
    v_diff := jsonb_build_object('new', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_entity_id := NEW.id::text;
    v_diff := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_entity_id := OLD.id::text;
    v_diff := jsonb_build_object('old', to_jsonb(OLD));
  END IF;

  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id,
    diff
  )
  VALUES (
    auth.uid(),
    auth.jwt() ->> 'role',
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_diff
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach audit trigger to critical management tables
CREATE TRIGGER audit_programs
  AFTER INSERT OR UPDATE OR DELETE ON programs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_program_sessions
  AFTER INSERT OR UPDATE OR DELETE ON program_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_announcements
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_coupons
  AFTER INSERT OR UPDATE OR DELETE ON coupons
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_site_content
  AFTER INSERT OR UPDATE OR DELETE ON site_content
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_site_settings
  AFTER INSERT OR UPDATE OR DELETE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_profile_role_changes
  AFTER UPDATE OF role, is_blocked ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_blocked IS DISTINCT FROM NEW.is_blocked)
  EXECUTE FUNCTION audit_trigger_func();

-- 6. RPCs for Client Applications

-- Public Platform Statistics (Anon-accessible)
CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_student_count BIGINT;
  v_program_count BIGINT;
  v_lesson_count BIGINT;
  v_total_seconds BIGINT;
  v_total_hours NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_student_count FROM profiles WHERE role = 'student';
  SELECT COUNT(*) INTO v_program_count FROM programs WHERE status IN ('published', 'live', 'completed') AND deleted_at IS NULL;
  SELECT COUNT(*), COALESCE(SUM(duration_seconds), 0) INTO v_lesson_count, v_total_seconds FROM lessons WHERE is_published = true;

  v_total_hours := ROUND((v_total_seconds / 3600.0)::numeric, 1);

  RETURN jsonb_build_object(
    'students', v_student_count,
    'programs', v_program_count,
    'lessons', v_lesson_count,
    'hours', v_total_hours
  );
END;
$$;

-- Current User Enrolled Programs
CREATE OR REPLACE FUNCTION get_my_programs()
RETURNS TABLE (
  program_id UUID,
  type program_type,
  category program_category,
  title TEXT,
  slug CITEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  thumbnail_alt TEXT,
  poster_image_url TEXT,
  poster_image_alt TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  status program_status,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  enrollment_status enrollment_status,
  enrolled_at TIMESTAMPTZ,
  access_until TIMESTAMPTZ,
  total_sessions BIGINT,
  attended_sessions BIGINT,
  total_lessons BIGINT,
  completed_lessons BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id AS program_id,
    p.type,
    p.category,
    p.title,
    p.slug,
    p.short_description,
    p.thumbnail_url,
    p.thumbnail_alt,
    p.poster_image_url,
    p.poster_image_alt,
    p.cover_image_url,
    p.cover_image_alt,
    p.status,
    p.starts_at,
    p.ends_at,
    e.status AS enrollment_status,
    e.enrolled_at,
    e.access_until,
    (SELECT COUNT(*) FROM program_sessions ps WHERE ps.program_id = p.id) AS total_sessions,
    (SELECT COUNT(*) FROM session_attendance sa JOIN program_sessions ps ON sa.session_id = ps.id WHERE ps.program_id = p.id AND sa.user_id = auth.uid()) AS attended_sessions,
    (SELECT COUNT(*) FROM lessons l JOIN course_sections cs ON l.section_id = cs.id WHERE cs.program_id = p.id AND l.is_published = true) AS total_lessons,
    (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id JOIN course_sections cs ON l.section_id = cs.id WHERE cs.program_id = p.id AND lp.user_id = auth.uid() AND lp.completed = true) AS completed_lessons
  FROM enrollments e
  JOIN programs p ON e.program_id = p.id
  WHERE e.user_id = auth.uid()
    AND e.status = 'active'
    AND (e.access_until IS NULL OR e.access_until > NOW())
    AND p.deleted_at IS NULL
  ORDER BY e.enrolled_at DESC;
END;
$$;

-- Mark Announcement as Read
CREATE OR REPLACE FUNCTION mark_announcement_read(p_announcement_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO announcement_reads (announcement_id, user_id, read_at)
  VALUES (p_announcement_id, auth.uid(), NOW())
  ON CONFLICT (announcement_id, user_id) DO NOTHING;
END;
$$;

-- Mark Notification as Read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE notifications
  SET is_read = true
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$;
