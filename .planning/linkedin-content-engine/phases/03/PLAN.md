---
phase: 03-weekly-deep-research
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json
  - business-os/workflows/README-wf2-weekly-deep-research.md
autonomous: false
user_setup:
  - service: apify
    why: "Reddit and LinkedIn post scraping via Apify actors"
    env_vars:
      - name: APIFY_API_TOKEN
        source: "Apify Console -> Settings -> Integrations -> API tokens (starts with apify_api_KN1g...)"
    dashboard_config:
      - task: "Verify Apify Starter plan is active ($49/mo) with enough compute units"
        location: "Apify Console -> Billing"

must_haves:
  truths:
    - "WF2 workflow runs on schedule every Sunday at 8 PM CST"
    - "Reddit posts from 7 subreddits with 50+ upvotes are scraped via Apify"
    - "LinkedIn top posts in HR/AI space are scraped via Apify"
    - "Each signal is de-duplicated against existing source_url entries before insert"
    - "Platform engagement metrics (upvotes, comments, likes, shares) stored as JSONB"
    - "Claude Sonnet extracts keywords, topic_category, and sentiment for each signal"
    - "Errors are caught and posted to workflow_errors table via canary pattern"
  artifacts:
    - path: "n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json"
      provides: "Complete n8n workflow JSON importable into n8n"
      contains: "scheduleTrigger"
    - path: "business-os/workflows/README-wf2-weekly-deep-research.md"
      provides: "Workflow documentation with CEO summary"
      contains: "CEO Summary"
  key_links:
    - from: "wf2-weekly-deep-research.json (schedule-trigger)"
      to: "Apify API (run actor)"
      via: "HTTP Request node POST to https://api.apify.com/v2/acts/{actorId}/runs"
      pattern: "api\\.apify\\.com.*acts.*runs"
    - from: "wf2-weekly-deep-research.json (get-dataset)"
      to: "Apify API (dataset items)"
      via: "HTTP Request node GET to https://api.apify.com/v2/datasets/{datasetId}/items"
      pattern: "api\\.apify\\.com.*datasets.*items"
    - from: "wf2-weekly-deep-research.json (dedup-check)"
      to: "Supabase REST API (research_signals)"
      via: "HTTP Request node GET with source_url filter"
      pattern: "rest/v1/research_signals.*source_url"
    - from: "wf2-weekly-deep-research.json (claude-classify)"
      to: "Anthropic API (claude-sonnet)"
      via: "HTTP Request node POST to https://api.anthropic.com/v1/messages"
      pattern: "api\\.anthropic\\.com.*messages"
    - from: "wf2-weekly-deep-research.json (insert-signals)"
      to: "Supabase REST API (research_signals)"
      via: "HTTP Request node POST to insert classified signals"
      pattern: "rest/v1/research_signals"
---

<objective>
Build WF2 (Weekly Deep Research) as a complete n8n workflow JSON file that scrapes Reddit (7 subreddits) and LinkedIn (HR/AI top posts) via Apify, classifies each signal with Claude Sonnet, de-duplicates against existing entries, and stores results in the `linkedin_engine.research_signals` table via Supabase REST API.

Purpose: This workflow feeds the content engine's "deep research" pipeline with trending HR/AI discussions from Reddit and LinkedIn every week, providing raw material for topic scoring in Phase 4.

Output: One importable n8n workflow JSON file + README documentation.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/linkedin-content-engine/PROJECT.md
@.planning/linkedin-content-engine/ROADMAP.md
@.planning/linkedin-content-engine/STATE.md
@.planning/linkedin-content-engine/PROMPT.md
@.planning/linkedin-content-engine/HANDOFF.md
@WEB-INTEL-WORKFLOWS-REFERENCE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build WF2 n8n workflow JSON</name>
  <files>n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json</files>
  <action>

Create the directory `n8n-workflows/linkedin-engine/` if it does not exist.

Build a complete n8n workflow JSON file with the following node layout. All node IDs must be kebab-case descriptive strings. Node positions must be laid out left-to-right with ~200px horizontal spacing and parallel branches vertically offset by ~300px.

## Schedule Trigger

```
Node: schedule-trigger
Type: n8n-nodes-base.scheduleTrigger (typeVersion 1.2)
Position: [0, 400]
Config: Cron expression for Sunday 8 PM CST (Central Standard Time = UTC-6, so 2 AM Monday UTC)
  - cron expression: "0 2 * * 1" (2 AM UTC every Monday = 8 PM CST every Sunday)
```

## Workflow Run Logger (Start)

