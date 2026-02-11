# Requirements: Marketing Analytics Dashboard

**Defined:** 2026-02-11
**Core Value:** Open the dashboard and immediately know which campaigns and channels are producing registrations, at what cost, and whether conversion goals are being hit.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Schema & Data Layer

- [ ] **SCHEMA-01**: Supabase materialized views pre-compute pipeline funnel, channel scoreboard, campaign metrics, and conversion data
- [ ] **SCHEMA-02**: RPC functions power all dashboard queries with optional tier filter parameter
- [ ] **SCHEMA-03**: `classify_tier(job_title)` function maps contact titles to Directors/Executives/Managers tiers
- [ ] **SCHEMA-04**: `analytics_sync_log` table tracks data freshness per platform (SmartLead, HeyReach, GHL)
- [ ] **SCHEMA-05**: `refresh_analytics_views()` function refreshes all materialized views in one call
- [ ] **SCHEMA-06**: Conversion deduplication enforced at contact level (one contact = one registration = one attributed channel)

### Data Ingestion

- [ ] **SYNC-01**: n8n workflow syncs SmartLead campaign statistics into Supabase every 15 minutes
- [ ] **SYNC-02**: n8n workflow syncs GHL contact updates, branch assignments, and registration events into Supabase
- [ ] **SYNC-03**: Existing HeyReach webhook receiver enhanced to call `refresh_analytics_views()` after processing
- [ ] **SYNC-04**: HeyReach receiver updated to support multiple campaigns (not hardcoded to one campaign ID)
- [ ] **SYNC-05**: Each sync workflow logs success/failure to `analytics_sync_log` with row counts and error details
- [ ] **SYNC-06**: Materialized views refresh automatically after each sync completes

### Pipeline & Funnel

- [ ] **PIPE-01**: Dashboard displays pipeline funnel showing aggregate counts at each stage (Cold, Engaged, Registered, Alumni)
- [ ] **PIPE-02**: Funnel shows drop-off rates between stages (percentage that progresses vs. drops off)
- [ ] **PIPE-03**: Pipeline funnel responds to global tier filter (shows Director-only, Executive-only, or Manager-only funnel)

### Channel Scoreboard

- [ ] **CHAN-01**: Dashboard displays channel comparison table (SmartLead, HeyReach, GHL, Phone)
- [ ] **CHAN-02**: Each channel row shows: sends, opens, replies, registrations, cost per registration
- [ ] **CHAN-03**: Channel scoreboard responds to global tier filter
- [ ] **CHAN-04**: Cost per registration calculated from manual channel cost input (monthly spend per channel)

### Campaign Management

- [ ] **CAMP-01**: Dashboard displays campaign cards for all active campaigns
- [ ] **CAMP-02**: Each campaign card shows: name, contacts enrolled, response rate, registrations, status, branch breakdown
- [ ] **CAMP-03**: Clicking a campaign card navigates to drill-down page with per-step metrics
- [ ] **CAMP-04**: Campaign drill-down shows per-message-step: sends, opens, clicks, replies, and rates
- [ ] **CAMP-05**: Campaign drill-down groups steps by channel (SmartLead email steps, LinkedIn steps, GHL steps)
- [ ] **CAMP-06**: Campaign drill-down shows GHL branch distribution (A/A+/B/C) as visual chart

### Conversion Tracking

- [ ] **CONV-01**: Dashboard displays Quarterly Update signup count from cold outreach
- [ ] **CONV-02**: Dashboard displays conversion rate from Quarterly Update to paid program registration
- [ ] **CONV-03**: Dashboard displays team member registrations from engaged directors/executives
- [ ] **CONV-04**: Dashboard displays colleague referrals generated and converted
- [ ] **CONV-05**: Dashboard displays corporate training conversations initiated
- [ ] **CONV-06**: Positive reply rate metric displayed (from Gemini AI classification)

### Tier Filter & UX

- [ ] **UX-01**: Global tier filter at top of dashboard (All / Directors / Executives / Managers)
- [ ] **UX-02**: Tier filter affects all dashboard views (funnel, scoreboard, campaigns, conversions)
- [ ] **UX-03**: Tier filter state preserved in URL search params (shareable, bookmarkable)
- [ ] **UX-04**: Data freshness badge showing last sync time per platform (SmartLead, HeyReach, GHL)
- [ ] **UX-05**: Dashboard loading skeleton matching existing dashboard patterns
- [ ] **UX-06**: Navigation link from existing marketing dashboard to analytics page
- [ ] **UX-07**: Explicit "no data" and "stale data" states for all components (not just empty/zero)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Historical Trends
- **TREND-01**: Line charts showing reply rate, registrations, and cost per registration over time
- **TREND-02**: Weekly and monthly granularity options for trend charts
- **TREND-03**: Campaign performance comparison charts (this campaign vs. previous)

