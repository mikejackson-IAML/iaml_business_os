# System Architecture

## Overview

The Web Intelligence Department follows a layered architecture where data flows from external sources through collection, analysis, and delivery layers.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL DATA SOURCES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────────────────┐│
│  │   GA4    │  │  DataForSEO  │  │   GSC    │  │     Competitors          ││
│  │   API    │  │     API      │  │   API    │  │   (sitemap/scrape)       ││
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └───────────┬──────────────┘│
│       │               │               │                    │               │
└───────┼───────────────┼───────────────┼────────────────────┼───────────────┘
        │               │               │                    │
        ▼               ▼               ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COLLECTION LAYER (n8n)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   TRF-01    │  │   RNK-01    │  │   GSC-01    │  │      CMP-01         │ │
│  │   Traffic   │  │   Rankings  │  │   Coverage  │  │   Competitor Rank   │ │
│  │  Collector  │  │  Collector  │  │    Sync     │  │     Tracker         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │            │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STORAGE LAYER (Supabase)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         web_intel SCHEMA                               │  │
│  │                                                                        │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │  │
│  │  │ daily_traffic  │  │ daily_rankings │  │   search_performance   │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────────┘   │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │  │
│  │  │ index_coverage │  │content_inventory│ │  competitor_rankings   │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────────┘   │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │  │
│  │  │    alerts      │  │  ai_insights   │  │       reports          │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANALYSIS LAYER (n8n)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   TRF-02    │  │   RNK-02    │  │   CNT-02    │  │      AI-01          │ │
│  │   Anomaly   │  │   Change    │  │   Decay     │  │   Insight           │ │
│  │  Detector   │  │  Detector   │  │  Detector   │  │   Generator         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │            │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DELIVERY LAYER (n8n)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   TRF-03    │  │   RPT-01    │  │   RPT-06    │  │      AI-05          │ │
│  │   Alert     │  │   Weekly    │  │  Dashboard  │  │    Anomaly          │ │
│  │  Notifier   │  │   Report    │  │    Sync     │  │   Explainer         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │            │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OUTPUT CHANNELS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │    Slack     │  │   Business OS    │  │         Email                │   │
│  │   Channels   │  │    Dashboard     │  │      (optional)              │   │
│  └──────────────┘  └──────────────────┘  └──────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Patterns

### Pattern 1: Collect → Store → Detect → Alert

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Collect │────▶│  Store  │────▶│ Detect  │────▶│  Alert  │
│ (TRF-01)│     │(Supabase)│    │(TRF-02) │     │(TRF-03) │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

**Used By:** Traffic, Rankings, GSC, Content Decay

**Timing:**
- Collect: 5-7am (staggered)
- Detect: 30min after collect
- Alert: Immediate via webhook

### Pattern 2: Aggregate → Analyze → Report

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Multiple   │────▶│  Aggregate  │────▶│   Report    │
│   Tables    │     │  & Analyze  │     │  & Deliver  │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Used By:** Weekly Reports, Monthly Reports, Competitor Digests

**Timing:**
- Reports: Monday/1st of month morning
- After all collection workflows complete

### Pattern 3: Detect → Explain → Alert

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Detect  │────▶│   AI    │────▶│  Alert  │
│ Anomaly │     │ Explain │     │  Rich   │
└─────────┘     └─────────┘     └─────────┘
```

**Used By:** Anomaly alerts with AI explanation

**Timing:** On-demand when anomaly detected

---

## Database Schema Design

### Core Tables

```sql
-- Traffic data (daily aggregates)
web_intel.daily_traffic (
  id, collected_date, sessions, users, pageviews,
  bounce_rate, avg_session_duration, source_breakdown
)

-- Per-page traffic
web_intel.page_traffic (
  id, collected_date, page_path, sessions, pageviews,
  avg_time_on_page, bounce_rate, exit_rate
)

-- Keyword tracking
web_intel.tracked_keywords (
  id, keyword, search_volume, difficulty, priority,
  target_url, created_at, updated_at
)

-- Daily ranking snapshots
web_intel.daily_rankings (
  id, keyword_id, collected_date, position, url,
  serp_features, competitor_positions
)

-- GSC index coverage
web_intel.index_coverage (
  id, collected_date, indexed_count, crawled_not_indexed,
  excluded_count, error_count, details
)

-- Content inventory
web_intel.content_inventory (
  id, url, title, word_count, publish_date,
  last_modified, last_crawled, status
)

-- Alerts
web_intel.alerts (
  id, alert_type, severity, title, message,
  metadata, created_at, acknowledged_at
)

-- AI insights
web_intel.ai_insights (
  id, insight_type, date_range, content,
  data_sources, created_at
)
```

### Indexes

```sql
-- Time-series queries
CREATE INDEX idx_daily_traffic_date ON web_intel.daily_traffic(collected_date);
CREATE INDEX idx_daily_rankings_date ON web_intel.daily_rankings(collected_date);
CREATE INDEX idx_daily_rankings_keyword ON web_intel.daily_rankings(keyword_id);