```
Node: log-workflow-start
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [200, 400]
Config:
  - Method: POST
  - URL: https://{{$env.SUPABASE_URL || 'gkwmnaxzkhionetmdpvh.supabase.co'}}/rest/v1/linkedin_engine.workflow_runs
  - Authentication: httpHeaderAuth credential ID "Dy6aCSbL5Tup4TnE"
  - Headers:
    - apikey: (sent by credential)
    - Content-Type: application/json
    - Prefer: return=representation
  - Body (JSON):
    {
      "workflow_name": "wf2-weekly-deep-research",
      "n8n_execution_id": "{{$execution.id}}",
      "status": "running",
      "metadata": {"started_by": "schedule"}
    }
```

## Branch: Reddit Scraping (Top Branch)

### Set Reddit Config

```
Node: set-reddit-config
Type: n8n-nodes-base.set (typeVersion 3.4)
Position: [400, 200]
Config: Set JSON output with array of 7 subreddit search configs:
  {
    "subreddits": [
      {"name": "humanresources", "searchTerms": ["AI", "automation", "compliance", "technology"]},
      {"name": "AskHR", "searchTerms": ["AI", "automation", "technology", "chatbot"]},
      {"name": "antiwork", "searchTerms": ["AI", "automation", "surveillance", "monitoring"]},
      {"name": "recruiting", "searchTerms": ["AI", "automation", "ATS", "screening"]},
      {"name": "employmentlaw", "searchTerms": ["AI", "automation", "compliance", "discrimination"]},
      {"name": "artificial", "searchTerms": ["HR", "hiring", "employment", "workplace"]},
      {"name": "MachineLearning", "searchTerms": ["HR", "hiring", "employment", "workforce"]}
    ],
    "apify_actor_id": "trudax/reddit-scraper-lite"
  }
```

**IMPORTANT about Apify Reddit actor selection:** Use `trudax/reddit-scraper-lite` as the primary choice. If this actor is unavailable or returns errors at runtime, alternatives to try (in order): `apify/reddit-scraper`, `okhlopkov/reddit-scraper`. The executor should verify the actor exists in Apify Store before finalizing. Search `https://apify.com/store?q=reddit+scraper` and pick the most popular/maintained Reddit scraper that accepts subreddit names and returns post title, body, URL, author, upvotes, and comment count.

### Run Reddit Apify Actor

```
Node: run-reddit-actor
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [600, 200]
Config:
  - Method: POST
  - URL: https://api.apify.com/v2/acts/{{$json.apify_actor_id}}/runs?token={{$env.APIFY_API_TOKEN || 'apify_api_KN1g...'}}
  - Headers: Content-Type: application/json
  - Body (JSON): Build input dynamically based on the actor's expected input schema. Typical Reddit scraper input:
    {
      "startUrls": [
        {"url": "https://www.reddit.com/r/humanresources/top/?t=week"},
        {"url": "https://www.reddit.com/r/AskHR/top/?t=week"},
        {"url": "https://www.reddit.com/r/antiwork/top/?t=week"},
        {"url": "https://www.reddit.com/r/recruiting/top/?t=week"},
        {"url": "https://www.reddit.com/r/employmentlaw/top/?t=week"},
        {"url": "https://www.reddit.com/r/artificial/top/?t=week"},
        {"url": "https://www.reddit.com/r/MachineLearning/top/?t=week"}
      ],
      "maxItems": 200,
      "sort": "top",
      "time": "week",
      "skipComments": true
    }
  - NOTE: The exact input schema varies by actor. The executor MUST check the chosen actor's input schema page on Apify and adjust field names accordingly. Common variations:
    - Some actors use "subreddits" array instead of "startUrls"
    - Some use "maxPostCount" instead of "maxItems"
    - Some use "type": "posts" to filter out comments
  - Timeout: 120000ms (actor runs can take time)
```

### Wait for Reddit Actor

```
Node: wait-reddit-actor
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [800, 200]
Config:
  - Method: GET
  - URL: https://api.apify.com/v2/actor-runs/{{$json.data.id}}?token={{$env.APIFY_API_TOKEN || 'apify_api_KN1g...'}}
  - This node must be in a LOOP pattern. Use the following approach:
    1. After run-reddit-actor, extract `$json.data.id` (run ID) and `$json.data.defaultDatasetId` (dataset ID)
    2. Poll run status every 15 seconds using a Wait node + HTTP Request in a loop
    3. Exit loop when `$json.data.status === 'SUCCEEDED'` or `$json.data.status === 'FAILED'`

  IMPLEMENTATION: Instead of a true loop (complex in n8n), use a simpler approach:
  - Insert a Wait node (n8n-nodes-base.wait, typeVersion 1.1) set to 60 seconds
  - Then a single GET to check status
  - If not SUCCEEDED, wait another 60 seconds and check again (use If node + loop-back connection)
  - OR: Use the synchronous run endpoint instead: POST to https://api.apify.com/v2/acts/{actorId}/run-sync-get-dataset-items?token={token} with timeout of 300 seconds (5 min). This waits for completion and returns dataset items directly. THIS IS THE PREFERRED APPROACH for simplicity.

  PREFERRED APPROACH - Use synchronous endpoint:
  - Change run-reddit-actor URL to: https://api.apify.com/v2/acts/{{$json.apify_actor_id}}/run-sync-get-dataset-items?token={{$env.APIFY_API_TOKEN}}&timeout=300
  - This eliminates the need for polling entirely
  - Response is the dataset items array directly
  - Set HTTP Request timeout to 300000ms (5 min)
  - If this node is used, SKIP the wait-reddit-actor and get-reddit-dataset nodes
```

