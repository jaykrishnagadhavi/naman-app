-- Migration: 20261031000009_storage_and_realtime.sql
-- Description: Storage buckets, storage RLS policies, and Supabase Realtime publications

-- ============================================================================
-- 1. Storage Buckets Configuration
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'program-images',
    'program-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'site-assets',
    'site-assets',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'attachments',
    'attachments',
    false,
    52428800, -- 50MB
    ARRAY[
      'application/pdf',
      'application/zip',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. Storage RLS Policies
-- ============================================================================

-- Program Images (Public read, Staff/Admin write)
CREATE POLICY "program_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'program-images');

CREATE POLICY "program_images_staff_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'program-images' AND is_staff_or_admin());

CREATE POLICY "program_images_staff_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'program-images' AND is_staff_or_admin())
  WITH CHECK (bucket_id = 'program-images' AND is_staff_or_admin());

CREATE POLICY "program_images_staff_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'program-images' AND is_staff_or_admin());

-- Site Assets (Public read, Staff/Admin write)
CREATE POLICY "site_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "site_assets_staff_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND is_staff_or_admin());

CREATE POLICY "site_assets_staff_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND is_staff_or_admin())
  WITH CHECK (bucket_id = 'site-assets' AND is_staff_or_admin());

CREATE POLICY "site_assets_staff_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND is_staff_or_admin());

-- Avatars (Public read, User writes to their own folder)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );

CREATE POLICY "avatars_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );

-- Attachments (Private, Enrolled students and staff read, Staff write)
CREATE POLICY "attachments_authorized_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND (
      is_staff_or_admin()
      OR (
        auth.uid() IS NOT NULL
        AND has_active_enrollment(
          ((storage.foldername(name))[1])::uuid
        )
      )
    )
  );

CREATE POLICY "attachments_staff_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND is_staff_or_admin());

CREATE POLICY "attachments_staff_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'attachments' AND is_staff_or_admin())
  WITH CHECK (bucket_id = 'attachments' AND is_staff_or_admin());

CREATE POLICY "attachments_staff_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'attachments' AND is_staff_or_admin());

-- ============================================================================
-- 3. Supabase Realtime Publication
-- ============================================================================
ALTER TABLE announcements REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE program_sessions REPLICA IDENTITY FULL;
ALTER TABLE session_links REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'program_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE program_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'session_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE session_links;
  END IF;
END $$;