-- Alert queries
CREATE INDEX idx_alerts_type_date ON web_intel.alerts(alert_type, created_at);
CREATE INDEX idx_alerts_severity ON web_intel.alerts(severity) WHERE acknowledged_at IS NULL;
```

### Views

```sql
-- 7-day traffic average
CREATE VIEW web_intel.traffic_7day_avg AS
SELECT
  page_path,
  AVG(sessions) as avg_sessions,
  AVG(pageviews) as avg_pageviews
FROM web_intel.page_traffic
WHERE collected_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY page_path;

-- Ranking changes (today vs yesterday)
CREATE VIEW web_intel.ranking_changes AS
SELECT
  t.keyword_id,
  t.position as today_position,
  y.position as yesterday_position,
  t.position - y.position as change
FROM web_intel.daily_rankings t
LEFT JOIN web_intel.daily_rankings y
  ON t.keyword_id = y.keyword_id
  AND y.collected_date = t.collected_date - INTERVAL '1 day'
WHERE t.collected_date = CURRENT_DATE;
```

---

## Workflow Scheduling

### Daily Schedule (CT)

| Time | Workflow | Dependencies |
|------|----------|--------------|
| 4:00 | GSC-07 (Sitemap) | — |
| 5:00 | RNK-01 (Rankings) | — |
| 5:00 | CMP-01 (Competitor Ranks) | — |
| 5:15 | RNK-04 (SERP Features) | — |
| 5:30 | RNK-02 (Rank Changes) | RNK-01 |
| 6:00 | TRF-01 (Traffic) | — |
| 6:00 | GSC-04 (Search Performance) | — |
| 6:15 | TRF-04 (Page Performance) | — |
| 6:30 | TRF-05 (Traffic Sources) | — |
| 7:00 | TRF-02 (Traffic Anomalies) | TRF-01 |
| 7:00 | GSC-01 (Index Coverage) | — |
| 7:30 | GSC-02 (Index Errors) | GSC-01 |
| 8:00 | GSC-03 (Core Web Vitals) | — |
| 8:00 | AI-01 (Daily Insights) | TRF-01, RNK-01 |
| 9:00 | SYS-03 (Data Validation) | All collectors |

### Weekly Schedule (CT)

| Day | Time | Workflow |
|-----|------|----------|
| Mon | 3:00 | CMP-02 (Competitor Content) |
| Mon | 4:00 | RNK-05 (Opportunities) |
| Mon | 5:00 | GSC-05 (Crawl Stats) |
| Mon | 6:00 | TRF-06 (Geo Traffic) |
| Mon | 6:00 | CNT-02 (Content Decay) |
| Mon | 8:00 | RPT-01 (Weekly Report) |
| Mon | 9:00 | CMP-05 (Competitor Digest) |
| Mon | 10:00 | AI-02 (Weekly Insights) |
| Mon | 11:00 | AI-03 (Competitor Intel) |
| Wed | 3:00 | CMP-03 (Backlinks) |
| Wed | 4:00 | RNK-06 (New Keywords) |
| Wed | 5:00 | GSC-06 (Mobile Usability) |
| Wed | 10:00 | AI-04 (Content Recommendations) |

### Monthly Schedule (CT)

| Day | Time | Workflow |
|-----|------|----------|
| 1st | 1:00 | SYS-04 (Data Archiver) |
| 1st | 3:00 | RNK-07 (Search Volumes) |
| 1st | 4:00 | CNT-04 (Thin Content) |
| 1st | 5:00 | CNT-06 (Internal Links) |
| 1st | 8:00 | SYS-05 (Credential Reminder) |
| 1st | 9:00 | RPT-02 (Executive Report) |
| 1st | 10:00 | RPT-03 (Competitor Report) |
| 1st | 11:00 | RPT-05 (Technical SEO Report) |
| 15th | 4:00 | CNT-05 (Content Gaps) |
| 15th | 9:00 | RPT-04 (Content Health Report) |

---

## Error Handling

### Standard Error Handler

Every workflow includes:
1. **Try/Catch wrapper** - Catch all errors
2. **Log to n8n-brain** - `store_error_fix` call
3. **Slack alert** - For P0/P1 workflows
4. **Retry logic** - 3 retries with exponential backoff

### Error Categories

| Category | Action | Example |
|----------|--------|---------|
| Transient | Retry | Network timeout, rate limit |
| Auth | Alert + pause | Token expired, invalid credentials |
| Data | Log + continue | Empty response, malformed data |
| Critical | Alert + stop | Database down, API permanently failed |

---

## Monitoring

### Health Checks (SYS-01)

```
Every 15 minutes:
├── Check: Did scheduled workflows run?
├── Check: Any error states in last 15 min?
├── Check: Data freshness (last collection time)
└── Alert: If any check fails
```

### Data Quality (SYS-03)

```
Daily at 9am:
├── Check: All tables have today's data
├── Check: No NULL values in required fields
├── Check: Values within expected ranges
├── Check: Row counts reasonable
└── Alert: If any check fails
```

---
*Last updated: 2026-01-20*
