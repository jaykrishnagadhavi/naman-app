-- Migration: 20261031000002_core_schema.sql
-- Description: Core tables: profiles, programs, sessions, protected links, course sections, lessons, protected media, bundles

-- Helper trigger for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles (linked 1:1 with Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  goal_tag TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 2. Programs (Challenges & Courses)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type program_type NOT NULL,
  category program_category NOT NULL,
  title TEXT NOT NULL,
  slug CITEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  poster_image_url TEXT,
  poster_image_alt TEXT,
  thumbnail_url TEXT,
  thumbnail_alt TEXT,
  promo_video_url TEXT,
  price_paise INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  compare_at_price_paise INTEGER CHECK (compare_at_price_paise IS NULL OR compare_at_price_paise >= 0),
  status program_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  enrollment_deadline TIMESTAMPTZ,
  max_seats INTEGER CHECK (max_seats IS NULL OR max_seats > 0),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending_pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  what_you_will_learn JSONB NOT NULL DEFAULT '[]'::jsonb,
  faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_published_program CHECK (
    status != 'published' OR (
      price_paise IS NOT NULL AND
      thumbnail_url IS NOT NULL AND
      poster_image_url IS NOT NULL
    )
  )
);

CREATE TRIGGER trg_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. Program Sessions (Public metadata only)
CREATE TABLE program_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  live_platform live_platform NOT NULL DEFAULT 'zoom',
  status session_status NOT NULL DEFAULT 'scheduled',
  task_title TEXT,
  task_body TEXT,
  resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, day_number)
);

CREATE TRIGGER trg_program_sessions_updated_at
  BEFORE UPDATE ON program_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 4. Protected Session Links (Separated from program_sessions for security)
CREATE TABLE session_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES program_sessions(id) ON DELETE CASCADE,
  live_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_session_links_updated_at
  BEFORE UPDATE ON session_links
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 5. Course Sections
CREATE TABLE course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_course_sections_updated_at
  BEFORE UPDATE ON course_sections
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 6. Lessons (Public metadata only)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  thumbnail_url TEXT,
  is_free_preview BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  release_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 7. Protected Lesson Media (Separated from lessons for security)
CREATE TABLE lesson_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
  video_id UUID, -- Foreign key constraint added in video migration
  content_url TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtitles JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_lesson_media_updated_at
  BEFORE UPDATE ON lesson_media
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 8. Bundles
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug CITEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
  compare_at_price_paise INTEGER CHECK (compare_at_price_paise IS NULL OR compare_at_price_paise >= 0),
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 9. Bundle Items
CREATE TABLE bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bundle_id, program_id)
);

