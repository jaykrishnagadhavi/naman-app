-- Migration: 20261104000002_program_image_srcset.sql
-- Description: Add responsive WebP srcset columns (thumbnail_srcset, poster_srcset, cover_srcset) to programs table

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS thumbnail_srcset JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS poster_srcset JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cover_srcset JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN programs.thumbnail_srcset IS 'Responsive WebP srcset map: {"480": url, "960": url, "1600": url}';
COMMENT ON COLUMN programs.poster_srcset IS 'Responsive WebP srcset map: {"320": url, "640": url, "1000": url}';
COMMENT ON COLUMN programs.cover_srcset IS 'Responsive WebP srcset map: {"480": url, "960": url, "1600": url}';

