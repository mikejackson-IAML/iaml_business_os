---
phase: 02-daily-rss-research
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json
  - business-os/workflows/README-wf1-daily-rss-monitor.md
autonomous: false

must_haves:
  truths:
    - "WF1 runs daily at 6 AM CST and reads RSS feeds from 7 sources"
    - "Each RSS item is classified with keywords, topic_category, and sentiment via Claude Sonnet"
    - "Classified signals are inserted into linkedin_engine.research_signals via Supabase REST API"
    - "signal_week is correctly set to Monday of the collection week"
    - "Errors are caught and logged to workflow_errors table via canary pattern"
    - "Pattern is registered in n8n-brain for future reuse"
  artifacts:
    - path: "n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json"
      provides: "Complete n8n workflow JSON importable to n8n"
      contains: "scheduleTrigger"
    - path: "business-os/workflows/README-wf1-daily-rss-monitor.md"
      provides: "CEO-readable workflow documentation"
      contains: "CEO Summary"
  key_links:
    - from: "scheduleTrigger node"
      to: "RSS Feed Read nodes (7 feeds)"
      via: "connections array"
      pattern: "rssFeedRead"
    - from: "RSS output"
      to: "Claude API HTTP Request"
      via: "merged feed items"
      pattern: "api.anthropic.com"
    - from: "Claude classification output"
      to: "Supabase REST insert"
      via: "HTTP Request POST"
      pattern: "rest/v1/research_signals"
    - from: "Error trigger"
      to: "workflow_errors insert"
      via: "canary error handler"
      pattern: "rest/v1/workflow_errors"
---

<objective>
Build the WF1 Daily RSS Monitor n8n workflow as a local JSON file ready for import into n8n. This workflow monitors 7 HR/AI RSS feeds daily at 6 AM CST, classifies each article using Claude Sonnet for keywords/topic/sentiment, and stores signals in the linkedin_engine.research_signals table via Supabase REST API.

Purpose: This is the primary research intake for the LinkedIn Content Engine. Without daily signal collection, the downstream scoring and content generation workflows have nothing to work with.

Output: A complete n8n workflow JSON file and README documentation.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/linkedin-content-engine/ROADMAP.md
@.planning/linkedin-content-engine/REQUIREMENTS.md
@.planning/linkedin-content-engine/STATE.md
@.planning/linkedin-content-engine/HANDOFF.md
@.planning/linkedin-content-engine/PROMPT.md
@n8n-workflows/branch-c-scheduler.json (schedule trigger + kebab-case ID pattern)
@n8n-workflows/waterfall-enrichment.json (HTTP Request + httpHeaderAuth credential pattern)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build WF1 Daily RSS Monitor workflow JSON</name>
  <files>n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json</files>
  <action>
Create the directory `n8n-workflows/linkedin-engine/` if it does not exist. Then create the complete n8n workflow JSON file with the following node layout:

### Schedule Trigger
- Node ID: `schedule-daily-6am-cst`
- Type: `n8n-nodes-base.scheduleTrigger`, typeVersion 1.2
- Cron: Daily at 6:00 AM CST (12:00 UTC). Use the `cron` rule with expression `0 12 * * *`
- Position: [0, 400]

### RSS Feed Read Nodes (7 feeds, parallel from trigger)
All use type `n8n-nodes-base.rssFeedRead`, typeVersion 1.2. Each has `"options": {}`.

| # | Node ID | Name | URL | Position |
|---|---------|------|-----|----------|
| 1 | `rss-shrm` | RSS: SHRM | `https://www.shrm.org/rss/pages/custom-rss.aspx` | [300, 0] |
| 2 | `rss-hr-dive` | RSS: HR Dive | `https://www.hrdive.com/feeds/news/` | [300, 150] |
| 3 | `rss-eeoc` | RSS: EEOC Press | `https://www.eeoc.gov/newsroom/rss` | [300, 300] |
| 4 | `rss-dol` | RSS: DOL News | `https://www.dol.gov/rss/releases.xml` | [300, 450] |
| 5 | `rss-littler` | RSS: Littler Mendelson | `https://www.littler.com/rss.xml` | [300, 600] |
| 6 | `rss-jackson-lewis` | RSS: Jackson Lewis | `https://www.jacksonlewis.com/feed` | [300, 750] |
| 7 | `rss-fisher-phillips` | RSS: Fisher Phillips | `https://www.fisherphillips.com/rss` | [300, 900] |

