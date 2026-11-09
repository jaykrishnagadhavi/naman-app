-- Migration: 20261105000003_drop_old_upsert_session_overload.sql
-- Description: Drop the old 15-parameter upsert_session_with_links overload to resolve PostgREST PGRST203 candidate ambiguity

DROP FUNCTION IF EXISTS public.upsert_session_with_links(
  UUID,
  INT,
  TEXT,
  TIMESTAMPTZ,
  UUID,
  TEXT,
  live_platform,
  session_status,
  TEXT,
  TEXT,
  JSONB,
  TEXT,
  TEXT,
  BOOLEAN,
  BOOLEAN
);

-- Ensure upsert_session_with_links has the exact 16-parameter signature matching save_session_with_links
CREATE OR REPLACE FUNCTION public.upsert_session_with_links(
  p_program_id UUID,
  p_day_number INT,
  p_title TEXT,
  p_scheduled_at TIMESTAMPTZ,
  p_session_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_live_platform live_platform DEFAULT 'zoom',
  p_status session_status DEFAULT 'scheduled',
  p_task_title TEXT DEFAULT NULL,
  p_task_body TEXT DEFAULT NULL,
  p_resources JSONB DEFAULT '[]'::jsonb,
  p_live_url TEXT DEFAULT NULL,
  p_recording_url TEXT DEFAULT NULL,
  p_recording_visible BOOLEAN DEFAULT false,
  p_is_link_published BOOLEAN DEFAULT false,
  p_notify_enrollees BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN save_session_with_links(
    p_program_id := p_program_id,
    p_day_number := p_day_number,
    p_title := p_title,
    p_scheduled_at := p_scheduled_at,
    p_session_id := p_session_id,
    p_description := p_description,
    p_live_platform := p_live_platform,
    p_status := p_status,
    p_task_title := p_task_title,
    p_task_body := p_task_body,
    p_resources := p_resources,
    p_live_url := p_live_url,
    p_recording_url := p_recording_url,
    p_recording_visible := p_recording_visible,
    p_is_link_published := p_is_link_published,
    p_notify_enrollees := p_notify_enrollees
  );
END;
$$;

