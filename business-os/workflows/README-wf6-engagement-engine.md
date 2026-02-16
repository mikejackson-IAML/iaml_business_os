# WF6: Engagement Engine

> **CEO Summary:** Automatically finds the best LinkedIn posts from your engagement network to comment on each morning, generates AI-powered comment suggestions via Claude, and sends a Slack digest -- plus fires a pre-publish warming alert 20 minutes before your posts go live on Tue-Fri, turning strategic commenting from a manual chore into a daily 5-minute habit.

## Overview

| Field | Value |
|-------|-------|
| **Workflow** | WF6: Engagement Engine |
| **System** | LinkedIn Content Engine |
| **Trigger A** | Schedule: Daily 7:00 AM CST (13:00 UTC) |
| **Trigger B** | Schedule: Tue-Fri 7:40 AM CST (13:40 UTC) |
| **Input** | `linkedin_engine.engagement_network`, `linkedin_engine.content_calendar`, `linkedin_engine.posts` |
| **Output** | `linkedin_engine.engagement_digests` entries, Slack notifications |
| **Dependencies** | Apify (LinkedIn profile scraping), Claude Sonnet (comment generation), Supabase REST, Slack |
| **Error Handling** | Canary pattern: workflow_errors + Slack alert |
| **n8n Tags** | linkedin-content-engine |
| **JSON File** | `n8n-workflows/linkedin-engine/wf6-engagement-engine.json` |

## What It Does

WF6 has two independent branches, each with its own schedule trigger:

### Branch A: Daily Engagement Digest (7 AM CST, daily)

Every morning, WF6:

1. **Fetches active network contacts** -- reads `engagement_network` for contacts with LinkedIn URLs
2. **Scrapes recent posts via Apify** -- uses `harvestapi/linkedin-profile-posts` actor to get the last 5 posts per profile, batched in groups of 8
3. **Filters for recency and engagement** -- keeps only posts from the last 24 hours with 5+ total reactions
4. **Ranks and selects top 7** -- scores by `(likes * 1) + (comments * 3) + (shares * 2)` with a +10 bonus for Tier 1 contacts
5. **Generates comment suggestions via Claude** -- 2 suggestions per post: one insight/value-add style, one question/discussion style, following Mike's brand voice
6. **Stores digest items** -- saves each post + suggestions to `engagement_digests` table
7. **Updates last_monitored** -- marks all scraped contacts with current timestamp
8. **Sends Slack digest** -- rich Block Kit message with post authors, snippets, engagement stats, and comment suggestions

### Branch B: Pre-Post Warming (7:40 AM CST, Tue-Fri only)

20 minutes before WF5 publishes, WF6:

1. **Checks today's calendar** -- looks for a scheduled/approved post in `content_calendar`
2. **Fetches the post details** -- gets hook text, series, pillar, and content for context
3. **Scores warming targets** -- ranks network contacts by topical relevance to the upcoming post:
   - Same category as post topic: +3
   - Tier 1: +2, Tier 2: +1
   - Not engaged in last 48h: +1
4. **Selects top 4 warming targets** -- the most relevant contacts to engage with before publishing
5. **Scrapes their recent posts** -- via Apify, gets 3 most recent posts per target
6. **Filters for best post per contact** -- most recent post from last 48h with highest engagement
7. **Generates warming comments** -- Claude generates comments that seed conversations related to Mike's upcoming post topic
8. **Stores warming items** -- saves to `engagement_digests` with `digest_type: 'warming'` and `warming_context`
9. **Sends Slack warming alert** -- urgent message with publishing countdown, targets, and comment suggestions

### Skip Logic

- **Daily digest:** Skips silently if no contacts found or no recent posts. Logged to `workflow_runs`.
- **Warming:** Skips if no post scheduled for today or no suitable warming targets. Logged to `workflow_runs`.

## Triggers