**Important note on RSS URLs:** These are best-guess URLs based on known blog structures. Some may need adjustment after testing. The RSS Read node will surface errors for invalid URLs via the error handling path, so they can be corrected without workflow redesign.

### Merge Node
- Node ID: `merge-all-feeds`
- Name: `Merge All Feeds`
- Type: `n8n-nodes-base.merge`, typeVersion 3
- Mode: `append` (combine all items from all feeds into one stream)
- Position: [600, 400]
- Connect ALL 7 RSS nodes to this merge node. The merge node in append mode with n8n v3 accepts multiple inputs.

**IMPORTANT:** n8n's Merge node (typeVersion 3) only accepts 2 inputs by default. To merge 7 feeds, use a Code node instead:

### Alternative: Code node to merge feeds
- Node ID: `merge-all-feeds`
- Name: `Merge All Feeds`
- Type: `n8n-nodes-base.code`, typeVersion 2
- Position: [600, 400]
- jsCode:
```javascript
// Collect all items from all inputs
const allItems = [];
for (let i = 0; i < $input.all().length; i++) {
  allItems.push($input.all()[i]);
}
return allItems;
```

Actually, the BEST approach for merging 7 RSS feeds in n8n is to chain them. Use this pattern instead:

### Feed Processing Pattern (Sequential with Append)
Instead of a merge node, connect the 7 RSS feeds through a chain of append operations. However, the SIMPLEST working pattern in n8n for this is:

**Use a single Code node that reads all 7 feeds and merges them:**

- Node ID: `fetch-all-rss-feeds`
- Name: `Fetch & Merge All RSS Feeds`
- Type: `n8n-nodes-base.code`, typeVersion 2
- Position: [300, 400]
- jsCode: (see below)

**REVISED ARCHITECTURE — Simplest approach that works:**

Instead of 7 separate RSS Read nodes + merge complexity, use ONE Code node that fetches all feeds. However, n8n Code nodes cannot make HTTP requests directly. So the correct architecture is:

**Final architecture: 7 RSS nodes → 7 Set nodes (tag source) → Code node (merge all)**

Each RSS node outputs to a Set node that tags the source, then all flow into a single Code node.

**ACTUALLY — use this proven pattern:** Connect each RSS node to its own Set node that adds source metadata, then connect ALL Set nodes to the SAME next node (Claude classification). n8n handles multiple inputs to a single node by appending items automatically.

### FINAL NODE LAYOUT:

**Layer 1: Trigger**
- `schedule-daily-6am-cst` — Schedule Trigger at [0, 400]

**Layer 2: RSS Reads (all connected from trigger)**
7 RSS Feed Read nodes as listed above. All triggered by the schedule node.

**Layer 3: Tag Source (one per RSS feed)**
Each is a Set node (typeVersion 3.4) that adds a `source` field.

| # | Node ID | Name | Sets `source` to | Position |
|---|---------|------|------------------|----------|
| 1 | `tag-shrm` | Tag: SHRM | `shrm` | [550, 0] |
| 2 | `tag-hr-dive` | Tag: HR Dive | `hr_dive` | [550, 150] |
| 3 | `tag-eeoc` | Tag: EEOC | `eeoc` | [550, 300] |
| 4 | `tag-dol` | Tag: DOL | `dol` | [550, 450] |
| 5 | `tag-littler` | Tag: Littler | `littler` | [550, 600] |
| 6 | `tag-jackson-lewis` | Tag: Jackson Lewis | `jackson_lewis` | [550, 750] |
| 7 | `tag-fisher-phillips` | Tag: Fisher Phillips | `fisher_phillips` | [550, 900] |

Each Set node config:
```json
{
  "mode": "raw",
  "jsonOutput": "={\n  \"source\": \"shrm\",\n  \"source_url\": \"{{ $json.link || $json.url || '' }}\",\n  \"title\": \"{{ $json.title || '' }}\",\n  \"body_text\": \"{{ ($json.content || $json.description || $json['content:encoded'] || '').substring(0, 5000) }}\",\n  \"author\": \"{{ $json.creator || $json.author || '' }}\",\n  \"pub_date\": \"{{ $json.pubDate || $json.isoDate || '' }}\"\n}",
  "options": {}
}
```
Change the `source` value for each feed accordingly.

