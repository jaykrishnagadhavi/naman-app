-- Migration: 20261104000001_auth_and_onboarding.sql
-- Description: Adds onboarding and legal consent tracking to profiles, creates account_deletion_requests,
--              and updates Google OAuth metadata synchronization to preserve admin roles.

-- 1. Extend profiles with onboarding and legal consent attributes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS goal_pillars TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- 2. Create account_deletion_requests table
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_account_deletion_requests_updated_at
  BEFORE UPDATE ON account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. Row Level Security for account_deletion_requests
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deletion_requests_select_own_or_admin"
  ON account_deletion_requests FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "deletion_requests_insert_own"
  ON account_deletion_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "deletion_requests_update_admin"
  ON account_deletion_requests FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "deletion_requests_delete_admin"
  ON account_deletion_requests FOR DELETE
  USING (is_admin());

-- 4. Enhance handle_new_user() to extract full_name and avatar_url from Google metadata
--    and ensure admin roles are never overwritten or downgraded on identity conflict.
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
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

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
    full_name = CASE
      WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name
      ELSE profiles.full_name
    END,
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 5. Trigger to synchronize updated OAuth metadata when user signs in again
CREATE OR REPLACE FUNCTION handle_user_updated()
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
    NEW.raw_user_meta_data->>'name'
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  UPDATE profiles
  SET
    full_name = CASE
      WHEN (profiles.full_name IS NULL OR profiles.full_name = '') AND v_full_name IS NOT NULL THEN v_full_name
      ELSE profiles.full_name
    END,
    avatar_url = COALESCE(profiles.avatar_url, v_avatar_url),
    phone = COALESCE(NEW.phone, profiles.phone),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_updated ON auth.users;
CREATE TRIGGER trg_on_auth_user_updated
  AFTER UPDATE OF raw_user_meta_data, phone ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_updated();

