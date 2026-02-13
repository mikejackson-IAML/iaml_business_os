-- ============================================================================
-- MIGRATION: Analytics Materialized Views (Marketing Analytics Dashboard)
-- ============================================================================
-- Part of: Marketing Analytics Dashboard project
-- Purpose: Creates 5 materialized views that pre-compute the expensive
--          aggregate queries the dashboard RPC functions will read from.
--          These are the performance backbone -- without them every dashboard
--          load would run COUNT + GROUP BY across the full campaign_activity
--          table (100K+ rows as campaigns scale).
--
-- Dependencies:
--   002_campaign_tracking_tables.sql  (all campaign tables)
--   20260212_analytics_classify_tier.sql  (classify_tier function)
--
-- Pattern: Each view has a UNIQUE INDEX on (primary_key, tier) to enable
--          REFRESH MATERIALIZED VIEW CONCURRENTLY (avoids read locks).
--
-- Views created:
--   1. mv_pipeline_funnel       - Pipeline stages per campaign per tier
--   2. mv_channel_scoreboard    - Per-channel metrics per tier
--   3. mv_campaign_summary      - Campaign health overview per tier
--   4. mv_campaign_step_metrics - Sequence step drill-down per tier
--   5. mv_conversion_metrics    - Conversion tracking per campaign per tier
-- ============================================================================


-- ============================================================================
-- VIEW 1: mv_pipeline_funnel
-- ============================================================================
-- Aggregates pipeline stages per campaign per tier.
-- Stages: total_cold -> engaged -> qualified -> registered -> alumni
-- Dashboard component: Pipeline funnel visualization
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_pipeline_funnel AS
SELECT
  mc.id AS campaign_id,
  mc.name AS campaign_name,
  classify_tier(c.job_title) AS tier,
  COUNT(cc.id) AS total_cold,
  COUNT(cc.id) FILTER (WHERE cc.first_engagement_at IS NOT NULL) AS engaged,
  COUNT(cc.id) FILTER (WHERE cc.ghl_branch IS NOT NULL) AS qualified,
  COUNT(cc.id) FILTER (WHERE cc.quarterly_update_registered = TRUE) AS registered,
  COUNT(cc.id) FILTER (WHERE cc.quarterly_update_first_session_attended = TRUE) AS alumni
FROM multichannel_campaigns mc
JOIN campaign_contacts cc ON cc.campaign_id = mc.id
JOIN contacts c ON c.id = cc.contact_id
WHERE cc.status != 'opted_out'
GROUP BY mc.id, mc.name, classify_tier(c.job_title);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_pipeline_funnel_pk
  ON mv_pipeline_funnel (campaign_id, tier);

COMMENT ON MATERIALIZED VIEW mv_pipeline_funnel IS
  'Pipeline stages (cold->engaged->qualified->registered->alumni) per campaign per tier. Read by pipeline funnel RPC. Refresh via CONCURRENTLY.';


-- ============================================================================
-- VIEW 2: mv_channel_scoreboard
-- ============================================================================
-- Per-channel metrics aggregated by tier. JOIN chain:
--   campaign_channels -> campaign_contact_channels -> campaign_contacts -> contacts (tier)
--   LEFT JOIN campaign_activity (event counts)
--
-- KEY: Uses COUNT(DISTINCT ...) to prevent double-counting from the
-- activity LEFT JOIN fan-out. Registration count uses
-- conversion_attributed_channel for dedup (SCHEMA-06).
--
-- Dashboard component: Channel scoreboard / comparison table
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_channel_scoreboard AS
SELECT
  ch.id AS channel_id,
  ch.campaign_id,
  ch.channel,
  ch.platform,
  classify_tier(c.job_title) AS tier,
  COUNT(DISTINCT ccc.id) AS total_contacts,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'sent') AS sends,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'opened') AS opens,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'clicked') AS clicks,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type IN ('replied', 'message_replied')) AS replies,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'bounced') AS bounces,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'connection_sent') AS connection_requests,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'connection_accepted') AS connections_accepted,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.quarterly_update_registered = TRUE
    AND cc.conversion_attributed_channel = ch.channel) AS registrations
FROM campaign_channels ch
JOIN campaign_contact_channels ccc ON ccc.campaign_channel_id = ch.id
JOIN campaign_contacts cc ON cc.id = ccc.campaign_contact_id
JOIN contacts c ON c.id = cc.contact_id
LEFT JOIN campaign_activity ca ON ca.campaign_channel_id = ch.id
  AND ca.campaign_contact_id = ccc.campaign_contact_id
GROUP BY ch.id, ch.campaign_id, ch.channel, ch.platform, classify_tier(c.job_title);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_channel_scoreboard_pk
  ON mv_channel_scoreboard (channel_id, tier);

COMMENT ON MATERIALIZED VIEW mv_channel_scoreboard IS
  'Per-channel engagement metrics (sends/opens/clicks/replies/bounces/connections/registrations) per tier. Registration count uses conversion_attributed_channel for SCHEMA-06 dedup. Read by channel scoreboard RPC.';