**Layer 4: Deduplicate** (check if signal already exists)
- Node ID: `check-existing-signals`
- Name: `Check Existing Signals`
- Type: `n8n-nodes-base.httpRequest`, typeVersion 4.2
- Position: [800, 400]
- Method: GET
- URL: `=https://htmnsoqkwtfshavqxlrm.supabase.co/rest/v1/research_signals?source_url=eq.{{ encodeURIComponent($json.source_url) }}&select=id&limit=1`
- Authentication: `genericCredentialType`, genericAuthType: `httpHeaderAuth`
- Credentials: `{ "httpHeaderAuth": { "id": "Dy6aCSbL5Tup4TnE", "name": "Supabase REST" } }`
- Headers: send custom header `Prefer` = `return=minimal`
- onError: `continueRegularOutput`
- Connect ALL 7 tag nodes to this single node (n8n appends items automatically)

**Layer 5: Filter New Only**
- Node ID: `filter-new-signals`
- Name: `Filter New Signals`
- Type: `n8n-nodes-base.if`, typeVersion 2
- Position: [1050, 400]
- Condition: Check if the GET returned empty array (no existing record)
- Left value: `={{ $json.length || 0 }}`
- Operator: `number.equals`
- Right value: `0`

**NOTE on dedup approach:** The simpler approach is to skip dedup for now and rely on the database having a unique constraint or just accepting occasional duplicates. RSS items don't change URLs, so a daily run will mostly see the same items. The better approach: use a Code node to filter items from the last 48 hours only (by pubDate), which naturally limits duplicates.

**REVISED Layer 4: Filter Recent Items Only (replace dedup)**
- Node ID: `filter-recent-items`
- Name: `Filter Last 48 Hours`
- Type: `n8n-nodes-base.code`, typeVersion 2
- Position: [800, 400]
- jsCode:
```javascript
const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
const items = $input.all();
const recent = items.filter(item => {
  const pubDate = new Date(item.json.pub_date);
  return pubDate > cutoff;
});
return recent.length > 0 ? recent : [{ json: { _empty: true } }];
```

**Layer 5: Skip if Empty**
- Node ID: `has-new-items`
- Name: `Has New Items?`
- Type: `n8n-nodes-base.if`, typeVersion 2
- Position: [1050, 400]
- Condition: `={{ $json._empty }}` is not true

**Layer 6: Split In Batches (process one at a time for Claude API)**
- Node ID: `process-one-at-a-time`
- Name: `Process One at a Time`
- Type: `n8n-nodes-base.splitInBatches`, typeVersion 3
- Position: [1300, 300]
- batchSize: 1

**Layer 7: Claude Classification**
- Node ID: `classify-with-claude`
- Name: `Classify with Claude`
- Type: `n8n-nodes-base.httpRequest`, typeVersion 4.2
- Position: [1550, 300]
- Method: POST
- URL: `https://api.anthropic.com/v1/messages`
- Authentication: `genericCredentialType`, genericAuthType: `httpHeaderAuth`
- Credentials: `{ "httpHeaderAuth": { "id": "anthropic-api", "name": "Anthropic API" } }`
- Send Headers: Yes
  - `anthropic-version`: `2023-06-01`
  - `content-type`: `application/json`
- Send Body: Yes, JSON:
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 500,
  "messages": [
    {
      "role": "user",
      "content": "Analyze this HR/AI news article and return ONLY valid JSON (no markdown, no code fences).\n\nTitle: {{ $json.title }}\nBody: {{ $json.body_text.substring(0, 3000) }}\nSource: {{ $json.source }}\n\nReturn this exact JSON structure:\n{\n  \"keywords\": [\"keyword1\", \"keyword2\", \"keyword3\"],\n  \"topic_category\": \"one of: ai_compliance, ai_hiring, surveillance, employment_law, hr_tech, legacy_pivot, build_in_public\",\n  \"sentiment\": \"one of: positive, negative, neutral, concerned, confused\"\n}\n\nRules:\n- keywords: 3-7 specific terms from the article (not generic words)\n- topic_category: pick the BEST match from the list. If about AI regulation/rules = ai_compliance. If about AI in recruitment = ai_hiring. If about employee monitoring = surveillance. If about labor law/EEOC/DOL = employment_law. If about HR software/tools = hr_tech. Default to employment_law if unclear.\n- sentiment: overall tone of the article toward its subject"
    }
  ]
}
```
- Response: Full response (need to parse `content[0].text`)
- onError: `continueRegularOutput`
- Add Wait Before: Consider a 1-second wait node before this to avoid rate limiting. Add a Wait node:

**Layer 6.5: Rate Limit Wait**
- Node ID: `rate-limit-wait`
- Name: `Wait 1s (Rate Limit)`
- Type: `n8n-nodes-base.wait`, typeVersion 1.1
- Position: [1400, 300]
- Resume: `timeInterval`
- Amount: 1
- Unit: `seconds`

**Layer 8: Parse Claude Response**
- Node ID: `parse-classification`
- Name: `Parse Claude Response`
- Type: `n8n-nodes-base.code`, typeVersion 2
- Position: [1800, 300]
- jsCode:
```javascript
const item = $input.first().json;

