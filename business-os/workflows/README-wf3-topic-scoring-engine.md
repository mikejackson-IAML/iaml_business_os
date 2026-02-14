# WF3: Topic Scoring Engine

> **CEO Summary:** Scores and ranks this week's research topics across 5 dimensions (engagement, freshness, content gap, positioning, format) so the dashboard shows which topics to post about, ranked by total score.

## Overview

| Field | Value |
|-------|-------|
| **Workflow** | WF3: Topic Scoring Engine |
| **System** | LinkedIn Content Engine |
| **Trigger** | Schedule: Monday at 5:00 AM CST (11:00 UTC) |
| **Input** | `linkedin_engine.research_signals` (unprocessed) |
| **Output** | `linkedin_engine.topic_recommendations` (scored, status=pending) |
| **Dependencies** | Claude Sonnet API, Supabase REST API |
| **Error Handling** | Canary pattern (logs to workflow_runs) |
| **n8n Tags** | linkedin-content-engine |
| **JSON File** | `n8n-workflows/linkedin-engine/wf3-topic-scoring-engine.json` |

## What It Does

WF3 is the intelligence layer between raw research signals (from WF1 Daily RSS and WF2 Weekly Deep Research) and the dashboard's topic selection UI. It uses a **two-pass Claude architecture**:

1. **Pass 1 -- Clustering:** Takes all unprocessed signals for the current week and asks Claude to group them into 6-10 distinct topic clusters. Each topic gets a title, angle, source signal IDs, and key data points. This step converts ~50-200 individual signals into ~6-10 coherent themes.

2. **Pass 2 -- Scoring:** For each topic cluster, Claude scores it across 5 dimensions using the full scoring rubric. Each dimension has specific point thresholds based on engagement data, freshness, content gap analysis, positioning alignment, and format potential.

The output is a ranked list of scored topics inserted into `topic_recommendations` with status=pending, ready for Mike to approve/reject in the dashboard "This Week" tab.

### AEO Bonus Mechanism

The positioning dimension includes an **AEO (AI Engine Optimization) bonus of +3 points** when a topic naturally allows use of terms like "Agentic RAG", "Compliance Guardrails", "Multi-Agent Orchestration", or "HR Agentic Systems". This means the positioning_score can reach 18 (15 base + 3 bonus), and total_score can exceed 100 (max 103). This is by design -- the AEO bonus is an intentional differentiator.

## Schedule

**Monday 5:00 AM CST** (11:00 UTC)

This timing ensures:
- WF1 (Daily RSS) has run Sun-Sat, collecting ~7 days of RSS signals
- WF2 (Weekly Deep Research) has completed its Sunday 8 PM run, collecting Reddit + LinkedIn signals
- Topics are scored and ready for review when Mike starts his Monday morning

## Input / Output

### Input
- **Source:** `linkedin_engine.research_signals` table
- **Filter:** `processed=false` AND `signal_week=<current Monday>`
- **Fields:** id, source, source_url, title, body_text, author, platform_engagement, keywords, topic_category, sentiment, collected_date

### Output
- **Destination:** `linkedin_engine.topic_recommendations` table
- **Fields:** week_of, topic_title, angle, total_score, engagement_score, freshness_score, gap_score, positioning_score, format_score, recommended_format, recommended_series, hook_suggestion, key_data_points, source_signal_ids, status (pending)

## Node Map

```
schedule-monday-5am-cst (Schedule: Monday 5 AM CST)
  |
  v
calc-week-and-start-run (Code: calculate signal_week, generate run_id)
  |
  v
log-run-start (HTTP POST: workflow_runs status=running)
  |
  v
fetch-unprocessed-signals (HTTP GET: research_signals?processed=eq.false)
  |
  v
normalize-signals (Code: normalize Supabase response, detect empty)
  |
  v
check-has-signals (If: _empty != true)
  |                    \
  | [true]              [false]
  v                      v
prepare-signals-for-clustering    log-empty-run (HTTP POST: workflow_runs status=completed, 0 items)
  |
  v
claude-cluster-topics (HTTP POST: Claude API -- cluster signals into 6-10 topics)
  |
  v
parse-clustering-response (Code: parse topics, attach full signal data)
  |
  v
split-topics-batch (SplitInBatches: 1 topic at a time)
  |              \
  | [each]        [done]
  v                v
claude-score-topic    prepare-mark-processed (Code: collect signal IDs)
  |                    |
  v                    v
parse-score-and-total  mark-signals-processed (HTTP PATCH: processed=true using captured IDs)
  |                    |
  v                    v
insert-topic-recommendation  log-run-complete (HTTP POST: workflow_runs status=completed)
  |
  v
[loop back to split-topics-batch]

error-trigger --> log-error (HTTP POST: workflow_runs status=failed)
```

