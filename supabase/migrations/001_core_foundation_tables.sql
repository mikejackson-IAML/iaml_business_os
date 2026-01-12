-- ============================================================================
-- MIGRATION 001: Core Foundation Tables
-- ============================================================================
-- Run this FIRST in Supabase SQL Editor
-- Creates: programs, venues, faculty, companies
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROGRAMS (Course Catalog)
-- ============================================================================
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  code TEXT,
  program_type TEXT, -- 'Employment Law', 'Benefits Law', 'HR Management', etc.
  slug TEXT UNIQUE,

  -- Descriptions
  short_description TEXT,
  full_description TEXT,
  who_should_attend TEXT,
  learning_objectives TEXT,
  topics_covered TEXT,
  key_takeaways TEXT,

  -- Duration & Credits
  duration_days NUMERIC(3,1) DEFAULT 1,
  credits JSONB DEFAULT '{
    "ceu": null,
    "cle": null,
    "hrci": null,
    "shrm": null
  }'::jsonb,

  -- Pricing
  pricing JSONB DEFAULT '{
    "in_person": null,
    "virtual": null,
    "on_demand": null,
    "group_rate_3_5": null,
    "group_rate_6_plus": null,
    "alumni_discount_pct": 15,
    "corporate_onsite": null
  }'::jsonb,

  -- Format Availability
  available_in_person BOOLEAN DEFAULT true,
  available_virtual BOOLEAN DEFAULT false,
  available_on_demand BOOLEAN DEFAULT false,
  available_corporate BOOLEAN DEFAULT false,
  format_notes TEXT,

  -- Block Structure (for multi-day programs with segments)
  has_blocks BOOLEAN DEFAULT false,
  blocks JSONB DEFAULT '[]'::jsonb, -- [{name, price, duration}]

  -- Materials
  materials JSONB DEFAULT '{
    "workbook": null,
    "slide_deck": null,
    "handouts": null,
    "faculty_guide": null,
    "last_updated": null
  }'::jsonb,

  -- Images & Marketing
  program_image_url TEXT,
  brochure_pdf_url TEXT,
  meta_title TEXT,
  meta_description TEXT,

  -- Approvals
  cle_approved_states TEXT[],
  cle_approval_numbers JSONB DEFAULT '{}'::jsonb,
  hrci_approval_number TEXT,
  shrm_approval_number TEXT,
  approval_expiration_date DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'development')),

  -- Internal Notes
  development_notes TEXT,
  feedback_themes TEXT,
  future_enhancements TEXT,
  internal_notes TEXT,

  -- Airtable Migration
  airtable_record_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_type ON programs(program_type);
CREATE INDEX idx_programs_slug ON programs(slug);

-- ============================================================================
-- VENUES (Hotels/Locations)
-- ============================================================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  brand TEXT, -- Marriott, Hilton, Caesars, etc.

  -- Address
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Contact
  phone TEXT,
  website TEXT,
  reservations_phone TEXT,
  group_sales_contact TEXT,

  -- Description
  description TEXT,

  -- Amenities
  amenities JSONB DEFAULT '{
    "parking_available": false,
    "parking_type": null,
    "parking_fee": null,
    "wifi_available": false,
    "wifi_cost": null,
    "business_center": false,
    "fitness_center": false,
    "restaurant_on_site": false,
    "room_service": false
  }'::jsonb,

  -- Rates & Fees
  room_rate NUMERIC(10,2),
  resort_fee NUMERIC(10,2),

  -- Meeting Space
  av_included BOOLEAN DEFAULT false,
  catering_minimum NUMERIC(10,2),
  catering_notes TEXT,

  -- Booking Links
  hotel_booking_link TEXT,
  room_block_booking_link TEXT,

  -- Status
  active_status BOOLEAN DEFAULT true,
  preferred_venue BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,

  -- Airtable Migration
  airtable_record_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_city_state ON venues(city, state);
CREATE INDEX idx_venues_active ON venues(active_status);