// Get the original item data from the batch
const originalItem = $('Process One at a Time').first().json;

// Parse Claude's response
let classification;
try {
  const responseText = item.content?.[0]?.text || '{}';
  // Strip any markdown code fences if present
  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  classification = JSON.parse(cleaned);
} catch (e) {
  classification = {
    keywords: [],
    topic_category: 'employment_law',
    sentiment: 'neutral'
  };
}

// Validate topic_category
const validCategories = ['ai_compliance', 'ai_hiring', 'surveillance', 'employment_law', 'hr_tech', 'legacy_pivot', 'build_in_public'];
if (!validCategories.includes(classification.topic_category)) {
  classification.topic_category = 'employment_law';
}

// Validate sentiment
const validSentiments = ['positive', 'negative', 'neutral', 'concerned', 'confused'];
if (!validSentiments.includes(classification.sentiment)) {
  classification.sentiment = 'neutral';
}

// Calculate signal_week (Monday of current week)
const now = new Date();
const dayOfWeek = now.getDay();
const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
const monday = new Date(now.setDate(diff));
const signalWeek = monday.toISOString().split('T')[0];

return [{
  json: {
    source: originalItem.source,
    source_url: originalItem.source_url,
    title: originalItem.title,
    body_text: originalItem.body_text,
    author: originalItem.author,
    keywords: classification.keywords || [],
    topic_category: classification.topic_category,
    sentiment: classification.sentiment,
    signal_week: signalWeek,
    platform_engagement: {},
    processed: false
  }
}];
```

**Layer 9: Insert into Supabase**
- Node ID: `insert-research-signal`
- Name: `Insert Research Signal`
- Type: `n8n-nodes-base.httpRequest`, typeVersion 4.2
- Position: [2050, 300]
- Method: POST
- URL: `https://htmnsoqkwtfshavqxlrm.supabase.co/rest/v1/research_signals`
- Authentication: `genericCredentialType`, genericAuthType: `httpHeaderAuth`
- Credentials: `{ "httpHeaderAuth": { "id": "Dy6aCSbL5Tup4TnE", "name": "Supabase REST" } }`
- Headers:
  - `Content-Type`: `application/json`
  - `Prefer`: `return=representation`
- Send Body: Yes, JSON:
```json
{
  "source": "{{ $json.source }}",
  "source_url": "{{ $json.source_url }}",
  "title": "{{ $json.title }}",
  "body_text": "{{ $json.body_text }}",
  "author": "{{ $json.author }}",
  "keywords": {{ JSON.stringify($json.keywords) }},
  "topic_category": "{{ $json.topic_category }}",
  "sentiment": "{{ $json.sentiment }}",
  "signal_week": "{{ $json.signal_week }}",
  "platform_engagement": {},
  "processed": false
}
```
- onError: `continueRegularOutput`

**Layer 10: Loop back to batch**
Connect `insert-research-signal` back to `process-one-at-a-time` (the SplitInBatches node loops automatically).

**Layer 11: Log Workflow Run**
After the batch loop completes (second output of SplitInBatches = "done"):
- Node ID: `log-workflow-run`
- Name: `Log Workflow Run`
- Type: `n8n-nodes-base.httpRequest`, typeVersion 4.2
- Position: [2050, 500]
- Method: POST
- URL: `https://htmnsoqkwtfshavqxlrm.supabase.co/rest/v1/workflow_runs`
- Authentication: `genericCredentialType`, genericAuthType: `httpHeaderAuth`
- Credentials: `{ "httpHeaderAuth": { "id": "Dy6aCSbL5Tup4TnE", "name": "Supabase REST" } }`
- Send Body: Yes, JSON:
```json
{
  "workflow_name": "wf1-daily-rss-monitor",
  "status": "completed",
  "items_processed": {{ $('Process One at a Time').first().json._itemCount || 0 }},
  "metadata": { "sources": ["shrm", "hr_dive", "eeoc", "dol", "littler", "jackson_lewis", "fisher_phillips"] }
}
```

