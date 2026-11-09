-- pgTAP Test: Verifies admin profile preservation on Google OAuth sign-in
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap SCHEMA extensions;
SET search_path = public, extensions;
SELECT plan(4);

-- 1. Create a simulated seeded admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '00000000-0000-0000-0000-000000000000',
  'test-admin-seeded@abrainoconcious.com',
  '',
  NOW(),
  '{"role": "admin"}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
  id,
  full_name,
  role,
  is_blocked
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '',
  'admin',
  false
) ON CONFLICT (id) DO UPDATE SET role = 'admin';

SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '99999999-9999-9999-9999-999999999999'),
  'admin',
  'Initial seeded admin has role admin'
);

-- 2. Simulate Google OAuth login updating metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'full_name', 'Google Admin Naman',
  'picture', 'https://lh3.googleusercontent.com/photo.jpg',
  'email_verified', true
)
WHERE id = '99999999-9999-9999-9999-999999999999';

SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '99999999-9999-9999-9999-999999999999'),
  'admin',
  'Admin role is preserved and not downgraded on Google sign-in'
);

SELECT is(
  (SELECT full_name FROM public.profiles WHERE id = '99999999-9999-9999-9999-999999999999'),
  'Google Admin Naman',
  'Full name is filled from Google metadata'
);

SELECT is(
  (SELECT avatar_url FROM public.profiles WHERE id = '99999999-9999-9999-9999-999999999999'),
  'https://lh3.googleusercontent.com/photo.jpg',
  'Avatar URL is filled from Google picture metadata'
);

SELECT * FROM finish();
ROLLBACK;