### Get Reddit Dataset Items (only if using async approach)

```
Node: get-reddit-dataset
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [1000, 200]
Config:
  - Method: GET
  - URL: https://api.apify.com/v2/datasets/{{$json.data.defaultDatasetId}}/items?token={{$env.APIFY_API_TOKEN}}&limit=500
  - Only needed if NOT using the run-sync-get-dataset-items endpoint
```

### Filter Reddit Posts (50+ upvotes)

```
Node: filter-reddit-upvotes
Type: n8n-nodes-base.code (typeVersion 2)
Position: [1200, 200]
Config: JavaScript code that:
  1. Takes the array of Reddit posts from previous node
  2. Filters to posts with upvotes >= 50
  3. Maps each post to a normalized format:
     {
       "source": "reddit",
       "source_url": post.url || `https://www.reddit.com${post.permalink}`,
       "title": post.title,
       "body_text": (post.selftext || post.body || '').substring(0, 5000),
       "author": post.author || post.username,
       "platform_engagement": {
         "upvotes": post.upVotes || post.ups || post.score,
         "comments": post.numberOfComments || post.numComments || post.num_comments,
         "subreddit": post.subreddit || post.community || post.dataSubreddit
       },
       "collected_date": new Date().toISOString(),
       "signal_week": getMondayOfWeek(new Date())  // Calculate Monday of current week
     }
  4. Returns only posts with valid title and URL
  5. De-duplicate by source_url within the batch itself

  NOTE: Field names from the Apify actor response will vary. The executor MUST inspect the actual response from the chosen Reddit actor and adjust the field mapping. Common field name patterns:
  - trudax/reddit-scraper-lite: title, url, selftext, author, score, num_comments, subreddit
  - apify/reddit-scraper: title, url, body, username, upVotes, numberOfComments, community

  Include a getMondayOfWeek helper function:
  function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }
```

## Branch: LinkedIn Scraping (Bottom Branch)

### Set LinkedIn Config

```
Node: set-linkedin-config
Type: n8n-nodes-base.set (typeVersion 3.4)
Position: [400, 600]
Config: Set JSON output with LinkedIn search configuration:
  {
    "apify_actor_id": "curious_coder/linkedin-post-search-scraper",
    "search_keywords": [
      "HR artificial intelligence",
      "AI hiring compliance",
      "HR technology automation",
      "employment law AI",
      "AI workplace surveillance",
      "CHRO artificial intelligence",
      "HR tech 2026"
    ],
    "max_posts": 50
  }

  IMPORTANT about Apify LinkedIn actor selection: Use `curious_coder/linkedin-post-search-scraper` as primary. If unavailable, alternatives: `apimaestro/linkedin-post-scraper`, `anchor/linkedin-post-scraper`. The executor should verify the actor exists in Apify Store. Search `https://apify.com/store?q=linkedin+post+scraper` and pick the most popular LinkedIn post scraper that accepts keyword searches and returns post text, author, reactions, comments.

  Some LinkedIn actors require a LinkedIn cookie (li_at) for authentication. If the chosen actor requires this:
  - Add a user_setup note about obtaining the li_at cookie from browser DevTools
  - Store it as an environment variable or hardcode in the workflow input
```

### Run LinkedIn Apify Actor

```
Node: run-linkedin-actor
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [600, 600]
Config:
  - Method: POST
  - URL: https://api.apify.com/v2/acts/{{$json.apify_actor_id}}/run-sync-get-dataset-items?token={{$env.APIFY_API_TOKEN}}&timeout=300
  - Headers: Content-Type: application/json
  - Body (JSON): Build input based on actor's expected schema. Typical LinkedIn post scraper input:
    {
      "searchKeywords": {{$json.search_keywords}},
      "maxResults": {{$json.max_posts}},
      "sortBy": "relevance",
      "datePosted": "past-week"
    }
  - NOTE: Input field names vary by actor. Common variations:
    - "keywords" vs "searchKeywords" vs "searchTerms"
    - "limit" vs "maxResults" vs "maxItems"
    - "timeRange" vs "datePosted" vs "publishedAt"
  - Timeout: 300000ms (5 min)