| Trigger | Schedule | Cron | Days |
|---------|----------|------|------|
| Daily Digest | 7:00 AM CST (13:00 UTC) | `0 13 * * *` | Every day |
| Pre-Post Warming | 7:40 AM CST (13:40 UTC) | `40 13 * * 2-5` | Tue-Fri only |

**Timezone:** America/Chicago

**Execution Timeout:** 600 seconds (10 minutes, accommodates Apify scraping + Claude API calls)

## Input / Output

### Input

- **engagement_network:** Active contacts with LinkedIn URLs, tier, category
- **content_calendar:** Today's scheduled post slot (warming branch)
- **posts:** Post details for warming context (warming branch)

### Output

- **engagement_digests:** Daily digest and warming items with comment suggestions
- **engagement_network:** Updated `last_monitored` timestamps
- **workflow_runs:** Run logs with status, items_processed, metadata
- **workflow_errors:** Error records (canary pattern)
- **Slack:** Daily digest + warming alert to #linkedin-content

## Flow Diagram

### Branch A: Daily Digest
```
Schedule (7 AM CST daily)
  |
  Build Date & Run ID -> Log Run Start
  |
  Fetch Network Contacts -> Normalize -> Has Contacts? --NO--> Log Skip
  |YES
  Build Profile URL Batches
  |
  SplitInBatches (8 profiles per batch)
  | (loop)
  Apify: Scrape Posts -> Filter Recent (24h, 5+ engagement) -> Wait 1s
  | (done)
  Rank & Select Top 7 -> Has Posts? --NO--> Log Skip
  |YES
  Prepare for Comment Gen
  |
  SplitInBatches (1 post at a time)
  | (loop)
  Claude: Generate Comments -> Parse Suggestions -> Store Digest Item -> Wait 1s
  | (done)
  Prepare Update & Slack
  |
  Update last_monitored -> Slack: Daily Digest -> Log Daily Complete
```

### Branch B: Pre-Post Warming
```
Schedule (7:40 AM CST Tue-Fri)
  |
  Build Warming Date -> Log Warming Start
  |
  Fetch Today's Calendar -> Check Calendar Slot -> Post Today? --NO--> Log Skip
  |YES
  Fetch Post Details -> Fetch Warming Network
  |
  Select Warming Targets (score by category, tier, recency)
  |
  Has Warming Targets? --NO--> Log Skip
  |YES
  Apify: Warming Posts -> Filter Warming Posts -> Prepare Warming Gen
  |
  SplitInBatches (1 post at a time)
  | (loop)
  Claude: Warming Comments -> Parse Warming Suggestions -> Store Warming Item -> Wait 1s
  | (done)
  Prepare Warming Slack -> Slack: Warming Alert -> Log Warming Complete
```

### Error Handling
```
Error Trigger -> Log Error (Canary) to workflow_errors -> Slack Error Alert
```

## Node List

### Branch A: Daily Digest

| # | ID | Name | Type |
|---|-----|------|------|
| 1 | wf6-schedule-daily | Daily 7 AM CST | scheduleTrigger |
| 2 | wf6-build-date | Build Date & Run ID | code |
| 3 | wf6-log-start | Log Run Start | httpRequest |
| 4 | wf6-fetch-network | Fetch Network Contacts | httpRequest |
| 5 | wf6-normalize-contacts | Normalize Contacts | code |
| 6 | wf6-check-contacts | Has Contacts? | if |
| 7 | wf6-build-profile-urls | Build Profile URL Batches | code |
| 8 | wf6-batch-scrape | Scrape Batches | splitInBatches |
| 9 | wf6-scrape-posts | Apify: Scrape Posts | httpRequest |
| 10 | wf6-filter-recent | Filter Recent Posts | code |
| 11 | wf6-wait-batch | Wait 1s Between Batches | wait |
| 12 | wf6-rank-select | Rank & Select Top 7 | code |
| 13 | wf6-check-posts | Has Posts? | if |
| 14 | wf6-prepare-comment-gen | Prepare for Comment Gen | code |
| 15 | wf6-comment-batch | Comment Gen (Batch) | splitInBatches |
| 16 | wf6-generate-comments | Claude: Generate Comments | httpRequest |
| 17 | wf6-parse-suggestions | Parse Comment Suggestions | code |
| 18 | wf6-store-digest-item | Store Digest Item | httpRequest |
| 19 | wf6-wait-comment-gen | Wait 1s Rate Limit | wait |
| 20 | wf6-prepare-update | Prepare Update & Slack | code |
| 21 | wf6-update-monitored | Update last_monitored | httpRequest |
| 22 | wf6-slack-digest | Slack: Daily Digest | httpRequest |
| 23 | wf6-log-daily-complete | Log Daily Complete | httpRequest |
| 24 | wf6-log-daily-skip | Log Daily Skip | httpRequest |

