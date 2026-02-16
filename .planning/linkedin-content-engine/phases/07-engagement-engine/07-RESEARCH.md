# Phase 7: Engagement Engine - Research

**Researched:** 2026-02-15
**Domain:** n8n workflow automation, LinkedIn scraping via Apify, Claude AI comment generation, Next.js dashboard CRUD
**Confidence:** HIGH

## Summary

Phase 7 builds WF6 (Engagement Engine) -- an n8n workflow with two schedule triggers (daily 7 AM digest + pre-post warming at 7:40 AM Tue-Fri), plus a fully interactive Engagement dashboard tab with network CRUD, daily digest display, and ROI metrics. The workflow scrapes recent posts from engagement network contacts via Apify, uses Claude to generate comment suggestions, stores digest items and warming alerts in Supabase, and sends Slack notifications.

The standard approach follows established project patterns: schedule-triggered n8n workflow using HTTP Request nodes for Supabase REST API (schema-scoped with `Accept-Profile: linkedin_engine`), Claude Sonnet via Anthropic API for comment generation, and Apify sync endpoint for LinkedIn scraping. The dashboard extension follows the existing tab pattern in `linkedin-content.tsx` with server-side queries in `linkedin-content-queries.ts` and mutation functions in `linkedin-content-mutations.ts`.

**Primary recommendation:** Build this in two plans: Plan 1 = WF6 n8n workflow + schema migration + Supabase RLS grants; Plan 2 = Dashboard Engagement tab overhaul with CRUD network management, today's digest display, and ROI metrics.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n scheduleTrigger | 1.2 | Dual schedule triggers (7 AM daily + 7:40 AM Tue-Fri) | Used in WF1, WF3, WF5 |
| n8n HTTP Request | 4.2 | Supabase REST API calls, Apify calls, Slack webhooks, Claude API | Used in all existing workflows |
| n8n Code node | 2 | JavaScript logic for data transformation | Used in all existing workflows |
| Anthropic Claude API | claude-sonnet-4-20250514 | Comment suggestion generation | Same model as WF3/WF4 |
| Apify harvestapi/linkedin-profile-posts | current | Scrape recent posts from LinkedIn profiles | No cookies needed, $2/1k posts |
| Supabase REST API | PostgREST | All database operations | Project-wide mandate: no postgres nodes |
| Slack Incoming Webhook | n/a | Warming alerts and digest notifications | Same webhook as WF5 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| n8n SplitInBatches | 3 | Process engagement network contacts in batches | When scraping multiple profiles |
| n8n If node | 2 | Conditional branching (publish day check, has posts check) | Flow control |
| n8n Wait node | 1.1 | Not needed in this workflow | Only if adding delays between API calls |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| harvestapi/linkedin-profile-posts | curious_coder/linkedin-post-search-scraper | Already used in WF2 for keyword search; profile-based scraping is better for known contacts |
| Per-profile scraping | Feed-based scraping | Feed-based is cheaper but unreliable for catching specific network contacts' posts |

**Installation:** No additional packages needed. All tools are already configured in the project.

## Architecture Patterns

### Recommended Workflow Structure (WF6)
```
WF6: Engagement Engine
├── Schedule Trigger A (7 AM CST daily)
│   ├── Build Date + UUID
│   ├── Log Run Start
│   ├── Fetch Active Network Contacts (Supabase)
│   ├── Apify: Scrape Recent Posts (batch)
│   ├── Filter Posts (last 24h, engagement threshold)
│   ├── Rank & Select Top 7 Posts
│   ├── Claude: Generate Comment Suggestions (batch)
│   ├── Store Digest Items (Supabase)
│   ├── Update last_monitored on contacts
│   ├── Slack: Daily Digest Summary
│   └── Log Run Complete
│
├── Schedule Trigger B (7:40 AM CST Tue-Fri only)
│   ├── Build Date + Check Day
│   ├── If Not Publish Day → Skip
│   ├── Fetch Today's Calendar Slot (check if post exists)
│   ├── Fetch Warming-Relevant Network Posts
│   ├── Claude: Generate Warming Comments (with post context)
│   ├── Store Warming Items (Supabase)
│   ├── Slack: Warming Alert with targets + suggestions
│   └── Log Run Complete
```

