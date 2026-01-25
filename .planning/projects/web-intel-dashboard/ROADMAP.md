# Web Intel Dashboard - Roadmap

**Project:** Web Intel Dashboard
**Created:** 2026-01-23
**Core Value:** See website health and SEO performance at a glance

## Overview

This project adds a `/dashboard/web-intel` section to the existing Business OS dashboard. The build order follows the established dashboard patterns: foundation (types, queries, routing) → core features → secondary features → polish.

**Build Order Rationale:**
1. Foundation first — Types and queries enable all subsequent UI work
2. Traffic before Rankings — Validates data flow with simpler queries
3. Technical health (CWV, GSC) — Core monitoring metrics
4. Alerts — Cross-cutting, depends on understanding data shape
5. Content & Competitors — Secondary analysis views
6. AI Recommendations — Polish feature, depends on all data being accessible

### Phase Summary

| Phase | Name | Requirements | Count |
|-------|------|--------------|-------|
| 1 | Foundation | FOUND-01, FOUND-02, FOUND-03, FOUND-04 | 4 |
| 2 | Traffic Overview | TRAF-01, TRAF-02, TRAF-03, TRAF-04, TRAF-05, TRAF-06 | 6 |
| 3 | Rankings Tracker | RANK-01, RANK-02, RANK-03, RANK-04, RANK-05, RANK-06 | 6 |
| 4 | Technical Health | CWV-01, CWV-02, CWV-03, CWV-04, CWV-05, GSC-01, GSC-02, GSC-03, GSC-04, GSC-05 | 10 |
| 5 | Alerts System | ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05 | 5 |
| 6 | Content & Competitors | CONT-01, CONT-02, CONT-03, COMP-01, COMP-02, COMP-03 | 6 |
| 7 | AI Recommendations | AI-01, AI-02, AI-03 | 3 |

**Total:** 39 requirements across 7 phases

---

## Phase 1: Foundation

**Goal:** Establish routing, types, and data layer so features can be built in parallel

**Depends on:** Nothing (first phase)

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04

**Success Criteria** (what must be TRUE):
1. `/dashboard/web-intel` route renders a page with "Web Intel" title
2. Navigation sidebar shows "Web Intel" option with chart/globe icon
3. TypeScript types exist for all major web_intel tables (daily_traffic, tracked_keywords, daily_rankings, core_web_vitals, alerts, etc.)
4. Supabase query functions can fetch data from web_intel schema and return typed results

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — TypeScript types for web_intel schema
- [x] 01-02-PLAN.md — Supabase query functions
- [x] 01-03-PLAN.md — Dashboard route and page structure
- [x] 01-04-PLAN.md — Navigation integration

---

## Phase 2: Traffic Overview

**Goal:** Users can see website traffic metrics at a glance with trends

**Depends on:** Phase 1 (types and queries)

**Requirements:** TRAF-01, TRAF-02, TRAF-03, TRAF-04, TRAF-05, TRAF-06

**Success Criteria** (what must be TRUE):
1. Sessions metric card shows current total with % change vs previous period
2. Users metric shows total with new/returning breakdown visible
3. Bounce rate displays with color-coded status (green <40%, yellow 40-60%, red >60%)
4. Traffic sources chart shows distribution across organic, direct, referral, social
5. Date range selector allows switching between 7d, 30d, 90d views

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Date range selector + traffic sources query
- [x] 02-02-PLAN.md — Traffic metrics row + sources chart components
- [x] 02-03-PLAN.md — Wire components into page + verification

---

## Phase 3: Rankings Tracker

**Goal:** Users can monitor keyword positions and track changes over time

**Depends on:** Phase 1 (types and queries)

**Requirements:** RANK-01, RANK-02, RANK-03, RANK-04, RANK-05, RANK-06

**Success Criteria** (what must be TRUE):
1. Keywords table displays keyword, current position, and target URL
2. Position changes show directional arrows (up green, down red) with delta value
3. Filter dropdown allows selecting by priority level
4. Table columns are sortable by clicking headers
5. SERP features column shows icons for featured snippet, PAA, etc.
6. Sparkline in each row shows 7-day position history

**Plans:** 5 plans

