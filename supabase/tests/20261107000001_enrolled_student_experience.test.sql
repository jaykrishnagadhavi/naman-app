-- pgTAP Test Suite for Step 8 Enrolled Student Experience
-- Validates task_completions, payment_interest, enroll_free, get_program_enrolled,
-- get_session_link, get_session_recording, and admin enrollment functions.

BEGIN;
SELECT plan(12);

-- ============================================================================
-- 1. Anonymous Access Tests
-- ============================================================================
SET ROLE anon;
SET request.jwt.claim.sub = '';
SET request.jwt.claim.role = 'anon';

-- Test 1: Anon cannot read task_completions
SELECT is_empty(
  'SELECT * FROM task_completions',
  'Anon visitor cannot read task_completions table directly'
);

-- Test 2: Anon get_session_link returns unauthenticated
SELECT is(
  (get_session_link('00000000-0000-0000-0000-000000000001'::uuid)->>'reason'),
  'unauthenticated',
  'get_session_link cleanly returns unauthenticated for anonymous visitors'
);

-- Test 3: Anon get_session_recording returns unauthenticated
SELECT is(
  (get_session_recording('00000000-0000-0000-0000-000000000001'::uuid)->>'reason'),
  'unauthenticated',
  'get_session_recording cleanly returns unauthenticated for anonymous visitors'
);

-- Test 4: Anon cannot call enroll_free
SELECT throws_ok(
  $$ SELECT enroll_free('00000000-0000-0000-0000-000000000001'::uuid) $$,
  'Authentication required to enroll',
  'enroll_free rejects anonymous calls'
);

-- ============================================================================
-- 2. Authenticated Student Security & Leak Verification
-- ============================================================================
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000099';
SET request.jwt.claim.role = 'authenticated';

-- Test 5: get_program_enrolled NEVER leaks live_url
SELECT ok(
  NOT (COALESCE(get_program_enrolled('21-day-mindset-reset')::text, '') LIKE '%"live_url"%'),
  'get_program_enrolled NEVER includes live_url secret link in output'
);

-- Test 6: get_program_enrolled NEVER leaks recording_url
SELECT ok(
  NOT (COALESCE(get_program_enrolled('21-day-mindset-reset')::text, '') LIKE '%"recording_url"%'),
  'get_program_enrolled NEVER includes recording_url secret link in output'
);

-- Test 7: Non-enrolled student get_session_link returns not_enrolled or not_found
SELECT ok(
  (get_session_link('00000000-0000-0000-0000-000000000001'::uuid)->>'reason') IN ('not_enrolled', 'not_found'),
  'get_session_link enforces enrollment guard before disclosing link'
);

-- Test 8: Non-enrolled student get_session_recording returns not_enrolled or not_found
SELECT ok(
  (get_session_recording('00000000-0000-0000-0000-000000000001'::uuid)->>'reason') IN ('not_enrolled', 'not_found'),
  'get_session_recording enforces enrollment guard before disclosing recording'
);

-- Test 9: Student cannot call admin_enroll
SELECT throws_ok(
  $$ SELECT admin_enroll('test@example.com', '00000000-0000-0000-0000-000000000001'::uuid) $$,
  'Unauthorized: administrator or staff role required',
  'admin_enroll strictly rejects non-admin callers'
);

-- Test 10: Student cannot call admin_revoke_enrollment
SELECT throws_ok(
  $$ SELECT admin_revoke_enrollment('00000000-0000-0000-0000-000000000001'::uuid) $$,
  'Unauthorized: only administrators can revoke enrollments',
  'admin_revoke_enrollment strictly rejects non-admin callers'
);

-- ============================================================================
-- 3. Anonymous Payment Interest Registration
-- ============================================================================
SET ROLE anon;
-- Test 11: Anon can insert payment interest
SELECT lives_ok(
  $$
    INSERT INTO payment_interest (program_id, email)
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'interested_visitor@gmail.com')
    ON CONFLICT (program_id, email) DO NOTHING;
  $$,
  'Anonymous visitor can register payment interest'
);

-- Test 12: Anon cannot read all payment interest
SELECT is_empty(
  'SELECT * FROM payment_interest',
  'Anon visitor cannot select rows from payment_interest'
);

SELECT * FROM finish();
ROLLBACK;

