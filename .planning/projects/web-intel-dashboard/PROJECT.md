# Web Intel Dashboard

## What This Is

A dashboard section within the Business OS dashboard (`/dashboard/web-intel`) that visualizes SEO and web intelligence data collected by n8n workflows into the `web_intel` Supabase schema. Provides at-a-glance visibility into traffic, rankings, site health, content performance, competitor positioning, and AI-generated recommendations.

## Core Value

See website health and SEO performance at a glance without logging into multiple tools.

## Current State

**Version:** v1.0 MVP (shipped 2026-01-25)
**LOC:** ~5,470 lines TypeScript/React
**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Tremor charts

### What's Built

- `/dashboard/web-intel` route with tabbed interface (Overview, Rankings, Technical, Alerts, Content, Recommendations)
- Traffic metrics (sessions, users, pageviews, bounce rate) with date range selection
- Keyword rankings table with sparklines, SERP features, priority filtering, and sorting
- Core Web Vitals panel with mobile/desktop toggle
- GSC performance metrics and top queries
- Alert management with severity sorting and acknowledgment
- Content health (decay warnings, thin content) and competitor analysis
- AI recommendations with complete/snooze actions

## Requirements

### Validated

- FOUND-01, FOUND-02, FOUND-03, FOUND-04 — v1.0
- TRAF-01, TRAF-02, TRAF-03, TRAF-04, TRAF-05, TRAF-06 — v1.0
- RANK-01, RANK-02, RANK-03, RANK-04, RANK-05, RANK-06 — v1.0
- CWV-01, CWV-02, CWV-03, CWV-04, CWV-05 — v1.0
- GSC-01, GSC-02, GSC-03, GSC-04, GSC-05 — v1.0
- ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05 — v1.0
- CONT-01, CONT-02, CONT-03 — v1.0
- COMP-01, COMP-02, COMP-03 — v1.0
- AI-01, AI-02, AI-03 — v1.0

### Active

(None — planning next milestone)

### Out of Scope

- Editing/managing data from dashboard — read-only visualization only
- SEO auditing tools — workflows handle data collection
- Direct GA4/GSC connections — data comes via n8n workflows to Supabase
- Custom report builder — predefined views only for v1
- Historical trend charts with interactive zoom — v2
- Custom date range picker — v2
- Export to CSV — v2
- Email report scheduling — v2

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
| Use existing dashboard-kit | Consistency with other sections, faster development | Good |
| Follow leads section pattern | Well-established query/type/page structure | Good |
| Tab-based layout | Organize content into logical sections | Good |
| 46 interfaces/types | Full web_intel schema coverage | Good |
| URL state for filters | Shareable links, browser history | Good |
| Cyan color scheme | Differentiates from other departments | Good |
| 1-hour refresh interval | SEO data changes less frequently | Good |
| Optimistic UI for mutations | Responsive feel for alert/rec actions | Good |
| Mobile-first CWV default | Matches Google's mobile-first indexing | Good |

---
*Last updated: 2026-01-25 after v1.0 milestone*
