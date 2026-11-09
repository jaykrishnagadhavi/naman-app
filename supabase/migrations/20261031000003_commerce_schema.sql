-- Migration: 20261031000003_commerce_schema.sql
-- Description: Commerce tables: coupons, orders, payments, coupon_redemptions, enrollments, webhook_events

-- 1. Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CITEXT NOT NULL UNIQUE,
  discount_type discount_type NOT NULL,
  value INTEGER NOT NULL CHECK (value > 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  per_user_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_user_limit > 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  applicable_program_ids UUID[] DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_coupon_max_uses CHECK (max_uses IS NULL OR used_count <= max_uses)
);

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 2. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  program_id UUID REFERENCES programs(id) ON DELETE RESTRICT,
  bundle_id UUID REFERENCES bundles(id) ON DELETE RESTRICT,
  razorpay_order_id TEXT UNIQUE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  discount_paise INTEGER NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_order_item CHECK (program_id IS NOT NULL OR bundle_id IS NOT NULL)
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  method TEXT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  status TEXT NOT NULL DEFAULT 'captured',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ,
  refunded_amount_paise INTEGER NOT NULL DEFAULT 0 CHECK (refunded_amount_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 4. Coupon Redemptions
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_paise INTEGER NOT NULL CHECK (discount_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  status enrollment_status NOT NULL DEFAULT 'active',
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_until TIMESTAMPTZ,
  source enrollment_source NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, program_id)
);

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 6. Webhook Events (for idempotent Razorpay webhook handling)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  event_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