```

### Normalize LinkedIn Posts

```
Node: normalize-linkedin-posts
Type: n8n-nodes-base.code (typeVersion 2)
Position: [800, 600]
Config: JavaScript code that:
  1. Takes LinkedIn post array from previous node
  2. Maps each post to normalized format:
     {
       "source": "linkedin",
       "source_url": post.url || post.postUrl || post.shareUrl,
       "title": (post.text || post.content || '').substring(0, 200),
       "body_text": (post.text || post.content || '').substring(0, 5000),
       "author": post.authorName || post.author?.name || post.profileName,
       "platform_engagement": {
         "likes": post.totalReactionCount || post.likes || post.reactions,
         "comments": post.commentsCount || post.comments || post.numComments,
         "shares": post.repostsCount || post.shares || post.reposts,
         "author_followers": post.authorFollowerCount || post.followerCount
       },
       "collected_date": new Date().toISOString(),
       "signal_week": getMondayOfWeek(new Date())
     }
  3. Filter to posts with meaningful engagement (likes >= 20 or comments >= 5)
  4. De-duplicate by source_url within batch

  NOTE: Field names vary by actor. The executor MUST inspect actual response and adjust mapping.
```

## Merge Branches

```
Node: merge-all-signals
Type: n8n-nodes-base.merge (typeVersion 3)
Position: [1400, 400]
Config:
  - Mode: Append
  - Connect filter-reddit-upvotes output AND normalize-linkedin-posts output to this node
```

## Split Into Batches for Processing

```
Node: split-into-batches
Type: n8n-nodes-base.splitInBatches (typeVersion 3)
Position: [1600, 400]
Config:
  - Batch Size: 5 (process 5 signals at a time to avoid Claude rate limits)
```

## De-duplication Check via Supabase REST

```
Node: dedup-check-supabase
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [1800, 400]
Config:
  - Method: GET
  - URL: https://{{$env.SUPABASE_URL || 'gkwmnaxzkhionetmdpvh.supabase.co'}}/rest/v1/linkedin_engine.research_signals?source_url=eq.{{encodeURIComponent($json.source_url)}}&select=id
  - Authentication: httpHeaderAuth credential ID "Dy6aCSbL5Tup4TnE"
  - Headers:
    - apikey: (sent by credential)
  - Response: If array is empty -> signal is new. If array has items -> signal already exists (skip it).

  NOTE on Supabase REST API schema access: For tables in custom schemas (linkedin_engine), the URL may need to be:
  - Option A: Set "Accept-Profile" header to "linkedin_engine" and use /rest/v1/research_signals
  - Option B: Use /rest/v1/linkedin_engine.research_signals directly (if schema is exposed in Supabase API settings)

  The executor MUST verify which approach works. Check Supabase Dashboard -> Settings -> API -> Schema to ensure "linkedin_engine" is exposed. If not, add it to the exposed schemas list.
```

### If New Signal

```
Node: is-new-signal
Type: n8n-nodes-base.if (typeVersion 2)
Position: [2000, 400]
Config:
  - Condition: $json (response from dedup check) is an empty array
  - True path: proceed to Claude classification
  - False path: skip (signal already exists)

  Use expression: {{ $json.length === 0 }} or check if response array is empty.

  NOTE: The dedup check returns the Supabase response. If the GET returned an empty array [], the signal is new. If it returned [{id: "..."}], it already exists.
  The actual response from the HTTP Request node will be in a specific format — the executor should test the dedup endpoint and inspect the response shape to wire the If condition correctly.
```

## Claude Classification

```
Node: claude-classify-signal
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [2200, 300]
Config:
  - Method: POST
  - URL: https://api.anthropic.com/v1/messages
  - Authentication: httpHeaderAuth credential ID "anthropic-api"
  - Headers:
    - x-api-key: (sent by credential)
    - anthropic-version: 2023-06-01
    - Content-Type: application/json
  - Body (JSON):
    {
      "model": "claude-sonnet-4-20250514",
      "max_tokens": 500,
      "messages": [
        {
          "role": "user",
          "content": "Analyze this social media post and return a JSON object with exactly these fields:\n\n1. keywords: array of 3-7 relevant keywords (lowercase)\n2. topic_category: exactly one of: ai_compliance, ai_hiring, surveillance, employment_law, hr_tech, legacy_pivot, build_in_public\n3. sentiment: exactly one of: positive, negative, neutral, concerned, confused\n\nPost source: {{$json.source}}\nTitle: {{$json.title}}\nBody: {{$json.body_text.substring(0, 2000)}}\n\nReturn ONLY valid JSON, no markdown, no explanation. Example:\n{\"keywords\": [\"ai\", \"hiring\", \"bias\"], \"topic_category\": \"ai_hiring\", \"sentiment\": \"concerned\"}"
        }
      ]
    }
  - Parse response: Extract $json.content[0].text and JSON.parse it to get keywords, topic_category, sentiment
