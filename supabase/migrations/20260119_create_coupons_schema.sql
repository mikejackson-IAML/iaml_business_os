-- Coupons Schema
-- Stores discount coupons with program-type restrictions
-- Date: 2026-01-19

-- ============================================
-- COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Coupon identity
  code TEXT UNIQUE NOT NULL,              -- 'IAML-500', 'IAML-300', etc.
  name TEXT,                              -- Human-readable name
  description TEXT,

  -- Discount configuration
  discount_amount NUMERIC(10,2),          -- Fixed amount discount (e.g., 500.00)
  discount_percent INTEGER,               -- Percentage discount (e.g., 10 for 10%)

  -- Program type restrictions
  -- Array of eligible types: 'certificate', 'advanced_certificate', 'block', 'standalone'
  eligible_program_types TEXT[] DEFAULT '{}',

  -- Stripe integration
  stripe_coupon_id TEXT,                  -- Coupon ID in Stripe (e.g., 'IAML-500')

  -- Usage tracking
  max_uses INTEGER,                       -- NULL = unlimited
  times_used INTEGER DEFAULT 0,

  -- Validity
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  expiration_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coupons_code ON coupons(LOWER(code));
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_stripe_id ON coupons(stripe_coupon_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_coupons_updated_at();

-- ============================================
-- SEED INITIAL COUPONS
-- ============================================
INSERT INTO coupons (code, name, discount_amount, eligible_program_types, stripe_coupon_id, status) VALUES
  ('IAML-500', '$500 Off Certificate Programs', 500, ARRAY['certificate'], 'IAML-500', 'active'),
  ('IAML-300', '$300 Off Full Programs', 300, ARRAY['certificate', 'advanced_certificate'], 'IAML-300', 'active'),
  ('IAML-100', '$100 Off Any Program', 100, ARRAY['certificate', 'advanced_certificate', 'block', 'standalone'], 'IAML-100', 'active'),
  ('IAML-ALUMNI', 'Free Quarterly Updates for Alumni', 397, ARRAY['standalone'], 'IAML-ALUMNI', 'active')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE coupons IS 'Discount coupons with program-type restrictions for registration system';
COMMENT ON COLUMN coupons.eligible_program_types IS 'Array of program types this coupon can be applied to: certificate, advanced_certificate, block, standalone';
COMMENT ON COLUMN coupons.stripe_coupon_id IS 'Corresponding coupon ID in Stripe for checkout discount application';
