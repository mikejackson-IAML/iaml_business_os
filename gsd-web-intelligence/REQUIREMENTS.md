# Web Intelligence Department - Requirements

## Overview

This document defines all requirements for the Web Intelligence Department, organized by functional area. Each workflow has a unique ID, description, trigger type, and acceptance criteria.

**Total: 46 workflows across 8 functional areas**

---

## 1. Traffic Collection (GA4)

### TRF-01: Daily Traffic Collector
**Priority:** P0 (Critical)
**Trigger:** Schedule (daily 6am CT)
**Description:** Collects daily traffic metrics from GA4 including sessions, users, pageviews, bounce rate, and avg session duration. Stores in `web_intel.daily_traffic` table.

**Acceptance Criteria:**
- [ ] Fetches previous day's data from GA4
- [ ] Stores metrics per page and aggregate totals
- [ ] Handles API rate limits gracefully
- [ ] Logs success/failure to n8n-brain

### TRF-02: Traffic Anomaly Detector
**Priority:** P0 (Critical)
**Trigger:** Schedule (daily 7am CT, after TRF-01)
**Description:** Compares daily traffic to 7-day and 30-day moving averages. Flags anomalies exceeding configurable thresholds.

**Acceptance Criteria:**
- [ ] Detects drops >20% from 7-day average
- [ ] Detects spikes >50% from 7-day average
- [ ] Creates alert records in `web_intel.alerts`
- [ ] Triggers TRF-03 for significant anomalies

### TRF-03: Traffic Alert Notifier
**Priority:** P0 (Critical)
**Trigger:** Webhook (from TRF-02)
**Description:** Sends Slack notification for traffic anomalies with context (affected pages, magnitude, possible causes).

**Acceptance Criteria:**
- [ ] Posts to configured Slack channel
- [ ] Includes comparison data (current vs expected)
- [ ] Links to GA4 for deeper investigation
- [ ] Respects alert suppression rules

### TRF-04: Page Performance Collector
**Priority:** P1 (High)
**Trigger:** Schedule (daily 6:15am CT)
**Description:** Collects per-page metrics including landing page performance, exit rates, and conversion paths.

**Acceptance Criteria:**
- [ ] Stores top 100 pages by traffic
- [ ] Tracks landing page bounce rates
- [ ] Tracks exit page rates
- [ ] Calculates page-level trends

### TRF-05: Traffic Source Breakdown
**Priority:** P1 (High)
**Trigger:** Schedule (daily 6:30am CT)
**Description:** Breaks down traffic by source/medium, campaign, and channel grouping.

**Acceptance Criteria:**
- [ ] Stores organic, direct, referral, social, email breakdown
- [ ] Tracks UTM campaign performance
- [ ] Calculates source-level conversion rates
- [ ] Identifies new referral sources

### TRF-06: Geographic Traffic Analyzer
**Priority:** P2 (Medium)
**Trigger:** Schedule (weekly Monday 6am CT)
**Description:** Analyzes traffic by geographic region to identify market opportunities.

**Acceptance Criteria:**
- [ ] Breaks down by country and region
- [ ] Tracks geographic trends over time
- [ ] Identifies emerging markets
- [ ] Stores in `web_intel.geo_traffic`

---

## 2. Ranking Collection (DataForSEO)

### RNK-01: Daily Rank Tracker
**Priority:** P0 (Critical)
**Trigger:** Schedule (daily 5am CT)
**Description:** Checks rankings for tracked keywords using DataForSEO SERP API. Stores position, URL, and SERP features.

**Acceptance Criteria:**
- [ ] Tracks all keywords in `web_intel.tracked_keywords`
- [ ] Stores position, URL ranking, SERP features present
- [ ] Handles "not ranking" gracefully (position = null)
- [ ] Respects DataForSEO rate limits

### RNK-02: Rank Change Detector
**Priority:** P0 (Critical)
**Trigger:** Schedule (daily 5:30am CT, after RNK-01)
**Description:** Compares today's rankings to yesterday and 7-day average. Flags significant movements.

**Acceptance Criteria:**
- [ ] Detects position drops >3 positions
- [ ] Detects position gains >5 positions
- [ ] Detects new rankings (was null, now ranking)
- [ ] Detects lost rankings (was ranking, now null)

### RNK-03: Rank Alert Notifier
**Priority:** P0 (Critical)
**Trigger:** Webhook (from RNK-02)
**Description:** Sends Slack alerts for significant ranking changes with context.

**Acceptance Criteria:**
- [ ] Groups alerts by severity (lost >10 positions = critical)
- [ ] Includes keyword, old position, new position, URL
- [ ] Links to DataForSEO SERP snapshot if available
- [ ] Batches alerts to avoid notification spam

