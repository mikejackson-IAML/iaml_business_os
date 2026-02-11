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
| SCHEMA-01 | TBD | Pending |
| SCHEMA-02 | TBD | Pending |
| SCHEMA-03 | TBD | Pending |
| SCHEMA-04 | TBD | Pending |
| SCHEMA-05 | TBD | Pending |
| SCHEMA-06 | TBD | Pending |
| SYNC-01 | TBD | Pending |
| SYNC-02 | TBD | Pending |
| SYNC-03 | TBD | Pending |
| SYNC-04 | TBD | Pending |
| SYNC-05 | TBD | Pending |
| SYNC-06 | TBD | Pending |
| PIPE-01 | TBD | Pending |
| PIPE-02 | TBD | Pending |
| PIPE-03 | TBD | Pending |
| CHAN-01 | TBD | Pending |
| CHAN-02 | TBD | Pending |
| CHAN-03 | TBD | Pending |
| CHAN-04 | TBD | Pending |
| CAMP-01 | TBD | Pending |
| CAMP-02 | TBD | Pending |
| CAMP-03 | TBD | Pending |
| CAMP-04 | TBD | Pending |
| CAMP-05 | TBD | Pending |
| CAMP-06 | TBD | Pending |
| CONV-01 | TBD | Pending |
| CONV-02 | TBD | Pending |
| CONV-03 | TBD | Pending |
| CONV-04 | TBD | Pending |
| CONV-05 | TBD | Pending |
| CONV-06 | TBD | Pending |
| UX-01 | TBD | Pending |
| UX-02 | TBD | Pending |
| UX-03 | TBD | Pending |
| UX-04 | TBD | Pending |
| UX-05 | TBD | Pending |
| UX-06 | TBD | Pending |
| UX-07 | TBD | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 37

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