```

### Parse Claude Response

```
Node: parse-claude-response
Type: n8n-nodes-base.code (typeVersion 2)
Position: [2400, 300]
Config: JavaScript code that:
  1. Gets the Claude response text from $json.content[0].text
  2. JSON.parse the response (with try/catch)
  3. Validates topic_category is one of the allowed values
  4. Validates sentiment is one of the allowed values
  5. Merges the classification fields into the signal object from the batch
  6. Returns the enriched signal ready for insert

  Code:
  const items = $input.all();
  const results = [];

  for (const item of items) {
    try {
      const claudeText = item.json.content?.[0]?.text || item.json.content || '{}';
      const classification = JSON.parse(claudeText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      const validCategories = ['ai_compliance', 'ai_hiring', 'surveillance', 'employment_law', 'hr_tech', 'legacy_pivot', 'build_in_public'];
      const validSentiments = ['positive', 'negative', 'neutral', 'concerned', 'confused'];

      // Get the original signal data (passed through from dedup check)
      // NOTE: The executor needs to ensure the original signal fields are available here.
      // This may require using a Merge node to combine the original signal data with the Claude response,
      // or using the $('node-name').item approach to reference data from an earlier node.

      results.push({
        json: {
          ...item.json._originalSignal, // or however the original data is passed through
          keywords: Array.isArray(classification.keywords) ? classification.keywords : [],
          topic_category: validCategories.includes(classification.topic_category) ? classification.topic_category : 'hr_tech',
          sentiment: validSentiments.includes(classification.sentiment) ? classification.sentiment : 'neutral',
          processed: false
        }
      });
    } catch (e) {
      // If Claude response fails to parse, still insert with defaults
      results.push({
        json: {
          ...item.json._originalSignal,
          keywords: [],
          topic_category: 'hr_tech',
          sentiment: 'neutral',
          processed: false
        }
      });
    }
  }

  return results;

  CRITICAL NOTE: The data flow between dedup check -> Claude classify -> parse is tricky.
  The original signal data (source, source_url, title, body_text, author, platform_engagement, etc.)
  needs to be available at the parse step. There are multiple n8n approaches:

  A) Use $('node-name').item.json to reference an earlier node's output (cleanest)
  B) Pass all data through as headers or additional JSON fields in the Claude request
  C) Use a Set node before Claude to stash the original data, then a Merge after Claude

  The executor should pick the approach that works best with the actual node wiring.
```

## Insert Into Supabase

```
Node: insert-signal-supabase
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [2600, 300]
Config:
  - Method: POST
  - URL: https://{{$env.SUPABASE_URL || 'gkwmnaxzkhionetmdpvh.supabase.co'}}/rest/v1/research_signals
  - Authentication: httpHeaderAuth credential ID "Dy6aCSbL5Tup4TnE"
  - Headers:
    - apikey: (sent by credential)
    - Content-Type: application/json
    - Prefer: return=representation
    - Accept-Profile: linkedin_engine (required for custom schema)
    - Content-Profile: linkedin_engine (required for custom schema POST)
  - Body (JSON):
    {
      "source": "={{$json.source}}",
      "source_url": "={{$json.source_url}}",
      "title": "={{$json.title}}",
      "body_text": "={{$json.body_text}}",
      "author": "={{$json.author}}",
      "platform_engagement": ={{JSON.stringify($json.platform_engagement)}},
      "keywords": ={{JSON.stringify($json.keywords)}},
      "topic_category": "={{$json.topic_category}}",
      "sentiment": "={{$json.sentiment}}",
      "collected_date": "={{$json.collected_date}}",
      "signal_week": "={{$json.signal_week}}",
      "processed": false
    }
```

## Loop Back for Next Batch

Wire the insert-signal-supabase output back to split-into-batches "done" input to process the next batch of 5 signals.

## Count Inserted Signals

```
Node: count-inserted
Type: n8n-nodes-base.code (typeVersion 2)
Position: [2800, 400]
Config: Aggregate count of successfully inserted signals for the workflow run log.
  Code:
  const items = $input.all();
  return [{
    json: {
      total_inserted: items.length,
      reddit_count: items.filter(i => i.json.source === 'reddit').length,
      linkedin_count: items.filter(i => i.json.source === 'linkedin').length
    }
  }];

  NOTE: This node should connect after all batches are processed. In n8n, the splitInBatches node
  has a "done" output that fires when all batches complete. Wire the count-inserted node to that output
  OR place it after the loop completes.