### Pattern 1: Dual Schedule Trigger
**What:** Two separate schedule trigger nodes in one workflow, each with its own downstream branch. n8n supports multiple triggers per workflow -- each trigger activates its own execution path independently.
**When to use:** When two time-based automations share enough context (same tables, same credential set) to live in one workflow.
**Example:**
```json
// Trigger A: Daily 7 AM CST (12 PM UTC)
{
  "parameters": {
    "rule": {
      "interval": [{
        "field": "cronExpression",
        "expression": "0 13 * * *"
      }]
    }
  },
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2,
  "position": [0, 200]
}

// Trigger B: Tue-Fri 7:40 AM CST (12:40 PM UTC)
{
  "parameters": {
    "rule": {
      "interval": [{
        "field": "cronExpression",
        "expression": "40 13 * * 2-5"
      }]
    }
  },
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2,
  "position": [0, 800]
}
```
**Note:** WF5 uses `0 14 * * 2-5` for 8 AM CST publish. Warming at 7:40 AM CST = `40 13 * * 2-5` (20 min before).

### Pattern 2: Apify Profile Posts Scraping
**What:** Use Apify `harvestapi/linkedin-profile-posts` actor to scrape recent posts from engagement network contacts' profiles. No cookies/login required.
**When to use:** To discover posts from known LinkedIn profiles for engagement targeting.
**Example:**
```json
// Source: Apify documentation + WF2 sync endpoint pattern
{
  "method": "POST",
  "url": "https://api.apify.com/v2/acts/harvestapi~linkedin-profile-posts/run-sync-get-dataset-items?token=<APIFY_TOKEN>&timeout=300",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [{"name": "Content-Type", "value": "application/json"}]
  },
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": {
    "profileUrls": ["https://www.linkedin.com/in/person1", "https://www.linkedin.com/in/person2"],
    "maxPosts": 5,
    "scrapeReactions": false,
    "scrapeComments": false,
    "includeReposts": false
  }
}
```
**Output fields per post:** `id`, `linkedinUrl`, `content`, `name`, `publicIdentifier`, `postedAt` (with timestamp), `likes`, `comments`, `shares`, `reactions` (by type).

### Pattern 3: Claude Comment Generation
**What:** Send post content + brand voice context to Claude Sonnet, get back 2 comment suggestions with different styles.
**When to use:** For each selected post in the daily digest and warming routine.
**Example:**
```javascript
// Claude API call pattern (matches WF3/WF4 style)
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "messages": [{
    "role": "user",
    "content": "You are a LinkedIn engagement strategist for Mike Van Horn, 'The HR Technologist'... [brand voice context] ... Generate 2 comment suggestions for this post: [post content]. Comment A: insight/value-add style. Comment B: question/discussion style. JSON output only."
  }]
}
```

