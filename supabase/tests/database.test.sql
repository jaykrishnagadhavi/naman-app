-- pgTAP Test Suite for ABrainoConscious Database & Security
-- Run via: pnpm db:test (supabase test db)

BEGIN;
SELECT plan(22);

-- ============================================================================
-- Helper Test Variables
-- ============================================================================
-- Enrolled Student: 33333333-3333-3333-3333-333333333333 (Arjun)
-- Non-Enrolled Student: 44444444-4444-4444-4444-444444444444 (Priya)
-- Staff User: 22222222-2222-2222-2222-222222222222 (Rohit)
-- Admin User: 11111111-1111-1111-1111-111111111111 (Naman)
-- Enrolled Challenge: c1111111-1111-1111-1111-111111111111 (Sprint)
-- Non-Enrolled Challenge: c2222222-2222-2222-2222-222222222222 (Calm)

-- ============================================================================
-- 1. Anonymous Access Tests (Default Deny on Sensitive Tables)
-- ============================================================================
-- Switch to anon role
SET ROLE anon;
SET request.jwt.claim.sub = '';
SET request.jwt.claim.role = 'anon';

SELECT is_empty(
  'SELECT * FROM session_links',
  'Anon client cannot read session_links'
);

SELECT is_empty(
  'SELECT * FROM orders',
  'Anon client cannot read orders'
);

SELECT is_empty(
  'SELECT * FROM payments',
  'Anon client cannot read payments'
);

SELECT is_empty(
  'SELECT * FROM video_keys',
  'Anon client cannot read video_keys'
);

SELECT is_empty(
  'SELECT * FROM audit_log',
  'Anon client cannot read audit_log'
);

-- ============================================================================
-- 2. Non-Enrolled Student Access Tests
-- ============================================================================
-- Switch to Priya (authenticated student with NO enrollments)
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is_empty(
  'SELECT * FROM session_links',
  'Non-enrolled student cannot read any protected session_links'
);

-- Non-enrolled student CAN read free preview lesson media
SELECT is(
  (SELECT COUNT(*)::int FROM lesson_media WHERE can_view_lesson(lesson_id)),
  2,
  'Non-enrolled student CAN view free preview lessons (2 free previews)'
);

-- Non-enrolled student cannot read another student''s orders
SELECT is_empty(
  'SELECT * FROM orders WHERE user_id = ''33333333-3333-3333-3333-333333333333''::uuid',
  'Student cannot read another student''s orders'
);

-- Non-enrolled student cannot read another student''s phone number
SELECT is_empty(
  'SELECT * FROM profiles WHERE id = ''33333333-3333-3333-3333-333333333333''::uuid',
  'Student cannot read another student''s profile'
);

-- Student cannot self-elevate role to admin
SELECT throws_ok(
  'UPDATE profiles SET role = ''admin'' WHERE id = ''44444444-4444-4444-4444-444444444444''::uuid',
  NULL,
  NULL,
  'Student cannot escalate role to admin'
);

-- Student cannot self-insert enrollment
SELECT throws_ok(
  'INSERT INTO enrollments (user_id, program_id, status) VALUES (''44444444-4444-4444-4444-444444444444''::uuid, ''c2222222-2222-2222-2222-222222222222''::uuid, ''active'')',
  NULL,
  NULL,
  'Student cannot insert self-enrollment'
);

-- ============================================================================
-- 3. Enrolled Student Access Tests
-- ============================================================================
-- Switch to Arjun (enrolled in challenge c1111111)
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT isnt_empty(
  'SELECT * FROM session_links WHERE session_id IN (SELECT id FROM program_sessions WHERE program_id = ''c1111111-1111-1111-1111-111111111111''::uuid)',
  'Enrolled student CAN read session_links for their enrolled program'
);

SELECT is(
  (SELECT COUNT(*)::int FROM orders WHERE user_id = '33333333-3333-3333-3333-333333333333'::uuid),
  1,
  'Enrolled student can view their own order'
);

