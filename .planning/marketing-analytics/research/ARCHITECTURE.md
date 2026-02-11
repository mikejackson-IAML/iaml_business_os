# Architecture Patterns: Marketing Analytics Dashboard

**Domain:** Multi-channel marketing analytics with Supabase + n8n + Next.js
**Researched:** 2026-02-11
**Confidence:** HIGH (based on existing codebase patterns and established integrations)

---

## Executive Architecture Decision

**The analytics layer sits ON TOP of the existing campaign tracking schema.** Do not redesign the existing tables (`campaign_activity`, `campaign_contacts`, `campaign_contact_channels`). Instead, add an analytics layer consisting of:

1. **Materialized views** that pre-compute expensive aggregates from existing event data
2. **A thin new table** (`analytics_sync_log`) to track ingestion freshness
3. **RPC functions** that power dashboard queries with tier filtering
4. **n8n workflows** that poll external APIs and write to existing tables

This is the cheapest path because the existing campaign tracking schema already captures 80% of the events needed. The gap is that events are not flowing in yet from SmartLead/GHL. The HeyReach webhook receiver is already operational.

---

## System Architecture Overview

```
                        DATA SOURCES
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │SmartLead │    │ HeyReach │    │   GHL    │    │Gemini AI │
    │  (REST)  │    │(Webhook) │    │(REST+WH) │    │(via n8n) │
    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                    n8n INGESTION LAYER                       │
    │                                                             │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
    │  │ SmartLead   │ │  HeyReach   │ │   GHL       │          │
    │  │ Stats Sync  │ │  Activity   │ │  Activity   │          │
    │  │ (polling    │ │  Receiver   │ │  Sync       │          │
    │  │  15 min)    │ │ (webhook)   │ │ (polling    │          │
    │  └──────┬──────┘ └──────┬──────┘ │  + webhook) │          │
    │         │               │        └──────┬──────┘          │
    │         │               │               │                  │
    │         ▼               ▼               ▼                  │
    │  ┌──────────────────────────────────────────────────┐      │
    │  │         WRITE TO EXISTING TABLES                 │      │
    │  │  campaign_activity  +  campaign_contact_channels │      │
    │  │  campaign_contacts  +  contacts                  │      │
    │  └──────────────────────────────────────────────────┘      │
    │         │                                                   │
    │         ▼                                                   │
    │  ┌──────────────────────────────────────────────────┐      │
    │  │  Materialized View Refresh (every 15 min)        │      │
    │  │  REFRESH MATERIALIZED VIEW CONCURRENTLY ...      │      │
    │  └──────────────────────────────────────────────────┘      │
    └─────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                    SUPABASE ANALYTICS LAYER                  │
    │                                                             │
    │  EXISTING TABLES (source of truth):                         │
    │  ├── campaign_activity (event log)                          │
    │  ├── campaign_contacts (journey + branch)                   │
    │  ├── campaign_contact_channels (per-channel status)         │
    │  ├── contacts (master contact with job_title for tier)      │
    │  └── campaign_channels (channel config)                     │
    │                                                             │
    │  NEW MATERIALIZED VIEWS (pre-computed aggregates):          │
    │  ├── mv_pipeline_funnel (Cold → Registered → Alumni)       │
    │  ├── mv_channel_scoreboard (registrations + cost/channel)   │
    │  ├── mv_campaign_summary (per-campaign rollup)              │
    │  └── mv_campaign_step_metrics (per-sequence-step rollup)    │
    │                                                             │
    │  NEW RPC FUNCTIONS (tier-filtered queries):                 │
    │  ├── get_pipeline_funnel(tier?)                             │
    │  ├── get_channel_scoreboard(tier?)                          │
    │  ├── get_campaign_cards(tier?)                              │
    │  ├── get_campaign_drilldown(campaign_id, tier?)             │
    │  ├── get_conversion_metrics(tier?)                          │
    │  └── get_positive_reply_rate(tier?)                         │
    │                                                             │
    │  NEW TABLE:                                                 │
    │  └── analytics_sync_log (last sync timestamps per source)  │
    └──────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                    NEXT.JS DASHBOARD LAYER                   │
    │                                                             │
    │  app/dashboard/marketing/analytics/                         │
    │  ├── page.tsx (server component, data loader)               │
    │  ├── analytics-content.tsx (client component, layout)       │
    │  ├── components/                                            │
    │  │   ├── pipeline-funnel.tsx                                │
    │  │   ├── channel-scoreboard.tsx                             │
    │  │   ├── campaign-cards.tsx                                 │
    │  │   ├── campaign-drilldown.tsx                             │
    │  │   ├── conversion-tracker.tsx                             │
    │  │   ├── tier-filter.tsx                                    │
    │  │   └── sync-status-badge.tsx                              │
    │  └── lib/                                                   │
    │      └── analytics-queries.ts (Supabase RPC calls)          │
    │                                                             │
    │  Pattern: Server Component fetches → Client Component renders│
    │  Revalidation: 300s (5 min) matching existing pattern       │
    └─────────────────────────────────────────────────────────────┘
```