### Pattern 4: Schema Extension for Digest Storage
**What:** New `engagement_digests` table to store daily digest entries (post selections + comment suggestions). Separate from `comment_activity` which tracks actual posted comments.
**When to use:** Need to persist digest items for dashboard display and historical tracking.
**Schema:**
```sql
CREATE TABLE linkedin_engine.engagement_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date DATE NOT NULL,
  digest_type TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'warming'
  target_post_url TEXT,
  target_post_content TEXT,
  target_author TEXT,
  target_author_url TEXT,
  target_author_followers INT,
  network_contact_id UUID REFERENCES linkedin_engine.engagement_network(id),
  post_engagement JSONB, -- {likes, comments, shares}
  comment_suggestions JSONB, -- [{style, text}, {style, text}]
  status TEXT DEFAULT 'pending', -- pending, completed, skipped
  completed_at TIMESTAMPTZ,
  warming_context TEXT, -- only for warming: upcoming post topic
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Anti-Patterns to Avoid
- **DO NOT use n8n Postgres nodes:** Project-wide mandate. Use HTTP Request + Supabase REST API exclusively.
- **DO NOT use n8n Supabase native nodes:** Same mandate. HTTP Request + REST API only.
- **DO NOT scrape all posts then filter:** Limit Apify `maxPosts` to 5 per profile to control costs. Filter by recency (24h) in code node after.
- **DO NOT put warming targets in daily digest:** CONTEXT.md explicitly states warming targets are separate, chosen for topical relevance to upcoming post.
- **DO NOT fire warming on Mon/Sat/Sun:** Only Tue-Fri, 20 min before 8 AM CST publish.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LinkedIn post scraping | Custom puppeteer/playwright scraper | Apify `harvestapi/linkedin-profile-posts` | Account ban risk, maintenance burden, reliability |
| AI comment generation | Rule-based comment templates | Claude Sonnet API (same as WF3/WF4) | Context-aware, style-varied, brand-voice-consistent |
| Cron expression for CST | Manual UTC offset calculation | Use UTC offsets: CST = UTC-6, so 7 AM CST = 13:00 UTC | Avoid DST bugs (CDT = UTC-5 in summer) |
| UUID generation | Custom ID scheme | `gen_random_uuid()` in Supabase, UUID v4 in Code node | Standard pattern across all existing workflows |
| Slack message formatting | Plain text messages | Slack Block Kit JSON | Matches WF5 pattern, rich formatting |

**Key insight:** Every component in WF6 has a direct precedent in WF1-WF5. The only genuinely new element is the Apify profile posts actor (vs. WF2's keyword search actor), but the HTTP Request pattern is identical.

## Common Pitfalls

### Pitfall 1: Missing Anon RLS Grants for engagement_network and comment_activity
**What goes wrong:** WF6 uses the Supabase REST credential `Dy6aCSbL5Tup4TnE` which authenticates as the `anon` role. The `engagement_network` and `comment_activity` tables currently have NO anon grants -- only `service_role` and `authenticated` have access.
**Why it happens:** Earlier migrations (20260214) only added anon grants for `workflow_runs`, `research_signals`, and `workflow_errors`. The engagement tables were not needed by previous workflows.
**How to avoid:** Create a migration that adds anon grants: `GRANT SELECT, INSERT, UPDATE ON linkedin_engine.engagement_network TO anon;` and `GRANT SELECT, INSERT, UPDATE ON linkedin_engine.comment_activity TO anon;` plus anon RLS policies.
**Warning signs:** Supabase REST API returns 401 or empty results when WF6 tries to read engagement_network.

### Pitfall 2: Apify Timeout on Large Network
**What goes wrong:** If the engagement network has 20+ contacts, scraping 5 posts each = 100+ API calls to Apify. The sync endpoint times out at 300 seconds.
**Why it happens:** `run-sync-get-dataset-items` has a hard 300s timeout.
**How to avoid:** Batch contacts into groups of 5-10 per Apify call. Use `profileUrls` array (multiple URLs per call). Apify processes up to 6 profiles concurrently. Keep maxPosts low (3-5 per profile).
**Warning signs:** HTTP 408 from Apify, incomplete post data.

### Pitfall 3: DST Time Shift
**What goes wrong:** 7 AM CST (UTC-6) becomes 7 AM CDT (UTC-5) in March-November, so the cron expression `0 13 * * *` actually fires at 8 AM CDT (or 6 AM CST becomes 7 AM CDT).
**Why it happens:** n8n server timezone may be UTC while the business operates in CST/CDT.
**How to avoid:** Use n8n's workflow timezone setting (America/Chicago) if available. If using cron, document the UTC offset and note the DST shift. WF5 uses `0 14 * * 2-5` for "8 AM CST" which suggests the n8n instance uses UTC. Check the `$now.toISODate()` pattern from WF5 which uses workflow timezone.
**Warning signs:** Digest arrives at wrong time after DST transition.

### Pitfall 4: Dashboard Tab Already Exists as Placeholder
**What goes wrong:** Overwriting the existing Engagement tab placeholder without understanding current data flow.
**Why it happens:** The tab already shows `recentComments` and `engagementNetwork` summary data via `getLinkedInContentDashboardData()`.
**How to avoid:** Read the existing `linkedin-content.tsx` engagement tab code (lines 1170-1258) and `linkedin-content-queries.ts` (lines 289-328) before modifying. Extend, don't replace. Add new query functions for digest data alongside existing ones.
**Warning signs:** Breaking existing dashboard data flow.

### Pitfall 5: Engagement Network Table Missing `linkedin_profile_id` for Apify
**What goes wrong:** Apify's `profileUrls` input needs full LinkedIn profile URLs. The `engagement_network` table has `linkedin_url` but it may be null or contain non-profile URLs.
**Why it happens:** The table was designed for manual network management; Apify scraping was deferred to Phase 7.
**How to avoid:** Filter for contacts where `linkedin_url IS NOT NULL` and `active = true`. Validate URL format starts with `https://www.linkedin.com/in/`. Handle edge cases in the Code node.
**Warning signs:** Apify returns empty results or errors on malformed URLs.

