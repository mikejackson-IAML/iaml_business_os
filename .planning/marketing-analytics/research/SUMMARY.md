# Project Research Summary

**Project:** IAML Marketing Analytics Dashboard
**Domain:** Multi-channel B2B outreach analytics (SmartLead + HeyReach + GHL -> Supabase -> Next.js)
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

This project adds an analytics dashboard to an existing marketing automation stack. The core finding is that the existing technology stack (Next.js 16, React 19, Tremor 3.18.7, Supabase, n8n) covers 100% of frontend needs with zero new npm dependencies. Tremor's FunnelChart (available since v3.16.0), BarChart, AreaChart, DonutChart, and DateRangePicker map directly to every required visualization. The work is primarily backend: building materialized views for pre-aggregated metrics, RPC functions for tier-filtered queries, and n8n workflows to sync data from SmartLead, HeyReach, and GHL into the existing campaign tracking schema.

The recommended approach is to layer analytics on top of the existing `campaign_activity` and `campaign_contacts` tables -- not redesign them. Five materialized views (pipeline funnel, channel scoreboard, campaign summary, step metrics, conversion metrics) pre-compute expensive aggregates. Six RPC functions expose these views with optional tier filtering. n8n workflows handle all external API communication; the dashboard reads exclusively from Supabase. This architecture matches established patterns already in the codebase (6+ existing RPC migrations, Server Component data fetching, dashboard-kit components). The 15-minute sync cadence is explicitly acceptable per requirements, and materialized views refreshed by pg_cron (or n8n) deliver sub-500ms dashboard loads regardless of data volume growth.

The top risks are: (1) cross-platform double-counting of conversions -- each platform claims credit for the same registration, inflating channel ROI by 50-200% unless conversions are deduplicated at the contact level in Supabase; (2) contact identity fragmentation -- the same person exists in SmartLead (by email), HeyReach (by LinkedIn URL), and GHL (by email/phone), requiring identity resolution during ingestion; (3) silent sync failures -- n8n workflows fail at 2am with nobody noticing, causing stale dashboard data that looks current. All three must be addressed in the schema and sync workflow phases before any dashboard UI is built.

## Key Findings

### Recommended Stack

Zero new npm dependencies. The installed `@tremor/react@3.18.7` covers every chart type needed. Supabase materialized views plus RPC functions handle the analytics aggregation layer. n8n workflows sync data from all three platforms.

**Core technologies (all already installed):**
- **@tremor/react 3.18.7:** FunnelChart, BarChart, AreaChart, DonutChart, SparkAreaChart, DateRangePicker, Tracker -- covers all 9 dashboard visualizations
- **Supabase (PostgreSQL):** Materialized views for pre-computed aggregates, RPC functions for tier-filtered queries, pg_cron for scheduled refresh
- **Next.js 16 Server Components:** Data fetching via `supabase.rpc()` in server components, client components render charts -- matches existing codebase pattern
- **n8n:** All external API communication (SmartLead polling, HeyReach webhooks, GHL sync) -- dashboard never calls external APIs
- **date-fns-tz 3.2.0:** Already installed; handles timezone normalization for date range filtering

**What NOT to add:** Recharts directly (Tremor wraps it), Supabase Realtime (data is 15-min stale anyway), React Query (Server Components handle data fetching), D3 (overkill), Cube.js/Metabase (data volume too small), Redis (materialized views handle caching).

See: [STACK.md](./STACK.md) for full component mapping, FunnelChart API reference, and migration plan.

### Expected Features

10 table stakes features, 9 differentiators, 8 anti-features identified. The playbook's core questions ("What's working?", "Which channel produces registrations?", "Are Directors converting?") drive feature priority.