### Advanced Analytics
- **ADV-01**: Automated alerting for sync failures and anomalous metrics
- **ADV-02**: Weekly/monthly/quarterly cadence review dashboards
- **ADV-03**: Phone channel detailed metrics (call attempts, connect rate, outcomes)
- **ADV-04**: Export dashboard data to CSV/PDF for executive reporting

### Operational
- **OPS-01**: Cost input form for manual channel spend entry
- **OPS-02**: Supabase Realtime subscriptions for live metric updates (if justified by volume)
- **OPS-03**: Mobile-optimized responsive layout

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Individual contact tracking/CRM | Already covered by Lead Intelligence dashboard |
| Email sequence builder/editor | Managed in SmartLead and GHL directly |
| LinkedIn sequence builder | Managed in HeyReach directly |
| Complex multi-touch attribution | IAML pipeline is simple; first-touch attribution sufficient |
| A/B test statistical significance | Separate analytical concern; volume too low for statistical tests |
| Predictive analytics / lead scoring | GHL branch system already serves as lead classification |
| Cross-campaign contact deduplication UI | Data hygiene belongs in n8n ingestion layer, not dashboard |
| Domain-level deliverability tracking | SmartLead handles this natively; dashboard shows aggregate only |
| Real-time individual activity feed | Lead Intelligence dashboard already provides this |
| Vanity metric totals without rates | Always show rates first, totals as supporting context only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 1: Schema Foundation | Pending |
| SCHEMA-02 | Phase 1: Schema Foundation | Pending |
| SCHEMA-03 | Phase 1: Schema Foundation | Pending |
| SCHEMA-04 | Phase 1: Schema Foundation | Pending |
| SCHEMA-05 | Phase 1: Schema Foundation | Pending |
| SCHEMA-06 | Phase 1: Schema Foundation | Pending |
| SYNC-01 | Phase 2: SmartLead Ingestion | Pending |
| SYNC-02 | Phase 5: GHL Ingestion | Pending |
| SYNC-03 | Phase 3: HeyReach Enhancement | Pending |
| SYNC-04 | Phase 3: HeyReach Enhancement | Pending |
| SYNC-05 | Phase 2: SmartLead Ingestion | Pending |
| SYNC-06 | Phase 2: SmartLead Ingestion | Pending |
| PIPE-01 | Phase 4: Dashboard Core | Pending |
| PIPE-02 | Phase 4: Dashboard Core | Pending |
| PIPE-03 | Phase 4: Dashboard Core | Pending |
| CHAN-01 | Phase 4: Dashboard Core | Pending |
| CHAN-02 | Phase 4: Dashboard Core | Pending |
| CHAN-03 | Phase 4: Dashboard Core | Pending |
| CHAN-04 | Phase 7: Conversion Tracking | Pending |
| CAMP-01 | Phase 6: Campaign Management | Pending |
| CAMP-02 | Phase 6: Campaign Management | Pending |
| CAMP-03 | Phase 6: Campaign Management | Pending |
| CAMP-04 | Phase 6: Campaign Management | Pending |
| CAMP-05 | Phase 6: Campaign Management | Pending |
| CAMP-06 | Phase 6: Campaign Management | Pending |
| CONV-01 | Phase 7: Conversion Tracking | Pending |
| CONV-02 | Phase 7: Conversion Tracking | Pending |
| CONV-03 | Phase 7: Conversion Tracking | Pending |
| CONV-04 | Phase 7: Conversion Tracking | Pending |
| CONV-05 | Phase 7: Conversion Tracking | Pending |
| CONV-06 | Phase 7: Conversion Tracking | Pending |
| UX-01 | Phase 4: Dashboard Core | Pending |
| UX-02 | Phase 4: Dashboard Core | Pending |
| UX-03 | Phase 4: Dashboard Core | Pending |
| UX-04 | Phase 8: Polish & Resilience | Pending |
| UX-05 | Phase 4: Dashboard Core | Pending |
| UX-06 | Phase 4: Dashboard Core | Pending |
| UX-07 | Phase 8: Polish & Resilience | Pending |

**Coverage:**
- v1 requirements: 38 total (6 Schema + 6 Sync + 3 Pipeline + 4 Channel + 6 Campaign + 6 Conversion + 7 UX)
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after roadmap creation -- all requirements mapped to phases*