### Pitfall 6: New `engagement_digests` Table Needs Full RLS Setup
**What goes wrong:** Any new table in the `linkedin_engine` schema needs RLS enabled, policies created, and anon grants added.
**Why it happens:** The schema has RLS on all tables; a new table without policies will block all access.
**How to avoid:** Follow the exact RLS pattern from `20260208_create_linkedin_engine_schema.sql`: enable RLS, create service_role full access policy, create authenticated read policy, grant anon SELECT/INSERT/UPDATE.
**Warning signs:** 401 errors or empty results from new table.

## Code Examples

Verified patterns from existing project workflows:

### Supabase REST GET (with schema scope)
```json
// Source: WF5 wf5-fetch-calendar pattern
{
  "method": "GET",
  "url": "=https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/engagement_network?active=eq.true&linkedin_url=not.is.null&select=id,linkedin_name,linkedin_url,linkedin_headline,follower_count,tier,category,last_monitored",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {"name": "Accept-Profile", "value": "linkedin_engine"}
    ]
  },
  "options": {"timeout": 10000}
}
```

### Supabase REST POST (insert with schema scope)
```json
// Source: WF3 insert-topic-recommendation pattern
{
  "method": "POST",
  "url": "https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/engagement_digests",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {"name": "Content-Type", "value": "application/json"},
      {"name": "Prefer", "value": "return=minimal"},
      {"name": "Accept-Profile", "value": "linkedin_engine"},
      {"name": "Content-Profile", "value": "linkedin_engine"}
    ]
  },
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "=<insert payload>"
}
```

### Claude API Call (with Anthropic credential)
```json
// Source: WF3 claude-score-topic pattern
{
  "method": "POST",
  "url": "https://api.anthropic.com/v1/messages",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {"name": "anthropic-version", "value": "2023-06-01"},
      {"name": "Content-Type", "value": "application/json"}
    ]
  },
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"model\": \"claude-sonnet-4-20250514\",\n  \"max_tokens\": 1000,\n  \"messages\": [{\"role\": \"user\", \"content\": <prompt>}]\n}",
  "options": {"timeout": 60000}
}
```

### Slack Webhook (Block Kit)
```json
// Source: WF5 wf5-slack-success pattern
{
  "method": "POST",
  "url": "https://hooks.slack.com/services/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",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \":speech_balloon: *Daily Engagement Digest*\\n\\n<digest content>\"\n      }\n    }\n  ]\n}"
}
```

