-- Update HeyReach Routing Table with actual list IDs
-- Created: 2026-01-19

-- First, clear the old segments and insert the new ones
DELETE FROM heyreach_routing;

INSERT INTO heyreach_routing (segment_code, segment_name, description, heyreach_list_id, filter_criteria)
VALUES
  (
    'past_participant_verified',
    'Past Participants (Verified Emails)',
    'Alumni who attended IAML programs with verified email addresses',
    '490482',
    '{"lifecycle_stage": "customer", "email_validation_result": "valid"}'
  ),
  (
    'past_participant_unverified',
    'Past Participants (Unverified Emails)',
    'Alumni who attended IAML programs without verified email addresses',
    '488763',
    '{"lifecycle_stage": "customer", "email_validation_result": ["invalid", "unknown", "catch_all", null]}'
  ),
  (
    'company_insider',
    'Company Insiders',
    'Leads who work at companies where we have past participants (not alumni themselves)',
    '490479',
    '{"has_company_alumni": true, "lifecycle_stage": "lead"}'
  ),
  (
    'cold_outreach',
    'Cold Outreach',
    'ICP-qualified cold leads with no prior IAML relationship',
    '490480',
    '{"lifecycle_stage": "lead", "has_company_alumni": false}'
  );

-- Verify
SELECT segment_code, segment_name, heyreach_list_id, is_active
FROM heyreach_routing
ORDER BY segment_code;