```

## Workflow Run Logger (Complete)

```
Node: log-workflow-complete
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [3000, 400]
Config:
  - Method: PATCH
  - URL: https://{{$env.SUPABASE_URL || 'gkwmnaxzkhionetmdpvh.supabase.co'}}/rest/v1/linkedin_engine.workflow_runs?workflow_name=eq.wf2-weekly-deep-research&status=eq.running
  - Authentication: httpHeaderAuth credential ID "Dy6aCSbL5Tup4TnE"
  - Headers:
    - apikey: (sent by credential)
    - Content-Type: application/json
    - Prefer: return=representation
    - Accept-Profile: linkedin_engine
    - Content-Profile: linkedin_engine
  - Body (JSON):
    {
      "status": "completed",
      "completed_at": "={{$now.toISO()}}",
      "items_processed": ={{$json.total_inserted}},
      "metadata": {
        "reddit_signals": ={{$json.reddit_count}},
        "linkedin_signals": ={{$json.linkedin_count}}
      }
    }
```

## Error Handling (Canary Pattern)

```
Node: catch-errors
Type: n8n-nodes-base.errorTrigger (typeVersion 1)
Position: [1400, 800]
Config: Catches any uncaught errors in the workflow.

Node: post-error-to-supabase
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [1600, 800]
Config:
  - Method: POST
  - URL: https://{{$env.SUPABASE_URL || 'gkwmnaxzkhionetmdpvh.supabase.co'}}/rest/v1/workflow_errors
  - Authentication: httpHeaderAuth credential ID "Dy6aCSbL5Tup4TnE"
  - Headers:
    - apikey: (sent by credential)
    - Content-Type: application/json
    - Prefer: return=representation
  - Body (JSON):
    {
      "workflow_name": "wf2-weekly-deep-research",
      "error_message": "={{$json.execution?.error?.message || $json.message || 'Unknown error'}}",
      "error_details": ={{JSON.stringify($json)}},
      "n8n_execution_id": "={{$execution.id}}",
      "occurred_at": "={{$now.toISO()}}"
    }

  NOTE: The workflow_errors table may be in the public schema (not linkedin_engine). Check existing
  error handling patterns in other workflows. The canary pattern referenced in PROMPT.md posts to
  the workflow_errors table — verify the table exists and its schema.

Node: log-workflow-failed
Type: n8n-nodes-base.httpRequest (typeVersion 4.2)
Position: [1800, 800]
Config:
  - Method: PATCH
  - URL: Same as log-workflow-complete but with status "failed" and error_message populated
  - Body: { "status": "failed", "completed_at": "={{$now.toISO()}}", "error_message": "={{$json.execution?.error?.message}}" }
```

## Connection Map

```
schedule-trigger -> log-workflow-start -> [SPLIT to two branches]
  Branch 1 (top):  set-reddit-config -> run-reddit-actor -> filter-reddit-upvotes
  Branch 2 (bottom): set-linkedin-config -> run-linkedin-actor -> normalize-linkedin-posts

filter-reddit-upvotes -> merge-all-signals
normalize-linkedin-posts -> merge-all-signals

merge-all-signals -> split-into-batches -> dedup-check-supabase -> is-new-signal
  is-new-signal (true) -> claude-classify-signal -> parse-claude-response -> insert-signal-supabase -> [loop back to split-into-batches]
  is-new-signal (false) -> [loop back to split-into-batches]

[After all batches complete] -> count-inserted -> log-workflow-complete