### Dashboard Server Query Pattern
```typescript
// Source: linkedin-content-queries.ts getRecentComments pattern
export async function getTodayDigest(): Promise<EngagementDigestDb[]> {
  const supabase = getServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('linkedin_engine.engagement_digests')
    .select('*')
    .eq('digest_date', today)
    .eq('digest_type', 'daily')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching today digest:', error);
    return [];
  }
  return (data as EngagementDigestDb[]) || [];
}
```

### Dashboard API Route Pattern
```typescript
// Source: topics/[id]/status/route.ts pattern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate, call mutation, return result
    const result = await createNetworkContact(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LinkedIn cookies for scraping | No-cookies Apify actors | 2025 | No account ban risk, no cookie refresh maintenance |
| Per-profile sequential scraping | Batch profileUrls array | Current | 6x faster (concurrent), lower cost |
| Hardcoded comment templates | Claude Sonnet contextual generation | Project standard | Brand-voice consistent, context-aware |
| n8n Postgres nodes | HTTP Request + Supabase REST API | Project decision | Avoids connection pooling bugs |

**Deprecated/outdated:**
- `curious_coder/linkedin-post-search-scraper`: Still works for keyword search (used in WF2) but `harvestapi/linkedin-profile-posts` is better for known-profile scraping (supports `profileUrls` array input directly).

## Tier Criteria Recommendation (Claude's Discretion)

Based on the engagement network use case and LinkedIn algorithm dynamics:

### Tier 1: Key Influencers (10-15 contacts)
- 5,000+ followers OR significant reach in HR/AI/employment law space
- Regularly post (2+ times/week)
- High engagement on their posts (50+ reactions average)
- Categories: hr_leader, employment_attorney, ai_policy
- **Purpose:** Priority engagement -- always in daily digest when they post

### Tier 2: Active Network (15-25 contacts)
- 1,000-5,000 followers OR growing presence
- Post at least weekly
- Moderate engagement (10-50 reactions average)
- Categories: hr_tech, journalist, hr_leader
- **Purpose:** Rotational engagement -- included in digest when Tier 1 is sparse

### Initial Network Size: 20-30 contacts
- Start with 10 Tier 1 + 15 Tier 2
- Sustainable daily engagement without burnout (5-7 posts/day)
- Expand based on ROI data from Phase 9

## Post Discovery Method Recommendation (Claude's Discretion)

**Recommend: Per-profile scraping via `harvestapi/linkedin-profile-posts`**

| Factor | Per-Profile | Feed-Based |
|--------|------------|------------|
| Reliability | HIGH -- guaranteed to find posts from specific contacts | LOW -- feed is algorithmic, may miss contacts |
| Cost | ~$2 per 1,000 posts scraped | Similar but wasteful (scrapes irrelevant posts) |
| Targeting | Exact match to engagement network contacts | Approximate, requires filtering |
| Freshness | Returns most recent posts per profile | Depends on feed algorithm |

**Implementation:** Pass `profileUrls` array (from engagement_network table) to Apify actor. Use `maxPosts: 5` per profile. Filter results for posts < 24 hours old in Code node.

## Warming Target Selection Algorithm Recommendation (Claude's Discretion)

**Algorithm:** Select 3-4 warming targets from engagement network based on topical relevance to the upcoming post.

1. Fetch today's scheduled post from `content_calendar` + `posts` tables
2. Extract the post's topic, series, pillar, and key themes
3. Score network contacts by relevance:
   - Same `category` as post topic: +3 points
   - Tier 1: +2 points, Tier 2: +1 point
   - Recently active (posted in last 24h): +2 points
   - Not engaged in last 48h (avoid over-engagement): +1 point
4. Select top 3-4 scoring contacts
5. For each, find their most recent relevant post via Apify
6. Generate warming comments with context about Mike's upcoming post topic

## ROI Attribution Methodology Recommendation (Claude's Discretion)

**Approach:** Time-windowed attribution with Apify scraping.

1. **Comment ROI Collection (24h after comment):**
   - Apify scrapes the target post to get comment reactions/replies
   - Find Mike's comment in the comments list, record likes_received + replies_received

2. **Profile Impact Attribution (correlated, not causal):**
   - LinkedIn profile views and connection requests are not attributable to specific comments via API
   - Track daily profile views and connection requests via LinkedIn API (future Phase 8)
   - Correlate spikes with high-engagement comment days
   - `profile_visits_driven` and `connection_requests_driven` remain nullable until Phase 8

3. **ROI Score Formula:**
   ```
   roi_score = (likes_received * 1) + (replies_received * 3) +
               (target_author_followers / 1000 * 0.5)
   ```
   - Replies weighted 3x because they indicate real conversation
   - Author follower count as a reach multiplier (exposure value)

## Dashboard Layout Recommendation (Claude's Discretion)

### Engagement Tab Sub-sections

```
Engagement Tab
├── Today's Digest (full width, primary)
│   ├── Digest summary: "7 posts to engage with today" + date
│   ├── Post cards (expandable):
│   │   ├── Author name + headline + follower count
│   │   ├── Post preview (first 200 chars)
│   │   ├── Post engagement stats (likes, comments, shares)
│   │   ├── 2 comment suggestions (copy-to-clipboard)
│   │   └── Status toggle: pending / completed / skipped
│   └── Warming alert banner (if publish day, shown at top)
│       ├── "Publishing in X minutes" countdown
│       ├── 3-4 warming targets with suggestions
│       └── Today's post topic context
│
├── Engagement Network (right sidebar on lg, full width on mobile)
│   ├── Summary: X total, Y Tier 1, Z Tier 2
│   ├── Filterable list: tier, category, active status
│   ├── Add Contact button (dialog/modal form)
│   ├── Inline edit (tier, category, notes)
│   └── Deactivate toggle
│
└── ROI & Activity (full width, below)
    ├── MetricCards: Total comments this week, Avg ROI score, Best performing comment
    ├── Recent comments list (from comment_activity table)
    └── Network engagement heatmap or simple bar chart (comments per contact)
