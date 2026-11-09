-- Migration: 20261031000008_rls_policies.sql
-- Description: Comprehensive Row Level Security (RLS) on every table, default deny

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE piracy_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Profiles Policies
-- ============================================================================
CREATE POLICY "profiles_select_own_or_staff"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

-- ============================================================================
-- 3. Programs Policies
-- ============================================================================
CREATE POLICY "programs_select_published_or_staff"
  ON programs FOR SELECT
  USING (
    (status IN ('published', 'live', 'completed') AND deleted_at IS NULL)
    OR is_staff_or_admin()
  );

CREATE POLICY "programs_insert_staff"
  ON programs FOR INSERT
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "programs_update_staff"
  ON programs FOR UPDATE
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "programs_delete_admin"
  ON programs FOR DELETE
  USING (is_admin());

-- ============================================================================
-- 4. Program Sessions Policies (Public Metadata)
-- ============================================================================
CREATE POLICY "sessions_select_published_or_staff"
  ON program_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = program_sessions.program_id
        AND p.status IN ('published', 'live', 'completed')
        AND p.deleted_at IS NULL
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "sessions_write_staff"
  ON program_sessions FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- ============================================================================
-- 5. Protected Session Links Policies (Secret URLs)
-- ============================================================================
CREATE POLICY "session_links_select_enrolled"
  ON session_links FOR SELECT
  USING (
    has_active_enrollment(
      (SELECT ps.program_id FROM program_sessions ps WHERE ps.id = session_links.session_id)
    )
  );

CREATE POLICY "session_links_write_staff"
  ON session_links FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- ============================================================================
-- 6. Course Sections & Lessons Policies (Metadata)
-- ============================================================================
CREATE POLICY "sections_select_published_or_staff"
  ON course_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = course_sections.program_id
        AND p.status IN ('published', 'live', 'completed')
        AND p.deleted_at IS NULL
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "sections_write_staff"
  ON course_sections FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "lessons_select_published_or_staff"
  ON lessons FOR SELECT
  USING (
    (
      is_published = true AND EXISTS (
        SELECT 1 FROM course_sections cs
        JOIN programs p ON cs.program_id = p.id
        WHERE cs.id = lessons.section_id
          AND p.status IN ('published', 'live', 'completed')
          AND p.deleted_at IS NULL
      )
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "lessons_write_staff"
  ON lessons FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- ============================================================================
-- 7. Protected Lesson Media Policies (Secret Media & Video IDs)
-- ============================================================================
CREATE POLICY "lesson_media_select_authorized"
  ON lesson_media FOR SELECT
  USING (can_view_lesson(lesson_id));

CREATE POLICY "lesson_media_write_staff"
  ON lesson_media FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- ============================================================================
-- 8. Bundles & Bundle Items Policies
-- ============================================================================
CREATE POLICY "bundles_select_published_or_staff"
  ON bundles FOR SELECT
  USING (is_published = true OR is_staff_or_admin());

CREATE POLICY "bundles_write_staff"
  ON bundles FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "bundle_items_select"
  ON bundle_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_items.bundle_id AND b.is_published = true)
    OR is_staff_or_admin()
  );

CREATE POLICY "bundle_items_write_staff"
  ON bundle_items FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- ============================================================================
-- 9. Coupons Policies
-- ============================================================================
CREATE POLICY "coupons_select_active_or_staff"
  ON coupons FOR SELECT
  USING (
    (is_active = true AND (valid_until IS NULL OR valid_until > NOW()))
    OR is_staff_or_admin()
  );

CREATE POLICY "coupons_write_admin"
  ON coupons FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 10. Orders & Payments Policies
-- ============================================================================
CREATE POLICY "orders_select_own_or_admin"
  ON orders FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_admin_manage"
  ON orders FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "payments_select_own_or_admin"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = payments.order_id AND o.user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "payments_admin_manage"
  ON payments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "coupon_redemptions_select_own_or_admin"
  ON coupon_redemptions FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 11. Enrollments Policies (Enforced: Students CANNOT self-insert or modify)