## Scoring Algorithm

### 5-Dimension Breakdown

| Dimension | Range | What It Measures |
|-----------|-------|------------------|
| **Engagement Signal Strength** | 0-25 | Reddit upvotes/comments, LinkedIn likes, multi-source coverage |
| **Freshness & Timing** | 0-25 | Recency of regulatory announcements, court decisions, trends |
| **Content Gap Analysis** | 0-20 | Whether this angle is already covered on LinkedIn |
| **Positioning Alignment** | 0-15 (+3 AEO) | How well topic fits "The HR Technologist" brand |
| **Format Potential** | 0-15 | Suitability for text, carousel, or data graphic |
| **Total** | **0-103** | Sum of all dimensions (exceeds 100 when AEO applies) |

### Engagement Scoring Notes

- RSS signals (SHRM, HR Dive, EEOC, DOL, Littler, Jackson Lewis, Fisher Phillips) have **no platform_engagement data** -- engagement is scored based on multi-source coverage (+5 for 3+ sources covering the same topic)
- Reddit signals are scored on upvotes (100+: +5) and comments (50+: +5)
- LinkedIn signals are scored on likes (500+: +5)

### Positioning AEO Bonus

+3 bonus applied within positioning_score when topic naturally allows use of:
- "Agentic RAG"
- "Compliance Guardrails"
- "Multi-Agent Orchestration"
- "HR Agentic Systems"

### Recommended Outputs

For each scored topic, Claude also recommends:
- **Format:** text, carousel, or data_graphic
- **Series:** not_being_told, compliance_radar, ask_ai_guy, or flex
- **Hook:** A punchy 1-2 sentence opening for the LinkedIn post

## Credentials Required

| Service | Credential ID | Type | Purpose |
|---------|--------------|------|---------|
| Supabase REST | `Dy6aCSbL5Tup4TnE` | httpHeaderAuth | Read signals, write topics, log runs |
| Anthropic API | `anthropic-api` | httpHeaderAuth | Claude clustering + scoring calls |

## Race Condition Prevention

WF3 captures all signal IDs at fetch time (`signal_ids_to_process`) and uses this captured list when marking signals as processed (`PATCH research_signals?id=in.(...)`). This prevents race conditions if WF1 or WF2 insert new signals during WF3's execution -- only the signals that were actually processed get marked.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No signals found | Check WF1/WF2 have run and produced signals. Verify `signal_week` matches current Monday. |
| Claude API rate limit (429) | Batch size is 1 with sequential processing. If still hitting limits, add a Wait node between scoring calls. |
| Score validation errors | Code node clamps all scores to valid ranges. Check logs if scores seem wrong. |
| Topics not appearing in dashboard | Verify `linkedin_engine` schema is exposed in Supabase API settings. Check `topic_recommendations` table directly. |
| Clustering produces too few topics | Signals may be too similar. Adjust clustering prompt to allow fewer topics if signals are sparse. |
| Total score > 100 | This is expected when AEO bonus applies. Max possible is 103. |
| Empty workflow run logged | No unprocessed signals existed for current week. Not an error -- workflow exits gracefully. |

## Monitoring

Check execution history:
```sql
SELECT * FROM linkedin_engine.workflow_runs
WHERE workflow_name = 'wf3-topic-scoring-engine'
ORDER BY started_at DESC LIMIT 10;
```

Check scored topics:
```sql
SELECT topic_title, total_score, engagement_score, freshness_score,
       gap_score, positioning_score, format_score, recommended_series, status
FROM linkedin_engine.topic_recommendations
WHERE week_of = '2026-02-10'  -- adjust to current Monday
ORDER BY total_score DESC;
```

## Monthly Cost Impact

- Claude Sonnet API: ~$0.05-0.20/run (1 clustering call + 6-10 scoring calls at ~500 tokens each)
- **Weekly total: ~$0.05-0.20/run**
- **Monthly total: ~$0.20-0.80/month**

## File Location

`n8n-workflows/linkedin-engine/wf3-topic-scoring-engine.json`