```

## Schema Changes Required

### New Table: `engagement_digests`
```sql
CREATE TABLE linkedin_engine.engagement_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date DATE NOT NULL,
  digest_type TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'warming'
  target_post_url TEXT,
  target_post_content TEXT,
  target_author TEXT,
  target_author_url TEXT,
  target_author_followers INT,
  network_contact_id UUID REFERENCES linkedin_engine.engagement_network(id),
  post_engagement JSONB, -- {likes, comments, shares}
  comment_suggestions JSONB, -- [{style: "insight", text: "..."}, {style: "question", text: "..."}]
  status TEXT DEFAULT 'pending', -- pending, completed, skipped
  completed_at TIMESTAMPTZ,
  warming_context TEXT, -- only for warming type: upcoming post topic context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_le_digest_date ON linkedin_engine.engagement_digests(digest_date);
CREATE INDEX idx_le_digest_type ON linkedin_engine.engagement_digests(digest_type);
CREATE INDEX idx_le_digest_contact ON linkedin_engine.engagement_digests(network_contact_id);
```

### New Grants: Anon access for n8n workflows
```sql
-- engagement_network: WF6 needs SELECT + UPDATE (last_monitored)
GRANT SELECT, INSERT, UPDATE ON linkedin_engine.engagement_network TO anon;

-- comment_activity: WF6 needs INSERT (logging comments), future ROI updates
GRANT SELECT, INSERT, UPDATE ON linkedin_engine.comment_activity TO anon;

-- engagement_digests: WF6 needs INSERT (creating digest items)
GRANT SELECT, INSERT, UPDATE ON linkedin_engine.engagement_digests TO anon;

-- RLS policies for new table + anon policies for all three tables
```

### Dashboard Grants: Authenticated access for network CRUD
```sql
-- engagement_network: Dashboard needs full CRUD
GRANT INSERT, UPDATE, DELETE ON linkedin_engine.engagement_network TO authenticated;