catch-errors -> post-error-to-supabase -> log-workflow-failed
```

## Workflow Metadata

```json
{
  "name": "LinkedIn Engine: WF2 Weekly Deep Research",
  "tags": [{"name": "linkedin-content-engine"}],
  "settings": {
    "executionTimeout": 600,
    "timezone": "America/Chicago"
  }
}
```

## IMPORTANT EXECUTION NOTES

1. **Apify Actor Verification:** Before writing the final JSON, search the Apify Store to confirm the chosen actors exist and note their exact input schemas. The executor should:
   - Visit https://apify.com/trudax/reddit-scraper-lite (or search alternatives)
   - Visit https://apify.com/curious_coder/linkedin-post-search-scraper (or search alternatives)
   - Read the "Input" tab to get exact field names
   - Adjust the run-reddit-actor and run-linkedin-actor node bodies accordingly

2. **Supabase Schema Exposure:** Verify that "linkedin_engine" schema is exposed in Supabase API settings. If not:
   - Go to Supabase Dashboard -> Settings -> API -> Schema
   - Add "linkedin_engine" to the exposed schemas list
   - Use Accept-Profile and Content-Profile headers in all REST API calls

3. **Data Flow Between Nodes:** The trickiest part is passing original signal data through the dedup + Claude classification chain. The executor should test the data flow in n8n's editor node-by-node to ensure fields are accessible at each step. Consider using $('node-name').item.json.fieldName to reference earlier node outputs.

4. **Synchronous vs Async Apify Runs:** Strongly prefer the synchronous endpoint (run-sync-get-dataset-items) to avoid polling complexity. Set HTTP Request timeout to 300000ms. If the sync endpoint times out (dataset too large), fall back to async (run -> poll -> get items).

5. **Rate Limiting:** The split-into-batches node (batch size 5) with Claude API calls should respect rate limits. If Claude returns 429, add a Wait node (5 seconds) before retry.

6. **The workflow JSON should be valid n8n export format** with proper `nodes`, `connections`, `settings`, and `meta` fields at the top level. Reference the structure of existing workflow files in `n8n-workflows/` for the exact format.

  </action>
  <verify>
  1. `cat n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json | python3 -m json.tool` validates as JSON
  2. JSON contains all required nodes: schedule-trigger, run-reddit-actor, run-linkedin-actor, filter-reddit-upvotes, normalize-linkedin-posts, merge-all-signals, dedup-check-supabase, is-new-signal, claude-classify-signal, parse-claude-response, insert-signal-supabase, catch-errors, post-error-to-supabase
  3. All node IDs are kebab-case strings
  4. Connections map matches the documented flow
  5. Supabase REST API URLs use correct schema prefix or Accept-Profile header
  6. Claude API call uses anthropic-version header and correct model ID
  7. Schedule trigger fires Sunday 8 PM CST (cron: 0 2 * * 1 in UTC)
  </verify>
  <done>
  A valid n8n workflow JSON file exists at `n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json` that:
  - Triggers every Sunday 8 PM CST
  - Scrapes 7 Reddit subreddits via Apify and filters to 50+ upvotes
  - Scrapes LinkedIn HR/AI posts via Apify
  - De-duplicates each signal against existing source_url in research_signals
  - Classifies each new signal with Claude Sonnet (keywords, topic_category, sentiment)
  - Inserts classified signals into linkedin_engine.research_signals via Supabase REST API
  - Logs workflow run start/complete/failed to workflow_runs table
  - Catches and logs errors via canary pattern
  </done>
</task>

<task type="auto">
  <name>Task 2: Create README documentation and register n8n-brain pattern</name>
  <files>business-os/workflows/README-wf2-weekly-deep-research.md</files>
  <action>

Create `business-os/workflows/README-wf2-weekly-deep-research.md` following IAML Business OS documentation standards:

```markdown
# WF2: Weekly Deep Research

> **CEO Summary:** Automated weekly workflow that scrapes Reddit and LinkedIn for trending HR/AI discussions, classifies them with AI, and stores the results as research signals feeding the LinkedIn content engine's topic scoring pipeline.

## Overview

| Field | Value |
|-------|-------|
| **Workflow** | LinkedIn Engine: WF2 Weekly Deep Research |
| **Schedule** | Sunday 8:00 PM CST (weekly) |
| **Sources** | Reddit (7 subreddits), LinkedIn (keyword search) |
| **Output** | `linkedin_engine.research_signals` table |
| **Dependencies** | Apify API, Claude Sonnet, Supabase REST API |
| **Error Handling** | Canary pattern (posts to workflow_errors) |
| **n8n Tags** | linkedin-content-engine |

## What It Does

1. **Scrapes Reddit** — Pulls top posts from 7 subreddits (r/humanresources, r/AskHR, r/antiwork, r/recruiting, r/employmentlaw, r/artificial, r/MachineLearning) via Apify. Filters to posts with 50+ upvotes.

2. **Scrapes LinkedIn** — Searches for top HR/AI posts from the past week via Apify. Filters to posts with meaningful engagement (20+ likes or 5+ comments).

3. **De-duplicates** — Checks each signal's source_url against existing entries in research_signals table. Skips duplicates.

4. **Classifies with AI** — Claude Sonnet extracts keywords, assigns topic_category (ai_compliance, ai_hiring, surveillance, employment_law, hr_tech, legacy_pivot, build_in_public), and determines sentiment.

5. **Stores Results** — Inserts classified signals into `linkedin_engine.research_signals` with platform engagement metrics as JSONB.

## Node Map

[Include simplified node flow diagram]

## Credentials Used

| Credential | ID | Purpose |
|------------|-----|---------|
| Supabase REST | Dy6aCSbL5Tup4TnE | Database reads/writes |
| Anthropic/Claude | anthropic-api | Signal classification |
| Apify | hardcoded token | Reddit + LinkedIn scraping |

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

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Apify actor timeout | Increase HTTP Request timeout to 600s or switch to async polling |
| Claude rate limit (429) | Reduce batch size from 5 to 3 |
| Supabase 404 on schema | Add "linkedin_engine" to exposed schemas in Supabase API settings |
| No Reddit results | Verify Apify actor ID is correct and subreddit URLs are valid |

