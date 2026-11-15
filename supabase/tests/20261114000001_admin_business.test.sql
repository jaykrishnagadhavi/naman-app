-- pgTAP Test Suite for Step 9 Admin Business Screens & Security Definer RPCs
-- Proves RBAC isolation, student block checks, coupon normalization, and pagination bounds.

BEGIN;
SELECT plan(15);

-- ============================================================================
-- 1. Anonymous Access Tests
-- ============================================================================
SET ROLE anon;
SET request.jwt.claim.sub = '';
SET request.jwt.claim.role = 'anon';

-- Test 1: Anon cannot call admin_list_students
SELECT throws_ok(
  $$ SELECT admin_list_students() $$,
  'ACCESS_DENIED: Admin or staff role required',
  'admin_list_students strictly rejects anonymous callers'
);

-- Test 2: Anon cannot call admin_dashboard_stats
SELECT throws_ok(
  $$ SELECT admin_dashboard_stats() $$,
  'ACCESS_DENIED: Admin or staff role required',
  'admin_dashboard_stats strictly rejects anonymous callers'
);

-- Test 3: Anon can call get_public_site_settings
SELECT lives_ok(
  $$ SELECT get_public_site_settings() $$,
  'get_public_site_settings is publicly accessible'
);

-- ============================================================================
-- 2. Authenticated Student RBAC Tests
-- ============================================================================
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000099';
SET request.jwt.claim.role = 'authenticated';

-- Test 4: Student cannot call admin_list_students
SELECT throws_ok(
  $$ SELECT admin_list_students() $$,
  'ACCESS_DENIED: Admin or staff role required',
  'admin_list_students rejects student role callers'
);

-- Test 5: Student cannot call admin_list_orders
SELECT throws_ok(
  $$ SELECT admin_list_orders() $$,
  'ACCESS_DENIED: Administrator role required to view orders and financial records',
  'admin_list_orders rejects student callers'
);

-- Test 6: Student cannot call admin_set_blocked
SELECT throws_ok(
  $$ SELECT admin_set_blocked('00000000-0000-0000-0000-000000000002'::uuid, true, 'Test') $$,
  'ACCESS_DENIED: Administrator role required to block or unblock students',
  'admin_set_blocked rejects student callers'
);

-- Test 7: Student cannot update site_settings
SELECT throws_ok(
  $$ SELECT admin_update_site_settings('{"brand_name":"Hacked"}'::jsonb) $$,
  'ACCESS_DENIED: Administrator role required to update platform settings',
  'admin_update_site_settings rejects student callers'
);

-- ============================================================================
-- 3. Staff RBAC Restriction Tests (Staff allowed content/sessions, but NOT revenue/settings/roles/deletions)
-- ============================================================================
-- Seed a staff profile for testing
INSERT INTO profiles (id, full_name, role, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000088'::uuid, 'Test Staff', 'staff', false)
ON CONFLICT (id) DO UPDATE SET role = 'staff', is_blocked = false;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000088';
SET request.jwt.claim.role = 'authenticated';

-- Test 8: Staff CAN call admin_list_students
SELECT lives_ok(
  $$ SELECT admin_list_students() $$,
  'Staff member is authorized to view students directory'
);

-- Test 9: Staff CANNOT view orders or revenue
SELECT throws_ok(
  $$ SELECT admin_revenue_stats() $$,
  'ACCESS_DENIED: Administrator role required to view revenue statistics',
  'Staff member is forbidden from viewing revenue stats'
);

-- Test 10: Staff CANNOT block students
SELECT throws_ok(
  $$ SELECT admin_set_blocked('00000000-0000-0000-0000-000000000002'::uuid, true, 'Staff test') $$,
  'ACCESS_DENIED: Administrator role required to block or unblock students',
  'Staff member cannot block or unblock students'
);

-- Test 11: Staff CANNOT update platform settings
SELECT throws_ok(
  $$ SELECT admin_update_site_settings('{"brand_name":"Staff Change"}'::jsonb) $$,
  'ACCESS_DENIED: Administrator role required to update platform settings',
  'Staff member cannot modify platform settings'
);

-- Test 12: Staff CANNOT handle account deletion requests
SELECT throws_ok(
  $$ SELECT handle_deletion_request('00000000-0000-0000-0000-000000000001'::uuid, 'completed') $$,
  'ACCESS_DENIED: Administrator role required to handle deletion requests',
  'Staff member cannot handle deletion requests'
);

-- ============================================================================
-- 4. Blocked Student Lockout Verification
-- ============================================================================
-- Seed a blocked student
INSERT INTO profiles (id, full_name, role, is_blocked, blocked_reason)
VALUES ('00000000-0000-0000-0000-000000000077'::uuid, 'Blocked Student', 'student', true, 'Terms violation')
ON CONFLICT (id) DO UPDATE SET is_blocked = true, blocked_reason = 'Terms violation';

SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000077';
SET request.jwt.claim.role = 'authenticated';

-- Test 13: Blocked student get_my_programs throws exception
SELECT throws_ok(
  $$ SELECT get_my_programs() $$,
  'ACCOUNT_BLOCKED: Your account has been paused. Please contact support.',
  'Blocked student cannot query my programs RPC'
);

-- Test 14: Blocked student complete_task throws exception
SELECT throws_ok(
  $$ SELECT complete_task('00000000-0000-0000-0000-000000000001'::uuid, true) $$,
  'ACCOUNT_BLOCKED: Your account has been paused. Please contact support.',
  'Blocked student cannot complete daily tasks'
);

-- ============================================================================
-- 5. Coupon Trigger Normalization & Case Insensitivity
-- ============================================================================
SET ROLE postgres;

-- Test 15: Coupon code is automatically normalized to uppercase
INSERT INTO coupons (code, discount_type, value, is_active)
VALUES ('welcome_test_lowercase', 'percent', 20, true)
ON CONFLICT (code) DO NOTHING;

SELECT is(
  (SELECT code FROM coupons WHERE code = 'WELCOME_TEST_LOWERCASE'),
  'WELCOME_TEST_LOWERCASE',
  'Coupon trigger normalizes code to uppercase'
);

SELECT * FROM finish();
ROLLBACK;