### Branch B: Pre-Post Warming

| # | ID | Name | Type |
|---|-----|------|------|
| 25 | wf6-schedule-warming | Warming Tue-Fri 7:40 AM CST | scheduleTrigger |
| 26 | wf6-warming-date | Build Warming Date | code |
| 27 | wf6-log-warming-start | Log Warming Start | httpRequest |
| 28 | wf6-fetch-today-post | Fetch Today's Calendar | httpRequest |
| 29 | wf6-check-calendar | Check Calendar Slot | code |
| 30 | wf6-check-post-exists | Post Today? | if |
| 31 | wf6-fetch-post-detail | Fetch Post Details | httpRequest |
| 32 | wf6-fetch-warming-network | Fetch Warming Network | httpRequest |
| 33 | wf6-select-warming-targets | Select Warming Targets | code |
| 34 | wf6-check-warming-targets | Has Warming Targets? | if |
| 35 | wf6-scrape-warming-posts | Apify: Warming Posts | httpRequest |
| 36 | wf6-filter-warming-posts | Filter Warming Posts | code |
| 37 | wf6-prepare-warming-gen | Prepare Warming Gen | code |
| 38 | wf6-warming-comment-batch | Warming Comment (Batch) | splitInBatches |
| 39 | wf6-generate-warming-comments | Claude: Warming Comments | httpRequest |
| 40 | wf6-parse-warming-suggestions | Parse Warming Suggestions | code |
| 41 | wf6-store-warming | Store Warming Item | httpRequest |
| 42 | wf6-wait-warming-gen | Wait 1s Warming | wait |
| 43 | wf6-prepare-warming-slack | Prepare Warming Slack | code |
| 44 | wf6-slack-warming | Slack: Warming Alert | httpRequest |
| 45 | wf6-log-warming-complete | Log Warming Complete | httpRequest |
| 46 | wf6-log-warming-skip | Log Warming Skip | httpRequest |

### Error Handling

| # | ID | Name | Type |
|---|-----|------|------|
| 47 | wf6-error-trigger | Error Trigger | errorTrigger |
| 48 | wf6-log-error | Log Error (Canary) | httpRequest |
| 49 | wf6-slack-error | Slack Error Alert | httpRequest |

**Total: 49 nodes**

## Credentials

| Service | Credential ID | Type | Purpose |
|---------|--------------|------|---------|
| Supabase REST | `Dy6aCSbL5Tup4TnE` | httpHeaderAuth | Read/write engagement_network, engagement_digests, content_calendar, posts, workflow_runs, workflow_errors |
| Anthropic API | `anthropic-api` | httpHeaderAuth | Claude Sonnet for comment suggestion generation |
| Apify | `APIFY_API_TOKEN` env var | Token in URL | LinkedIn profile post scraping |
| Slack | Webhook URL (hardcoded) | webhook | Daily digest + warming alert notifications |

## Prerequisites

### APIFY_API_TOKEN

The Apify API token must be set as an environment variable in n8n:
1. Go to n8n Settings > Environment Variables
2. Add `APIFY_API_TOKEN` with your Apify API token
3. The token is used in the Apify HTTP Request URLs

### Engagement Network Data