**Error Handling Path (Canary Pattern):**
- Node ID: `error-trigger`
- Name: `On Error`
- Type: `n8n-nodes-base.errorTrigger`, typeVersion 1
- Position: [0, 800]

- Node ID: `log-error-to-supabase`
- Name: `Log Error to Supabase`
- Type: `n8n-nodes-base.httpRequest`, typeVersion 4.2
- Position: [300, 800]
- Method: POST
- URL: `https://htmnsoqkwtfshavqxlrm.supabase.co/rest/v1/workflow_errors`
- Authentication: `genericCredentialType`, genericAuthType: `httpHeaderAuth`
- Credentials: `{ "httpHeaderAuth": { "id": "Dy6aCSbL5Tup4TnE", "name": "Supabase REST" } }`
- Send Body: Yes, JSON:
```json
{
  "workflow_name": "wf1-daily-rss-monitor",
  "error_message": "={{ $json.message || 'Unknown error' }}",
  "error_node": "={{ $json.node?.name || 'unknown' }}",
  "execution_id": "={{ $json.execution?.id || '' }}",
  "timestamp": "={{ $now.toISO() }}"
}
```

**NOTE:** The `workflow_errors` table must exist. If it does not exist in the public schema, the executor should check for it and create it if needed (a simple table with id, workflow_name, error_message, error_node, execution_id, timestamp columns).

### Connections Array

Wire all nodes as follows:
1. `schedule-daily-6am-cst` → all 7 RSS nodes
2. Each RSS node → its corresponding Tag node
3. All 7 Tag nodes → `filter-recent-items`
4. `filter-recent-items` → `has-new-items`
5. `has-new-items` (true) → `process-one-at-a-time`
6. `process-one-at-a-time` (first output) → `rate-limit-wait`
7. `rate-limit-wait` → `classify-with-claude`
8. `classify-with-claude` → `parse-classification`
9. `parse-classification` → `insert-research-signal`
10. `insert-research-signal` → `process-one-at-a-time` (loop back)
11. `process-one-at-a-time` (second/done output) → `log-workflow-run`
12. `error-trigger` → `log-error-to-supabase`

### Workflow Settings
```json
{
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner"
  },
  "tags": [
    { "name": "linkedin-content-engine" }
  ]
}
```

### Supabase Project URL
The Supabase REST base URL is: `https://htmnsoqkwtfshavqxlrm.supabase.co`
(This is the business-os-production project. Verify by checking `.env.local` or `supabase/config.toml` if this URL looks wrong.)

### What to AVOID and WHY
- DO NOT use n8n-nodes-base.postgres or n8n-nodes-base.supabase nodes — they have known bugs with connection pooling in n8n cloud/self-hosted
- DO NOT use UUID node IDs like `70d502a7-a869-...` — use kebab-case descriptive strings for readability
- DO NOT hardcode API keys in the workflow JSON — use credential references
- DO NOT send more than ~3000 chars to Claude per item — truncate body_text to avoid token waste
  </action>
  <verify>
1. File exists at `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json`
2. JSON is valid: `cat n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json | python3 -m json.tool > /dev/null && echo "Valid JSON"`
3. Contains all required node types: scheduleTrigger, rssFeedRead (7x), set (7x), code, splitInBatches, httpRequest (Claude + Supabase), wait, if, errorTrigger
4. All node IDs are kebab-case strings (no UUIDs)
5. All httpRequest nodes use `genericCredentialType` + `httpHeaderAuth`
6. Credential ID `Dy6aCSbL5Tup4TnE` appears for all Supabase requests
7. Credential ID `anthropic-api` appears for Claude request
8. Connections array wires all nodes as specified
  </verify>
  <done>
A valid n8n workflow JSON file exists that can be imported into n8n via Settings > Import Workflow. The workflow contains: schedule trigger (6 AM CST), 7 RSS feed readers, source tagging, 48-hour recency filter, Claude classification via Anthropic API, Supabase REST insert to research_signals, workflow run logging, and canary error handling.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create README documentation and register n8n-brain pattern</name>
  <files>business-os/workflows/README-wf1-daily-rss-monitor.md</files>
  <action>
Create the README following IAML Business OS documentation standards (CEO Summary at top).

