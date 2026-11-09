-- Migration: 20261031000005_content_and_audit.sql
-- Description: Site content, testimonials, faqs, site_settings, and audit log

-- 1. Site Content (Landing page sections and global content)
CREATE TABLE site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key CITEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 2. Testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_avatar_url TEXT,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  video_url TEXT,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  is_featured BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. FAQs
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 4. Site Settings (Enforce single-row singleton pattern)
CREATE TABLE site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  brand_name TEXT NOT NULL DEFAULT 'ABrainoConscious',
  support_email TEXT NOT NULL DEFAULT 'support@abrainoconcious.com',
  support_whatsapp TEXT,
  gst_number TEXT,
  legal_text TEXT,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  razorpay_mode TEXT NOT NULL DEFAULT 'test' CHECK (razorpay_mode IN ('test', 'live')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 5. Audit Log (Record administrative and critical security events)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  diff JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

