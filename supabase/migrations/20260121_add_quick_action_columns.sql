-- n8n-brain: Add Quick Action Support Columns
-- Migration: Add columns to workflow_registry for iOS quick actions
-- Date: 2026-01-21

-- ============================================
-- ADD QUICK ACTION COLUMNS
-- These columns enable workflows to be triggered from the iOS app
-- ============================================

-- webhook_url: The n8n webhook URL for triggering this workflow via HTTP POST
-- Only workflows with a webhook trigger can be triggered from the app
ALTER TABLE n8n_brain.workflow_registry
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- quick_action_icon: SF Symbol name for display in the iOS quick actions grid
-- Defaults to 'bolt.fill' which represents a quick action/trigger
ALTER TABLE n8n_brain.workflow_registry
ADD COLUMN IF NOT EXISTS quick_action_icon TEXT DEFAULT 'bolt.fill';

-- risk_level: Determines if confirmation dialog is required before triggering
-- 'safe' = execute immediately on tap
-- 'risky' = show confirmation dialog first
-- 'destructive' = show destructive-style confirmation dialog
ALTER TABLE n8n_brain.workflow_registry
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'safe'
CHECK (risk_level IN ('safe', 'risky', 'destructive'));

-- quick_action_enabled: Whether this workflow appears in the quick actions grid
-- User can enable/disable from Settings screen
ALTER TABLE n8n_brain.workflow_registry
ADD COLUMN IF NOT EXISTS quick_action_enabled BOOLEAN DEFAULT false;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN n8n_brain.workflow_registry.webhook_url IS 'n8n webhook URL for triggering this workflow from external systems';
COMMENT ON COLUMN n8n_brain.workflow_registry.quick_action_icon IS 'SF Symbol name for iOS quick actions grid display';
COMMENT ON COLUMN n8n_brain.workflow_registry.risk_level IS 'Determines confirmation behavior: safe (immediate), risky (confirm), destructive (confirm with warning)';
COMMENT ON COLUMN n8n_brain.workflow_registry.quick_action_enabled IS 'Whether this workflow appears in the iOS quick actions grid';