---

## Component 1: Supabase Schema Design

### Strategy: Materialized Views + RPC Functions

**Why materialized views instead of regular views:** The existing `campaign_funnel` and `channel_performance` views already exist as regular views but they scan entire tables on every query. With 2,166+ contacts and growing activity logs, dashboard loads will degrade. Materialized views pre-compute once and serve from cache. n8n refreshes them every 15 minutes right after data sync.

**Why RPC functions instead of direct Supabase queries:** The tier filter requires joining `contacts.job_title` and doing pattern matching. This is a cross-cutting concern that would be duplicated across every query. RPC functions centralize the tier-filtering logic server-side.

### New Table: `analytics_sync_log`

Tracks when each data source was last synced. Powers the "last updated" badge on the dashboard.

```sql
CREATE TABLE IF NOT EXISTS analytics_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL UNIQUE,  -- 'smartlead', 'heyreach', 'ghl', 'matview_refresh'
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  records_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',  -- 'success', 'error', 'running'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tier Classification Logic

Contacts need to be classified into tiers based on `job_title`. This is the foundation for the global tier filter.

```sql
-- Helper function used by all analytics RPCs
CREATE OR REPLACE FUNCTION classify_tier(p_job_title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_job_title IS NULL THEN 'unknown'
    WHEN p_job_title ~* '(director|vp |vice president|svp |chief |ceo|coo|cfo|cpo|clo|general counsel)'
      THEN 'directors'
    WHEN p_job_title ~* '(executive|president|partner|principal|owner|managing|head of)'
      THEN 'executives'
    WHEN p_job_title ~* '(manager|supervisor|lead |coordinator|administrator|specialist|analyst)'
      THEN 'managers'
    ELSE 'other'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Materialized View 1: `mv_pipeline_funnel`

The pipeline is simple: Cold (all contacts) -> Registered (quarterly_update_registered) -> Alumni (attended first session).

```sql
CREATE MATERIALIZED VIEW mv_pipeline_funnel AS
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

CREATE UNIQUE INDEX ON mv_pipeline_funnel (campaign_id, tier);
```

### Materialized View 2: `mv_channel_scoreboard`

Per-channel metrics: sends, opens, replies, registrations, and derived rates.

```sql
CREATE MATERIALIZED VIEW mv_channel_scoreboard AS
SELECT
  ch.id AS channel_id,
  ch.campaign_id,
  ch.channel,
  ch.platform,
  classify_tier(c.job_title) AS tier,
  COUNT(DISTINCT cc.id) AS total_contacts,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'sent') AS sends,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'opened') AS opens,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'clicked') AS clicks,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type IN ('replied', 'message_replied')) AS replies,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'bounced') AS bounces,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'connection_sent') AS connection_requests,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'connection_accepted') AS connections_accepted,
  COUNT(DISTINCT cc.id) FILTER (WHERE cc2.quarterly_update_registered = TRUE) AS registrations
FROM campaign_channels ch
JOIN campaign_contact_channels ccc ON ccc.campaign_channel_id = ch.id
JOIN campaign_contacts cc2 ON cc2.id = ccc.campaign_contact_id
JOIN contacts c ON c.id = cc2.contact_id
LEFT JOIN campaign_activity ca ON ca.campaign_channel_id = ch.id
  AND ca.campaign_contact_id = ccc.campaign_contact_id
LEFT JOIN campaign_contacts cc ON cc.id = ccc.campaign_contact_id
GROUP BY ch.id, ch.campaign_id, ch.channel, ch.platform, classify_tier(c.job_title);

CREATE UNIQUE INDEX ON mv_channel_scoreboard (channel_id, tier);
```

### Materialized View 3: `mv_campaign_summary`

One row per campaign with key health metrics.

```sql
CREATE MATERIALIZED VIEW mv_campaign_summary AS
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

CREATE UNIQUE INDEX ON mv_campaign_summary (campaign_id, tier);
```

### Materialized View 4: `mv_campaign_step_metrics`

Per-sequence-step metrics for campaign drill-down. This tracks how each message step performs.

```sql
CREATE MATERIALIZED VIEW mv_campaign_step_metrics AS
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

CREATE UNIQUE INDEX ON mv_campaign_step_metrics (message_id, tier);
```

### Conversion Tracking View

```sql
CREATE MATERIALIZED VIEW mv_conversion_metrics AS
SELECT
  mc.id AS campaign_id,
  mc.name AS campaign_name,
  classify_tier(c.job_title) AS tier,
  -- QU signups
  COUNT(DISTINCT cc.id) FILTER (
    WHERE cc.quarterly_update_registered = TRUE
  ) AS qu_signups,
  -- QU attended
  COUNT(DISTINCT cc.id) FILTER (
    WHERE cc.quarterly_update_first_session_attended = TRUE
  ) AS qu_attended,
  -- Secondary offer interest
  COUNT(DISTINCT cc.id) FILTER (
    WHERE cc.secondary_offer_interested = TRUE
  ) AS secondary_interested,
  -- Secondary offer accepted
  COUNT(DISTINCT cc.id) FILTER (
    WHERE cc.secondary_offer_accepted = TRUE
  ) AS secondary_accepted,
  -- Colleague referrals
  COUNT(DISTINCT cc.id) FILTER (
    WHERE cc.colleague_email IS NOT NULL
  ) AS referrals_generated,
  COUNT(DISTINCT cc.id) FILTER (
    WHERE cc.colleague_registered = TRUE
  ) AS referrals_converted,
  -- Positive reply rate (replies with metadata containing positive classification)
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

CREATE UNIQUE INDEX ON mv_conversion_metrics (campaign_id, tier);
```

### RPC Functions (Tier-Filtered)

Each RPC function wraps a materialized view query with optional tier filtering.

```sql
-- Example: Pipeline funnel with optional tier filter
CREATE OR REPLACE FUNCTION get_analytics_pipeline(
  p_campaign_id UUID DEFAULT NULL,
  p_tier TEXT DEFAULT NULL  -- 'directors', 'executives', 'managers', or NULL for all
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  total_cold BIGINT,
  engaged BIGINT,
  qualified BIGINT,
  registered BIGINT,
  alumni BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pf.campaign_id,
    pf.campaign_name,
    SUM(pf.total_cold)::BIGINT,
    SUM(pf.engaged)::BIGINT,
    SUM(pf.qualified)::BIGINT,
    SUM(pf.registered)::BIGINT,
    SUM(pf.alumni)::BIGINT
  FROM mv_pipeline_funnel pf
  WHERE (p_campaign_id IS NULL OR pf.campaign_id = p_campaign_id)
    AND (p_tier IS NULL OR pf.tier = p_tier)
  GROUP BY pf.campaign_id, pf.campaign_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Pattern repeats for each view. The tier filter is always an optional parameter that defaults to NULL (all tiers).

### Materialized View Refresh Function

Single function to refresh all analytics views, called by n8n after data sync.

```sql
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS JSON AS $$
DECLARE
  v_start TIMESTAMPTZ := NOW();
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_funnel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_channel_scoreboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_step_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversion_metrics;

  -- Log the refresh
  INSERT INTO analytics_sync_log (source, last_sync_at, status, metadata)
  VALUES ('matview_refresh', NOW(), 'success',
    jsonb_build_object('duration_ms', EXTRACT(MILLISECONDS FROM (NOW() - v_start))::INTEGER)
  )
  ON CONFLICT (source) DO UPDATE SET
    last_sync_at = NOW(),
    status = 'success',
    metadata = jsonb_build_object('duration_ms', EXTRACT(MILLISECONDS FROM (NOW() - v_start))::INTEGER),
    updated_at = NOW();

  RETURN json_build_object('success', true, 'refreshed_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Component 2: n8n Workflow Architecture

### Workflow Overview

| Workflow | Trigger | Source | Frequency | What It Does |
|----------|---------|--------|-----------|--------------|
| SmartLead Stats Sync | Schedule (15 min) | SmartLead REST API | Every 15 min | Pulls campaign stats, maps to `campaign_activity` |
| HeyReach Activity Receiver | Webhook | HeyReach | Real-time | **Already exists** -- receives LinkedIn events |
| GHL Activity Sync | Schedule (15 min) + Webhook | GHL REST API | Every 15 min + real-time | Pulls contact updates, branch changes, registrations |
| Analytics View Refresher | Schedule (runs after syncs) | Supabase | Every 15 min | Calls `refresh_analytics_views()` |

### Workflow 1: SmartLead Stats Sync (NEW - Critical)

**Purpose:** Pull campaign statistics from SmartLead and write activity events to `campaign_activity`.

**SmartLead API endpoints to call (per campaign):**
1. `GET /campaigns/{id}/statistics` -- top-level stats (total sent, opened, clicked, replied, bounced)
2. `GET /campaigns/{id}/lead-statistics` -- per-lead stats with sequence step data
3. `GET /campaigns/{id}/analytics-by-date` -- daily breakdown (if needed for trends later)

**Data flow:**
```
Schedule Trigger (every 15 min)
       |
       v
Get SmartLead Campaign IDs from campaign_channels
  (WHERE platform = 'smartlead' AND platform_campaign_id IS NOT NULL)
       |
       v
For Each SmartLead Campaign:
  1. GET /campaigns/{sl_id}/lead-statistics?offset=0&limit=100
     (paginate through all leads)
  2. For each lead with new activity:
     - Match to Supabase contact via email
     - Calculate delta from last sync (sent_time, open_time, click_time, reply_time)
     - INSERT new campaign_activity rows (dedup by sl_stats_id in metadata)
     - UPDATE campaign_contact_channels (last_email_sent_at, last_email_opened_at, etc.)
       |
       v
Log to analytics_sync_log (source='smartlead')
       |
       v
Call refresh_analytics_views() RPC
```

**De-duplication strategy:** Store `stats_id` from SmartLead in `campaign_activity.metadata.smartlead_stats_id`. Before inserting, check for existing activity with same stats_id. This prevents duplicate events on re-sync.

**Rate limiting:** SmartLead has 10 requests per 2 seconds. The existing MCP server already implements this bucket. n8n workflow should use a "Wait" node between API calls or use the HTTP Request node with retry on 429.

### Workflow 2: HeyReach Activity Receiver (EXISTS)

**Already operational** as workflow `9bt5BdyoosqB8ChU`. Receives webhooks for:
- `connection_request_sent` -> logged
- `connection_request_accepted` -> logged + channel status updated
- `message_sent` -> logged
- `reply_received` / `message_reply_received` -> logged + Gemini AI classification + GHL branch routing

**Gap to fill:** The existing workflow is hardcoded to the Alumni Reconnect campaign. For analytics to work across campaigns, add a campaign lookup based on the HeyReach campaign ID in the webhook payload. This is a minor modification, not a new workflow.

**Current webhook endpoint:** `https://n8n.realtyamp.ai/webhook/heyreach-activity`

### Workflow 3: GHL Activity Sync (NEW - Important)

**Purpose:** Pull contact updates, branch progression, registration events from GHL.

**GHL API v2 endpoints to call:**
1. `GET /contacts/?query={email}` -- lookup contacts
2. `GET /contacts/{id}/tasks` -- task completion for registration tracking
3. `GET /opportunities/search` -- pipeline stage changes
4. Webhooks for real-time: `ContactCreate`, `ContactUpdate`, `OpportunityUpdate`, `TaskCompleted`

**Data flow:**
```
Dual trigger:
  A) Schedule (every 15 min) -- poll for missed events
  B) Webhook (real-time) -- GHL sends contact/opportunity events
       |
       v
For webhook path:
  Parse event type (ContactUpdate, OpportunityUpdate, etc.)
  Map to campaign_activity event types
  Update campaign_contacts (branch, registration status)
       |
For polling path:
  Query GHL for contacts updated since last_sync_at
  Diff against Supabase state
  Write new events
       |
       v
Log to analytics_sync_log (source='ghl')
```

**Key GHL events to capture:**
| GHL Event | Maps To | Action |
|-----------|---------|--------|
| Contact tag added (e.g., "QU Registered") | `quarterly_registered` | Set `quarterly_update_registered = TRUE` |
| Contact tag added (e.g., "QU Attended") | `quarterly_attended` | Set `quarterly_update_first_session_attended = TRUE` |
| Opportunity stage change | `status_changed` | Update lifecycle tag |
| Call completed | `call_connected` / `call_no_answer` | Log activity, update call counts |
| Contact DND status | `opted_out` | Call `handle_opt_out()` |

**Rate limiting:** GHL allows 100 requests per 10 seconds, 200K per day. The polling workflow should batch queries efficiently.

### Workflow 4: Analytics View Refresher (NEW - Simple)

**Purpose:** Refresh materialized views after data syncs complete.

```
Schedule Trigger (every 15 min, offset by 2 min after sync workflows)
       |
       v
Call Supabase RPC: refresh_analytics_views()
       |
       v
Check result, alert on error
```

**Alternative:** Chain this as the final step in each sync workflow. Simpler but means views refresh 3x per cycle (once per source). The dedicated workflow is cleaner -- runs once after all syncs complete.

---

## Component 3: Dashboard Component Architecture

### Page Structure

The analytics dashboard is a NEW page at `/dashboard/marketing/analytics/` (not replacing the existing `/dashboard/marketing/` page which focuses on email deliverability and LinkedIn automation status).

### URL Structure
```
/dashboard/marketing/              -- Existing: email health, deliverability, LinkedIn status
/dashboard/marketing/analytics/    -- NEW: sales playbook analytics
/dashboard/marketing/analytics/[campaignId]  -- NEW: campaign drill-down
```

### Data Fetching Pattern (Matches Existing Codebase)

The codebase uses a consistent pattern: Server Component fetches, Client Component renders.

```typescript
// page.tsx (server component)
import { Suspense } from 'react';
import { AnalyticsSkeleton } from './analytics-skeleton';
import { AnalyticsContent } from './analytics-content';
import {
  getAnalyticsPipeline,
  getAnalyticsChannels,
  getAnalyticsCampaigns,
  getConversionMetrics,
  getSyncStatus,
} from '@/lib/api/analytics-queries';

export const revalidate = 300; // 5 min, matching existing pattern

async function AnalyticsDataLoader() {
  const [pipeline, channels, campaigns, conversions, syncStatus] = await Promise.all([
    getAnalyticsPipeline(),
    getAnalyticsChannels(),
    getAnalyticsCampaigns(),
    getConversionMetrics(),
    getSyncStatus(),
  ]);

  return (
    <AnalyticsContent
      pipeline={pipeline}
      channels={channels}
      campaigns={campaigns}
      conversions={conversions}
      syncStatus={syncStatus}
    />
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsDataLoader />
    </Suspense>
  );
}
```

### Component Hierarchy

```
AnalyticsContent (client component, 'use client')
├── Header
│   ├── Title + breadcrumb back to /dashboard/marketing
│   ├── TierFilter (All | Directors | Executives | Managers)
│   │   └── Uses URL search params for filter state (shareable URLs)
│   └── SyncStatusBadge (last updated timestamp per source)
│
├── 12-Column Grid Layout
│   ├── PipelineFunnel (col-span-12)
│   │   └── Horizontal bar showing: Cold → Engaged → Qualified → Registered → Alumni
│   │   └── Uses existing MetricCard components for the counts
│   │
│   ├── ChannelScoreboard (col-span-12 lg:col-span-8)
│   │   └── Table: Channel | Sends | Opens | Replies | Registrations | Cost/Reg
│   │   └── Each row: SmartLead, HeyReach, GHL, Phone
│   │
│   ├── ConversionTracker (col-span-12 lg:col-span-4)
│   │   └── Stack of MetricCards:
│   │       ├── QU Signups
│   │       ├── QU → Paid conversion
│   │       ├── Team registrations
│   │       ├── Referrals generated/converted
│   │       └── Positive reply rate (%)
│   │
│   ├── CampaignCards (col-span-12)
│   │   └── Grid of cards, one per active campaign
│   │   └── Each card shows: name, contacts, reply rate, registrations, branch breakdown
│   │   └── Click → navigates to /dashboard/marketing/analytics/[campaignId]
│   │
│   └── Footer: Link back to marketing dashboard
│
Campaign Drill-Down Page ([campaignId]/page.tsx)
├── Campaign header (name, status, date range)
├── TierFilter (same component, URL param preserved)
├── StepMetrics (col-span-12)
│   └── Table showing per-message-step: sends, opens, clicks, replies, rates
│   └── Grouped by channel (SmartLead steps, LinkedIn steps, GHL steps)
├── BranchBreakdown (col-span-12 lg:col-span-6)
│   └── Visual showing A / A+ / B / C distribution
└── ActivityTimeline (col-span-12 lg:col-span-6)
    └── Recent events for this campaign (reuse ActivityFeed component)
```

### Tier Filter Implementation

The tier filter is a URL search parameter so it persists across navigation and is shareable.

```typescript
// tier-filter.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const TIERS = [
  { value: '', label: 'All Tiers' },
  { value: 'directors', label: 'Directors' },
  { value: 'executives', label: 'Executives' },
  { value: 'managers', label: 'Managers' },
];

export function TierFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTier = searchParams.get('tier') || '';

  function setTier(tier: string) {
    const params = new URLSearchParams(searchParams);
    if (tier) params.set('tier', tier);
    else params.delete('tier');
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      {TIERS.map(t => (
        <button
          key={t.value}
          onClick={() => setTier(t.value)}
          className={currentTier === t.value ? 'active' : ''}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

**Important:** When the tier filter changes, the page re-renders server-side because `searchParams` change triggers a new server component render. The data loader passes the tier to all RPC calls.

### Query File Pattern

```typescript
// lib/api/analytics-queries.ts
import { getServerClient } from '@/lib/supabase/server';

export async function getAnalyticsPipeline(tier?: string) {
  const supabase = getServerClient();
  const { data, error } = await supabase.rpc('get_analytics_pipeline', {
    p_tier: tier || null,
  });
  if (error) { console.error('Pipeline error:', error); return []; }
  return data || [];
}

export async function getAnalyticsChannels(tier?: string) {
  const supabase = getServerClient();
  const { data, error } = await supabase.rpc('get_analytics_channels', {
    p_tier: tier || null,
  });
  if (error) { console.error('Channel error:', error); return []; }
  return data || [];
}

// ... same pattern for each view
```

---

## Component 4: Data Flow (End-to-End)

### SmartLead Data Flow

```
SmartLead Platform (sends email, tracks opens/clicks/replies)
       |
       | n8n polls every 15 min via REST API
       | GET /campaigns/{id}/lead-statistics
       v
n8n SmartLead Stats Sync Workflow
  - Match lead.email to contacts.email
  - Get campaign_contact_id via campaign_contacts
  - Get campaign_channel_id via campaign_channels (platform='smartlead')
  - For each new event (delta since last sync):
       |
       v
INSERT INTO campaign_activity (
  campaign_contact_id, campaign_channel_id,
  activity_type, activity_at, channel='smartlead',
  metadata={smartlead_stats_id, sequence_number, ...}
)
       |
       v
UPDATE campaign_contact_channels SET
  last_email_sent_at, last_email_opened_at,
  has_replied, replied_at, reply_sentiment
       |
       v
RPC: refresh_analytics_views()
       |
       v
Dashboard reads from mv_channel_scoreboard, mv_campaign_step_metrics
```

### HeyReach Data Flow (Already Working)

```
HeyReach Platform (LinkedIn automation)
       |
       | Webhook fires on each event
       | POST /webhook/heyreach-activity
       v
n8n HeyReach Activity Receiver (workflow 9bt5BdyoosqB8ChU)
  - Already normalizes, deduplicates, logs to campaign_activity
  - Already classifies replies with Gemini AI
  - Already routes to GHL branches
       |
       v
(existing tables already populated)
       |
       v
Only gap: RPC refresh_analytics_views() call at end of workflow
```

### GHL Data Flow

```
GHL Platform (CRM, email sequences, phone tracking)
       |
       ├── Webhook (real-time): ContactUpdate, TaskCompleted
       |   POST /webhook/ghl-activity
       |
       └── n8n polls every 15 min: GET /contacts/ (updated since last sync)
       |
       v
n8n GHL Activity Sync Workflow
  - Match GHL contact to Supabase contact via email/phone
  - Map GHL events to campaign_activity types
  - Update campaign_contacts (registration flags, branch status)
       |
       v
INSERT INTO campaign_activity (...)
UPDATE campaign_contacts SET quarterly_update_registered, etc.
       |
       v
RPC: refresh_analytics_views()
       |
       v
Dashboard reads from mv_pipeline_funnel, mv_conversion_metrics
```

### Gemini AI Classification Flow (Already Working via HeyReach)

```
Reply received (LinkedIn via HeyReach webhook)
       |
       v
Gemini AI classifies reply text:
  -> positive_reply, not_now_polite, not_interested, etc.
       |
       v
Classification stored in campaign_activity.metadata.reply_sentiment
AND campaign_contact_channels.reply_sentiment
       |
       v
mv_conversion_metrics counts positive_replies vs total_replies
       |
       v
Dashboard shows: Positive Reply Rate = positive_replies / total_replies * 100
```

---

## Component 5: Build Order (Dependency Chain)

The build order is driven by data dependencies. You cannot build dashboard views until data flows into Supabase. You cannot test views until materialized views exist.

### Phase 1: Schema Foundation (no external dependencies)

**What:** Create the analytics schema layer on top of existing tables.
**Deliverables:**
1. Migration: `classify_tier()` function
2. Migration: `analytics_sync_log` table
3. Migration: All 5 materialized views (initially empty, that is fine)
4. Migration: All RPC functions
5. Migration: `refresh_analytics_views()` function
6. Seed: Insert test data into `analytics_sync_log` for all sources

**Why first:** Everything else depends on this. Dashboard needs RPC functions. n8n needs sync_log table. Views need to exist before refresh can work.

**Can be tested:** Run `SELECT * FROM get_analytics_pipeline()` -- returns empty results but proves the function works.

### Phase 2: SmartLead Ingestion (highest data value)

**What:** Build the SmartLead stats sync n8n workflow.
**Deliverables:**
1. n8n workflow: SmartLead Stats Sync
2. Map SmartLead `platform_campaign_id` to existing `campaign_channels` rows
3. Test with real data from the Alumni Reconnect SmartLead campaign

**Why second:** SmartLead is the largest data source (~1,100 contacts with valid emails). Getting this flowing populates the most rows in materialized views. Also, the SmartLead MCP server already exists, so API patterns are well-understood.

**Depends on:** Phase 1 (analytics_sync_log, campaign_activity exists)

### Phase 3: Dashboard MVP (pipeline + channels + campaigns)

**What:** Build the Next.js analytics page with core views.
**Deliverables:**
1. `analytics-queries.ts` (RPC call wrappers)
2. `page.tsx` + `analytics-content.tsx` + `analytics-skeleton.tsx`
3. `PipelineFunnel` component
4. `ChannelScoreboard` component
5. `CampaignCards` component
6. `TierFilter` component
7. `SyncStatusBadge` component
8. Navigation link from existing marketing page

**Why third:** With SmartLead data flowing and materialized views populated, the dashboard can show real numbers. Even without GHL data, the pipeline and channel views have meaningful data.

**Depends on:** Phase 1 (RPCs), Phase 2 (data in views)

### Phase 4: GHL Ingestion + HeyReach Enhancement

**What:** Build GHL sync workflow, enhance HeyReach receiver.
**Deliverables:**
1. n8n workflow: GHL Activity Sync
2. GHL webhook receiver setup in GHL admin
3. Modify HeyReach receiver to call `refresh_analytics_views()` after processing
4. Modify HeyReach receiver to support multiple campaigns (not hardcoded)

**Why fourth:** GHL data adds registration tracking and branch assignment data. This fills in the conversion funnel. But the dashboard already works with email/LinkedIn data from phases 2-3.

**Depends on:** Phase 1 (schema), Phase 3 (dashboard ready to display)

### Phase 5: Campaign Drill-Down + Conversions

**What:** Build the campaign detail page and conversion tracking panel.
**Deliverables:**
1. `[campaignId]/page.tsx` -- drill-down page
2. `StepMetrics` component (per-message-step table)
3. `BranchBreakdown` component
4. `ConversionTracker` component on main analytics page
5. `PositiveReplyRate` metric

**Why fifth:** This is the most complex UI and requires data from all three sources to be meaningful. The conversion metrics (QU -> paid, team registrations, referrals) depend on GHL data from Phase 4.

**Depends on:** Phase 4 (GHL data for conversions)

### Phase 6: View Refresh Automation + Polish

**What:** Ensure everything refreshes reliably and handle edge cases.
**Deliverables:**
1. n8n workflow: Analytics View Refresher (standalone, every 15 min)
2. Error alerting for sync failures
3. Cost-per-registration calculation (requires manual cost input or channel settings)
4. Dashboard skeleton loading states tuned
5. Mobile responsiveness pass

**Depends on:** Phases 1-5 complete

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct API Calls from Dashboard

**What:** Having Next.js server components call SmartLead/HeyReach/GHL APIs directly.
**Why bad:** Adds latency to page loads (API calls take 1-5 seconds each), creates coupling to external API availability, and exceeds rate limits when multiple users/refreshes hit the page.
**Instead:** n8n handles all external API calls. Dashboard reads only from Supabase. This is already the stated architecture constraint.

### Anti-Pattern 2: Real-Time Event Processing in the Database

**What:** Using Supabase Realtime subscriptions or database triggers to compute analytics on every event insert.
**Why bad:** Trigger-based aggregation creates performance bottlenecks as activity volume grows. With 2,166 contacts and 4+ events per contact per day, that is 8K+ trigger executions daily. Materialized views batch this work.
**Instead:** Use materialized views refreshed every 15 minutes. The 15-minute delay is explicitly acceptable per requirements.

### Anti-Pattern 3: Storing Pre-Computed Metrics in Regular Tables

**What:** Creating tables like `daily_campaign_metrics` and having n8n INSERT computed rows.
**Why bad:** Creates a second source of truth that can drift from the event log. When bugs are fixed in `campaign_activity`, the pre-computed table does not automatically correct.
**Instead:** Materialized views always derive from the event log. Refreshing them re-computes from source data, so corrections propagate automatically.

### Anti-Pattern 4: Per-Request Aggregate Queries

**What:** Having each dashboard page load run `COUNT(*)` aggregates across `campaign_activity` (which will be the largest table).
**Why bad:** The existing `getMarketingMetrics()` function already does 7 separate `COUNT(*)` queries on `campaign_activity`. This pattern does not scale. Each query scans the entire activity table.
**Instead:** RPC functions read from materialized views. Aggregate once (on refresh), read many times.

### Anti-Pattern 5: Hardcoding Campaign IDs in Workflows

**What:** The existing HeyReach receiver is hardcoded to campaign ID `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.
**Why bad:** Does not scale to future campaigns. Analytics must work across all campaigns.
**Instead:** Lookup campaign dynamically based on platform campaign ID from the webhook/API payload. Use `campaign_channels.platform_campaign_id` as the lookup key.

---

## Scalability Considerations

| Concern | Current (2K contacts) | At 10K contacts | At 50K contacts |
|---------|----------------------|-----------------|-----------------|
| Activity table size | ~20K rows | ~100K rows | ~500K rows |
| Matview refresh time | <1 second | ~5 seconds | ~30 seconds |
| Dashboard load time | <500ms (from matviews) | <500ms | <1s |
| n8n sync duration | ~2 min | ~10 min | Need pagination overhaul |
| Storage | Negligible | ~500MB | ~2GB |

**At 50K+ contacts:** Would need to partition `campaign_activity` by date and add incremental materialized view refresh (Postgres does not support this natively -- would need a custom approach with staging tables).

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Materialized views over regular views | Pre-computed aggregates, 200ms loads instead of 12s |
| CONCURRENTLY refresh | No read locks during refresh, dashboard stays available |
| RPC functions over direct table queries | Centralized tier filter logic, cleaner API surface |
| Separate analytics page over extending existing | Existing marketing page serves a different purpose (deliverability), keep concerns separated |
| URL search params for tier filter | Shareable, bookmarkable, works with server component re-rendering |
| 15-minute sync cadence | Balance between freshness and API rate limits (explicitly approved in requirements) |
| SmartLead polling over webhooks | SmartLead webhooks fire per-event but don't include full stats. Polling lead-statistics gives complete picture. |
| GHL dual approach (polling + webhook) | Webhooks for real-time registration events. Polling as safety net for missed webhooks. |

---

## Sources

- SmartLead API: [Full API Documentation](https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation), [Campaign Statistics Endpoint](https://api.smartlead.ai/reference/lead-statistics), [Fetch Campaign Analytics](https://api.smartlead.ai/reference/fetch-campaign-top-level-analytics)
- HeyReach Webhooks: [Webhooks Documentation](https://help.heyreach.io/en/articles/9877965-webhooks), [API & Integrations](https://help.heyreach.io/en/collections/10421873-integrations-api)
- GHL API: [Developer Portal](https://marketplace.gohighlevel.com/docs/), [Webhook Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html)
- Supabase Materialized Views: [Views Documentation](https://supabase.com/docs/guides/graphql/views), [Materialized View Discussion](https://github.com/orgs/supabase/discussions/16389)
- Existing codebase: `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md`, `supabase/migrations/002_campaign_tracking_tables.sql`, `dashboard/src/app/dashboard/marketing/`, `business-os/workflows/README-heyreach-activity-receiver.md`
