# WF1: Daily RSS Monitor

> **CEO Summary:** Automatically scans 7 HR and employment law news sources every morning at 6 AM and stores classified signals in the database so the content engine knows what to write about.

## Overview

| Field | Value |
|-------|-------|
| **Workflow** | WF1 -- Daily RSS Monitor |
| **System** | LinkedIn Content Engine |
| **Trigger** | Schedule: Daily at 6:00 AM CST (12:00 UTC) |
| **Database** | `linkedin_engine.research_signals` |
| **n8n Tag** | `linkedin-content-engine` |
| **JSON File** | `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json` |

## What It Does

1. Reads RSS feeds from 7 HR/AI news sources
2. Filters to articles published in the last 48 hours
3. Sends each article to Claude Sonnet for classification (keywords, topic category, sentiment)
4. Inserts classified signals into `linkedin_engine.research_signals` via Supabase REST API
5. Logs the workflow run to `linkedin_engine.workflow_runs`
6. Logs any errors to `workflow_errors` via canary pattern

## RSS Sources

| # | Source | Feed URL | Source Code |
|---|--------|----------|-------------|
| 1 | SHRM | `https://www.shrm.org/rss/pages/custom-rss.aspx` | `shrm` |
| 2 | HR Dive | `https://www.hrdive.com/feeds/news/` | `hr_dive` |
| 3 | EEOC Press Releases | `https://www.eeoc.gov/newsroom/rss` | `eeoc` |
| 4 | DOL News | `https://www.dol.gov/rss/releases.xml` | `dol` |
| 5 | Littler Mendelson | `https://www.littler.com/rss.xml` | `littler` |
| 6 | Jackson Lewis | `https://www.jacksonlewis.com/feed` | `jackson_lewis` |
| 7 | Fisher Phillips | `https://www.fisherphillips.com/rss` | `fisher_phillips` |

## Topic Categories

| Category | Code | Signals |
|----------|------|---------|
| AI Compliance | `ai_compliance` | AI regulation, bias audits, algorithmic accountability |
| AI Hiring | `ai_hiring` | AI in recruitment, automated screening, EEOC guidance |
| Surveillance | `surveillance` | Employee monitoring, bossware, privacy |
| Employment Law | `employment_law` | Labor law updates, court decisions, DOL guidance |
| HR Tech | `hr_tech` | HR software, HRIS, people analytics |
| Legacy Pivot | `legacy_pivot` | Institutional knowledge meets modern AI |
| Build in Public | `build_in_public` | Automation stories, tool-building narratives |

## Credentials Required

| Service | Credential ID | Type |
|---------|--------------|------|
| Supabase REST | `Dy6aCSbL5Tup4TnE` | httpHeaderAuth |
| Claude API | `anthropic-api` | httpHeaderAuth |

## Node Map

```
Schedule (6 AM CST)
  |-- RSS: SHRM -> Tag: SHRM --------------|
  |-- RSS: HR Dive -> Tag: HR Dive --------|
  |-- RSS: EEOC -> Tag: EEOC -------------|
  |-- RSS: DOL -> Tag: DOL ---------------+-> Filter Last 48h -> Has Items? -> Split Batches
  |-- RSS: Littler -> Tag: Littler --------|       | (loop)
  |-- RSS: Jackson Lewis -> Tag: JL ------|   Wait 1s -> Claude Classify -> Parse -> Insert Signal
  '-- RSS: Fisher Phillips -> Tag: FP ----'       | (done)
                                              Log Workflow Run

Error Trigger -> Log Error to Supabase (canary)
```

## Error Handling

Uses canary error pattern: any unhandled error triggers the Error Trigger node, which POSTs the error details to the `workflow_errors` table via Supabase REST API.

## Monitoring

Check `linkedin_engine.workflow_runs` for execution history:
```sql
SELECT * FROM linkedin_engine.workflow_runs
WHERE workflow_name = 'wf1-daily-rss-monitor'
ORDER BY started_at DESC LIMIT 10;
```

Check for errors:
```sql
SELECT * FROM linkedin_engine.workflow_errors
WHERE workflow_name = 'wf1-daily-rss-monitor'
ORDER BY timestamp DESC LIMIT 10;
```

## Import Instructions

1. Open n8n at `https://n8n.realtyamp.ai`
2. Go to Settings -> Import from File
3. Select `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json`
4. Verify credential mappings (Supabase REST + Anthropic API)
5. Activate the workflow