**Must have (table stakes):**
- **Pipeline Funnel** (TS-1): Cold -> Registered -> Alumni visualization. The dashboard's reason to exist.
- **Channel Scoreboard** (TS-2): SmartLead vs HeyReach vs GHL vs Phone with per-channel registrations and cost
- **Campaign Cards** (TS-3): Status overview with embedded metrics per campaign
- **Email Metrics** (TS-4) + **LinkedIn Metrics** (TS-5): Aggregate performance for both primary channels (already partially built)
- **Positive Reply Rate** (TS-6): AI-classified reply sentiment -- 33% better correlation with meetings than raw reply rate
- **Global Tier Filter** (TS-7): Directors / Executives / Managers toggle that filters ALL dashboard views
- **Registration Tracking** (TS-8): The north star metric -- quarterly update signups from cold outreach
- **Cost Per Registration** (TS-9): Channel ROI calculation (requires new cost input table)
- **Deliverability Health** (TS-10): Bounce rate monitoring with threshold alerts

**Should have (differentiators):**
- **Campaign Drill-Down** (D-1): Per-sequence-step metrics. High value for optimization but high complexity.
- **Branch Distribution** (D-5): A/A+/B/C lead qualification breakdown. Low effort, high signal.
- **Data Freshness Indicator** (D-9): "SmartLead: synced 12 min ago." Low effort, prevents silent staleness.
- **Stale Campaign Alerts** (D-7): Extends existing alert system for operational safety.

**Defer (v2+):**
- **Historical Trend Lines** (D-8): Needs weeks of accumulated data
- **Referral Loop Tracking** (D-2): Complex data model requiring referral junction table
- **Director -> Team Registration** (D-3): Needs reliable company-level data
- **Predictive Analytics / Lead Scoring** (AF-6): GHL branch system IS the lead score; ML adds no value at this scale

See: [FEATURES.md](./FEATURES.md) for full feature table, dependency graph, and build order implications.

### Architecture Approach

Layer analytics ON TOP of existing campaign tracking tables. Five materialized views pre-compute aggregates from the event log. Six RPC functions power dashboard queries with optional tier filtering. n8n handles all external API polling/webhooks. The dashboard is a new page at `/dashboard/marketing/analytics/` (separate from the existing `/dashboard/marketing/` deliverability page).

**Major components:**
1. **Supabase Analytics Layer** -- 5 materialized views (mv_pipeline_funnel, mv_channel_scoreboard, mv_campaign_summary, mv_campaign_step_metrics, mv_conversion_metrics), 6 RPC functions with tier filter params, 1 new table (analytics_sync_log), 1 helper function (classify_tier)
2. **n8n Ingestion Workflows** -- SmartLead Stats Sync (NEW, polling every 15 min), HeyReach Activity Receiver (EXISTS, needs multi-campaign enhancement), GHL Activity Sync (NEW, webhook + polling), Analytics View Refresher (NEW, triggers matview refresh)
3. **Next.js Dashboard Layer** -- Server Component fetches via `supabase.rpc()`, Client Components render Tremor charts. URL search params for tier filter (shareable, bookmarkable). Suspense boundaries with skeleton loading states.

**Key architectural decisions:** Materialized views over regular views (200ms vs 12s loads). CONCURRENTLY refresh to avoid read locks. RPC functions over direct table queries (centralized tier filter logic). Separate analytics page from existing marketing page (different concerns).

See: [ARCHITECTURE.md](./ARCHITECTURE.md) for system diagrams, SQL schema, component hierarchy, and data flow documentation.

### Critical Pitfalls

16 pitfalls documented (4 critical, 4 high, 5 moderate, 3 minor). The top 5 prevention actions:

1. **Cross-platform double-counting conversions** -- Each platform claims credit for the same registration. Prevention: Track conversions at the contact level in Supabase, not by summing platform-reported stats. One contact = one registration = one attributed channel. Must be in schema design (Phase 1).

2. **Contact identity fragmentation** -- Same person as 2-3 records across platforms. Prevention: Match on email (primary) then LinkedIn URL (secondary) during ingestion. Store external IDs per platform. Classify tier once, centrally on the `contacts` table.