WF6 requires active contacts in the `engagement_network` table:
- Each contact needs `active = true` and a valid `linkedin_url` starting with `https://www.linkedin.com/in/`
- Contacts should have `tier` (tier_1 or tier_2) and `category` set for proper scoring
- Recommended starting network: 10-15 Tier 1 + 15-25 Tier 2 contacts

### Supabase Grants

The migration `20260215_linkedin_engine_engagement_grants.sql` must be applied before WF6 can run. It grants anon access to `engagement_network`, `comment_activity`, and `engagement_digests` tables.

## Monitoring

### Verify Workflow is Running

Check workflow runs in Supabase:
```sql
SELECT * FROM linkedin_engine.workflow_runs
WHERE workflow_name = 'wf6-engagement-engine'
ORDER BY started_at DESC LIMIT 10;
```

Check daily digest entries:
```sql
SELECT digest_date, digest_type, target_author, status, created_at
FROM linkedin_engine.engagement_digests
WHERE digest_type = 'daily'
ORDER BY created_at DESC LIMIT 10;
```

Check warming entries:
```sql
SELECT digest_date, target_author, warming_context, status
FROM linkedin_engine.engagement_digests
WHERE digest_type = 'warming'
ORDER BY created_at DESC LIMIT 10;
```

### Slack Channel

Monitor `#linkedin-content` for:
- Daily engagement digest (speech balloon icon with post list and suggestions)
- Pre-post warming alerts (fire icon with publishing countdown)
- Error alerts (rotating light with error details)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty daily digest | Check `engagement_network` has active contacts with valid LinkedIn URLs |
| Apify timeout | Reduce network size or increase batch timeout. Check APIFY_API_TOKEN is set. |
| No warming alert | Verify `content_calendar` has today's date with a linked `post_id` |
| Claude API errors | Check `anthropic-api` credential in n8n. Verify API key is valid. |
| 401 from Supabase | Run `20260215_linkedin_engine_engagement_grants.sql` migration for anon grants |
| No posts found (all filtered) | Check network contacts are actively posting. Reduce MIN_ENGAGEMENT threshold in Filter Recent Posts code node. |
| Warming fires on Mon/Sat/Sun | Verify cron is `40 13 * * 2-5` (Tue-Fri only). Check n8n timezone setting. |

## Monthly Cost Impact

| Service | Estimate | Basis |
|---------|----------|-------|
| Apify (daily scrape) | ~$7.50/mo | 25 contacts x 5 posts x 30 days = 3,750 posts @ $2/1k |
| Apify (warming scrape) | ~$1.00/mo | 4 contacts x 3 posts x 17 days = 204 posts @ $2/1k |
| Claude Sonnet (comments) | ~$2.00/mo | ~250 API calls/mo @ ~$0.008 each (800 tokens output) |
| n8n execution | Minimal | Self-hosted, 1-2 runs/day |
| **Monthly total** | **~$10.50** | |

## n8n-brain Registration

After importing the workflow into n8n, register the pattern:

```javascript
// Via n8n-brain MCP tool: store_pattern
{
  "name": "WF6 Engagement Engine",
  "description": "Daily engagement digest (7 AM) + pre-post warming (7:40 AM Tue-Fri). Scrapes network posts via Apify, generates Claude comment suggestions, stores in engagement_digests, sends Slack notifications.",
  "workflow_json": "<contents of wf6-engagement-engine.json>",
  "tags": ["engagement", "linkedin", "apify", "claude", "schedule", "warming"],
  "services": ["apify", "anthropic", "supabase", "slack"],
  "node_types": ["scheduleTrigger", "httpRequest", "code", "if", "splitInBatches", "wait", "errorTrigger"],
  "trigger_type": "schedule",
  "notes": "Dual schedule trigger. Branch A: daily digest with profile scraping and ranked post selection. Branch B: pre-post warming with topical relevance scoring. 49 nodes total."
}
```

## File Location

`n8n-workflows/linkedin-engine/wf6-engagement-engine.json`
