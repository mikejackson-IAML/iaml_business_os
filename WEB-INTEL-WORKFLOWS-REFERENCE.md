# Web Intel Workflows Reference

> **Purpose:** A self-contained reference of all Web Intelligence workflows built in n8n. Use this document to evaluate which workflows would be beneficial to add to other projects.

## Overview

The Web Intelligence system is a comprehensive web analytics and SEO intelligence platform that automatically collects, analyzes, and reports on:
- Website traffic performance
- Search rankings
- Technical SEO health
- Competitor activity
- Content performance

**Total Workflows:** 46
**Architecture:** n8n workflows + Supabase (PostgreSQL) + DataForSEO + GA4 + Google Search Console

---

## Workflow Categories

| Category | Code | Count | Purpose |
|----------|------|-------|---------|
| Traffic | TRF | 6 | GA4 traffic collection and anomaly detection |
| Rankings | RNK | 7 | Keyword ranking tracking and opportunities |
| Google Search Console | GSC | 7 | Technical SEO and index coverage |
| Content | CNT | 6 | Content health and decay detection |
| Competitors | CMP | 5 | Competitive intelligence |
| Backlinks | BKL | 5 | Backlink profile monitoring |
| AI Insights | INS | 3 | Claude-powered analysis |
| Reports | RPT | 3 | Automated reporting |
| System | SYS | 4 | Monitoring and maintenance |

---

## Traffic Workflows (TRF)

| ID | Name | Type | Description |
|----|------|------|-------------|
| TRF-01 | Daily Traffic Collector | Schedule | Pulls daily traffic data from GA4 and stores in Supabase. Captures sessions, users, pageviews, bounce rate, avg session duration by page. |
| TRF-02 | Traffic Anomaly Detector | Schedule | Analyzes collected traffic data to identify significant changes (drops or spikes) compared to rolling averages. Flags anomalies for alerting. |
| TRF-03 | Traffic Alert Notifier | Webhook | Sends Slack notifications when traffic anomalies are detected. Includes context about the anomaly type and magnitude. |
| TRF-04 | Page Performance Collector | Schedule | Tracks individual page performance metrics over time. Identifies top performing and declining pages. |
| TRF-05 | Traffic Source Breakdown | Schedule | Analyzes traffic by source/medium (organic, paid, social, direct, referral). Tracks channel performance trends. |
| TRF-06 | Geographic Traffic Analyzer | Schedule | Breaks down traffic by geography. Identifies regional trends and opportunities. |

**Dependencies:** GA4 API access, Supabase, Slack

---

## Rankings Workflows (RNK)

| ID | Name | Type | Description |
|----|------|------|-------------|
| RNK-01 | Daily Rank Tracker | Schedule | Tracks keyword rankings daily via DataForSEO. Stores position, URL, SERP features for each tracked keyword. |
| RNK-02 | Rank Change Detector | Schedule | Identifies significant ranking changes (gains/losses) compared to previous periods. Flags movements > 5 positions. |
| RNK-03 | Rank Alert Notifier | Webhook | Sends Slack alerts for significant ranking changes. Prioritizes high-value keyword movements. |
| RNK-04 | SERP Feature Tracker | Schedule | Monitors SERP features (featured snippets, PAA, local pack, etc.) for tracked keywords. Identifies feature opportunities. |
| RNK-05 | Keyword Opportunity Finder | Schedule | Identifies keywords ranking positions 11-20 (page 2) that could be pushed to page 1 with optimization. |
| RNK-06 | New Keyword Discovery | Schedule | Discovers new keywords the site is ranking for but not actively tracking. Suggests additions to tracking list. |
| RNK-07 | Search Volume Updater | Schedule | Refreshes search volume data for tracked keywords periodically to keep opportunity sizing accurate. |

**Dependencies:** DataForSEO API, Supabase, Slack

---

## Google Search Console Workflows (GSC)