-- ============================================================================
CREATE POLICY "enrollments_select_own_or_staff"
  ON enrollments FOR SELECT
  USING (user_id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "enrollments_admin_manage"
  ON enrollments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 12. Announcements & Reads Policies
-- ============================================================================
CREATE POLICY "announcements_select_published"
  ON announcements FOR SELECT
  USING (
    (
      publish_at <= NOW()
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (
        audience = 'all'
        OR (audience = 'program' AND has_active_enrollment(program_id))
        OR (audience = 'user' AND user_id = auth.uid())
      )
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "announcements_write_staff"
  ON announcements FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "announcement_reads_own"
  ON announcement_reads FOR ALL
  USING (user_id = auth.uid() OR is_staff_or_admin())
  WITH CHECK (user_id = auth.uid() OR is_staff_or_admin());

-- ============================================================================
-- 13. Notifications Policies
-- ============================================================================
CREATE POLICY "notifications_select_update_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "notifications_admin_manage"
  ON notifications FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 14. Progress & Attendance Policies
-- ============================================================================
CREATE POLICY "lesson_progress_own"
  ON lesson_progress FOR ALL
  USING (user_id = auth.uid() OR is_staff_or_admin())
  WITH CHECK (user_id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "session_attendance_select"
  ON session_attendance FOR SELECT
  USING (user_id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "session_attendance_insert_enrolled"
  ON session_attendance FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND has_active_enrollment(
      (SELECT ps.program_id FROM program_sessions ps WHERE ps.id = session_attendance.session_id)
    )
  );

CREATE POLICY "session_attendance_staff_manage"
  ON session_attendance FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- ============================================================================
-- 15. Reviews Policies
-- ============================================================================
CREATE POLICY "reviews_select"
  ON reviews FOR SELECT
  USING (is_published = true OR user_id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "reviews_insert_enrolled"
  ON reviews FOR INSERT
  WITH CHECK (user_id = auth.uid() AND has_active_enrollment(program_id));

CREATE POLICY "reviews_update_own_or_staff"
  ON reviews FOR UPDATE
  USING (user_id = auth.uid() OR is_staff_or_admin())
  WITH CHECK (user_id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "reviews_delete_own_or_admin"
  ON reviews FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 16. Certificates Policies (Public verification)
-- ============================================================================
CREATE POLICY "certificates_select_public"
  ON certificates FOR SELECT
  USING (true);

CREATE POLICY "certificates_admin_manage"
  ON certificates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 17. Quizzes & Attempts Policies
-- ============================================================================
CREATE POLICY "quizzes_select"
  ON quizzes FOR SELECT
  USING (
    (program_id IS NOT NULL AND has_active_enrollment(program_id))
    OR (lesson_id IS NOT NULL AND can_view_lesson(lesson_id))
    OR is_staff_or_admin()
  );

CREATE POLICY "quizzes_write_staff"
  ON quizzes FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "quiz_questions_select"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND (
          (q.program_id IS NOT NULL AND has_active_enrollment(q.program_id))
          OR (q.lesson_id IS NOT NULL AND can_view_lesson(q.lesson_id))
        )
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "quiz_questions_write_staff"
  ON quiz_questions FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "quiz_attempts_own"
  ON quiz_attempts FOR ALL
  USING (user_id = auth.uid() OR is_staff_or_admin())
  WITH CHECK (user_id = auth.uid() OR is_staff_or_admin());

-- ============================================================================
-- 18. Badges Policies
-- ============================================================================
CREATE POLICY "badges_select_public"
  ON badges FOR SELECT
  USING (true);

CREATE POLICY "badges_admin_manage"
  ON badges FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "user_badges_select"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "user_badges_admin_manage"
  ON user_badges FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 19. Community Posts, Comments, Likes & Reports
-- ============================================================================
CREATE POLICY "posts_select"
  ON posts FOR SELECT
  USING (
    (is_hidden = false AND has_active_enrollment(program_id))
    OR is_staff_or_admin()
  );

CREATE POLICY "posts_insert"
  ON posts FOR INSERT
  WITH CHECK (user_id = auth.uid() AND has_active_enrollment(program_id));

CREATE POLICY "posts_update"
  ON posts FOR UPDATE
  USING (user_id = auth.uid() OR is_staff_or_admin())
  WITH CHECK (user_id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "posts_delete"
  ON posts FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "comments_select"
  ON comments FOR SELECT
  USING (
    (
      is_hidden = false AND EXISTS (
        SELECT 1 FROM posts p WHERE p.id = comments.post_id AND has_active_enrollment(p.program_id)
      )
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "comments_insert"
  ON comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p WHERE p.id = comments.post_id AND has_active_enrollment(p.program_id)
    )
  );

CREATE POLICY "comments_update"
  ON comments FOR UPDATE
  USING (user_id = auth.uid() OR is_staff_or_admin())
  WITH CHECK (user_id = auth.uid() OR is_staff_or_admin());

CREATE POLICY "comments_delete"
  ON comments FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "post_likes_select"
  ON post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p WHERE p.id = post_likes.post_id AND has_active_enrollment(p.program_id)
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "post_likes_insert"
  ON post_likes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p WHERE p.id = post_likes.post_id AND has_active_enrollment(p.program_id)
    )
  );

CREATE POLICY "post_likes_delete"
  ON post_likes FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "post_reports_insert"
  ON post_reports FOR INSERT
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "post_reports_staff_manage"
  ON post_reports FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- ============================================================================
-- 20. Content, Testimonials, FAQs & Settings Policies
-- ============================================================================
CREATE POLICY "site_content_select_public"
  ON site_content FOR SELECT
  USING (true);

CREATE POLICY "site_content_write_staff"
  ON site_content FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "testimonials_select_public"
  ON testimonials FOR SELECT
  USING (is_featured = true OR is_staff_or_admin());

CREATE POLICY "testimonials_write_staff"
  ON testimonials FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "faqs_select_public"
  ON faqs FOR SELECT
  USING (is_published = true OR is_staff_or_admin());

CREATE POLICY "faqs_write_staff"
  ON faqs FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "site_settings_select_public"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings_write_admin"
  ON site_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 21. Operations & Video Anti-Piracy Policies
-- ============================================================================
CREATE POLICY "audit_log_admin_read"
  ON audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "videos_staff_manage"
  ON videos FOR ALL
  USING (is_staff_or_admin())
  WITH CHECK (is_staff_or_admin());

-- video_keys is strictly inaccessible from client APIs
CREATE POLICY "video_keys_deny_all"
  ON video_keys FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "video_sessions_select_own_or_admin"
  ON video_sessions FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "video_sessions_write_own"
  ON video_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "video_sessions_update_own"
  ON video_sessions FOR UPDATE
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "video_access_logs_admin"
  ON video_access_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "piracy_flags_insert_client"
  ON piracy_flags FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "piracy_flags_admin_manage"
  ON piracy_flags FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "webhook_events_admin_manage"
  ON webhook_events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

