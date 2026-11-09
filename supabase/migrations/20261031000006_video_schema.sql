-- Migration: 20261031000006_video_schema.sql
-- Description: Self-hosted video tables: videos, video_keys, video_sessions, video_access_logs, piracy_flags

-- 1. Videos (Tracking self-hosted transcoding and renditions)
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  original_filename TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  status video_status NOT NULL DEFAULT 'uploading',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  renditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_path TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Connect lesson_media to videos
ALTER TABLE lesson_media
  ADD CONSTRAINT fk_lesson_media_video
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL;

-- 2. Video Keys (AES-128 encryption keys - service role only)
CREATE TABLE video_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Video Sessions (Anti-piracy session tracking, watermark ID & device binding)
CREATE TABLE video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  ip_address TEXT,
  watermark_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Video Access Logs (Anti-scraping and segment burst analysis)
CREATE TABLE video_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES video_sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  segments_requested INTEGER NOT NULL DEFAULT 1 CHECK (segments_requested >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Piracy Flags (Reported and auto-detected scraping/sharing flags)
CREATE TABLE piracy_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'flagged',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

