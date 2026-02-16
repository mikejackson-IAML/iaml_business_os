# WF4: Content Generation Pipeline

> **CEO Summary:** Takes approved topics from the scoring engine and generates complete LinkedIn post drafts with 3 hook variations, full post text, and first comments via Claude Sonnet, then assigns them to calendar slots for review in the dashboard.

## Overview

| Field | Value |
|-------|-------|
| **Workflow** | WF4: Content Generation Pipeline |
| **System** | LinkedIn Content Engine |
| **Trigger** | Webhook: POST to `linkedin-content-generate` |
| **Input** | `linkedin_engine.topic_recommendations` (approved topic by ID) |
| **Output** | `linkedin_engine.posts` (draft with hook_variations JSONB) |
| **Dependencies** | Claude Sonnet API, Supabase REST API |
| **Error Handling** | Canary pattern (logs to workflow_runs) + Slack error alerts |
| **n8n Tags** | linkedin-content-engine |
| **JSON File** | `n8n-workflows/linkedin-engine/wf4-content-generation-pipeline.json` |

## What It Does

WF4 is the content engine that transforms approved topics into publishable draft content. When a topic is approved in the dashboard's "This Week" tab, the dashboard fires a POST webhook to n8n with the `topic_id`. WF4 then:

1. **Fetches the topic** and its source research signals from Supabase
2. **Fetches context** -- top 5 hooks from the hook library and the next open calendar slot
3. **Assembles a prompt** following the PROMPT.md brand voice template with pillar-specific framing
4. **Calls Claude Sonnet** to generate 3 hook variations (data, contrarian, observation), full post text (1,800-2,000 chars), and first comment text
5. **Parses and stores** the generated content as a single post row with `hook_variations` JSONB
6. **Assigns a calendar slot** if one is available
7. **Notifies via Slack** and logs the workflow run

### Async Pattern

The webhook responds immediately with 200 OK (fire-and-forget). Content generation takes 30-60 seconds and runs asynchronously. The dashboard polls the `workflow_runs` table to detect completion.

### Hook Variations Storage

All 3 hooks are stored in the `hook_variations` JSONB column as an array:
```json
[
  {"text": "...", "category": "data", "variation": "A"},
  {"text": "...", "category": "contrarian", "variation": "B"},
  {"text": "...", "category": "observation", "variation": "C"}
]
```
Hook A (data) is selected by default. The dashboard allows switching between hooks by updating `hook_text`, `hook_category`, and `hook_variation` from the JSONB array.

## Trigger

**Webhook:** POST to `https://n8n.realtyamp.ai/webhook/linkedin-content-generate`

**Payload:**
```json
{
  "topic_id": "<uuid>"
}
```

**Response:** Immediate 200 OK (generation runs async)

## Input / Output

### Input
- **Source:** `linkedin_engine.topic_recommendations` table (single topic by ID)
- **Fields:** topic_title, angle, recommended_format, recommended_series, key_data_points, source_signal_ids
- **Context:** research_signals (source content), hooks (top 5), content_calendar (next open slot)

### Output
- **Destination:** `linkedin_engine.posts` table
- **Fields:** topic_id, hook_text, hook_category, hook_variation, hook_variations (JSONB), full_text, first_comment_text, format, series, pillar, hashtags, status (draft), generation_status (completed/failed)
- **Side effects:** content_calendar slot updated to status=generated with post_id assigned

## Node Map

```
wf4-webhook-trigger (Webhook: POST linkedin-content-generate, responds immediately)
  |
  v
validate-input (Code: extract topic_id, generate run_id, validate)
  |
  v
log-run-start (HTTP POST: workflow_runs status=running)
  |
  v
fetch-approved-topic (HTTP GET: topic_recommendations?id=eq.{topic_id})
  |
  v
prepare-signal-fetch (Code: extract signal IDs, build query)
  |
  +---> fetch-source-signals (HTTP GET: research_signals?id=in.(...))
  |---> fetch-top-hooks (HTTP GET: hooks?status=eq.active&order=score.desc&limit=5)
  +---> find-calendar-slot (HTTP GET: content_calendar?status=eq.open&post_date=gte.today&limit=1)
         |
         v (all three merge into)
assemble-context (Code: build full Claude prompt with brand voice, pillar framing, AEO terms)
  |
  v
claude-generate-content (HTTP POST: Claude API -- generate 3 hooks + full post + first comment)
  |
  v
parse-generation-response (Code: defensive JSON parse, build hook_variations array, handle failures)
  |
  v
insert-post-draft (HTTP POST: posts -- insert draft with hook_variations JSONB)
  |
  v
extract-post-id (Code: extract inserted post ID)
  |
  v
check-calendar-slot (If: has open calendar slot?)
  |                    \
  | [yes]               [no]
  v                      |
assign-calendar-slot     |
  |                      |
  v                      v
slack-notification <-----+  (success message)
  |
  v
log-run-complete (HTTP POST: workflow_runs status=completed)

error-trigger --> log-error (HTTP POST: workflow_runs status=failed)
              --> slack-error-alert (Slack: generation failed message)
```