### RNK-04: SERP Feature Tracker
**Priority:** P1 (High)
**Trigger:** Schedule (daily 5:15am CT)
**Description:** Tracks which SERP features appear for tracked keywords (featured snippets, PAA, local pack, etc.).

**Acceptance Criteria:**
- [ ] Identifies featured snippet opportunities
- [ ] Tracks PAA (People Also Ask) presence
- [ ] Monitors local pack for geo-relevant keywords
- [ ] Stores in `web_intel.serp_features`

### RNK-05: Keyword Opportunity Finder
**Priority:** P1 (High)
**Trigger:** Schedule (weekly Monday 4am CT)
**Description:** Identifies keywords where we rank positions 4-20 (striking distance) for optimization focus.

**Acceptance Criteria:**
- [ ] Finds keywords in positions 4-10 (page 1 potential)
- [ ] Finds keywords in positions 11-20 (page 2)
- [ ] Calculates traffic potential based on search volume
- [ ] Prioritizes by effort vs impact

### RNK-06: New Keyword Discovery
**Priority:** P2 (Medium)
**Trigger:** Schedule (weekly Wednesday 4am CT)
**Description:** Uses DataForSEO to discover new keyword opportunities based on existing rankings and competitor analysis.

**Acceptance Criteria:**
- [ ] Identifies related keywords not currently tracked
- [ ] Estimates search volume and difficulty
- [ ] Suggests keywords based on content gaps
- [ ] Adds promising keywords to tracking list

### RNK-07: Search Volume Updater
**Priority:** P2 (Medium)
**Trigger:** Schedule (monthly 1st day 3am CT)
**Description:** Updates search volume estimates for all tracked keywords.

**Acceptance Criteria:**
- [ ] Fetches current search volume from DataForSEO
- [ ] Updates `web_intel.tracked_keywords` table
- [ ] Flags keywords with significant volume changes
- [ ] Adjusts priority scores based on new volumes

---

## 3. Technical SEO (Google Search Console)

### GSC-01: Daily Index Coverage Sync
**Priority:** P0 (Critical)
**Trigger:** Schedule (daily 7am CT)
**Description:** Syncs index coverage data from GSC including indexed, excluded, and error pages.

**Acceptance Criteria:**
- [ ] Fetches coverage status for all URLs
- [ ] Categorizes by: indexed, crawled not indexed, excluded, error
- [ ] Tracks changes from previous day
- [ ] Stores in `web_intel.index_coverage`

### GSC-02: Index Error Alerter
**Priority:** P0 (Critical)
**Trigger:** Schedule (daily 7:30am CT, after GSC-01)
**Description:** Alerts on new indexing errors (server errors, redirect errors, soft 404s, etc.).

**Acceptance Criteria:**
- [ ] Detects new errors since last check
- [ ] Categorizes by error type
- [ ] Sends Slack alert with affected URLs
- [ ] Prioritizes by page importance

### GSC-03: Core Web Vitals Monitor
**Priority:** P0 (Critical)
**Trigger:** Schedule (daily 8am CT)
**Description:** Tracks Core Web Vitals (LCP, FID, CLS) from GSC for mobile and desktop.

**Acceptance Criteria:**
- [ ] Fetches LCP, FID/INP, CLS metrics
- [ ] Tracks good/needs improvement/poor percentages
- [ ] Compares to previous period
- [ ] Alerts on degradation

### GSC-04: Search Performance Collector
**Priority:** P1 (High)
**Trigger:** Schedule (daily 6am CT)
**Description:** Collects search performance data (impressions, clicks, CTR, position) from GSC.

**Acceptance Criteria:**
- [ ] Fetches by query, page, country, device
- [ ] Stores in `web_intel.search_performance`
- [ ] Calculates CTR benchmarks by position
- [ ] Identifies CTR optimization opportunities

### GSC-05: Crawl Stats Analyzer
**Priority:** P1 (High)
**Trigger:** Schedule (weekly Monday 5am CT)
**Description:** Analyzes crawl statistics to identify crawl budget issues.

**Acceptance Criteria:**
- [ ] Tracks crawl requests per day
- [ ] Monitors response time trends
- [ ] Identifies crawl waste (404s, redirects)
- [ ] Alerts on crawl budget concerns

### GSC-06: Mobile Usability Checker
**Priority:** P2 (Medium)
**Trigger:** Schedule (weekly Wednesday 5am CT)
**Description:** Checks for mobile usability issues flagged by GSC.

