-- HeyReach Routing Table
-- Maps lead segments to HeyReach lists/campaigns
-- Created: 2026-01-19

-- Create the routing table
CREATE TABLE IF NOT EXISTS heyreach_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Segment identification
  segment_code TEXT UNIQUE NOT NULL,
  segment_name TEXT NOT NULL,
  description TEXT,

  -- HeyReach destination
  heyreach_list_id TEXT,                  -- List to add leads to
  heyreach_campaign_id TEXT,              -- Campaign/template (optional)

  -- Filtering criteria for automated routing
  filter_criteria JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE heyreach_routing IS 'Maps lead segments to HeyReach lists and campaigns for automated routing';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_heyreach_routing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER heyreach_routing_updated_at
  BEFORE UPDATE ON heyreach_routing
  FOR EACH ROW EXECUTE FUNCTION update_heyreach_routing_updated_at();

-- Seed the 4 segments
INSERT INTO heyreach_routing (segment_code, segment_name, description, filter_criteria)
VALUES
  (
    'past_participant',
    'Past Participants',
    'Alumni who attended IAML programs and are still at the same company',
    '{"lifecycle_stage": "customer", "company_status": "verified"}'
  ),
  (
    'past_participant_job_change',
    'Past Participants - Job Change',
    'Alumni who attended IAML programs and have moved to a new company',
    '{"lifecycle_stage": "customer", "company_status": "changed"}'
  ),
  (
    'company_insider',
    'Company Insiders',
    'Leads who work at companies where we have past participants (not alumni themselves)',
    '{"has_company_alumni": true, "lifecycle_stage": "lead"}'
  ),
  (
    'cold_outreach',
    'Cold Outreach',
    'ICP-qualified cold leads with no prior IAML relationship',
    '{"lifecycle_stage": "lead", "has_company_alumni": false}'
  )
ON CONFLICT (segment_code) DO UPDATE SET
  segment_name = EXCLUDED.segment_name,
  description = EXCLUDED.description,
  filter_criteria = EXCLUDED.filter_criteria,
  updated_at = NOW();

-- Verify
SELECT segment_code, segment_name, heyreach_list_id, is_active
FROM heyreach_routing
ORDER BY segment_code;