## Monthly Cost Impact

- Apify Reddit actor: ~$5-10/run (depends on compute units)
- Apify LinkedIn actor: ~$5-15/run (depends on result count)
- Claude Sonnet API: ~$0.10-0.30/run (50-200 classifications)
- **Weekly total: ~$10-25/run, ~$40-100/month**

## File Location

`n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json`
```

Then update `business-os/workflows/README.md` (if it exists) to add WF2 to the workflow index.

Also, register the pattern in n8n-brain by calling the `store_pattern` MCP tool with:
- name: "wf2-weekly-deep-research"
- description: "Weekly workflow scraping Reddit (7 subreddits) and LinkedIn via Apify, classifying with Claude Sonnet, de-duplicating, and storing in research_signals"
- tags: ["linkedin-content-engine", "apify", "reddit", "linkedin", "research"]
- workflow_type: "scheduled"
- trigger: "scheduleTrigger (Sunday 8 PM CST)"
- key_nodes: ["Apify HTTP Request (sync run)", "Claude classification", "Supabase REST dedup + insert", "Canary error handler"]

  </action>
  <verify>
  1. `cat business-os/workflows/README-wf2-weekly-deep-research.md` contains "CEO Summary" line
  2. README covers all 7 subreddits, all 7 topic categories, credentials, troubleshooting
  3. n8n-brain store_pattern called successfully (check MCP tool output)
  </verify>
  <done>
  - README exists at `business-os/workflows/README-wf2-weekly-deep-research.md` with CEO summary, full workflow documentation, and troubleshooting guide
  - n8n-brain pattern registered for WF2
  - Workflow index updated (if README.md index exists)
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
  WF2 Weekly Deep Research workflow JSON and documentation:
  1. n8n workflow JSON at `n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json`
  2. README at `business-os/workflows/README-wf2-weekly-deep-research.md`
  3. n8n-brain pattern registered
  </what-built>
  <how-to-verify>
  1. Import the workflow JSON into n8n:
     - Open n8n at https://n8n.realtyamp.ai
     - Click "Add workflow" -> "Import from file"
     - Select `n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json`
     - Verify all nodes appear and connections are correct

  2. Verify credentials are wired:
     - Each HTTP Request node referencing Supabase should show credential "Dy6aCSbL5Tup4TnE"
     - Claude node should show credential "anthropic-api"
     - Apify nodes should have the token configured

  3. Test the schedule:
     - Confirm schedule trigger shows "Sunday 8:00 PM" in CST timezone

  4. Manual test run (optional):
     - Click "Test workflow" in n8n
     - Verify Reddit Apify actor returns posts
     - Verify LinkedIn Apify actor returns posts
     - Verify a few signals land in Supabase `linkedin_engine.research_signals` table
     - Check workflow_runs table for the run log entry

  5. Review README accuracy:
     - Open `business-os/workflows/README-wf2-weekly-deep-research.md`
     - Confirm it matches the actual workflow behavior
  </how-to-verify>
  <resume-signal>Type "approved" if workflow imports and tests correctly, or describe issues encountered (e.g., "Apify actor X doesn't exist, need alternative" or "Supabase schema not exposed")</resume-signal>
</task>

</tasks>

<verification>
Phase 3 verification checklist:
1. Workflow JSON is valid and importable into n8n
2. Schedule trigger fires Sunday 8 PM CST
3. Reddit scraping covers all 7 subreddits with 50+ upvote filter
4. LinkedIn scraping covers HR/AI keyword searches
5. De-duplication prevents duplicate source_url entries
6. Claude Sonnet classifies each signal with keywords, topic_category, sentiment
7. Signals inserted into linkedin_engine.research_signals with all required fields
8. platform_engagement stored as JSONB with correct metrics
9. signal_week set to Monday of collection week
10. Canary error handling posts to workflow_errors table
11. Workflow run logged (start/complete/failed) in workflow_runs table
12. README documentation exists with CEO summary
13. n8n-brain pattern registered
</verification>

<success_criteria>
- WF2 workflow JSON exists and imports cleanly into n8n
- Manual test run produces research_signals rows in Supabase
- All 7 Reddit subreddits scraped, posts with 50+ upvotes captured
- LinkedIn HR/AI posts captured with engagement metrics
- No duplicate source_url entries in research_signals table
- Each signal has valid keywords (array), topic_category (from allowed set), and sentiment
- platform_engagement JSONB contains upvotes/comments (Reddit) or likes/comments/shares (LinkedIn)
- Errors caught and logged to workflow_errors table
- README documentation meets IAML Business OS documentation standards
</success_criteria>

<output>
After completion, create `.planning/linkedin-content-engine/phases/03/03-01-SUMMARY.md` using the summary template.
</output>