**Acceptance Criteria:**
- [ ] Fetches mobile usability report
- [ ] Identifies pages with issues
- [ ] Categorizes by issue type
- [ ] Tracks fix progress over time

### GSC-07: Sitemap Status Monitor
**Priority:** P2 (Medium)
**Trigger:** Schedule (daily 4am CT)
**Description:** Monitors sitemap submission status and coverage.

**Acceptance Criteria:**
- [ ] Checks all submitted sitemaps
- [ ] Tracks submitted vs indexed URLs
- [ ] Alerts on sitemap errors
- [ ] Identifies URLs not in sitemap

---

## 4. Competitor Tracking

### CMP-01: Competitor Rank Tracker
**Priority:** P1 (High)
**Trigger:** Schedule (daily 5am CT, with RNK-01)
**Description:** Tracks competitor rankings for shared keywords.

**Acceptance Criteria:**
- [ ] Tracks top 5 competitors per keyword
- [ ] Stores in `web_intel.competitor_rankings`
- [ ] Identifies when competitors gain/lose positions
- [ ] Calculates share of voice metrics

### CMP-02: Competitor Content Monitor
**Priority:** P1 (High)
**Trigger:** Schedule (weekly Monday 3am CT)
**Description:** Monitors competitor websites for new content publication.

**Acceptance Criteria:**
- [ ] Checks competitor sitemaps/RSS feeds
- [ ] Identifies new pages published
- [ ] Categorizes content by topic
- [ ] Alerts on content in our target areas

### CMP-03: Competitor Backlink Monitor
**Priority:** P1 (High)
**Trigger:** Schedule (weekly Wednesday 3am CT)
**Description:** Tracks competitor backlink acquisition using DataForSEO.

**Acceptance Criteria:**
- [ ] Fetches new backlinks for competitors
- [ ] Identifies high-value link opportunities
- [ ] Tracks competitor domain authority trends
- [ ] Stores in `web_intel.competitor_backlinks`

### CMP-04: Share of Voice Calculator
**Priority:** P2 (Medium)
**Trigger:** Schedule (weekly Friday 6am CT)
**Description:** Calculates share of voice across tracked keywords vs competitors.

**Acceptance Criteria:**
- [ ] Weights by search volume
- [ ] Calculates visibility score (position-weighted)
- [ ] Tracks trends over time
- [ ] Generates competitive landscape report

### CMP-05: Competitor Alert Digest
**Priority:** P2 (Medium)
**Trigger:** Schedule (weekly Monday 9am CT)
**Description:** Sends weekly digest of competitor activity.

**Acceptance Criteria:**
- [ ] Summarizes competitor rank changes
- [ ] Highlights new competitor content
- [ ] Notes significant backlink gains
- [ ] Sends to Slack and/or email

---

## 5. Content Analysis

### CNT-01: Content Inventory Sync
**Priority:** P1 (High)
**Trigger:** Schedule (weekly Sunday 2am CT)
**Description:** Maintains inventory of all site content with metadata.

**Acceptance Criteria:**
- [ ] Crawls sitemap for all URLs
- [ ] Extracts title, meta description, word count
- [ ] Tracks publish date and last modified
- [ ] Stores in `web_intel.content_inventory`

### CNT-02: Content Decay Detector
**Priority:** P0 (Critical)
**Trigger:** Schedule (weekly Monday 6am CT)
**Description:** Identifies content experiencing traffic or ranking decay.

**Acceptance Criteria:**
- [ ] Compares current traffic to 3-month average
- [ ] Flags pages with >30% traffic decline
- [ ] Correlates with ranking changes
- [ ] Prioritizes by original traffic level

### CNT-03: Content Decay Alerter
**Priority:** P0 (Critical)
**Trigger:** Webhook (from CNT-02)
**Description:** Sends alerts for decaying content requiring attention.

**Acceptance Criteria:**
- [ ] Groups by decay severity
- [ ] Includes traffic trend data
- [ ] Suggests refresh vs retire decision
- [ ] Links to content in CMS

### CNT-04: Thin Content Identifier
**Priority:** P2 (Medium)
**Trigger:** Schedule (monthly 1st day 4am CT)
**Description:** Identifies thin content pages that may hurt SEO.

**Acceptance Criteria:**
- [ ] Flags pages under 300 words
- [ ] Identifies pages with high bounce rate + low time on page
- [ ] Excludes intentionally short pages (contact, etc.)
- [ ] Recommends consolidation candidates

### CNT-05: Content Gap Analyzer
**Priority:** P2 (Medium)
**Trigger:** Schedule (monthly 15th day 4am CT)
**Description:** Identifies content gaps based on keyword opportunities and competitor content.

