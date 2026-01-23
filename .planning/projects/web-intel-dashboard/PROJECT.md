# Web Intel Dashboard

## What This Is

A dashboard section within the Business OS dashboard (`/dashboard/web-intel`) that visualizes SEO and web intelligence data collected by n8n workflows into the `web_intel` Supabase schema. Provides at-a-glance visibility into traffic, rankings, site health, and content performance.

## Core Value

See website health and SEO performance at a glance without logging into multiple tools.

## Requirements

### Validated

(None yet — new project)

### Active

**Must Have:**
- [ ] Traffic overview (sessions, users, trends)
- [ ] Ranking tracker table (keywords, positions, changes)
- [ ] Core Web Vitals status display
- [ ] Active alerts list
- [ ] GSC performance summary (clicks, impressions, CTR)

**Should Have:**
- [ ] Traffic source breakdown chart
- [ ] Ranking change sparklines
- [ ] Content decay warnings
- [ ] Competitor comparison view

**Nice to Have:**
- [ ] AI recommendations display
- [ ] Historical trend charts
- [ ] Export functionality

### Out of Scope

- Editing/managing data from dashboard — read-only visualization only
- SEO auditing tools — workflows handle data collection
- Direct GA4/GSC connections — data comes via n8n workflows to Supabase
- Custom report builder — predefined views only for v1

## Context

### Data Source

The `web_intel` schema in Supabase contains data populated by n8n workflows:

**Core Tables:**
- `daily_traffic` — Sessions, users, pageviews, bounce rate from GA4
- `page_traffic` — Per-page metrics
- `traffic_sources` — Traffic by source/medium
- `tracked_keywords` — Keywords being monitored
- `daily_rankings` — Daily ranking snapshots with SERP features
- `ranking_change_events` — Significant position changes
- `core_web_vitals` — LCP, CLS, INP scores
- `search_performance` — GSC clicks/impressions
- `backlink_profile` — Backlink counts and domain rating
- `competitors` — Tracked competitors
- `competitor_rankings` — Competitor position data
- `alerts` — Generated alerts (traffic anomalies, ranking drops, etc.)
- `recommendations` — AI-generated recommendations
- `content_decay` — Content losing traffic
- `content_inventory` — Page catalog with metrics

**Existing Views:**
- `traffic_7day_avg` — 7-day rolling averages by page
- `ranking_changes_today` — Today vs yesterday positions
- `unresolved_alerts` — Alert summary by type/severity
- `content_health` — Content health status

### Existing Dashboard Patterns

The dashboard uses:
- **Next.js 14** App Router
- **TypeScript** with strict types
- **Tailwind CSS** for styling
- **Supabase** client for data fetching
- **dashboard-kit** component library

**Component library includes:**
- `MetricCard` — KPI display with trends
- `MetricsGrid` — Grid layout for metrics
- `DataTable` — Sortable, searchable tables
- `AlertList` — Priority-based alerts
- `HealthScore` — Circular score display
- `StatusIndicator` — Health status dots
- `ActivityFeed` — Timeline display

**File patterns to follow:**
- Section route: `dashboard/src/app/dashboard/[section]/page.tsx`
- Queries: `dashboard/src/lib/api/[section]-queries.ts`
- Types: `dashboard/src/dashboard-kit/types/departments/[section].ts`

### Related Projects

- `gsd-web-intelligence/` — n8n workflows that populate the `web_intel` schema
- Schema migration: `supabase/migrations/20260121_create_web_intel_schema.sql`

## Constraints

- **Read-only** — Dashboard displays data, doesn't modify it
- **Existing components** — Use dashboard-kit components, don't create new base components
- **Dark mode** — Must work with existing dark theme
- **Mobile responsive** — Follow existing responsive patterns
- **Real-time not required** — Periodic refresh is sufficient (data updates daily via workflows)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing dashboard-kit | Consistency with other sections, faster development | — Pending |
| Follow leads section pattern | Well-established query/type/page structure | — Pending |
| Tab-based layout | Organize content into logical sections (Overview, Rankings, Content, Alerts) | — Pending |

---
*Last updated: 2026-01-23 after initialization*