Plans:
- [x] 03-01-PLAN.md — Position change indicator + priority filter components
- [x] 03-02-PLAN.md — SERP features icons + ranking sparkline components
- [x] 03-03-PLAN.md — Keywords table with sorting
- [x] 03-04-PLAN.md — Expandable row with sparkline + SERP features
- [x] 03-05-PLAN.md — Integration into web-intel page + verification

---

## Phase 4: Technical Health

**Goal:** Users can monitor Core Web Vitals and Search Console performance

**Depends on:** Phase 1 (types and queries)

**Requirements:** CWV-01, CWV-02, CWV-03, CWV-04, CWV-05, GSC-01, GSC-02, GSC-03, GSC-04, GSC-05

**Success Criteria** (what must be TRUE):
1. LCP shows value in seconds with pass/fail badge (good <2.5s, poor >4s)
2. CLS shows value with pass/fail badge (good <0.1, poor >0.25)
3. INP shows value in ms with pass/fail badge (good <200ms, poor >500ms)
4. Toggle switches between mobile and desktop CWV data
5. Overall CWV status shows "Passing" or "Needs Work" based on all three
6. GSC cards show clicks, impressions, CTR, and avg position
7. Top queries list shows 10 highest-click queries

**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md — Device toggle + CWV metric components
- [x] 04-02-PLAN.md — Core Web Vitals unified card
- [x] 04-03-PLAN.md — GSC metrics row + top queries list
- [x] 04-04-PLAN.md — Technical tab integration + verification

---

## Phase 5: Alerts System

**Goal:** Users can see and manage web intelligence alerts

**Depends on:** Phase 1 (types and queries)

**Requirements:** ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05

**Success Criteria** (what must be TRUE):
1. Alert list shows all unacknowledged alerts sorted by severity (critical first)
2. Tab or badge shows count of active alerts
3. Acknowledge button marks alert as acknowledged and removes from active list
4. Critical alerts have red indicator, warnings yellow, info blue
5. Filter buttons allow viewing only specific alert types

**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md — Mutation function and server action for acknowledge
- [x] 05-02-PLAN.md — AlertTypeFilter and AlertCard components
- [x] 05-03-PLAN.md — AlertsSection integration with tab badge

---

## Phase 6: Content & Competitors

**Goal:** Users can monitor content health and competitive position

**Depends on:** Phase 1 (types and queries)

**Requirements:** CONT-01, CONT-02, CONT-03, COMP-01, COMP-02, COMP-03

**Success Criteria** (what must be TRUE):
1. Content decay section shows pages with significant traffic drops
2. Thin content section flags pages with <300 words or high bounce
3. Content summary shows total indexed pages and average word count
4. Competitor list shows tracked domains with notes
5. Shared keywords table shows our position vs competitor positions
6. SERP share chart shows our visibility % vs competitors

**Plans:** 5 plans

Plans:
- [x] 06-01-PLAN.md — Query functions for content and competitor data
- [x] 06-02-PLAN.md — ContentHealthSection (decay + thin content lists)
- [x] 06-03-PLAN.md — CompetitorsSection (list + SERP share chart)
- [x] 06-04-PLAN.md — Content tab integration
- [x] 06-05-PLAN.md — SharedKeywordsTable gap closure (added)

---

## Phase 7: AI Recommendations

**Goal:** Users can view and act on AI-generated SEO recommendations

**Depends on:** Phase 6 (context from all other data)

**Requirements:** AI-01, AI-02, AI-03

**Success Criteria** (what must be TRUE):
1. Recommendations list shows title, description, and category
2. Priority badges (high/medium/low) are visible and color-coded
3. Complete/dismiss buttons update recommendation status

**Plans:** 2 plans

Plans:
- [ ] 07-01-PLAN.md — Data layer (types, query, mutations, server actions)
- [ ] 07-02-PLAN.md — UI components and tab integration

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-01-23 |
| 2. Traffic Overview | 3/3 | Complete | 2026-01-24 |
| 3. Rankings Tracker | 5/5 | Complete | 2026-01-24 |
| 4. Technical Health | 4/4 | Complete | 2026-01-24 |
| 5. Alerts System | 3/3 | Complete | 2026-01-24 |
| 6. Content & Competitors | 5/5 | Complete | 2026-01-25 |
| 7. AI Recommendations | 0/2 | Planned | - |

---
*Roadmap created: 2026-01-23*
*Last updated: 2026-01-25 — Phase 7 planned*
