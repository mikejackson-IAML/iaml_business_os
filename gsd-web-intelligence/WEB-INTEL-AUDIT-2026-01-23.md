# Web Intelligence Audit Report

**Date:** 2026-01-23
**Purpose:** Comprehensive audit of Web Intel workflows and infrastructure for session handoff

---

## Executive Summary

The Web Intelligence project created 46 workflows but testing revealed several are broken or misconfigured. This audit documents the current state and required fixes.

**Key Findings:**
- 3 workflows deleted (broken APIs that don't exist)
- 2 workflows fixed today (missing config)
- GA4 tracking installed and deployed to production
- Many workflows remain untested

---

## Session Context (What Was Done Today)

### Completed Actions

| Action | Details |
|--------|---------|
| Deleted GSC Index Coverage | `25KaAvlPHwZ8R88v` - No bulk API exists for this data |
| Deleted GSC Mobile Usability | `9EBf7fQpSHouh5w8` - Uses non-existent endpoint |
| Deleted Crawl Stats | `LrQW5mTWvQ0hXuia` - Invalid API |
| Fixed Core Web Vitals | `RS5KDyZFlbybFkWy` - Added graceful "no data" handling for low-traffic sites |
| Fixed Traffic Source | `DtCML41ZGWAR2Srf` - Configured GA4 Property ID `521283124` |
| Installed GA4 Tag | Updated 28 HTML files with Measurement ID `G-PFVH9XHPW4` |
| Deployed to Production | www.iaml.com now has GA4 tracking active |

### SQL Cleanup Executed

```sql
DELETE FROM n8n_brain.workflow_registry
WHERE workflow_id IN ('LrQW5mTWvQ0hXuia', '25KaAvlPHwZ8R88v', '9EBf7fQpSHouh5w8');

SELECT n8n_brain.mark_workflow_tested(
  'RS5KDyZFlbybFkWy', 'verified', 'claude',
  'CrUX API works. Added graceful handling for no-data responses.'
);
```

---

## Web Intel Workflows - Complete Inventory

### Active Workflows (in n8n)

| ID | Name | Active | Nodes | Notes |
|----|------|--------|-------|-------|
| `3aUQ6BQkiS5HphxA` | Web Intel - Error Handler | Yes | 6 | Central error handling |
| `4GRjkhilT4d47rx4` | Web Intel - Backlink Profile Sync | Yes | 5 | Needs DataForSEO |
| `4ghDn661GG2k46HG` | Web Intel - Rankings - SERP Features | Yes | 9 | Needs DataForSEO |
| `4zTsVh8uhGCwWgl4` | Web Intel - Thin Content Identifier | Yes | 8 | |
| `72QZmkSRZm35twAu` | Web Intel - Competitive Gap Finder | Yes | 5 | Needs DataForSEO |
| `9B0tw9jWKw6hC1oK` | Web Intel - Rankings - Daily Tracker | Yes | 8 | Needs DataForSEO |
| `9EsPgSZcHqyZfaZJ` | Web Intel - Dashboard Metrics Computer | Yes | 6 | |
| `BceiAVXcEoJTo4cQ` | Web Intel - Rankings - Keyword Discovery | Yes | 14 | Needs DataForSEO |
| `DtCML41ZGWAR2Srf` | Web Intel - Traffic - Source Breakdown | Yes | 8 | **FIXED** - GA4 configured |
| `ETVro3ICNtAtbAEq` | Web Intel - Traffic - Anomaly Detector | Yes | 10 | Needs traffic data first |
| `F0IqIHxzMsVbQpET` | Web Intel - Recommendation Generator | Yes | 8 | |
| `IJss2eV5Jg9C1Xyr` | Web Intel - GSC - Search Performance | Yes | 8 | **VERIFIED WORKING** |
| `JwrnYD17LOSZUmra` | Web Intel - Rankings - Opportunity Finder | Yes | 8 | |
| `LIpMv9IzJDE6UnIx` | Web Intel - SERP Share Calculator | Yes | 6 | |
| `NY29HsSSmqFvvZQ0` | Web Intel - Competitor Traffic Estimator | Yes | 6 | |
| `OIm5d77XTAGHDB47` | Web Intel - Competitor Content Monitor | Yes | 8 | |
| `RS5KDyZFlbybFkWy` | Web Intel - GSC - Core Web Vitals Monitor | Yes | 9 | **FIXED** - Graceful no-data handling |
| `UTwZ1v1EffRRT2dv` | Web Intel - Rankings - Alert Notifier | Yes | 6 | |
| `afVQvgeWwBbLbo8Z` | Web Intel - Query Helper | Yes | 3 | Utility |

### Inactive Workflows (created but not activated)

| ID | Name | Nodes | Status |
|----|------|-------|--------|
| `UbnzS6cyOmeIAQg0` | Web Intel - Traffic - Daily Collector | 7 | Needs GA4 data |
| `UprzbWx4V1PZo6yD` | Web Intel - AI Content Analyzer | 9 | Phase 4 |
| `VgUaqjEadB5uRTqW` | Web Intel - Health Checker | 7 | Phase 5 |
| `WOMC0v0PDa8Wd3ie` | Web Intel - Credential Validator | 9 | Phase 5 |
| `Wm63f2pD3KCTWKWL` | Web Intel - Content Decay Detector | 6 | Phase 2 |
| `XoXOoOpQMiTU9woK` | Web Intel - Content Decay Alerter | 3 | Phase 2 |
| `YXMBiO2dNQMpLI7d` | Web Intel - Link Opportunity Finder | 7 | |
| `ZPnv8S51kJEWLncb` | Web Intel - Data Cleanup | 9 | Phase 5 |
| `c7unJvBZ20ukIdVm` | Web Intel - GSC - Index Error Alerter | 6 | May be broken |
| `epBJOsp9Nco2aa93` | Web Intel - Trend Spotter | 8 | |
| `g6W58UpTlKmxi4k3` | Web Intel - GSC - Sitemap Status Monitor | 5 | |
| `haagoO93MxLXY48o` | Web Intel - Toxic Link Alerter | 6 | |
| `heGC1O1wf9IZTSqW` | Web Intel - New/Lost Backlink Detector | 8 | |
| `kRWCqNso4OGWlJwO` | Web Intel - Content Gap Analyzer | 7 | |
| `mO9fbehGJFBPGIDU` | Web Intel - Weekly Digest | 9 | Phase 4 |
| `mUNKkdaPIPxfhhvJ` | Web Intel - Internal Link Analyzer | 8 | |
| `mrAB875zmaatetdg` | Web Intel - Backlink Quality Scorer | 6 | |
| `rF5rVvu53oHYNcVe` | Web Intel - Traffic - Alert Notifier | 6 | |
| `uB4E9jYgyk7IWivz` | Web Intel - Monthly Report | 8 | Phase 4 |
| `vr0oVa8P2EdCubo8` | Web Intel - Rankings - Volume Updater | 9 | |
| `wQ0U9uUSHnIX0sdL` | Web Intel - Rankings - Change Detector | 8 | |
| `wctl4o3mDeduPV4s` | Web Intel - Traffic - Page Performance | 6 | |
| `z7TURDap2iKQrCCt` | Web Intel - Content Inventory Sync | 5 | |
| `zLfG2Cf9pUBYqPNG` | Web Intel - Competitor Rank Tracker | 7 | Needs DataForSEO |

### Deleted Workflows (Broken - Don't Recreate)

| Former ID | Name | Reason |
|-----------|------|--------|
| `25KaAvlPHwZ8R88v` | Web Intel - GSC - Index Coverage Sync | No bulk API exists |
| `9EBf7fQpSHouh5w8` | Web Intel - GSC - Mobile Usability Checker | Non-existent endpoint |
| `LrQW5mTWvQ0hXuia` | Web Intel - Crawl Stats | Invalid API |

---

## Dependencies & Configuration

### GA4 (Google Analytics 4)

| Setting | Value |
|---------|-------|
| Property ID | `521283124` |
| Measurement ID | `G-PFVH9XHPW4` |
| Website | https://www.iaml.com |
| Status | **INSTALLED** - Deployed 2026-01-23 |
| Data Available | ~24-48 hours after install |

**Workflows using GA4:**
- Web Intel - Traffic - Daily Collector
- Web Intel - Traffic - Source Breakdown (configured)
- Web Intel - Traffic - Anomaly Detector
- Web Intel - Traffic - Alert Notifier
- Web Intel - Traffic - Page Performance

### Google Search Console

| Setting | Value |
|---------|-------|
| Property | https://www.iaml.com |
| Credential | `Google Search Console (Web Intel)` |
| Status | **WORKING** |

**Workflows using GSC:**
- Web Intel - GSC - Search Performance (**VERIFIED**)
- Web Intel - GSC - Core Web Vitals Monitor (**FIXED**)
- Web Intel - GSC - Sitemap Status Monitor (untested)
- Web Intel - GSC - Index Error Alerter (may be broken)

### DataForSEO

| Setting | Value |
|---------|-------|
| API | https://api.dataforseo.com |
| Status | **NEEDS VERIFICATION** |

**Workflows using DataForSEO:**
- All Rankings workflows (Daily Tracker, SERP Features, Keyword Discovery, etc.)
- All Competitor workflows
- All Backlink workflows

### CrUX (Chrome UX Report)

| Setting | Value |
|---------|-------|
| API | https://chromeuxreport.googleapis.com |
| API Key | Configured in workflow |
| Status | **WORKING** (but iaml.com has no data due to low traffic) |

---

## Database Schema

### Location
- Primary: `supabase/migrations/20260121_create_web_intel_schema.sql`
- Expose: `supabase/migrations/20260121_expose_web_intel_schema.sql`

### Schema: `web_intel`

**Core Tables:**
- `daily_traffic` - Aggregate daily metrics from GA4
- `page_traffic` - Per-page traffic metrics
- `traffic_sources` - Traffic by source/medium
- `traffic_geo` - Geographic breakdown
- `keyword_rankings` - Tracked keyword positions
- `keyword_metrics` - Search volume, difficulty
- `serp_features` - Featured snippets, PAA, etc.
- `core_web_vitals` - LCP, CLS, INP from CrUX
- `gsc_performance` - Search Console data
- `backlinks` - Backlink profile
- `competitors` - Competitor domains
- `content_inventory` - Site pages catalog
- `collection_log` - Workflow run tracking
- `alerts` - Generated alerts
- `recommendations` - AI recommendations

### Schema Status: **CREATED** (needs verification)

---

## Known Issues

### Critical (Blocking)
1. **GA4 has no historical data** - Just installed, need to wait 24-48 hours
2. **DataForSEO credentials not verified** - Rankings workflows may fail

### High Priority
1. **Many workflows untested** - Only GSC Search Performance and Core Web Vitals verified
2. **GSC Index Error Alerter may be broken** - Uses same pattern as deleted workflows

### Medium Priority
1. **CrUX returns no data for iaml.com** - Site needs more traffic
2. **Inactive workflows need activation** - Many created but not turned on

---

## Recommended Next Steps

### Immediate (Before Next Session)
1. Wait 24-48 hours for GA4 to collect data
2. Verify DataForSEO credentials work

### Next Session Priorities

1. **Test Traffic Workflows**
   - Wait for GA4 data, then test `UbnzS6cyOmeIAQg0` (Daily Collector)
   - Verify `DtCML41ZGWAR2Srf` (Source Breakdown) works with data

2. **Test Rankings Workflows**
   - Verify DataForSEO credentials
   - Test `9B0tw9jWKw6hC1oK` (Daily Tracker)
   - Test `BceiAVXcEoJTo4cQ` (Keyword Discovery)

3. **Verify Database**
   - Confirm `web_intel` schema exists in Supabase
   - Check tables are created

4. **Review GSC Workflows**
   - Check `c7unJvBZ20ukIdVm` (Index Error Alerter) - may need deletion
   - Test `g6W58UpTlKmxi4k3` (Sitemap Status Monitor)

5. **Dashboard Integration**
   - Verify dashboard can query `web_intel` schema
   - Test dashboard metrics display

---

## Project Files Reference

| File | Purpose |
|------|---------|
| `gsd-web-intelligence/PROJECT.md` | Project overview |
| `gsd-web-intelligence/ROADMAP.md` | Phase breakdown and workflow list |
| `gsd-web-intelligence/STATE.md` | Current progress (needs update) |
| `gsd-web-intelligence/REQUIREMENTS.md` | Original requirements |
| `supabase/migrations/20260121_create_web_intel_schema.sql` | Database schema |

---

## Resume Instructions

Copy this to start next session:

```
Resume: Web Intelligence Testing & Verification

## Context
- GA4 installed on iaml.com (G-PFVH9XHPW4, Property ID 521283124)
- GA4 data should be available now (installed 2026-01-23)
- 3 broken workflows deleted (Index Coverage, Mobile Usability, Crawl Stats)
- 2 workflows fixed (Core Web Vitals, Traffic Source)
- GSC Search Performance verified working

## Audit Document
See: gsd-web-intelligence/WEB-INTEL-AUDIT-2026-01-23.md

## Next Actions
1. Check if GA4 is collecting data (visit GA4 Realtime)
2. Test Traffic Daily Collector workflow
3. Verify DataForSEO credentials work
4. Test Rankings Daily Tracker workflow
5. Verify web_intel schema in Supabase
6. Check dashboard can display Web Intel data

## Key IDs
- GSC Search Performance: IJss2eV5Jg9C1Xyr (working)
- Core Web Vitals: RS5KDyZFlbybFkWy (fixed)
- Traffic Source: DtCML41ZGWAR2Srf (configured)
- Traffic Daily Collector: UbnzS6cyOmeIAQg0 (inactive, needs test)
- Rankings Daily Tracker: 9B0tw9jWKw6hC1oK (needs DataForSEO test)
```

---

*Audit completed: 2026-01-23*