3. **N+1 query pattern in dashboard** -- Current `getMarketingMetrics()` makes 7+ separate COUNT queries. Prevention: Replace with RPC functions reading from materialized views. One round-trip instead of 15+.

4. **Silent sync failures** -- n8n workflows fail with no notification. Prevention: `analytics_sync_log` table updated on every sync. Dashboard shows per-source freshness badge. Error workflows alert on failure.

5. **Activity event storm from 60 mailboxes** -- Open tracking fires per-pixel-load, not per-unique-open. Prevention: Use SmartLead's `unique_opened` counts during reconciliation. Track `first_opened_at` on `campaign_contact_channels` instead of individual open events.

See: [PITFALLS.md](./PITFALLS.md) for all 16 pitfalls with detection strategies and phase-specific warnings.

## Implications for Roadmap

Based on combined research, the build order is driven by data dependencies: schema first (everything depends on it), then data ingestion (dashboard needs real data), then UI (needs both schema and data), then advanced features (need all three layers plus accumulated data).

### Phase 1: Schema Foundation
**Rationale:** Every other phase depends on the analytics schema. Materialized views, RPC functions, and the tier classification function must exist before any data can be aggregated or displayed. This phase also forces the critical design decisions (conversion deduplication, identity resolution strategy, event deduplication) before data starts flowing.
**Delivers:** 5 materialized views, 6+ RPC functions, `analytics_sync_log` table, `classify_tier()` function, `conversion_attributed_channel` column on `campaign_contacts`
**Addresses:** TS-8 (Registration Tracking foundation), TS-7 (Tier Filter data model)
**Avoids:** Pitfall 1 (double-counting), Pitfall 2 (identity fragmentation), Pitfall 3 (N+1 queries), Pitfall 7 (event storm), Pitfall 10 (over-normalized queries)

### Phase 2: SmartLead Ingestion
**Rationale:** SmartLead is the largest data source (~1,100 contacts with valid emails). Getting this flowing first populates the most materialized view rows and provides immediate value. The SmartLead MCP server already exists, so API patterns are well-understood. HeyReach is already partially working (just needs multi-campaign enhancement and matview refresh call).
**Delivers:** SmartLead Stats Sync n8n workflow, HeyReach receiver enhancement, SmartLead webhook endpoints for replies/bounces, sync health tracking
**Addresses:** TS-4 (Email Metrics), TS-5 (LinkedIn Metrics -- via HeyReach enhancement), TS-10 (Deliverability Health)
**Avoids:** Pitfall 4 (silent sync failures), Pitfall 5 (polling-only blind spots), Pitfall 11 (webhook security), Pitfall 13 (platform consistency assumptions)

### Phase 3: Dashboard MVP
**Rationale:** With SmartLead and HeyReach data flowing, materialized views have real data. Build the core dashboard views that answer "what's working?" at a glance. Start with metric cards and tables (which work with current-state data), not trend charts (which need historical accumulation).
**Delivers:** Analytics page at `/dashboard/marketing/analytics/`, Pipeline Funnel, Channel Scoreboard, Campaign Cards, Email/LinkedIn Metrics, Data Freshness Badge, Tier Filter, Branch Distribution
**Addresses:** TS-1, TS-2, TS-3, TS-4, TS-5, TS-10, D-5, D-9
**Avoids:** Pitfall 8 (stale matviews -- uses hybrid read strategy), Pitfall 14 (charts before data -- metric cards first), Pitfall 16 (missing empty/error states)