-- ============================================================================
-- FACULTY (Instructors)
-- ============================================================================
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Name
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  preferred_name TEXT,
  display_name TEXT,
  professional_suffix TEXT, -- Esq., J.D., Ph.D., etc.
  full_name_with_credentials TEXT,

  -- Contact
  email TEXT,
  phone TEXT,
  office_phone TEXT,
  preferred_contact_method TEXT,

  -- Professional Info
  current_title TEXT,
  current_organization TEXT,
  firm_city TEXT,
  firm_state TEXT,

  -- Expertise
  practice_areas TEXT[],
  years_of_experience INTEGER,
  bar_admissions TEXT[],
  education TEXT,

  -- Faculty Status
  faculty_status TEXT DEFAULT 'active' CHECK (faculty_status IN ('active', 'inactive', 'emeritus', 'prospect')),
  start_date_with_iaml DATE,
  years_with_iaml NUMERIC(4,1),
  faculty_type TEXT, -- 'Primary', 'Guest', 'Subject Matter Expert'

  -- Teaching
  teaching_specialties TEXT[],
  available_for_teaching BOOLEAN DEFAULT true,
  preferred_teaching_format TEXT, -- 'in-person', 'virtual', 'both'
  willing_to_travel BOOLEAN DEFAULT true,
  preferred_travel_cities TEXT[],
  blackout_dates JSONB DEFAULT '[]'::jsonb, -- [{start, end, reason}]
  max_sessions_per_year INTEGER,

  -- Compensation
  payment_structure TEXT,
  standard_rate NUMERIC(10,2),
  travel_reimbursement TEXT,
  w9_on_file BOOLEAN DEFAULT false,
  last_w9_update DATE,

  -- Bio & Media
  headshot_url TEXT,
  short_bio TEXT,
  full_bio TEXT,
  notable_achievements TEXT,
  published_works TEXT,
  linkedin_url TEXT,
  firm_website TEXT,
  faculty_page_url TEXT,

  -- Internal Assessment
  strengths TEXT,
  areas_for_development TEXT,
  student_feedback_themes TEXT,
  internal_notes TEXT,

  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,

  -- Airtable Migration
  airtable_record_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faculty_status ON faculty(faculty_status);
CREATE INDEX idx_faculty_available ON faculty(available_for_teaching);
CREATE INDEX idx_faculty_name ON faculty(last_name, first_name);

-- ============================================================================
-- COMPANIES (Organizations)
-- ============================================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  domain TEXT,
  website TEXT,

  -- Industry & Size
  industry TEXT,
  naics_code TEXT,
  company_size TEXT, -- '1-50', '51-200', '201-500', '501-1000', '1000+'
  company_type TEXT, -- 'Corporation', 'Non-profit', 'Government', etc.
  employee_count INTEGER,

  -- Location
  hq_city TEXT,
  hq_state TEXT,
  hq_zip TEXT,
  address TEXT,
  country TEXT DEFAULT 'USA',
  multi_location BOOLEAN DEFAULT false,

  -- Contact
  main_phone TEXT,
  main_email TEXT,
  linkedin_url TEXT,

  -- Account Status
  account_status TEXT DEFAULT 'prospect' CHECK (account_status IN ('prospect', 'active', 'inactive', 'churned')),
  corporate_training_prospect BOOLEAN DEFAULT false,
  company_priority_score INTEGER,
  compliance_risk_profile TEXT,
  training_budget_cycle TEXT,

  -- Hierarchy
  parent_company_id UUID REFERENCES companies(id),

  -- Computed Metrics (updated by triggers/functions)
  total_registrations INTEGER DEFAULT 0,
  total_contacts INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  first_engagement_date DATE,
  last_engagement_date DATE,
  average_nps NUMERIC(4,2),

  -- Notes
  notes TEXT,

  -- Airtable Migration
  airtable_record_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_status ON companies(account_status);
CREATE INDEX idx_companies_industry ON companies(industry);

-- ============================================================================
-- DISCOUNT CODES
-- ============================================================================
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Code Info
  code TEXT UNIQUE NOT NULL,
  code_type TEXT, -- 'Alumni', 'Early Bird', 'Group', 'Corporate', 'Promotional'
  display_name TEXT,

  -- Discount Structure
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'special_price')),
  discount_percentage NUMERIC(5,2),
  discount_amount NUMERIC(10,2),
  special_price NUMERIC(10,2),

  -- Descriptions
  description TEXT,
  public_description TEXT,
  terms_conditions TEXT,

  -- Eligibility
  eligible_program_formats TEXT[], -- ['in-person', 'virtual', 'on-demand']
  minimum_registration_count INTEGER,
  maximum_uses_per_person INTEGER,
  alumni_only BOOLEAN DEFAULT false,
  company_specific_id UUID REFERENCES companies(id),

  -- Validity
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  auto_expire BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,

  -- Usage Limits
  maximum_total_uses INTEGER,
  maximum_uses_per_day INTEGER,
  budget_cap NUMERIC(12,2),
  current_uses INTEGER DEFAULT 0,

  -- Stacking Rules
  stackable BOOLEAN DEFAULT false,
  cannot_combine_with TEXT[],

  -- Marketing Attribution
  campaign_name TEXT,
  source_channel TEXT,
  utm_parameters JSONB,
  landing_page_url TEXT,

  -- Approval
  created_for TEXT,
  approval_status TEXT DEFAULT 'approved',
  approved_by TEXT,

  -- Notes
  notes TEXT,

  -- Airtable Migration
  airtable_record_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active);
CREATE INDEX idx_discount_codes_valid ON discount_codes(valid_from, valid_until);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faculty_updated_at
  BEFORE UPDATE ON faculty
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE programs IS 'Course catalog - the template/definition for each seminar type';
COMMENT ON TABLE venues IS 'Hotels and meeting locations used for in-person programs';
COMMENT ON TABLE faculty IS 'Instructors, speakers, and subject matter experts';
COMMENT ON TABLE companies IS 'Organizations - both customers and prospects';
COMMENT ON TABLE discount_codes IS 'Promotional codes, alumni discounts, group rates, etc.';