| ID | Name | Type | Description |
|----|------|------|-------------|
| GSC-01 | Daily Index Coverage Sync | Schedule | Syncs index coverage data from GSC. Tracks indexed pages, excluded pages, errors, and warnings. |
| GSC-02 | Index Error Alerter | Schedule | Monitors for new indexing errors (404s, server errors, redirect issues). Sends immediate alerts for critical errors. |
| GSC-03 | Core Web Vitals Monitor | Schedule | Tracks Core Web Vitals (LCP, FID, CLS) from GSC. Alerts on performance degradation. |
| GSC-04 | Search Performance Collector | Schedule | Collects search analytics data (impressions, clicks, CTR, position) by query and page. |
| GSC-05 | Crawl Stats Analyzer | Schedule | Monitors crawl activity (requests, response codes, crawl budget usage). Identifies crawl issues. |
| GSC-06 | Mobile Usability Checker | Schedule | Tracks mobile usability issues from GSC. Alerts on new mobile experience problems. |
| GSC-07 | Sitemap Status Monitor | Schedule | Monitors sitemap submission status and coverage. Alerts on sitemap processing issues. |

**Dependencies:** Google Search Console API, Supabase, Slack

---

## Content Workflows (CNT)

| ID | Name | Type | Description |
|----|------|------|-------------|
| CNT-01 | Content Inventory Sync | Schedule | Maintains a complete inventory of all site pages with metadata (publish date, word count, category, etc.). |
| CNT-02 | Content Decay Detector | Schedule | Identifies pages with declining traffic/rankings over time. Flags content needing refresh or update. |
| CNT-03 | Content Decay Alerter | Webhook | Sends alerts when content decay is detected, including recommended actions (update, consolidate, redirect). |
| CNT-04 | Thin Content Identifier | Schedule | Identifies pages with thin content (low word count, low value, duplicate issues). Suggests improvements or consolidation. |
| CNT-05 | Content Gap Analyzer | Schedule | Compares your content coverage against competitor topics. Identifies content opportunities. |
| CNT-06 | Internal Link Analyzer | Schedule | Analyzes internal linking structure. Identifies orphan pages, over-linked pages, and linking opportunities. |

**Dependencies:** Site crawler (Firecrawl/similar), Supabase, Slack, competitor content data

---

## Competitor Workflows (CMP)

| ID | Name | Type | Description |
|----|------|------|-------------|
| CMP-01 | Competitor Rank Tracker | Schedule | Tracks competitor rankings for your target keywords. Shows head-to-head position comparison. |
| CMP-02 | Competitor Content Monitor | Schedule | Monitors competitor blogs/content for new publications. Alerts when competitors publish on topics you track. |
| CMP-03 | Competitor Traffic Estimator | Schedule | Estimates competitor traffic using DataForSEO traffic estimation. Tracks competitive traffic trends. |
| CMP-04 | SERP Share Calculator | Schedule | Calculates share of voice across tracked keywords. Shows what % of SERP visibility you own vs competitors. |
| CMP-05 | Competitive Gap Finder | Schedule | Identifies keywords competitors rank for that you don't. Prioritizes by volume and difficulty. |

**Dependencies:** DataForSEO API, competitor domain list, Supabase, Slack

---

## Backlink Workflows (BKL)

| ID | Name | Type | Description |
|----|------|------|-------------|
| BKL-01 | Backlink Profile Sync | Schedule | Syncs complete backlink profile from DataForSEO. Tracks referring domains, dofollow/nofollow, anchor text. |
| BKL-02 | New/Lost Backlink Detector | Schedule | Monitors for new and lost backlinks. Alerts on high-value link gains or concerning losses. |
| BKL-03 | Backlink Quality Scorer | Schedule | Scores backlinks by quality (domain authority, relevance, spam signals). Identifies link profile health. |
| BKL-04 | Link Opportunity Finder | Schedule | Identifies link building opportunities based on competitor backlinks and unlinked brand mentions. |
| BKL-05 | Toxic Link Alerter | Schedule | Monitors for potentially toxic/spammy backlinks. Alerts when disavow candidates are detected. |