## Content Generation Prompt

The prompt follows the PROMPT.md template and includes:

- **Brand voice:** "The HR Technologist" -- innovative, grounded, technically curious
- **Pillar-specific framing:** Different instructions for legacy_future, building_in_public, partnered_authority
- **AEO terms:** Agentic RAG, Compliance Guardrails, Multi-Agent Orchestration, HR Agentic Systems (used only when natural)
- **Rules:** 1,800-2,000 chars, no links in body, no emojis, mobile-friendly formatting, binary CTA question
- **Output format:** JSON with hook_a, hook_b, hook_c, full_text, first_comment_text, hashtags, series, pillar

## Credentials Required

| Service | Credential ID | Type | Purpose |
|---------|--------------|------|---------|
| Supabase REST | `Dy6aCSbL5Tup4TnE` | httpHeaderAuth | Read topics/signals/hooks/calendar, write posts, log runs |
| Anthropic API | `anthropic-api` | httpHeaderAuth | Claude Sonnet content generation |
| Slack | Webhook URL (hardcoded) | webhook | Success/error notifications |

## Error Handling

- **Parse failures:** If Claude returns malformed JSON, the post is still created with `generation_status: "failed"` and the raw response saved in `generation_instructions` for debugging
- **Truncated responses:** If `stop_reason === "max_tokens"`, marked as failed with diagnostic message
- **Error trigger:** Catches any unhandled errors, logs to `workflow_runs` table with status=failed, sends Slack alert
- **Manual retry:** User can trigger regeneration from the dashboard Drafts tab

## Calendar Slot Assignment

- On draft creation, WF4 finds the next open calendar slot (status=open, post_date >= today, ordered ascending)
- If found, assigns the slot by setting `post_id`, `topic_id`, and `status: "generated"`
- If no open slot exists, the draft is created without a calendar assignment (can be assigned manually in dashboard)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook returns 404 | Workflow not imported or not active in n8n. Import JSON and activate. |
| Generation takes >60s | Normal for content generation. Claude Sonnet may take 30-60s for full post. Timeout set to 120s. |
| Parse error on Claude response | Check raw response in `generation_instructions` column. Likely markdown fences or extra commentary. |
| Post created with generation_status=failed | Claude response couldn't be parsed. Review raw response, retry from dashboard. |
| No calendar slot assigned | No open slots available. Create new calendar entries or manually assign in dashboard. |
| Missing hook_variations | Check the parse node output. All 3 hooks should be in the JSONB array. |
| Slack notification not sent | Verify webhook URL is correct. Check n8n execution log for HTTP errors. |

## Monitoring

Check execution history:
```sql
SELECT * FROM linkedin_engine.workflow_runs
WHERE workflow_name = 'wf4-content-generation-pipeline'
ORDER BY started_at DESC LIMIT 10;
```

Check generated drafts:
```sql
SELECT id, topic_id, hook_text, hook_variation, generation_status,
       series, pillar, status, created_at
FROM linkedin_engine.posts
WHERE generation_status IS NOT NULL
ORDER BY created_at DESC LIMIT 10;
```

Check hook variations:
```sql
SELECT id, hook_variations, generation_status
FROM linkedin_engine.posts
WHERE hook_variations IS NOT NULL
ORDER BY created_at DESC LIMIT 5;
```

## Monthly Cost Impact

- Claude Sonnet API: ~$0.02-0.05/generation (one call per topic, ~2000 input tokens + ~2000 output tokens)
- At 3-4 posts/week: ~12-16 generations/month
- **Monthly total: ~$0.25-0.80/month**

## File Location

`n8n-workflows/linkedin-engine/wf4-content-generation-pipeline.json`