-- engagement_digests: Dashboard needs UPDATE (status changes)
GRANT UPDATE ON linkedin_engine.engagement_digests TO authenticated;
```

## Open Questions

Things that could not be fully resolved:

1. **Apify cost per daily run**
   - What we know: $2 per 1,000 posts. 25 contacts x 5 posts each = 125 posts/day = ~$0.25/day
   - What's unclear: Whether Apify charges per actor run or per result item for the sync endpoint
   - Recommendation: Start with the estimate, monitor costs after first week

2. **DST handling in n8n cron**
   - What we know: WF5 uses `0 14 * * 2-5` for 8 AM CST. n8n uses `$now.toISODate()` with workflow timezone
   - What's unclear: Whether n8n automatically adjusts cron for DST if workflow timezone is set to America/Chicago
   - Recommendation: Set workflow timezone to America/Chicago in n8n settings. If cron doesn't auto-adjust, use Code node to check current time and skip if outside window

3. **ROI scraping implementation detail**
   - What we know: Apify can scrape post comments (with `scrapeComments: true`) to find Mike's comment and its reactions
   - What's unclear: Exact Apify output format when scrapeComments is enabled, and how to identify Mike's comment reliably
   - Recommendation: This is a Phase 9 (Analytics) concern. For now, store comment_activity rows with null ROI fields. Add automated ROI scraping later.

4. **Warming alert timing precision**
   - What we know: Publish at 8 AM CST (WF5), warming at 7:40 AM CST (20 min before). Both are schedule triggers.
   - What's unclear: If WF6 warming trigger and WF5 publish trigger run exactly on time (n8n may have slight delays)
   - Recommendation: 20-minute buffer is generous enough to absorb 1-2 minute execution delays. No action needed.

## Sources

### Primary (HIGH confidence)
- Existing workflow JSON files: `wf1-wf5` in `n8n-workflows/linkedin-engine/` -- established all patterns
- Existing dashboard code: `dashboard/src/app/dashboard/marketing/linkedin-content/` -- established UI patterns
- Existing schema: `supabase/migrations/20260208_create_linkedin_engine_schema.sql` -- all table definitions
- Existing queries: `dashboard/src/lib/api/linkedin-content-queries.ts` -- Supabase query patterns
- Existing mutations: `dashboard/src/lib/api/linkedin-content-mutations.ts` -- API mutation patterns
- Existing RLS: `supabase/migrations/20260214_linkedin_engine_anon_rls.sql` -- revealed missing anon grants

### Secondary (MEDIUM confidence)
- [Apify harvestapi/linkedin-profile-posts](https://apify.com/harvestapi/linkedin-profile-posts) -- Profile posts scraper, verified input format
- [GitHub HarvestAPI/apify-linkedin-profile-posts](https://github.com/HarvestAPI/apify-linkedin-profile-posts) -- Input/output schema confirmed
- [Apify run-sync-get-dataset-items API](https://docs.apify.com/api/v2/act-run-sync-get-dataset-items-post) -- Sync endpoint documentation

### Tertiary (LOW confidence)
- Apify pricing ($2/1k posts) -- from marketing page, actual billing may differ for sync endpoint
- DST behavior in n8n cron expressions -- need to verify with actual n8n instance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already used in WF1-WF5, exact patterns verified from JSON files
- Architecture: HIGH -- dual schedule trigger is standard n8n, Apify sync pattern used in WF2
- Schema changes: HIGH -- follows exact patterns from existing migrations, verified missing grants
- Dashboard extension: HIGH -- existing tab placeholder code read and understood, mutation patterns verified
- Pitfalls: HIGH -- anon RLS grant issue verified by reading actual migration files
- Apify actor specifics: MEDIUM -- input format verified from GitHub README, but output format details from marketing page
- ROI methodology: MEDIUM -- formula is reasonable but untested, deferred to Phase 9 for automation

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable -- all components are project-internal patterns)