-- ============================================================================
-- 4. Staff Permissions vs Admin Boundaries
-- ============================================================================
-- Switch to Rohit (Staff)
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

-- Staff can read programs
SELECT isnt_empty(
  'SELECT * FROM programs',
  'Staff can view programs catalogue'
);

-- Staff CANNOT modify site_settings (RLS restricts update to 0 rows)
UPDATE site_settings SET brand_name = 'Hacked Brand' WHERE id = true;
SELECT is(
  (SELECT brand_name FROM site_settings WHERE id = true),
  'ABrainoConscious',
  'Staff cannot update site_settings (row remains unchanged)'
);

-- Staff CANNOT read video_keys
SELECT is_empty(
  'SELECT * FROM video_keys',
  'Staff cannot read video_keys'
);

-- ============================================================================
-- 5. Admin Permissions
-- ============================================================================
-- Switch to Naman (Admin)
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT isnt_empty(
  'SELECT * FROM audit_log',
  'Admin can read audit_log'
);

SELECT is(
  (SELECT brand_name FROM site_settings WHERE id = true),
  'ABrainoConscious',
  'Admin can read site_settings'
);

-- ============================================================================
-- 6. grant_enrollment Idempotency & Coupon Logic
-- ============================================================================
-- Reset to postgres superuser to run grant_enrollment tests
RESET ROLE;

-- Create test order for Priya
DO $$
DECLARE
  v_test_order_id UUID := '99999999-9999-9999-9999-999999999999'::uuid;
  v_enr1 enrollments%ROWTYPE;
  v_enr2 enrollments%ROWTYPE;
BEGIN
  INSERT INTO orders (id, user_id, program_id, amount_paise, discount_paise, coupon_id, status)
  VALUES (
    v_test_order_id,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'c2222222-2222-2222-2222-222222222222'::uuid,
    159920,
    39980,
    'cf111111-1111-1111-1111-111111111111'::uuid,
    'created'
  );

  -- First invocation of grant_enrollment
  v_enr1 := grant_enrollment(
    v_test_order_id,
    'pay_test_idem_001',
    'sig_test_001',
    159920,
    'upi'
  );

  -- Second invocation of grant_enrollment with identical order
  v_enr2 := grant_enrollment(
    v_test_order_id,
    'pay_test_idem_001',
    'sig_test_001',
    159920,
    'upi'
  );
END $$;

SELECT is(
  (SELECT COUNT(*)::int FROM enrollments WHERE user_id = '44444444-4444-4444-4444-444444444444'::uuid AND program_id = 'c2222222-2222-2222-2222-222222222222'::uuid),
  1,
  'grant_enrollment is strictly idempotent: only 1 enrollment created'
);

SELECT is(
  (SELECT COUNT(*)::int FROM payments WHERE razorpay_payment_id = 'pay_test_idem_001'),
  1,
  'grant_enrollment is strictly idempotent: only 1 payment created'
);

SELECT is(
  (SELECT COUNT(*)::int FROM coupon_redemptions WHERE order_id = '99999999-9999-9999-9999-999999999999'::uuid),
  1,
  'grant_enrollment is strictly idempotent: only 1 coupon redemption created'
);

-- Coupon Max Uses Constraint Test
-- Create coupon with max_uses = 1 and used_count = 1
INSERT INTO coupons (id, code, discount_type, value, max_uses, used_count)
VALUES ('c0000000-0000-0000-0000-000000000000'::uuid, 'MAXUSE1', 'flat', 1000, 1, 1);

SELECT throws_ok(
  'UPDATE coupons SET used_count = used_count + 1 WHERE id = ''c0000000-0000-0000-0000-000000000000''::uuid',
  '23514',
  'new row for relation "coupons" violates check constraint "check_coupon_max_uses"',
  'Coupon usage cannot exceed max_uses'
);

SELECT * FROM finish();
ROLLBACK;
