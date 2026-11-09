-- pgTAP Test Suite for Step 6 Public Catalog & Program RPC Security
-- Validates that public-facing RPCs and table queries never leak protected links or media.

BEGIN;
SELECT plan(10);

-- ============================================================================
-- 1. Anonymous Access Tests for get_catalog and get_trending_programs
-- ============================================================================
SET ROLE anon;
SET request.jwt.claim.sub = '';
SET request.jwt.claim.role = 'anon';

-- Test 1: get_catalog is callable by anonymous visitors
SELECT lives_ok(
  $$ SELECT get_catalog() $$,
  'Anonymous visitor can call get_catalog without permission error'
);

-- Test 2: get_trending_programs is callable by anonymous visitors
SELECT lives_ok(
  $$ SELECT get_trending_programs(5) $$,
  'Anonymous visitor can call get_trending_programs without permission error'
);

-- Test 3: get_catalog result contains no drafts for anon
SELECT ok(
  NOT (get_catalog()->'items'::text LIKE '%"status": "draft"%'),
  'get_catalog never exposes draft programs to anonymous visitors'
);

-- Test 4: get_trending_programs contains no drafts
SELECT ok(
  NOT (get_trending_programs(10)::text LIKE '%"status": "draft"%'),
  'get_trending_programs never exposes draft programs'
);

-- ============================================================================
-- 2. Leak Prevention in get_program_public
-- ============================================================================
-- Test 5: get_program_public does not leak live_url
SELECT ok(
  NOT (COALESCE(get_program_public('21-day-mindset-reset')::text, '') LIKE '%live_url%'),
  'get_program_public NEVER includes live_url key in output'
);

-- Test 6: get_program_public does not leak recording_url
SELECT ok(
  NOT (COALESCE(get_program_public('21-day-mindset-reset')::text, '') LIKE '%recording_url%'),
  'get_program_public NEVER includes recording_url key in output'
);

-- Test 7: get_program_public does not leak protected lesson_media video_id
SELECT ok(
  NOT (COALESCE(get_program_public('emotional-regulation-masterclass')::text, '') LIKE '%video_id%'),
  'get_program_public NEVER includes video_id key in output'
);

-- Test 8: get_program_public does not leak lesson_media content_url
SELECT ok(
  NOT (COALESCE(get_program_public('emotional-regulation-masterclass')::text, '') LIKE '%content_url%'),
  'get_program_public NEVER includes content_url key in output'
);

-- ============================================================================
-- 3. Direct Table Access Verification (RLS Enforced)
-- ============================================================================
-- Test 9: Anon client cannot read session_links table directly
SELECT is_empty(
  'SELECT * FROM session_links',
  'Anon client cannot read session_links directly'
);

-- Test 10: Anon client cannot read lesson_media table directly
SELECT is_empty(
  'SELECT * FROM lesson_media',
  'Anon client cannot read lesson_media directly'
);

SELECT * FROM finish();
ROLLBACK;

