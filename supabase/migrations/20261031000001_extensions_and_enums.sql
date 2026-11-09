-- Migration: 20261031000001_extensions_and_enums.sql
-- Description: Enable core PostgreSQL extensions and create all platform enums

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Enums
CREATE TYPE user_role AS ENUM (
  'admin',
  'staff',
  'student'
);

CREATE TYPE program_type AS ENUM (
  'challenge',
  'course'
);

CREATE TYPE program_status AS ENUM (
  'draft',
  'published',
  'live',
  'completed',
  'archived'
);

CREATE TYPE session_status AS ENUM (
  'scheduled',
  'live',
  'ended'
);

CREATE TYPE live_platform AS ENUM (
  'zoom',
  'meet',
  'youtube',
  'other'
);

CREATE TYPE enrollment_status AS ENUM (
  'active',
  'refunded',
  'revoked'
);

CREATE TYPE enrollment_source AS ENUM (
  'paid',
  'manual',
  'coupon_free'
);

CREATE TYPE order_status AS ENUM (
  'created',
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE discount_type AS ENUM (
  'percent',
  'flat'
);

CREATE TYPE announcement_kind AS ENUM (
  'info',
  'success',
  'warning',
  'urgent'
);

CREATE TYPE announcement_audience AS ENUM (
  'all',
  'program',
  'user'
);

CREATE TYPE video_status AS ENUM (
  'uploading',
  'queued',
  'transcoding',
  'ready',
  'failed'
);

CREATE TYPE program_category AS ENUM (
  'emotional',
  'mental',
  'academic',
  'personal'
);

