-- Add AI summary columns to li_contacts
-- Phase 03: AI Search & Intelligence

ALTER TABLE li_contacts ADD COLUMN IF NOT EXISTS ai_summary jsonb DEFAULT NULL;
ALTER TABLE li_contacts ADD COLUMN IF NOT EXISTS ai_summary_generated_at timestamptz DEFAULT NULL;
