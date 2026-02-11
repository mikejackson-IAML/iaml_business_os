# Technology Stack: Marketing Analytics Dashboard

**Project:** IAML Marketing Analytics Dashboard
**Researched:** 2026-02-11
**Scope:** Additions to existing stack (Next.js 16 + React 19 + Tremor 3.18.7 + Radix UI + Tailwind + Supabase)

---

## Executive Summary

The existing stack already covers 90% of what is needed. The core charting library (Tremor/Recharts), the database (Supabase), the UI primitives (Radix), and the styling (Tailwind) are all in place. The analytics views need **zero new npm dependencies** for the core build. The FunnelChart component needed for pipeline visualization was added to `@tremor/react` in v3.16.0, and the installed v3.18.7 already includes it. Date filtering uses the Tremor DateRangePicker which depends on date-fns (already installed as `date-fns-tz`). The remaining work is database-side: Supabase RPC functions, materialized views, and pg_cron scheduling.

**Confidence: HIGH** -- All recommendations verified against installed `package.json`, Tremor NPM changelog, and Supabase documentation.

---

## Existing Stack (No Changes Needed)

These are already installed and working. Listed for context -- do NOT re-install.

| Technology | Installed Version | Role in Analytics |
|------------|------------------|-------------------|
| Next.js | 16.1.1 | App Router, server components for data fetching |
| React | 19.2.3 | UI rendering |
| @tremor/react | 3.18.7 | All charts: FunnelChart, BarChart, AreaChart, DonutChart, BarList, Tracker |
| Radix UI | Various | Dialog, Select, Tabs, Tooltip, Dropdown for filter controls |
| Tailwind CSS | 3.4.19 | Styling, responsive grid |
| @supabase/supabase-js | 2.90.1 | Database client |
| @supabase/ssr | 0.8.0 | Server-side Supabase client |
| date-fns-tz | 3.2.0 | Date formatting, timezone handling |
| framer-motion | 12.26.1 | Transitions, number animations |
| lucide-react | 0.562.0 | Icons |
| sonner | 2.0.7 | Toast notifications |
| class-variance-authority | 0.7.1 | Component variants |
| clsx + tailwind-merge | Latest | Class merging |

**Source:** Verified from `/Users/mike/iaml_business_os/dashboard/package.json` (read directly).

---

## Additional NPM Dependencies

### Required: None for Core Build

The FunnelChart, BarChart, AreaChart, DonutChart, and DateRangePicker components are all available in the already-installed `@tremor/react@3.18.7`. The dashboard-kit pattern (MetricCard, HealthScore, ActivityFeed, AlertList) is already built in `dashboard/src/dashboard-kit/`.