```markdown
# WF1: Daily RSS Monitor

> **CEO Summary:** Automatically scans 7 HR and employment law news sources every morning at 6 AM and stores classified signals in the database so the content engine knows what to write about.

## Overview

| Field | Value |
|-------|-------|
| **Workflow** | WF1 — Daily RSS Monitor |
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
  ├── RSS: SHRM → Tag: SHRM ──────────┐
  ├── RSS: HR Dive → Tag: HR Dive ─────┤
  ├── RSS: EEOC → Tag: EEOC ──────────┤
  ├── RSS: DOL → Tag: DOL ────────────┼→ Filter Last 48h → Has Items? → Split Batches
  ├── RSS: Littler → Tag: Littler ─────┤       ↓ (loop)
  ├── RSS: Jackson Lewis → Tag: JL ────┤   Wait 1s → Claude Classify → Parse → Insert Signal
  └── RSS: Fisher Phillips → Tag: FP ──┘       ↓ (done)
                                            Log Workflow Run

Error Trigger → Log Error to Supabase (canary)
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
SELECT * FROM workflow_errors
WHERE workflow_name = 'wf1-daily-rss-monitor'
ORDER BY timestamp DESC LIMIT 10;
```

## Import Instructions

1. Open n8n at `https://n8n.realtyamp.ai`
2. Go to Settings → Import from File
3. Select `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json`
4. Verify credential mappings (Supabase REST + Anthropic API)
5. Activate the workflow
```

Then register the pattern in n8n-brain by calling the `store_pattern` MCP tool with:
- name: `wf1-daily-rss-monitor`
- description: `Daily RSS Monitor for LinkedIn Content Engine. Reads 7 HR/AI RSS feeds at 6 AM CST, classifies articles with Claude Sonnet (keywords, topic_category, sentiment), and stores signals in linkedin_engine.research_signals via Supabase REST API. Uses canary error handling pattern.`
- pattern_type: `workflow`
- tags: `["linkedin-content-engine", "rss", "research", "claude-classification"]`
- configuration: Include key node types, credential IDs, RSS URLs, and Supabase table target

Also update `business-os/workflows/README.md` (the central workflow index) if it exists — add an entry for WF1 under a new "LinkedIn Content Engine" section.
  </action>
  <verify>
1. `business-os/workflows/README-wf1-daily-rss-monitor.md` exists and starts with CEO Summary
2. n8n-brain `store_pattern` was called successfully (check output)
3. If `business-os/workflows/README.md` exists, it now includes a LinkedIn Content Engine section with WF1
  </verify>
  <done>
README documentation exists with CEO summary, node map, source list, credential references, and import instructions. Pattern is registered in n8n-brain for future reuse.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Complete WF1 Daily RSS Monitor workflow JSON and README documentation. The workflow is ready to import into n8n.
  </what-built>
  <how-to-verify>
1. Review the workflow JSON at `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json` — confirm the node layout makes sense
2. Import into n8n at https://n8n.realtyamp.ai (Settings → Import from File)
3. Check that credentials map correctly (Supabase REST = `Dy6aCSbL5Tup4TnE`, Claude = `anthropic-api`)
4. Do a manual test execution (click "Test Workflow" in n8n)
5. Verify RSS feeds return data (some URLs may need adjustment — check which ones fail)
6. Verify at least one signal lands in `linkedin_engine.research_signals`:
   ```sql
   SELECT * FROM linkedin_engine.research_signals ORDER BY collected_date DESC LIMIT 5;
   ```
7. Confirm `signal_week` is set to the Monday of the current week
8. Activate the workflow for daily 6 AM CST execution
  </how-to-verify>
  <resume-signal>Type "approved" if workflow runs successfully, or describe any RSS feed URL issues or errors encountered</resume-signal>
</task>

</tasks>

<verification>
Phase 2 is complete when:
- WF1 workflow JSON exists and is valid
- Workflow imported and active in n8n
- At least one successful execution with signals stored
- README documentation exists with CEO summary
- Pattern registered in n8n-brain
- All 7 RSS sources attempted (some may need URL fixes — that's expected)
</verification>

<success_criteria>
- `research_signals` table has rows from at least 3+ sources after first run
- Each signal has valid `topic_category` (from the 7 allowed values)
- Each signal has valid `sentiment` (from the 5 allowed values)
- Each signal has `keywords` array with 3-7 items
- `signal_week` is a Monday date
- `workflow_runs` table has a "completed" entry for `wf1-daily-rss-monitor`
- No unhandled errors (any errors logged to `workflow_errors`)
</success_criteria>

<output>
After completion, create `.planning/linkedin-content-engine/phases/02/02-01-SUMMARY.md`
</output>
