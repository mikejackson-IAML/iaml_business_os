# Roadmap: Marketing Analytics Dashboard

## Overview

This roadmap delivers a marketing analytics dashboard that shows whether IAML's multi-channel sales playbook is working. The build order follows data dependencies: schema layer first (everything reads from it), then data ingestion (dashboard needs real data to be useful), then dashboard UI (reads from populated views), then advanced features (need all data sources). Eight phases deliver 38 v1 requirements, from empty database to a fully operational analytics page with pipeline funnel, channel scoreboard, campaign drill-downs, conversion tracking, and tier filtering.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Schema Foundation** - Materialized views, RPC functions, tier classification, and sync tracking table
- [ ] **Phase 2: SmartLead Ingestion** - n8n workflow syncing SmartLead stats into Supabase with sync logging and view refresh
- [ ] **Phase 3: HeyReach Enhancement** - Multi-campaign support and materialized view refresh for existing HeyReach receiver
- [ ] **Phase 4: Dashboard Core** - Analytics page with pipeline funnel, channel scoreboard, tier filter, and navigation
- [ ] **Phase 5: GHL Ingestion** - n8n workflow syncing GHL contacts, branches, and registration events into Supabase
- [ ] **Phase 6: Campaign Management** - Campaign cards on main page and per-step drill-down page
- [ ] **Phase 7: Conversion Tracking** - Conversion metrics panel, positive reply rate, and cost per registration
- [ ] **Phase 8: Polish & Resilience** - Data freshness badges, no-data states, stale data indicators, and edge case handling

## Phase Details

### Phase 1: Schema Foundation
**Goal**: The analytics data layer exists and can power all dashboard queries with tier filtering, conversion deduplication, and pre-computed aggregates
**Depends on**: Nothing (first phase)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06
**Success Criteria** (what must be TRUE):
  1. Running `SELECT * FROM get_analytics_pipeline()` returns results (empty or populated) without error
  2. Running `SELECT classify_tier('VP of Learning and Development')` returns `directors`
  3. Running `SELECT refresh_analytics_views()` completes successfully and logs to `analytics_sync_log`
  4. All 5 materialized views exist and can be queried directly
  5. Conversion deduplication constraint exists -- a contact cannot be attributed to multiple channels for the same registration
**Plans**: TBD

Plans:
- [ ] 01-01: Create classify_tier() function and analytics_sync_log table
- [ ] 01-02: Create all 5 materialized views with unique indexes for CONCURRENTLY refresh
- [ ] 01-03: Create all RPC functions with tier filter parameter and conversion deduplication logic
- [ ] 01-04: Create refresh_analytics_views() function and seed sync_log with initial rows

### Phase 2: SmartLead Ingestion
**Goal**: SmartLead campaign data flows into Supabase automatically every 15 minutes with sync health tracking
**Depends on**: Phase 1
**Requirements**: SYNC-01, SYNC-05, SYNC-06
**Success Criteria** (what must be TRUE):
  1. SmartLead campaign statistics appear in `campaign_activity` table within 15 minutes of the workflow running
  2. `analytics_sync_log` shows last successful SmartLead sync timestamp and row count
  3. Materialized views contain SmartLead data after the sync workflow completes
  4. Sync failures are logged to `analytics_sync_log` with error details (not silently swallowed)
**Plans**: TBD

Plans:
- [ ] 02-01: Build SmartLead Stats Sync n8n workflow with campaign-level polling
- [ ] 02-02: Implement delta sync, deduplication, and contact matching logic
- [ ] 02-03: Add sync logging to analytics_sync_log and trigger materialized view refresh

### Phase 3: HeyReach Enhancement
**Goal**: The existing HeyReach webhook receiver supports multiple campaigns and triggers analytics view refresh after processing
**Depends on**: Phase 1
**Requirements**: SYNC-03, SYNC-04
**Success Criteria** (what must be TRUE):
  1. HeyReach webhook events from any campaign are routed to the correct campaign record (not hardcoded to one campaign)
  2. Materialized views refresh automatically after HeyReach webhook processing completes
  3. HeyReach sync status appears in `analytics_sync_log` with timestamp
**Plans**: TBD

Plans:
- [ ] 03-01: Modify HeyReach receiver to dynamically look up campaign by platform_campaign_id
- [ ] 03-02: Add refresh_analytics_views() call and sync logging to HeyReach receiver

### Phase 4: Dashboard Core
**Goal**: Users can open the analytics page and see the pipeline funnel and channel scoreboard, filtered by tier
**Depends on**: Phase 1 (RPC functions), Phase 2 (real data to display)
**Requirements**: UX-01, UX-02, UX-03, UX-05, UX-06, PIPE-01, PIPE-02, PIPE-03, CHAN-01, CHAN-02, CHAN-03
**Success Criteria** (what must be TRUE):
  1. Navigating to `/dashboard/marketing/analytics/` shows the pipeline funnel with stage counts (Cold, Engaged, Registered, Alumni) and drop-off percentages
  2. Channel scoreboard table shows SmartLead, HeyReach, GHL, and Phone rows with sends, opens, replies, and registrations
  3. Clicking a tier filter button (All / Directors / Executives / Managers) re-renders all dashboard views with filtered data
  4. Tier filter selection is preserved in the URL (copying and pasting the URL in a new tab shows the same filter)
  5. A loading skeleton appears while data loads, matching existing dashboard loading patterns
