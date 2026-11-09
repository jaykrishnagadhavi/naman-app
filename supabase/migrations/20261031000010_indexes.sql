-- Migration: 20261031000010_indexes.sql
-- Description: Trigram search indexes, foreign key indexes, and query performance optimizations

-- 1. Full-text / Trigram Search Indexes
CREATE INDEX idx_programs_title_trgm ON programs USING gin (title gin_trgm_ops);
CREATE INDEX idx_programs_description_trgm ON programs USING gin (short_description gin_trgm_ops);

-- 2. Programs Filters
CREATE INDEX idx_programs_status_type ON programs (status, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_programs_category ON programs (category) WHERE deleted_at IS NULL;
CREATE INDEX idx_programs_featured ON programs (is_featured, is_trending_pinned) WHERE deleted_at IS NULL;
CREATE INDEX idx_programs_sort_order ON programs (sort_order ASC) WHERE deleted_at IS NULL;

-- 3. Sessions and Links
CREATE INDEX idx_program_sessions_program_id ON program_sessions (program_id, scheduled_at);
CREATE INDEX idx_program_sessions_status ON program_sessions (status);
CREATE INDEX idx_session_links_session_id ON session_links (session_id);

-- 4. Sections and Lessons
CREATE INDEX idx_course_sections_program_id ON course_sections (program_id, sort_order ASC);
CREATE INDEX idx_lessons_section_id ON lessons (section_id, sort_order ASC);
CREATE INDEX idx_lesson_media_lesson_id ON lesson_media (lesson_id);
CREATE INDEX idx_lesson_media_video_id ON lesson_media (video_id);

-- 5. Bundles
CREATE INDEX idx_bundle_items_bundle_id ON bundle_items (bundle_id);
CREATE INDEX idx_bundle_items_program_id ON bundle_items (program_id);

-- 6. Commerce Indexes
CREATE INDEX idx_orders_user_id ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_program_id ON orders (program_id);
CREATE INDEX idx_orders_bundle_id ON orders (bundle_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_razorpay_payment_id ON payments (razorpay_payment_id);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions (user_id, coupon_id);
CREATE INDEX idx_enrollments_user_status ON enrollments (user_id, status);
CREATE INDEX idx_enrollments_program_user ON enrollments (program_id, user_id);

-- 7. Engagement & Social
CREATE INDEX idx_announcements_audience ON announcements (audience, publish_at, expires_at);
CREATE INDEX idx_announcements_program ON announcements (program_id) WHERE program_id IS NOT NULL;
CREATE INDEX idx_announcement_reads_user ON announcement_reads (user_id, announcement_id);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_lesson_progress_user_lesson ON lesson_progress (user_id, lesson_id);
CREATE INDEX idx_session_attendance_user_session ON session_attendance (user_id, session_id);
CREATE INDEX idx_reviews_program ON reviews (program_id, is_published, rating);
CREATE INDEX idx_certificates_user_program ON certificates (user_id, program_id);
CREATE INDEX idx_quizzes_program_lesson ON quizzes (program_id, lesson_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions (quiz_id, sort_order ASC);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts (user_id, quiz_id);
CREATE INDEX idx_posts_program ON posts (program_id, is_pinned DESC, created_at DESC) WHERE is_hidden = false;
CREATE INDEX idx_comments_post ON comments (post_id, created_at ASC) WHERE is_hidden = false;
CREATE INDEX idx_post_likes_post_user ON post_likes (post_id, user_id);
CREATE INDEX idx_post_reports_status ON post_reports (status);

-- 8. Content & Video Operations
CREATE INDEX idx_faqs_program ON faqs (program_id, sort_order ASC) WHERE is_published = true;
CREATE INDEX idx_testimonials_program ON testimonials (program_id, is_featured, sort_order ASC);
CREATE INDEX idx_audit_log_entity ON audit_log (entity, entity_id, created_at DESC);
CREATE INDEX idx_videos_lesson ON videos (lesson_id);
CREATE INDEX idx_video_sessions_user_active ON video_sessions (user_id, video_id, is_active);
CREATE INDEX idx_video_access_logs_session ON video_access_logs (session_id, created_at DESC);
CREATE INDEX idx_piracy_flags_status ON piracy_flags (status, created_at DESC);