### Phase 4: GHL Ingestion + Conversions
**Rationale:** GHL data adds registration tracking, branch assignment, and phone channel data. These fill in the bottom of the pipeline funnel (Qualified -> Registered -> Alumni). The conversion metrics and positive reply rate require GHL data to be meaningful.
**Delivers:** GHL Activity Sync n8n workflow, GHL webhook receiver, conversion tracking panel, positive reply rate metric, cost-per-registration calculation
**Addresses:** TS-6 (Positive Reply Rate), TS-8 (Registration Tracking -- full), TS-9 (Cost Per Registration), D-4 (Phone Metrics)
**Avoids:** Pitfall 1 (double-counting -- conversion attribution set at registration time), Pitfall 6 (tier classification drift), Pitfall 12 (GHL dedup conflicts)

### Phase 5: Campaign Drill-Down + Advanced Features
**Rationale:** Campaign drill-down is the highest-value differentiator but depends on per-step metrics from all channels. Requires data from SmartLead (email steps) + HeyReach (LinkedIn steps) + GHL (phone steps) to show the complete multi-channel sequence. Also adds corporate training conversation tracking and stale campaign alerts.
**Delivers:** Campaign drill-down page, per-step-metrics table, referral tracking (basic), secondary offer tracking, enhanced alert system
**Addresses:** D-1 (Campaign Drill-Down), D-6 (Corporate Training), D-7 (Stale Campaign Alerts), D-2 (Referral Loop -- basic)
**Avoids:** Pitfall 15 (hardcoded field mappings -- uses sub-workflows for normalization)

### Phase 6: Historical Trends + Polish
**Rationale:** Trend lines require 2-4 weeks of accumulated data. By this phase, enough time has passed to show meaningful weekly/monthly patterns. Also handles mobile responsiveness, error alerting refinement, and automated refresh scheduling.
**Delivers:** Historical trend charts (AreaChart/LineChart), metric snapshot table, mobile-responsive layout pass, pg_cron refresh scheduling, automated error alerting
**Addresses:** D-8 (Historical Trends), D-3 (Director -> Team Tracking)

### Phase Ordering Rationale

- **Schema before sync:** Materialized views and RPC functions must exist before data flows in. Design decisions about deduplication and attribution cannot be retrofitted.
- **SmartLead before GHL:** SmartLead has 2x the data volume and the MCP server is already built. Provides maximum dashboard value earliest.
- **Dashboard after first data source:** Building UI against empty tables wastes time on mock data. Real data exposes edge cases earlier.
- **GHL after dashboard MVP:** The dashboard is useful with email/LinkedIn data alone. GHL adds depth (conversions, branches) but the core "what's working" view functions without it.
- **Drill-down last:** Highest complexity, requires all data sources, and the campaign cards with aggregate metrics serve 80% of the use case.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (SmartLead Ingestion):** SmartLead API pagination, rate limit handling, delta sync strategy need hands-on API testing. The SmartLead MCP server provides reference patterns but the stats sync is a new workflow.
- **Phase 4 (GHL Ingestion):** GHL API v2 endpoints, webhook event types, dedup settings need verification against the live sub-account. GHL's API documentation is less precise than SmartLead's.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Schema Foundation):** Materialized views + RPC functions are well-documented PostgreSQL patterns already used in this codebase.
- **Phase 3 (Dashboard MVP):** Server Component + Tremor chart rendering follows existing dashboard patterns exactly. No new technology.
- **Phase 6 (Trends + Polish):** Standard Tremor chart components with time-series data. No novel patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against installed `package.json`. FunnelChart availability confirmed via Tremor NPM changelog. Zero new dependencies. |
| Features | HIGH | 10 table stakes validated against existing schema, industry benchmarks, and PROJECT.md requirements. Feature dependencies and build order well-defined. |
| Architecture | HIGH | Materialized views + RPC functions already used in 6+ migrations in this codebase. Data flow architecture follows established n8n -> Supabase -> Next.js pattern. |
| Pitfalls | MEDIUM-HIGH | 4 critical pitfalls verified against existing code analysis and API documentation. Platform-specific pitfalls (SmartLead rate limits, GHL dedup) verified via official docs. Some edge cases (Gemini classification consistency, HeyReach multi-campaign support) need validation during implementation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Tier classification accuracy:** The `classify_tier()` SQL function uses regex on `job_title`. Needs validation against actual contact data to ensure patterns capture IAML's specific audience (L&D professionals). May need tuning after analyzing real title distribution.
- **Gemini reply classification consistency:** Positive reply rate (TS-6) depends on Gemini AI storing `reply_sentiment` consistently in `campaign_activity.metadata`. Need to verify the HeyReach receiver workflow is actually writing this field.
- **SmartLead campaign ID mapping:** The `campaign_channels.platform_campaign_id` must be populated for SmartLead campaigns. Need to verify this is set for the Alumni Reconnect campaign before building the sync workflow.
- **Cost data input mechanism:** Cost-per-registration (TS-9) requires a new `channel_costs` table with monthly spend per channel. No automated source -- requires manual entry or a simple admin form. Defer the UI but design the table in Phase 1.
- **GHL sub-account dedup settings:** Must verify the "Allow Duplicate Contact" setting before building GHL sync (Pitfall 12). Document current configuration.