**Acceptance Criteria:**
- [ ] Cross-references keywords without ranking content
- [ ] Analyzes competitor content we don't have
- [ ] Prioritizes by search volume and difficulty
- [ ] Generates content brief suggestions

### CNT-06: Internal Link Analyzer
**Priority:** P2 (Medium)
**Trigger:** Schedule (monthly 1st day 5am CT)
**Description:** Analyzes internal linking structure for orphan pages and opportunities.

**Acceptance Criteria:**
- [ ] Identifies orphan pages (no internal links)
- [ ] Finds pages with few internal links
- [ ] Suggests internal linking opportunities
- [ ] Tracks internal PageRank distribution

---

## 6. AI Insights

### AI-01: Daily Traffic Insight Generator
**Priority:** P1 (High)
**Trigger:** Schedule (daily 8am CT, after all collection)
**Description:** Uses Claude to generate natural language insights about daily traffic patterns.

**Acceptance Criteria:**
- [ ] Summarizes key traffic changes
- [ ] Explains anomalies in context
- [ ] Suggests potential causes
- [ ] Stores in `web_intel.ai_insights`

### AI-02: Weekly Ranking Insight Generator
**Priority:** P1 (High)
**Trigger:** Schedule (weekly Monday 10am CT)
**Description:** Generates strategic insights about ranking trends and opportunities.

**Acceptance Criteria:**
- [ ] Summarizes week's ranking movements
- [ ] Identifies patterns (algorithm update impact, etc.)
- [ ] Recommends optimization priorities
- [ ] Highlights quick wins

### AI-03: Competitor Intelligence Synthesizer
**Priority:** P1 (High)
**Trigger:** Schedule (weekly Monday 11am CT)
**Description:** Synthesizes competitor data into actionable intelligence.

**Acceptance Criteria:**
- [ ] Analyzes competitor strategy patterns
- [ ] Identifies threats and opportunities
- [ ] Suggests counter-strategies
- [ ] Formats for executive consumption

### AI-04: Content Optimization Recommender
**Priority:** P2 (Medium)
**Trigger:** Schedule (weekly Wednesday 10am CT)
**Description:** Generates specific optimization recommendations for underperforming content.

**Acceptance Criteria:**
- [ ] Analyzes decaying content
- [ ] Compares to ranking competitors
- [ ] Suggests specific improvements
- [ ] Prioritizes by impact potential

### AI-05: Anomaly Explainer
**Priority:** P1 (High)
**Trigger:** Webhook (from anomaly detectors)
**Description:** When anomalies are detected, generates explanation with likely causes.

**Acceptance Criteria:**
- [ ] Correlates with known events (algorithm updates, etc.)
- [ ] Checks for technical issues
- [ ] Analyzes competitor movements
- [ ] Provides confidence level for explanations

---

## 7. Reporting

### RPT-01: Weekly Performance Report
**Priority:** P0 (Critical)
**Trigger:** Schedule (weekly Monday 8am CT)
**Description:** Generates and delivers comprehensive weekly performance report.

**Acceptance Criteria:**
- [ ] Includes traffic summary with trends
- [ ] Includes ranking movements summary
- [ ] Includes technical SEO health status
- [ ] Delivers via Slack and/or email

### RPT-02: Monthly Executive Report
**Priority:** P0 (Critical)
**Trigger:** Schedule (monthly 1st day 9am CT)
**Description:** Generates executive-level monthly report with KPIs and strategic insights.

**Acceptance Criteria:**
- [ ] Month-over-month comparisons
- [ ] Year-over-year comparisons
- [ ] Key wins and losses highlighted
- [ ] Strategic recommendations included

### RPT-03: Competitor Benchmark Report
**Priority:** P1 (High)
**Trigger:** Schedule (monthly 1st day 10am CT)
**Description:** Monthly competitive analysis report.

**Acceptance Criteria:**
- [ ] Share of voice trends
- [ ] Competitor content analysis
- [ ] Backlink comparison
- [ ] Market position assessment

### RPT-04: Content Health Report
**Priority:** P1 (High)
**Trigger:** Schedule (monthly 15th day 9am CT)
**Description:** Report on content inventory health and optimization opportunities.

**Acceptance Criteria:**
- [ ] Content decay summary
- [ ] Thin content inventory
- [ ] Optimization queue prioritized
- [ ] Content gap opportunities

### RPT-05: Technical SEO Report
**Priority:** P1 (High)
**Trigger:** Schedule (monthly 1st day 11am CT)
**Description:** Detailed technical SEO health report.

**Acceptance Criteria:**
- [ ] Index coverage trends
- [ ] Core Web Vitals status
- [ ] Crawl health analysis
- [ ] Issue resolution tracking