-- ============================================================================
-- VIEW 3: mv_campaign_summary
-- ============================================================================
-- One row per campaign per tier with health metrics and branch distribution.
-- LEFT JOINs campaign_contact_channels for replied_contacts (has_replied
-- lives on ccc). COUNT(DISTINCT cc.id) ensures contacts with multiple
-- channel records are counted once.
--
-- Dashboard component: Campaign overview / summary cards
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_campaign_summary AS
SELECT
  mc.id AS campaign_id,
  mc.name AS campaign_name,
  mc.status AS campaign_status,
  mc.started_at,
  classify_tier(c.job_title) AS tier,
  COUNT(DISTINCT cc.id) AS total_contacts,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.status = 'active') AS active_contacts,
  COUNT(DISTINCT cc.id) FILTER (WHERE ccc.has_replied = TRUE) AS replied_contacts,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.quarterly_update_registered = TRUE) AS registered_contacts,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.ghl_branch = 'A') AS branch_a,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.ghl_branch = 'A+') AS branch_a_plus,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.ghl_branch = 'B') AS branch_b,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.ghl_branch = 'C') AS branch_c,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.status = 'opted_out') AS opted_out
FROM multichannel_campaigns mc
JOIN campaign_contacts cc ON cc.campaign_id = mc.id
JOIN contacts c ON c.id = cc.contact_id
LEFT JOIN campaign_contact_channels ccc ON ccc.campaign_contact_id = cc.id
GROUP BY mc.id, mc.name, mc.status, mc.started_at, classify_tier(c.job_title);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_campaign_summary_pk
  ON mv_campaign_summary (campaign_id, tier);

COMMENT ON MATERIALIZED VIEW mv_campaign_summary IS
  'Campaign health overview (contacts, replies, registrations, branch distribution, opt-outs) per tier. Read by campaign summary RPC.';


-- ============================================================================
-- VIEW 4: mv_campaign_step_metrics
-- ============================================================================
-- Per-sequence-step metrics for campaign drill-down. Groups by message_id
-- (each step in the sequence) and tier. LEFT JOINs ensure steps with no
-- activity still appear.
--
-- Dashboard component: Campaign step-by-step performance drill-down
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_campaign_step_metrics AS
SELECT
  cm.campaign_id,
  cm.channel_id,
  cm.id AS message_id,
  cm.message_code,
  cm.message_name,
  cm.message_type,
  cm.sequence_order,
  ch.channel,
  classify_tier(c.job_title) AS tier,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'sent') AS sends,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'opened') AS opens,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'clicked') AS clicks,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type IN ('replied', 'message_replied')) AS replies,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'bounced') AS bounces
FROM campaign_messages cm
JOIN campaign_channels ch ON ch.id = cm.channel_id
LEFT JOIN campaign_activity ca ON ca.message_id = cm.id
LEFT JOIN campaign_contacts cc ON cc.id = ca.campaign_contact_id
LEFT JOIN contacts c ON c.id = cc.contact_id
GROUP BY cm.campaign_id, cm.channel_id, cm.id, cm.message_code, cm.message_name,
         cm.message_type, cm.sequence_order, ch.channel, classify_tier(c.job_title);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_campaign_step_metrics_pk
  ON mv_campaign_step_metrics (message_id, tier);

COMMENT ON MATERIALIZED VIEW mv_campaign_step_metrics IS
  'Per-sequence-step engagement metrics (sends/opens/clicks/replies/bounces) per tier. Read by campaign drill-down RPC for step-by-step performance analysis.';


-- ============================================================================
-- VIEW 5: mv_conversion_metrics
-- ============================================================================
-- Conversion tracking per campaign per tier. Includes QU signups, QU
-- attendance, secondary offers, referrals, and positive reply rate (from
-- Gemini AI classification stored in campaign_activity.metadata).
--
-- Dashboard component: Conversion metrics / ROI panel
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_conversion_metrics AS
SELECT
  mc.id AS campaign_id,
  mc.name AS campaign_name,
  classify_tier(c.job_title) AS tier,
  COUNT(DISTINCT cc.id) AS total_contacts,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.quarterly_update_registered = TRUE) AS qu_signups,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.quarterly_update_first_session_attended = TRUE) AS qu_attended,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.secondary_offer_interested = TRUE) AS secondary_interested,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.secondary_offer_accepted = TRUE) AS secondary_accepted,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.colleague_email IS NOT NULL) AS referrals_generated,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc.colleague_registered = TRUE) AS referrals_converted,
  COUNT(DISTINCT ca.id) FILTER (
    WHERE ca.activity_type IN ('replied', 'message_replied')
      AND ca.metadata->>'reply_sentiment' = 'positive'
  ) AS positive_replies,
  COUNT(DISTINCT ca.id) FILTER (
    WHERE ca.activity_type IN ('replied', 'message_replied')
  ) AS total_replies
FROM multichannel_campaigns mc
JOIN campaign_contacts cc ON cc.campaign_id = mc.id
JOIN contacts c ON c.id = cc.contact_id
LEFT JOIN campaign_activity ca ON ca.campaign_contact_id = cc.id
GROUP BY mc.id, mc.name, classify_tier(c.job_title);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_conversion_metrics_pk
  ON mv_conversion_metrics (campaign_id, tier);

COMMENT ON MATERIALIZED VIEW mv_conversion_metrics IS
  'Conversion funnel (QU signups, attendance, secondary offers, referrals, positive reply rate) per campaign per tier. Positive replies use metadata reply_sentiment from Gemini AI classification. Read by conversion metrics RPC.';