**Dependencies:** DataForSEO API, Supabase, Slack

---

## AI Insights Workflows (INS)

| ID | Name | Type | Description |
|----|------|------|-------------|
| INS-01 | AI Content Analyzer | Schedule | Uses Claude to analyze content performance patterns. Identifies what content characteristics drive success. |
| INS-02 | Trend Spotter | Schedule | Uses Claude to identify emerging trends from search data. Suggests timely content opportunities. |
| INS-03 | Recommendation Generator | Schedule | Uses Claude to generate actionable recommendations from all collected data. Prioritizes by impact. |

**Dependencies:** Claude API, all data from other workflows, Supabase

---

## Report Workflows (RPT)

| ID | Name | Type | Description |
|----|------|------|-------------|
| RPT-01 | Weekly Digest | Schedule | Generates and sends weekly performance summary every Monday. Includes traffic, rankings, and key alerts. |
| RPT-02 | Monthly Report | Schedule | Generates comprehensive monthly report on the 1st. Executive summary + detailed metrics. |
| RPT-03 | Dashboard Metrics | Schedule | Pushes key metrics to dashboard API for real-time display. Keeps dashboard data fresh. |

**Dependencies:** All data sources, Slack, dashboard API

---

## System Workflows (SYS)

| ID | Name | Type | Description |
|----|------|------|-------------|
| SYS-01 | Error Handler | Webhook | Central error handling workflow. Catches and logs errors from all other workflows. |
| SYS-02 | Health Checker | Schedule | Monitors health of all Web Intel workflows. Alerts if workflows fail or fall behind schedule. |
| SYS-03 | Data Cleanup | Schedule | Archives old data and cleans up temporary tables. Manages database size. |
| SYS-04 | Credential Validator | Schedule | Validates API credentials are working. Alerts before credentials expire or quotas are exceeded. |

**Dependencies:** n8n execution logs, Supabase, Slack

---

## Quick Start: Recommended Minimum Set

If adopting Web Intel for a new project, start with these essential workflows:

### Tier 1: Core Visibility (6 workflows)
- TRF-01: Daily Traffic Collector
- TRF-02: Traffic Anomaly Detector
- TRF-03: Traffic Alert Notifier
- RNK-01: Daily Rank Tracker
- RNK-02: Rank Change Detector
- RNK-03: Rank Alert Notifier

### Tier 2: Technical Health (4 workflows)
- GSC-01: Daily Index Coverage Sync
- GSC-02: Index Error Alerter
- GSC-03: Core Web Vitals Monitor
- CNT-02: Content Decay Detector

### Tier 3: Competitive Intel (3 workflows)
- CMP-01: Competitor Rank Tracker
- CMP-04: SERP Share Calculator
- CMP-05: Competitive Gap Finder

### Tier 4: Reporting (2 workflows)
- RPT-01: Weekly Digest
- SYS-02: Health Checker

---

## API Requirements

| API | Required For | Typical Cost |
|-----|--------------|--------------|
| GA4 (Google Analytics) | TRF workflows | Free |
| DataForSEO | RNK, CMP, BKL workflows | $50-500/mo depending on volume |
| Google Search Console | GSC workflows | Free |
| Claude API | INS workflows | ~$20-50/mo |
| Slack | All alert workflows | Free tier works |

---

## Database Schema

All workflows store data in a `web_intel` schema in Supabase with tables including:
- `traffic_daily` - Daily traffic metrics
- `keyword_rankings` - Daily ranking positions
- `index_coverage` - GSC index status
- `content_inventory` - Page inventory
- `competitors` - Competitor domains
- `backlinks` - Backlink profile
- `alerts` - Alert history

---

*Generated: 2026-02-02*
*Source: IAML Business OS - gsd-web-intelligence project*