### RPT-06: Dashboard Data Sync
**Priority:** P0 (Critical)
**Trigger:** Schedule (hourly)
**Description:** Syncs key metrics to dashboard API for real-time display.

**Acceptance Criteria:**
- [ ] Updates dashboard health scores
- [ ] Syncs recent alerts
- [ ] Provides trend sparklines
- [ ] Handles dashboard unavailability gracefully

---

## 8. System & Infrastructure

### SYS-01: Workflow Health Monitor
**Priority:** P0 (Critical)
**Trigger:** Schedule (every 15 minutes)
**Description:** Monitors all Web Intelligence workflows for failures and delays.

**Acceptance Criteria:**
- [ ] Checks execution status of all workflows
- [ ] Detects workflows that didn't run on schedule
- [ ] Alerts on consecutive failures
- [ ] Logs to n8n-brain for pattern analysis

### SYS-02: API Quota Monitor
**Priority:** P1 (High)
**Trigger:** Schedule (daily 11pm CT)
**Description:** Tracks API usage against quotas for DataForSEO, GSC, GA4.

**Acceptance Criteria:**
- [ ] Fetches current usage from each API
- [ ] Compares to quota limits
- [ ] Alerts at 80% threshold
- [ ] Suggests rate limit adjustments if needed

### SYS-03: Data Quality Validator
**Priority:** P1 (High)
**Trigger:** Schedule (daily 9am CT)
**Description:** Validates data quality and completeness across all tables.

**Acceptance Criteria:**
- [ ] Checks for missing data points
- [ ] Validates data freshness
- [ ] Identifies anomalous values
- [ ] Alerts on data quality issues

### SYS-04: Historical Data Archiver
**Priority:** P2 (Medium)
**Trigger:** Schedule (monthly 1st day 1am CT)
**Description:** Archives old data to maintain query performance.

**Acceptance Criteria:**
- [ ] Archives data older than 2 years
- [ ] Maintains aggregated summaries
- [ ] Preserves important records
- [ ] Validates archive integrity

### SYS-05: Credential Rotation Reminder
**Priority:** P2 (Medium)
**Trigger:** Schedule (monthly 1st day 8am CT)
**Description:** Reminds to rotate API credentials approaching expiration.

**Acceptance Criteria:**
- [ ] Checks credential metadata
- [ ] Alerts 30 days before expiration
- [ ] Provides rotation instructions
- [ ] Logs rotation completions

---

## Database Tables Summary

| Table | Purpose | Primary Workflows |
|-------|---------|-------------------|
| `web_intel.daily_traffic` | Daily traffic metrics | TRF-01, TRF-02 |
| `web_intel.page_traffic` | Per-page traffic data | TRF-04, TRF-05 |
| `web_intel.geo_traffic` | Geographic breakdown | TRF-06 |
| `web_intel.tracked_keywords` | Keywords to monitor | RNK-01, RNK-07 |
| `web_intel.daily_rankings` | Daily ranking snapshots | RNK-01, RNK-02 |
| `web_intel.serp_features` | SERP feature tracking | RNK-04 |
| `web_intel.index_coverage` | GSC index coverage | GSC-01, GSC-02 |
| `web_intel.core_web_vitals` | CWV metrics | GSC-03 |
| `web_intel.search_performance` | GSC search data | GSC-04 |
| `web_intel.competitor_rankings` | Competitor positions | CMP-01, CMP-04 |
| `web_intel.competitor_backlinks` | Competitor links | CMP-03 |
| `web_intel.content_inventory` | All site content | CNT-01, CNT-02 |
| `web_intel.ai_insights` | Generated insights | AI-01 through AI-05 |
| `web_intel.alerts` | All system alerts | Multiple |
| `web_intel.reports` | Generated reports | RPT-01 through RPT-05 |

---

## Workflow Dependencies

```
TRF-01 (Traffic) ──▶ TRF-02 (Anomaly) ──▶ TRF-03 (Alert)
                                      └──▶ AI-05 (Explain)

RNK-01 (Rankings) ──▶ RNK-02 (Changes) ──▶ RNK-03 (Alert)
                                       └──▶ AI-05 (Explain)

GSC-01 (Coverage) ──▶ GSC-02 (Errors) ──▶ Alert

CNT-01 (Inventory) ──▶ CNT-02 (Decay) ──▶ CNT-03 (Alert)
                                      └──▶ AI-04 (Recommend)

All Collection ──▶ RPT-01 (Weekly Report)
              └──▶ RPT-06 (Dashboard Sync)
```

---
*Last updated: 2026-01-20 - Initial requirements definition*