**Confidence: HIGH** -- Verified FunnelChart was introduced in Tremor v3.16.0 ([Tremor NPM Changelog](https://npm.tremor.so/changelog)). Installed version is 3.18.7.

### Optional: Consider for Phase 2+

| Library | Version | Purpose | When to Add | Why Wait |
|---------|---------|---------|-------------|----------|
| `recharts` | 3.7.0 | Direct Recharts access for custom chart types Tremor does not wrap | Only if Tremor charts prove insufficient for a specific visualization | Tremor wraps Recharts underneath; adding Recharts directly creates two chart systems to maintain |
| `react-day-picker` | 8.x | Already a transitive dep of Tremor DateRangePicker | Not needed separately | Already installed via Tremor |

**Recommendation: Start with zero new dependencies.** The existing Tremor components cover all required chart types. Only add Recharts directly if you need a chart type Tremor does not expose (unlikely for this scope).

---

## Charting Strategy

### Chart-to-Component Mapping

This is the specific mapping of analytics views to Tremor components. All are available in the installed version.

| Dashboard View | Chart Type | Tremor Component | Confidence |
|----------------|-----------|------------------|------------|
| Pipeline Funnel (Cold -> Registered -> Alumni) | Funnel | `<FunnelChart>` | HIGH -- verified in Tremor 3.16.0+ |
| Channel Scoreboard (SmartLead vs HeyReach vs GHL vs Phone) | Horizontal Bar | `<BarChart>` with `layout="vertical"` | HIGH -- core Tremor component |
| Campaign Cards metric summaries | Stat cards | `<MetricCard>` from dashboard-kit | HIGH -- already built |
| Campaign drill-down engagement over time | Area/Line | `<AreaChart>` or `<LineChart>` | HIGH -- core Tremor component |
| Channel attribution comparison | Grouped bar | `<BarChart>` with `categories` prop | HIGH -- core Tremor component |
| Conversion rate trends | Sparklines | `<SparkAreaChart>` | HIGH -- already used in web-intel |
| Response rate by channel | Donut | `<DonutChart>` | HIGH -- core Tremor component |
| Global tier filter | Date range selector | `<DateRangePicker>` from Tremor | HIGH -- verified in Tremor NPM docs |
| Campaign status timeline | Status tracker | `<Tracker>` | HIGH -- core Tremor component |

### FunnelChart API (Verified)

```typescript
import { FunnelChart } from '@tremor/react';

const pipelineData = [
  { name: 'Cold Contacts', value: 2166 },
  { name: 'Engaged', value: 845 },
  { name: 'Qualified (Branch A/A+)', value: 312 },
  { name: 'Registered', value: 187 },
  { name: 'Attended', value: 142 },
];

<FunnelChart
  className="h-80"
  data={pipelineData}
  calculateFrom="first"     // Drop-off relative to first stage
  evolutionGradient={true}   // Visual gradient connecting bars
  showArrow={true}           // Arrow between stages
  onValueChange={(v) => handleStageClick(v)}  // Click to drill down
/>
```

**Props verified:** `data`, `calculateFrom` ("first" | "previous"), `evolutionGradient`, `gradient`, `showArrow`, `showXAxis`, `showYAxis`, `showTooltip`, `onValueChange`, `xAxisLabel`, `yAxisLabel`, `barGap`.

**Source:** [Tremor NPM FunnelChart Docs](https://npm.tremor.so/docs/visualizations/funnel-chart)

### Why NOT to Add a Separate Charting Library

| Option Considered | Why Rejected |
|-------------------|-------------|
| **Recharts direct** | Tremor already wraps Recharts. Adding it directly means two styling systems, double the bundle, and maintaining chart consistency between Tremor-wrapped and raw Recharts charts. Only justified if you need a chart type Tremor does not expose. |
| **Nivo** | Beautiful charts but completely different styling paradigm (uses its own theming, not Tailwind). Would look visually inconsistent with existing Tremor charts. Unnecessary complexity. |
| **Chart.js / react-chartjs-2** | Canvas-based, not SVG. Loses Tailwind styling integration. Older paradigm. |
| **Victory** | Good library but again a different styling system. No advantage over Tremor for these use cases. |
| **D3 direct** | Massive overkill for standard business charts. Only consider for truly custom visualizations that no library covers. |
| **MUI X Charts** | Requires MUI ecosystem. Would conflict with Radix UI primitives already in use. |

---

## Supabase Schema Patterns

### Pattern 1: RPC Functions for Aggregated Analytics (Recommended)

**Confidence: HIGH** -- This pattern is already used in the codebase (see `supabase/migrations/20260126_rankings_workflow_rpcs.sql`, `20260135_branch_c_scheduler_rpc.sql`).

The current `getMarketingMetrics()` function in `queries.ts` makes 7 separate Supabase queries (one per metric). This is the single biggest performance problem to solve. Replace with a single RPC function.

```sql
-- Single RPC replaces 7+ separate queries
CREATE OR REPLACE FUNCTION get_marketing_analytics(
  p_campaign_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_channel TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'funnel', (
      SELECT jsonb_agg(row_to_json(f))
      FROM campaign_funnel f
      WHERE (p_campaign_id IS NULL OR f.campaign_id = p_campaign_id)
    ),
    'channels', (
      SELECT jsonb_agg(row_to_json(cp))
      FROM channel_performance cp
      WHERE (p_campaign_id IS NULL OR cp.campaign_id = p_campaign_id)
        AND (p_channel IS NULL OR cp.channel = p_channel)
    ),
    'activity_counts', (
      SELECT jsonb_build_object(
        'sent', COUNT(*) FILTER (WHERE activity_type = 'sent'),
        'opened', COUNT(*) FILTER (WHERE activity_type = 'opened'),
        'clicked', COUNT(*) FILTER (WHERE activity_type = 'clicked'),
        'replied', COUNT(*) FILTER (WHERE activity_type = 'replied'),
        'bounced', COUNT(*) FILTER (WHERE activity_type = 'bounced'),
        'registered', COUNT(*) FILTER (WHERE activity_type = 'quarterly_registered')
      )
      FROM campaign_activity ca
      WHERE (p_date_from IS NULL OR ca.activity_at >= p_date_from)
        AND (p_date_to IS NULL OR ca.activity_at <= p_date_to)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Client-side call:**
```typescript
const { data } = await supabase.rpc('get_marketing_analytics', {
  p_campaign_id: selectedCampaign || null,
  p_date_from: dateRange?.from?.toISOString() || null,
  p_date_to: dateRange?.to?.toISOString() || null,
  p_channel: selectedChannel || null,
});
```

**Why RPC over multiple queries:**
- One round-trip instead of 7+
- Filtering logic lives in SQL where it is efficient
- Can be optimized with indexes without client changes
- Matches existing codebase patterns

### Pattern 2: Materialized Views for Pre-Computed Aggregates

**Confidence: HIGH** -- Supabase supports materialized views natively. The existing `campaign_funnel` and `channel_performance` are regular views. For the analytics dashboard where data is 15-30 min stale anyway (n8n sync interval), materialized views are the right choice.

```sql
-- Daily channel metrics rollup (pre-computed)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_channel_metrics AS
SELECT
  date_trunc('day', ca.activity_at)::date AS metric_date,
  cc_ch.channel AS channel_name,
  mc.id AS campaign_id,
  mc.name AS campaign_name,
  COUNT(*) FILTER (WHERE ca.activity_type = 'sent') AS sends,
  COUNT(*) FILTER (WHERE ca.activity_type = 'opened') AS opens,
  COUNT(*) FILTER (WHERE ca.activity_type = 'clicked') AS clicks,
  COUNT(*) FILTER (WHERE ca.activity_type = 'replied') AS replies,
  COUNT(*) FILTER (WHERE ca.activity_type = 'bounced') AS bounces,
  COUNT(*) FILTER (WHERE ca.activity_type = 'quarterly_registered') AS registrations,
  COUNT(DISTINCT ca.campaign_contact_id) AS unique_contacts
FROM campaign_activity ca
JOIN campaign_contacts cc ON cc.id = ca.campaign_contact_id
JOIN multichannel_campaigns mc ON mc.id = cc.campaign_id
LEFT JOIN campaign_channels cc_ch ON cc_ch.id = ca.campaign_channel_id
GROUP BY 1, 2, 3, 4
WITH DATA;

-- Required unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX ON mv_daily_channel_metrics (metric_date, channel_name, campaign_id);
```

**Refresh with pg_cron:**
```sql
-- Refresh every 15 minutes to match n8n sync cadence
SELECT cron.schedule(
  'refresh_daily_channel_metrics',
  '*/15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_channel_metrics;'
);
```

**Important constraints:**
- `CONCURRENTLY` requires a UNIQUE INDEX on the materialized view (shown above)
- Materialized views do NOT support RLS in PostgreSQL (not an issue since this is an internal dashboard with auth at the app layer)
- Materialized views are NOT accessible via Supabase Realtime subscriptions
- pg_cron jobs: max 8 concurrent, max 10 min per job
- pg_cron is available on all paid Supabase plans (free tier has it too, with limitations)

**Source:** [Supabase pg_cron Docs](https://supabase.com/docs/guides/cron), [PostgreSQL Materialized Views Docs](https://www.postgresql.org/docs/current/sql-refreshmaterializedview.html)

### Pattern 3: Summary Table with Trigger Updates (Alternative)

For metrics that need to be truly real-time (not 15-min stale), use a summary table updated by database triggers on `campaign_activity` inserts.

```sql
-- Summary table updated in real-time by trigger
CREATE TABLE IF NOT EXISTS analytics_campaign_summary (
  campaign_id UUID PRIMARY KEY REFERENCES multichannel_campaigns(id),
  total_contacts INTEGER DEFAULT 0,
  engaged_contacts INTEGER DEFAULT 0,
  registered_contacts INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  channel_metrics JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function to update summary on new activity
CREATE OR REPLACE FUNCTION update_analytics_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the appropriate counter
  INSERT INTO analytics_campaign_summary (campaign_id)
  SELECT cc.campaign_id
  FROM campaign_contacts cc WHERE cc.id = NEW.campaign_contact_id
  ON CONFLICT (campaign_id) DO UPDATE SET
    total_sent = analytics_campaign_summary.total_sent +
      CASE WHEN NEW.activity_type = 'sent' THEN 1 ELSE 0 END,
    total_opened = analytics_campaign_summary.total_opened +
      CASE WHEN NEW.activity_type = 'opened' THEN 1 ELSE 0 END,
    -- ... etc for each metric
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_analytics_summary
  AFTER INSERT ON campaign_activity
  FOR EACH ROW EXECUTE FUNCTION update_analytics_summary();
```

**When to use:** Only if 15-min materialized view refresh is too slow. For this project (n8n syncs every 15-30 min), materialized views are sufficient.

**Recommendation: Use Pattern 1 (RPC functions) for the initial build, backed by Pattern 2 (materialized views) for the heavy aggregation queries. Skip Pattern 3 unless real-time requirements change.**

---

## Data Sync Architecture (n8n -> Supabase -> Dashboard)

### Current Flow (Already Exists)

```
SmartLead API ──webhook──> n8n ──Supabase node──> campaign_activity table
HeyReach API ──webhook──> n8n ──Supabase node──> campaign_activity table
GHL API ──────webhook──> n8n ──Supabase node──> campaign_activity table
Phone (manual) ────────> n8n (form trigger) ──> campaign_activity table
```

### Analytics Layer (New)

```
campaign_activity (raw events)
         │
         ├── mv_daily_channel_metrics (materialized view, refreshed by pg_cron)
         ├── campaign_funnel (existing regular view)
         ├── channel_performance (existing regular view)
         │
         └── get_marketing_analytics() (RPC function aggregating above)
                    │
                    └── Next.js Server Component (RSC) fetches via supabase.rpc()
                              │
                              └── Client Components render Tremor charts
```

### Why NOT Supabase Realtime for This

Supabase Realtime (PostgreSQL CDC via `supabase.channel().on('postgres_changes', ...)`) supports TABLE changes only, not materialized views or views. For an analytics dashboard where:

1. Source data arrives every 15-30 minutes via n8n
2. Charts show aggregated data (not individual rows)
3. Users tolerate 15-min data staleness

**The right approach is:** Server Components fetch on page load + client-side `router.refresh()` on an interval (or a manual "Refresh" button). NOT Supabase Realtime subscriptions.

```typescript
// In the page component - simple polling
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function useAutoRefresh(intervalMs: number = 5 * 60 * 1000) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);
}
```

**Confidence: HIGH** -- Supabase Realtime subscription limitations verified from [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes).

---

## Date Filtering Pattern

### Tremor DateRangePicker (Already Available)

The Tremor `DateRangePicker` component is included in `@tremor/react@3.18.7`. It uses `react-day-picker@8.x` and `date-fns` under the hood (compatible with the already-installed `date-fns-tz@3.2.0`).

```typescript
import { DateRangePicker, DateRangePickerValue } from '@tremor/react';

const presets = [
  { label: 'Last 7 days', dateRange: { from: subDays(new Date(), 7), to: new Date() } },
  { label: 'Last 30 days', dateRange: { from: subDays(new Date(), 30), to: new Date() } },
  { label: 'This Quarter', dateRange: { from: startOfQuarter(new Date()), to: new Date() } },
  { label: 'Campaign Duration', dateRange: { from: campaignStartDate, to: new Date() } },
];

<DateRangePicker
  value={dateRange}
  onValueChange={setDateRange}
  presets={presets}
  enableYearNavigation
  placeholder="Select date range"
/>
```

**Source:** [Tremor DateRangePicker Docs](https://www.tremor.so/docs/inputs/date-range-picker)

---

## What NOT to Use (and Why)

| Technology | Why NOT |
|-----------|---------|
| **Recharts (direct)** | Already wrapped by Tremor. Adding directly creates dual styling systems and inconsistent chart aesthetics. Only resort to this if Tremor is missing a specific chart type. |
| **Supabase Realtime** | Data arrives every 15-30 min via n8n. Realtime subscriptions on tables add complexity for zero user benefit. Use RSC + polling instead. |
| **React Query / TanStack Query** | The dashboard uses Next.js Server Components for data fetching (see existing pattern in `page.tsx` files). Server Components eliminate the need for client-side data fetching libraries. Only add if you need client-side mutations with optimistic updates (unlikely for a read-only analytics dashboard). |
| **D3.js** | Massive overkill. Tremor/Recharts handle all standard chart types. D3 is justified only for truly custom visualizations (geographic maps, force-directed graphs, etc.). |
| **Cube.js / Metabase** | External analytics layers add infrastructure complexity. With ~2,166 contacts and 4 channels, the dataset is small enough for Supabase RPC functions. If IAML scales to 100K+ contacts, revisit. |
| **Separate API routes for data** | The existing pattern uses Server Components calling Supabase directly (see `queries.ts`). Adding API routes for read-only analytics data is unnecessary indirection. |
| **Redis caching** | With materialized views refreshed by pg_cron, caching is handled at the database layer. Adding Redis for a dashboard with <10 concurrent users is over-engineering. |
| **Separate analytics database** | PostgreSQL (Supabase) is row-oriented and suboptimal for OLAP queries at scale. But at IAML's data volume (~tens of thousands of rows), it is perfectly adequate. Do NOT add ClickHouse, TimescaleDB, or BigQuery unless data grows 100x. |

---

## Recommended Migrations to Create

| Migration | Purpose | Pattern |
|-----------|---------|---------|
| `20260212_marketing_analytics_rpcs.sql` | RPC functions for all analytics queries | Pattern 1 above |
| `20260212_marketing_analytics_matviews.sql` | Materialized views for daily rollups | Pattern 2 above |
| `20260212_marketing_analytics_cron.sql` | pg_cron jobs to refresh materialized views | pg_cron schedule |

### Specific RPC Functions Needed

| Function Name | Purpose | Parameters |
|---------------|---------|------------|
| `get_pipeline_funnel` | Pipeline stages with counts and rates | `campaign_id`, `date_from`, `date_to` |
| `get_channel_scoreboard` | Per-channel metrics comparison | `campaign_id`, `date_from`, `date_to` |
| `get_campaign_drill_down` | Single campaign detailed metrics | `campaign_id` |
| `get_conversion_timeline` | Daily conversion metrics over time | `campaign_id`, `date_from`, `date_to`, `channel` |
| `get_analytics_summary` | Top-level KPIs for summary cards | `campaign_id`, `date_from`, `date_to` |

---

## File Structure (New Files)

```
dashboard/src/
  app/dashboard/analytics/
    page.tsx                          # Server Component - data fetching
    analytics-content.tsx             # Client Component - layout + charts
    analytics-skeleton.tsx            # Loading state
    components/
      pipeline-funnel.tsx             # FunnelChart wrapper
      channel-scoreboard.tsx          # BarChart for channel comparison
      campaign-card.tsx               # Campaign summary card
      campaign-drill-down.tsx         # Detailed campaign view
      conversion-timeline.tsx         # AreaChart for trends over time
      analytics-filters.tsx           # DateRangePicker + campaign + channel selects
      tier-filter.tsx                 # Global lifecycle tier filter
  lib/api/
    analytics-queries.ts              # Supabase RPC calls for analytics

supabase/migrations/
  20260212_marketing_analytics_rpcs.sql
  20260212_marketing_analytics_matviews.sql
  20260212_marketing_analytics_cron.sql
```

This follows the exact pattern used by other dashboard sections (web-intel, marketing, lead-intelligence).

---

## Installation Commands

```bash
# No new dependencies needed for the core build.
# The existing stack covers everything.

# If you later need raw Recharts access (unlikely):
# cd dashboard && npm install recharts@3
```

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Tremor FunnelChart availability | HIGH | Verified installed version 3.18.7 > required 3.16.0; confirmed via Tremor NPM Changelog |
| Tremor chart type coverage | HIGH | All needed chart types verified in Tremor NPM component list |
| Supabase RPC pattern | HIGH | Already used extensively in this codebase (6+ existing RPC migrations) |
| Supabase materialized view + pg_cron | HIGH | Verified via Supabase docs; standard PostgreSQL pattern |
| No Supabase Realtime needed | HIGH | Verified Realtime only supports table changes, not views/matviews; data is 15-30 min stale anyway |
| Date filtering via Tremor | HIGH | DateRangePicker verified in Tremor NPM docs; date-fns already a transitive dependency |
| Zero new npm dependencies | HIGH | All needed components verified in installed @tremor/react@3.18.7 |

---

## Sources

- [Tremor NPM Changelog](https://npm.tremor.so/changelog) -- FunnelChart introduced in v3.16.0
- [Tremor NPM FunnelChart Docs](https://npm.tremor.so/docs/visualizations/funnel-chart) -- API reference
- [Tremor DateRangePicker Docs](https://www.tremor.so/docs/inputs/date-range-picker) -- Date filtering
- [Tremor NPM Components](https://npm.tremor.so/components) -- Full component list
- [Supabase Cron Docs](https://supabase.com/docs/guides/cron) -- pg_cron scheduling
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) -- RPC pattern
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) -- Table-only limitation
- [PostgreSQL REFRESH MATERIALIZED VIEW](https://www.postgresql.org/docs/current/sql-refreshmaterializedview.html) -- CONCURRENTLY requirements
- [Recharts GitHub](https://github.com/recharts/recharts) -- v3.7.0 latest (not needed)
- `/Users/mike/iaml_business_os/dashboard/package.json` -- Verified installed versions
- `/Users/mike/iaml_business_os/supabase/migrations/002_campaign_tracking_tables.sql` -- Existing schema
- `/Users/mike/iaml_business_os/dashboard/src/lib/supabase/queries.ts` -- Existing query patterns
