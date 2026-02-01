-- Logistics Tab Schema Extension
-- Phase 04-01: Extends program_logistics table for 10 in-person / 6 virtual checklist items
-- Creates program_expenses table for expense tracking with categories

-- ============================================
-- Extend program_logistics table
-- ============================================

-- People section
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS instructor_contact TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS instructor_confirmed_at TIMESTAMPTZ;

-- My Hotel
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS my_hotel_name TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS my_hotel_dates TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS my_hotel_confirmation TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS my_hotel_booked_at TIMESTAMPTZ;

-- Instructor Hotel
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS instructor_hotel_name TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS instructor_hotel_dates TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS instructor_hotel_confirmation TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS instructor_hotel_booked_at TIMESTAMPTZ;

-- Room Block (reference room_blocks table, but add quick fields for display)
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS room_block_secured_at TIMESTAMPTZ;

-- Venue
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS venue_location TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS venue_daily_rate NUMERIC(10,2);
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS venue_fb_minimum NUMERIC(10,2);
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS venue_confirmed_at TIMESTAMPTZ;

-- BEO
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS beo_url TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS beo_file_name TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS beo_status TEXT DEFAULT 'draft';
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS beo_uploaded_at TIMESTAMPTZ;

-- Add check constraint for beo_status (separate from ALTER to handle existing data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'program_logistics_beo_status_check'
  ) THEN
    ALTER TABLE program_logistics
    ADD CONSTRAINT program_logistics_beo_status_check
    CHECK (beo_status IS NULL OR beo_status IN ('draft', 'final'));
  END IF;
END $$;

-- Materials (7-item checklist)
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_sent_to_instructor BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_sent_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_feedback_received BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_feedback_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_updated BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_updated_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_printed BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_printed_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_shipped BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_shipped_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS materials_tracking TEXT;

-- AV Equipment
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS av_purchased BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS av_purchased_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS av_shipped BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS av_shipped_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS av_tracking TEXT;

-- Virtual-specific fields
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS platform_ready BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS platform_link TEXT;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS platform_ready_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS calendar_invites_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS calendar_invites_at TIMESTAMPTZ;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS reminder_emails_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS reminder_emails_at TIMESTAMPTZ;

-- Updated timestamp
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- Create program_expenses table
-- ============================================

CREATE TABLE IF NOT EXISTS program_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_instance_id UUID NOT NULL REFERENCES program_instances(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Accommodations', 'Venue', 'Materials', 'Equipment', 'Other')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE,
  receipt_url TEXT,
  receipt_file_name TEXT,
  receipt_file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for program_expenses
CREATE INDEX IF NOT EXISTS idx_program_expenses_program_id ON program_expenses(program_instance_id);
CREATE INDEX IF NOT EXISTS idx_program_expenses_category ON program_expenses(category);

-- ============================================
-- Updated timestamp trigger for program_expenses
-- ============================================

CREATE OR REPLACE FUNCTION update_program_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS program_expenses_updated_at_trigger ON program_expenses;
CREATE TRIGGER program_expenses_updated_at_trigger
  BEFORE UPDATE ON program_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_program_expenses_updated_at();

-- ============================================
-- RLS Policies for program_expenses
-- ============================================

ALTER TABLE program_expenses ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (single-tenant app)
DROP POLICY IF EXISTS "Allow all for authenticated" ON program_expenses;
CREATE POLICY "Allow all for authenticated" ON program_expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to anon for API routes
GRANT SELECT, INSERT, UPDATE, DELETE ON program_expenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON program_expenses TO authenticated;

COMMENT ON TABLE program_expenses IS 'Tracks expenses for program instances with categories and receipt attachments';
COMMENT ON COLUMN program_expenses.category IS 'One of: Accommodations, Venue, Materials, Equipment, Other';
COMMENT ON COLUMN program_expenses.receipt_url IS 'Supabase Storage path for receipt file';
