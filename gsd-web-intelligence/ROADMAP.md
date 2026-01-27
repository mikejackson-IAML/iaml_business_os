# Web Intelligence Department - Roadmap

## Milestone: v1.0 Web Intelligence Foundation

**Milestone Goal:** Build automated data collection, analysis, and alerting for all web intelligence metrics — traffic, rankings, technical SEO, competitors, and content performance.

### Overview

This milestone delivers 46 n8n workflows and supporting database schema. The build order prioritizes foundational infrastructure first (database schema, core collection workflows), then builds detection and alerting on top, and concludes with AI insights and reporting that consume all the collected data.

**Build Order Rationale:**
1. Database + Core Collection first - Everything depends on having data
2. Traffic before Rankings - Traffic is simpler, validates patterns for ranking workflows
3. GSC + Content next - Builds on traffic data, adds technical dimension
4. Competitors after own data - Need baseline before competitive analysis makes sense
5. AI + Reports last - Requires all data sources to be operational
6. Polish phase - Integration testing, edge cases, documentation

### Phase Summary

| Phase | Name | Workflows | Estimated Effort |
|-------|------|-----------|------------------|
| 1 | Foundation + Traffic + Rankings | 15 | ~40 hours |
| 2 | GSC + Content + Decay | 13 | ~35 hours |
| 3 | Competitors + Backlinks | 5 | ~25 hours |
| 4 | AI Insights + Reports | 11 | ~40 hours |
| 5 | System + Polish | 7 | ~35 hours |

**Total:** 46 workflows, ~175 hours

---

### Phase 1: Foundation + Traffic + Rankings
**Goal:** Establish database schema and core data collection for traffic and rankings
**Depends on:** Nothing (first phase)
**Requirements:** Database schema, TRF-01 through TRF-06, RNK-01 through RNK-07

**Success Criteria** (what must be TRUE):
1. `web_intel` schema exists with all required tables
2. Daily traffic collection runs and stores data in Supabase
3. Traffic anomaly detection identifies significant changes
4. Slack alerts fire for traffic anomalies
5. Daily ranking collection runs and stores positions
6. Ranking change detection identifies movements
7. Slack alerts fire for significant ranking changes

**Workflows (15 total):**

| ID | Workflow | Priority | Type |
|----|----------|----------|------|
| — | Database Schema Migration | P0 | Setup |
| TRF-01 | Daily Traffic Collector | P0 | Schedule |
| TRF-02 | Traffic Anomaly Detector | P0 | Schedule |
| TRF-03 | Traffic Alert Notifier | P0 | Webhook |
| TRF-04 | Page Performance Collector | P1 | Schedule |
| TRF-05 | Traffic Source Breakdown | P1 | Schedule |
| TRF-06 | Geographic Traffic Analyzer | P2 | Schedule |
| RNK-01 | Daily Rank Tracker | P0 | Schedule |
| RNK-02 | Rank Change Detector | P0 | Schedule |
| RNK-03 | Rank Alert Notifier | P0 | Webhook |
| RNK-04 | SERP Feature Tracker | P1 | Schedule |
| RNK-05 | Keyword Opportunity Finder | P1 | Schedule |
| RNK-06 | New Keyword Discovery | P2 | Schedule |
| RNK-07 | Search Volume Updater | P2 | Schedule |

**Plans:** TBD during planning phase

---

### Phase 2: GSC + Content + Decay Detection
**Goal:** Add technical SEO monitoring and content health analysis
**Depends on:** Phase 1 (uses same alerting patterns, traffic data for decay detection)
**Requirements:** GSC-01 through GSC-07, CNT-01 through CNT-06

**Success Criteria** (what must be TRUE):
1. GSC index coverage syncs daily and tracks changes
2. Index errors trigger immediate Slack alerts
3. Core Web Vitals are tracked and degradation alerts fire
4. Content inventory maintains all site pages
5. Content decay detection identifies declining pages
6. Decay alerts include actionable recommendations

**Workflows (13 total):**

| ID | Workflow | Priority | Type |
|----|----------|----------|------|
| GSC-01 | Daily Index Coverage Sync | P0 | Schedule |
| GSC-02 | Index Error Alerter | P0 | Schedule |
| GSC-03 | Core Web Vitals Monitor | P0 | Schedule |
| GSC-04 | Search Performance Collector | P1 | Schedule |
| GSC-05 | Crawl Stats Analyzer | P1 | Schedule |
| GSC-06 | Mobile Usability Checker | P2 | Schedule |
| GSC-07 | Sitemap Status Monitor | P2 | Schedule |
| CNT-01 | Content Inventory Sync | P1 | Schedule |
| CNT-02 | Content Decay Detector | P0 | Schedule |
| CNT-03 | Content Decay Alerter | P0 | Webhook |
| CNT-04 | Thin Content Identifier | P2 | Schedule |
| CNT-05 | Content Gap Analyzer | P2 | Schedule |
| CNT-06 | Internal Link Analyzer | P2 | Schedule |

**Plans:** TBD during planning phase

---

### Phase 3: Competitors + Backlinks
**Goal:** Add competitive intelligence tracking
**Depends on:** Phase 1 (uses ranking infrastructure), Phase 2 (content patterns)
**Requirements:** CMP-01 through CMP-05