**Plans**: TBD

Plans:
- [ ] 04-01: Create analytics-queries.ts with RPC call wrappers and TypeScript types
- [ ] 04-02: Build page.tsx server component, analytics-content.tsx client shell, and loading skeleton
- [ ] 04-03: Build TierFilter component with URL search param persistence
- [ ] 04-04: Build PipelineFunnel component with stage counts and drop-off rates
- [ ] 04-05: Build ChannelScoreboard component with per-channel metric rows
- [ ] 04-06: Add navigation link from existing marketing dashboard page

### Phase 5: GHL Ingestion
**Goal**: GHL contact data, branch assignments, and registration events flow into Supabase automatically
**Depends on**: Phase 1
**Requirements**: SYNC-02
**Success Criteria** (what must be TRUE):
  1. GHL contact updates (branch assignments A/A+/B/C) appear in `campaign_contacts` within 15 minutes
  2. Registration events from GHL tags populate `quarterly_update_registered` on contact records
  3. GHL sync status appears in `analytics_sync_log` with timestamp and row count
  4. Materialized views contain GHL-sourced data after the sync workflow completes
**Plans**: TBD

Plans:
- [ ] 05-01: Build GHL Activity Sync n8n workflow with contact matching and branch mapping
- [ ] 05-02: Implement registration event detection, phone call logging, and sync health tracking

### Phase 6: Campaign Management
**Goal**: Users can see all active campaigns at a glance and drill into any campaign to see per-step performance
**Depends on**: Phase 4 (dashboard page exists), Phase 2 (SmartLead data), Phase 3 (HeyReach data)
**Requirements**: CAMP-01, CAMP-02, CAMP-03, CAMP-04, CAMP-05, CAMP-06
**Success Criteria** (what must be TRUE):
  1. Main analytics page shows campaign cards for all active campaigns with name, contacts enrolled, response rate, registrations, and branch breakdown
  2. Clicking a campaign card navigates to `/dashboard/marketing/analytics/[campaignId]`
  3. Campaign drill-down page shows per-message-step metrics (sends, opens, clicks, replies, rates) grouped by channel
  4. Campaign drill-down shows GHL branch distribution (A/A+/B/C) as a visual chart
  5. Tier filter on drill-down page filters step metrics and branch distribution
**Plans**: TBD

Plans:
- [ ] 06-01: Build CampaignCards component with per-campaign metrics and navigation
- [ ] 06-02: Build campaign drill-down page with StepMetrics table grouped by channel
- [ ] 06-03: Build BranchBreakdown chart component on drill-down page

### Phase 7: Conversion Tracking
**Goal**: Users can see all conversion metrics that measure whether the playbook is producing registrations and downstream outcomes
**Depends on**: Phase 5 (GHL data for registration events), Phase 4 (dashboard page)
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, CONV-06, CHAN-04
**Success Criteria** (what must be TRUE):
  1. Dashboard displays Quarterly Update signup count from cold outreach
  2. Dashboard displays conversion rate from QU signup to paid program registration
  3. Dashboard displays team member registrations, colleague referrals (generated + converted), and corporate training conversations
  4. Positive reply rate metric shows percentage of AI-classified positive replies
  5. Channel scoreboard includes cost per registration calculated from manual channel cost input
**Plans**: TBD

Plans:
- [ ] 07-01: Build ConversionTracker component with QU signups, QU-to-paid rate, and team registrations
- [ ] 07-02: Add referral tracking, corporate training conversations, and positive reply rate metrics
- [ ] 07-03: Implement cost per registration with channel_costs table and manual input mechanism

### Phase 8: Polish & Resilience
**Goal**: The dashboard gracefully handles missing data, stale data, and sync failures with clear visual indicators
**Depends on**: Phases 1-7 (all core functionality complete)
**Requirements**: UX-04, UX-07
**Success Criteria** (what must be TRUE):
  1. Data freshness badge at top of dashboard shows last sync time per platform (SmartLead, HeyReach, GHL) with visual distinction for fresh vs stale
  2. Every dashboard component shows an explicit "no data" state when there is no data (not just empty/zero)
  3. Components show a "stale data" warning when the last sync for their data source is older than a configurable threshold
  4. Loading, empty, stale, and error states are visually distinct and follow existing dashboard patterns
**Plans**: TBD

Plans:
- [ ] 08-01: Build SyncStatusBadge component reading from analytics_sync_log
- [ ] 08-02: Add no-data, stale-data, and error states to all dashboard components

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

Note: Phases 2, 3, and 5 (data ingestion) can overlap with each other as they are independent n8n workflows. Phase 3 can start in parallel with Phase 2. Phase 5 can start after Phase 1.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema Foundation | 0/4 | Not started | - |
| 2. SmartLead Ingestion | 0/3 | Not started | - |
| 3. HeyReach Enhancement | 0/2 | Not started | - |
| 4. Dashboard Core | 0/6 | Not started | - |
| 5. GHL Ingestion | 0/2 | Not started | - |
| 6. Campaign Management | 0/3 | Not started | - |
| 7. Conversion Tracking | 0/3 | Not started | - |
| 8. Polish & Resilience | 0/2 | Not started | - |