## Sources

### Primary (HIGH confidence)
- [Tremor NPM Changelog](https://npm.tremor.so/changelog) -- FunnelChart availability (v3.16.0+)
- [Tremor NPM FunnelChart Docs](https://npm.tremor.so/docs/visualizations/funnel-chart) -- API reference
- [Supabase pg_cron Docs](https://supabase.com/docs/guides/cron) -- Materialized view scheduling
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) -- RPC pattern
- [SmartLead API Documentation](https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation) -- Campaign statistics endpoints
- [SmartLead API Rate Limits](https://api.smartlead.ai/reference/rate-limits) -- 60 req/60s
- [GHL API Developer Portal](https://marketplace.gohighlevel.com/docs/) -- Webhook and REST API
- [GHL Contact Deduplication](https://help.gohighlevel.com/support/solutions/articles/48001181714-allow-duplicate-contacts-contact-deduplication-preferences-) -- Dedup settings
- [n8n Error Handling Best Practices](https://n8n-tutorial.com/tutorials/n8n/error-handling-and-debugging/n8n-error-handling-best-practices/) -- Workflow reliability
- Existing codebase: `dashboard/package.json`, `supabase/migrations/002_campaign_tracking_tables.sql`, `dashboard/src/lib/supabase/queries.ts`, `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md`

### Secondary (MEDIUM confidence)
- [Outreach.io: Optimize for Sentiment Over Response Rate](https://www.outreach.io/resources/blog/optimize-for-sentiment-over-response-rate) -- Positive reply rate correlation data
- [Cold Email Benchmark Report 2026](https://instantly.ai/cold-email-benchmark-report-2026) -- Industry benchmarks
- [HeyReach Webhooks Documentation](https://help.heyreach.io/en/articles/9877965-webhooks) -- Webhook event types
- [Can I use Supabase for analytics?](https://www.tinybird.co/blog/can-i-use-supabase-for-user-facing-analytics) -- PostgreSQL analytics limitations
- [Identity Resolution Process](https://www.heap.io/blog/identity-resolution-heres-a-6-step-process) -- Cross-platform matching
- [Cross-Channel Attribution Pitfalls](https://www.thesmallbusinessexpo.com/blog/challenges-of-marketing-attribution/) -- Double-counting prevention

### Tertiary (LOW confidence)
- [B2B Marketing Dashboards: Hiding More Than They Reveal](https://www.revsure.ai/blog/b2b-marketing-dashboards-hiding-more-than-they-reveal) -- Anti-patterns (opinion piece, but directionally correct)
- [Multi-Touch Attribution for B2B](https://www.hockeystack.com/blog-posts/b2b-multi-touch-attribution) -- Why complex attribution is overkill at small scale

---
*Research completed: 2026-02-11*
*Ready for roadmap: yes*