**Success Criteria** (what must be TRUE):
1. Competitor rankings tracked alongside our keywords
2. Share of voice calculated weekly
3. Competitor content publication monitored
4. Competitor backlinks tracked and opportunities identified
5. Weekly competitor digest delivered via Slack

**Workflows (5 total):**

| ID | Workflow | Priority | Type |
|----|----------|----------|------|
| CMP-01 | Competitor Rank Tracker | P1 | Schedule |
| CMP-02 | Competitor Content Monitor | P1 | Schedule |
| CMP-03 | Competitor Backlink Monitor | P1 | Schedule |
| CMP-04 | Share of Voice Calculator | P2 | Schedule |
| CMP-05 | Competitor Alert Digest | P2 | Schedule |

**Plans:** TBD during planning phase

---

### Phase 4: AI Insights + Reports
**Goal:** Add Claude-powered insights and automated reporting
**Depends on:** Phases 1-3 (requires all data sources)
**Requirements:** AI-01 through AI-05, RPT-01 through RPT-06

**Success Criteria** (what must be TRUE):
1. Daily AI insights generated from traffic and ranking data
2. Weekly strategic insights synthesized
3. Anomalies explained with likely causes
4. Weekly performance report auto-delivered Monday morning
5. Monthly executive report auto-delivered 1st of month
6. Dashboard receives real-time data updates

**Workflows (11 total):**

| ID | Workflow | Priority | Type |
|----|----------|----------|------|
| AI-01 | Daily Traffic Insight Generator | P1 | Schedule |
| AI-02 | Weekly Ranking Insight Generator | P1 | Schedule |
| AI-03 | Competitor Intelligence Synthesizer | P1 | Schedule |
| AI-04 | Content Optimization Recommender | P2 | Schedule |
| AI-05 | Anomaly Explainer | P1 | Webhook |
| RPT-01 | Weekly Performance Report | P0 | Schedule |
| RPT-02 | Monthly Executive Report | P0 | Schedule |
| RPT-03 | Competitor Benchmark Report | P1 | Schedule |
| RPT-04 | Content Health Report | P1 | Schedule |
| RPT-05 | Technical SEO Report | P1 | Schedule |
| RPT-06 | Dashboard Data Sync | P0 | Schedule |

**Plans:** TBD during planning phase

---

### Phase 5: System + Polish
**Goal:** Add monitoring infrastructure and ensure production readiness
**Depends on:** Phases 1-4 (monitors all other workflows)
**Requirements:** SYS-01 through SYS-05, integration testing, documentation

**Success Criteria** (what must be TRUE):
1. Workflow health monitoring catches failures within 15 minutes
2. API quota tracking prevents hitting limits
3. Data quality validation catches missing or bad data
4. All workflows registered in n8n-brain with test status
5. Documentation complete for all workflows
6. End-to-end integration verified

**Workflows (5 total + polish tasks):**

| ID | Workflow | Priority | Type |
|----|----------|----------|------|
| SYS-01 | Workflow Health Monitor | P0 | Schedule |
| SYS-02 | API Quota Monitor | P1 | Schedule |
| SYS-03 | Data Quality Validator | P1 | Schedule |
| SYS-04 | Historical Data Archiver | P2 | Schedule |
| SYS-05 | Credential Rotation Reminder | P2 | Schedule |

**Additional Tasks:**
- Register all workflows in n8n-brain
- Create workflow documentation (CEO summaries)
- End-to-end integration testing
- Alert tuning and threshold calibration

**Plans:** TBD during planning phase

---

## Progress

| Phase | Name | Workflows | Status | Completed |
|-------|------|-----------|--------|-----------|
| 1 | Foundation + Traffic + Rankings | 15/15 | Complete | 2026-01-20 |
| 2 | GSC + Content + Decay | 0/13 | Not started | — |
| 3 | Competitors + Backlinks | 0/5 | Not started | — |
| 4 | AI Insights + Reports | 0/11 | Not started | — |
| 5 | System + Polish | 0/7 | Not started | — |

---

## Integration Points

### n8n-brain Integration

Each workflow will:
1. Be registered in `n8n_brain.workflow_registry`
2. Use `calculate_confidence` before building
3. Store successful patterns via `store_pattern`
4. Log errors via `store_error_fix`
5. Use registered credentials via `get_credential`

### Existing Business OS Integration

- Alerts post to existing Slack channels
- Dashboard API receives metrics via RPT-06
- Uses existing Supabase infrastructure
- Follows n8n naming conventions from n8n-brain preferences

### External API Dependencies

| API | Workflows Using | Rate Limits |
|-----|-----------------|-------------|
| GA4 | TRF-01 through TRF-06 | 10K requests/day |
| DataForSEO | RNK-01 through RNK-07, CMP-01, CMP-03 | Per plan limits |
| GSC | GSC-01 through GSC-07 | 1200 requests/min |
| Claude | AI-01 through AI-05 | Per tier limits |
| Slack | All alert workflows | 1 msg/sec/channel |

---
*Roadmap created: 2026-01-20*
*Last updated: 2026-01-20*
