# WF2: Weekly Deep Research

> **CEO Summary:** Automated weekly workflow that scrapes Reddit and LinkedIn for trending HR/AI discussions, classifies them with AI, and stores the results as research signals feeding the LinkedIn content engine's topic scoring pipeline.

## Overview

| Field | Value |
|-------|-------|
| **Workflow** | LinkedIn Engine: WF2 Weekly Deep Research |
| **Schedule** | Sunday 8:00 PM CST (Monday 2:00 AM UTC) |
| **Sources** | Reddit (7 subreddits), LinkedIn (keyword search) |
| **Output** | `linkedin_engine.research_signals` table |
| **Dependencies** | Apify API, Claude Sonnet, Supabase REST API |
| **Error Handling** | Canary pattern (posts to workflow_errors) |
| **n8n Tags** | linkedin-content-engine |

## What It Does

1. **Scrapes Reddit** -- Pulls top posts from 7 subreddits (r/humanresources, r/AskHR, r/antiwork, r/recruiting, r/employmentlaw, r/artificial, r/MachineLearning) via Apify's `trudax/reddit-scraper-lite` actor. Filters to posts with 50+ upvotes.

2. **Scrapes LinkedIn** -- Searches for top HR/AI posts from the past week via Apify's `curious_coder/linkedin-post-search-scraper` actor. Filters to posts with meaningful engagement (20+ likes or 5+ comments).

3. **De-duplicates** -- Checks each signal's `source_url` against existing entries in `research_signals` table via Supabase REST API. Skips duplicates.

4. **Classifies with AI** -- Claude Sonnet extracts keywords, assigns `topic_category` (one of 7 categories), and determines sentiment for each signal.

5. **Stores Results** -- Inserts classified signals into `linkedin_engine.research_signals` with platform engagement metrics as JSONB.

6. **Logs Run** -- Records workflow start, completion (with counts), and failures to `linkedin_engine.workflow_runs`.

## Node Map

```
Schedule (Sun 8PM CST)
  |
  v
Log Workflow Start
  |
  +---> Set Reddit Config --> Run Reddit Actor (Sync) --> Filter 50+ Upvotes --+
  |                                                                            |
  +---> Set LinkedIn Config --> Run LinkedIn Actor (Sync) --> Normalize Posts --+
                                                                               |
                                                                               v
                                                                   Merge All Signals
                                                                               |
                                                                               v
                                                                   Filter Empty Signals
                                                                               |
                                                                               v
                                                                        Has Signals?
                                                                       /           \
                                                                      YES          NO
                                                                      |             |
                                                              Split Into Batches   Log Complete (0)
                                                                      |
                                                              (per item loop)
                                                                      |
                                                              Stash Original Signal
                                                                      |
                                                              Dedup Check Supabase
                                                                      |
                                                                Is New Signal?
                                                               /            \
                                                             YES            NO
                                                              |              |
                                                     Claude Classify    (loop back)
                                                              |
                                                     Parse Response
                                                              |
                                                     Insert Signal
                                                              |
                                                        (loop back)
                                                              |
                                                   [all batches done]
                                                              |
                                                   Count Inserted Signals
                                                              |
                                                   Log Workflow Complete

Error Trigger --> Post Error to Supabase --> Log Workflow Failed
```

## Credentials Used

| Credential | ID | Purpose |
|------------|-----|---------|
| Supabase REST | Dy6aCSbL5Tup4TnE | Database reads/writes via HTTP Request |
| Anthropic/Claude | anthropic-api | Signal classification |
| Apify | env var APIFY_API_TOKEN | Reddit + LinkedIn scraping |

## Reddit Subreddits

| Subreddit | Focus Area |
|-----------|------------|
| r/humanresources | General HR discussions |
| r/AskHR | HR Q&A and advice |
| r/antiwork | Worker sentiment and workplace issues |
| r/recruiting | Recruitment and hiring |
| r/employmentlaw | Employment law discussions |
| r/artificial | AI general discussions (filtered for HR/workplace) |
| r/MachineLearning | ML discussions (filtered for HR/workforce) |

## LinkedIn Search Keywords

- HR artificial intelligence
- AI hiring compliance
- HR technology automation
- Employment law AI
- AI workplace surveillance
- CHRO artificial intelligence
- HR tech 2026

## Topic Categories

| Category | Description |
|----------|-------------|
| ai_compliance | AI in regulatory compliance |
| ai_hiring | AI in hiring and recruitment |
| surveillance | Workplace monitoring and AI surveillance |
| employment_law | Employment law and AI implications |
| hr_tech | HR technology and automation |
| legacy_pivot | Legacy business transformation |
| build_in_public | Building tools and processes in public |

## Sentiment Values

| Sentiment | Description |
|-----------|-------------|
| positive | Optimistic or supportive tone |
| negative | Critical or pessimistic tone |
| neutral | Factual or balanced tone |
| concerned | Worried or cautionary tone |
| confused | Uncertain or questioning tone |

## Data Flow

Each signal passes through this pipeline:

1. **Apify** returns raw posts (array)
2. **Filter/Normalize** code nodes map to common schema, filter by engagement threshold
3. **Merge** combines Reddit + LinkedIn into single array
4. **SplitInBatches** (batch size 1) processes one signal at a time
5. **Stash Original Signal** -- Set node preserves original fields for later reference
6. **Dedup Check** -- GET to Supabase checks if `source_url` already exists
7. **Is New Signal?** -- If empty array returned, signal is new
8. **Claude Classify** -- POST to Anthropic API with title + body, returns JSON with keywords/category/sentiment
9. **Parse Claude Response** -- Code node validates and merges classification with original signal using `$('Stash Original Signal').item.json`
10. **Insert** -- POST to Supabase `research_signals` table with all fields

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Apify actor timeout | Increase HTTP Request timeout beyond 300s or switch to async polling approach |
| Claude rate limit (429) | Already using batch size 1; add Wait node if needed |
| Supabase 404 on schema | Ensure `linkedin_engine` is in exposed schemas in Supabase API settings |
| No Reddit results | Verify Apify actor ID is correct; check `trudax/reddit-scraper-lite` on Apify Store |
| No LinkedIn results | LinkedIn actor may require `li_at` cookie; check actor docs |
| Empty signals after merge | Both branches returned no qualifying posts; check engagement thresholds |
| Dedup check returns error | Verify `Accept-Profile: linkedin_engine` header is sent |

## Monthly Cost Impact

- Apify Reddit actor: ~$5-10/run (depends on compute units)
- Apify LinkedIn actor: ~$5-15/run (depends on result count)
- Claude Sonnet API: ~$0.10-0.30/run (50-200 classifications at ~500 tokens each)
- **Weekly total: ~$10-25/run, ~$40-100/month**

## File Location

`n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json`
