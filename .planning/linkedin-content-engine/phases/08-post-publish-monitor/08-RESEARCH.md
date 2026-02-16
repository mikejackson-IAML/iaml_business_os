# Phase 8: Post-Publish Monitor - Research

**Researched:** 2026-02-15
**Domain:** LinkedIn post monitoring, n8n workflow automation, Apify scraping, Supabase schema design
**Confidence:** HIGH

## Summary

Phase 8 builds WF7, an n8n workflow that monitors published LinkedIn posts for incoming comments and engagement velocity. The workflow polls at decreasing intervals (10 min for 2 hrs, 30 min for 6 hrs, hourly for 24 hrs, daily for 7 days), classifies comments by type, generates reply suggestions via Claude, and detects viral velocity thresholds.

The critical finding of this research is that the LinkedIn API's `r_member_social` permission (required for reading comments on your own posts) is **CLOSED and not accepting applications**. The only open permission is `w_member_social` (write-only: post, comment, react). This means WF7 **must use Apify for all comment and engagement data retrieval**, following the same pattern established by WF6. Two Apify actors are relevant: `harvestapi~linkedin-profile-posts` (already used by WF6, has `scrapeComments` option) and `harvestapi~linkedin-post-comments` (dedicated comments scraper that accepts a post URL directly).

The recommended architecture uses a **state-driven polling pattern** rather than long-running Wait node loops. A scheduled trigger runs every 10 minutes, queries Supabase for posts in active monitoring windows, and processes only the posts whose polling interval has elapsed. This avoids n8n execution timeout issues and the known Wait node loop instability.

**Primary recommendation:** Use Apify `harvestapi~linkedin-post-comments` for comment retrieval (takes post URL directly, returns structured comment data with author info), and the LinkedIn `memberCreatorPostAnalytics` API (requires `r_member_postAnalytics` permission) OR Apify profile-posts with engagement metrics for analytics capture. Use a 10-minute schedule trigger with state-based filtering rather than Wait node loops.

## Standard Stack

### Core

| Library/Tool | Version | Purpose | Why Standard |
|---|---|---|---|
| Apify `harvestapi~linkedin-post-comments` | Current | Scrape comments from specific post URLs | Dedicated actor, no cookies needed, returns author name/URL/text/timestamp, $2/1k results |
| Apify `harvestapi~linkedin-profile-posts` | Current | Scrape Mike's recent posts with engagement metrics | Already used by WF6, has `scrapeComments`/`scrapeReactions` options |
| Claude Sonnet (Anthropic API) | claude-sonnet-4-20250514 | Comment classification and reply generation | Same model used across all LCE workflows |
| Supabase REST API | n/a | Database operations | Project standard, avoids n8n Postgres connection pooling bugs |
| Slack Webhook | n/a | Priority notifications (viral threshold, questions, disagreements) | Same webhook URL used by WF5/WF6 |

### Supporting

| Library/Tool | Version | Purpose | When to Use |
|---|---|---|---|
| LinkedIn `socialActions/comments` API | 2026-02 | Read comments on own posts | ONLY if `r_member_social` or `w_member_social_feed` permission is available -- currently CLOSED |
| LinkedIn `socialMetadata` API | 2026-02 | Get reaction counts and comment counts summary | Same permission restriction applies |
| LinkedIn `memberCreatorPostAnalytics` API | 2026-02 | Get impressions, reactions, comments, reshares counts | Requires `r_member_postAnalytics` (Marketing API access needed) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Apify for comments | LinkedIn Comments API (socialActions) | API requires `r_member_social` which is CLOSED -- not viable |
| Apify for analytics | LinkedIn `memberCreatorPostAnalytics` | Requires Marketing API approval -- may not be available |
| Dedicated comments actor | Profile-posts actor with `scrapeComments: true` | Profile-posts scrapes ALL posts, not just one -- wasteful for targeted polling |
| 10-min schedule + state filtering | Wait node loops | Wait node loops are unstable in n8n (documented issues with stopping after 1 loop) |

## Architecture Patterns

### Recommended Workflow Structure: State-Driven Polling

**What:** Instead of a single long-running execution with Wait nodes, use a frequent schedule trigger (every 10 min) that checks which posts need polling right now.

**Why:** n8n Wait node loops are unreliable for long-duration monitoring (documented issues with automatic stopping). A 7-day monitoring window would require an execution to stay active for 168 hours, which exceeds n8n's execution timeout limits.

**Pattern:**

```
Schedule (every 10 min)
  |
  v
Query Supabase: Get posts in monitoring window
  |
  v
Code: Calculate which posts need polling NOW
  (based on published_at + hours_since_publish -> determine interval)
  |
  v
For each post needing poll:
  |
  +-> Apify: Scrape comments for this post URL
  +-> Calculate engagement velocity
  +-> Claude: Classify new comments + generate replies
  +-> Store results in Supabase
  +-> Check viral threshold
  +-> Slack if needed
```

### Polling Schedule Logic (Code Node)

```javascript
// Determine if a post needs polling based on hours since publish
function shouldPollNow(hoursSincePublish, lastPolledAt) {
  const minutesSinceLastPoll = lastPolledAt
    ? (Date.now() - new Date(lastPolledAt).getTime()) / 60000
    : Infinity;

  if (hoursSincePublish <= 2) {
    return minutesSinceLastPoll >= 10;   // Every 10 min
  } else if (hoursSincePublish <= 8) {
    return minutesSinceLastPoll >= 30;   // Every 30 min
  } else if (hoursSincePublish <= 24) {
    return minutesSinceLastPoll >= 60;   // Every hour
  } else if (hoursSincePublish <= 168) { // 7 days
    return minutesSinceLastPoll >= 1440; // Every 24 hours
  }
  return false; // Stop monitoring after 7 days
}
```

### Monitoring State Table Pattern

A new column or table tracks the monitoring state per post:

```sql
-- Option A: New columns on posts table
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS monitoring_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS monitoring_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monitoring_ends_at TIMESTAMPTZ;
```

When a post is published (status = 'published'), WF5 or WF7 sets `monitoring_status = 'active'` and `monitoring_started_at = published_at` and `monitoring_ends_at = published_at + 7 days`.

### New Table: `post_incoming_comments`

```sql
CREATE TABLE IF NOT EXISTS linkedin_engine.post_incoming_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES linkedin_engine.posts(id),

  -- Comment data from Apify
  linkedin_comment_id TEXT,          -- Apify comment ID for dedup
  commenter_name TEXT,
  commenter_url TEXT,
  commenter_headline TEXT,
  comment_text TEXT NOT NULL,
  comment_posted_at TIMESTAMPTZ,
  comment_likes INT DEFAULT 0,
  comment_replies_count INT DEFAULT 0,

  -- Classification
  comment_type TEXT,                 -- question, agreement, disagreement, addition, spam

  -- Reply suggestion
  reply_suggestion TEXT,
  reply_posted BOOLEAN DEFAULT FALSE,
  reply_posted_at TIMESTAMPTZ,

  -- Thread tracking (for disagreement two-step flow)
  parent_comment_id UUID REFERENCES linkedin_engine.post_incoming_comments(id),
  thread_state TEXT DEFAULT 'new',   -- new, follow_up_sent, resolved

  -- Metadata
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  poll_sequence INT,                 -- which poll iteration detected this
  notified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_le_incoming_post ON linkedin_engine.post_incoming_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_le_incoming_type ON linkedin_engine.post_incoming_comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_le_incoming_linkedin_id ON linkedin_engine.post_incoming_comments(linkedin_comment_id);
CREATE INDEX IF NOT EXISTS idx_le_incoming_thread ON linkedin_engine.post_incoming_comments(parent_comment_id);
```

### Viral Detection Pattern

```javascript
// Calculate velocity and compare to rolling average
async function checkViralThreshold(postId, currentReactions, hoursSincePublish) {
  // Get rolling average from post_analytics (last 5+ posts)
  const avgFirstHourReactions = await getAverageFirstHourReactions();

  if (avgFirstHourReactions === null) {
    // Bootstrap: less than 5 posts, use fixed fallback
    const FALLBACK_VIRAL_THRESHOLD = 20;
    return hoursSincePublish <= 1 && currentReactions >= FALLBACK_VIRAL_THRESHOLD;
  }

  // Viral = 2x rolling average
  return currentReactions >= (avgFirstHourReactions * 2);
}
```

### Engagement Boost Trigger Pattern

When viral threshold is detected, trigger WF6 engagement warming by inserting a warming digest with a specific flag:

```javascript
// Option 1: Insert warming digest items directly into engagement_digests table
// WF6 can pick these up on its next run, or
// Option 2: Use n8n Execute Workflow node to trigger WF6's warming branch
// Option 3: Insert a special workflow_runs entry that WF6 polls for
```

**Recommendation:** Use Option 1 -- insert warming-type digest items into `engagement_digests` with `warming_context` explaining the viral post. This is the simplest approach and aligns with existing patterns.

### Anti-Patterns to Avoid

- **Wait node loops for 7-day monitoring:** n8n Wait nodes are unstable for long-duration loops. The execution can stop after one iteration or exceed timeout limits. Use schedule trigger + state instead.
- **LinkedIn API for reading comments:** `r_member_social` is CLOSED. Do not attempt to use the socialActions/comments GET endpoint without verifying permission status first.
- **Scraping all profile posts to find comments:** Using `harvestapi~linkedin-profile-posts` with `scrapeComments: true` scrapes ALL recent posts, not just the target post. This is wasteful. Use the dedicated `harvestapi~linkedin-post-comments` actor instead.
- **Inline reply suggestions in Slack:** Per CONTEXT.md, Slack notifications should be brief with a link to the dashboard. Reply suggestions stay in the database and are viewed on the dashboard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| LinkedIn comment scraping | Custom LinkedIn API integration | Apify `harvestapi~linkedin-post-comments` | LinkedIn API requires closed permission; Apify handles auth, rate limits, parsing |
| Comment deduplication | Manual text matching | `linkedin_comment_id` column with unique index | Apify returns stable comment IDs; dedup on upsert via ON CONFLICT |
| Comment thread detection | Manual parent-child tracking | Apify comment `numComments` field + separate thread query | Apify indicates reply count; fetch replies separately when disagreement detected |
| Engagement velocity charting | Custom velocity calculation | `post_analytics` table with `hours_since_publish` | Already exists in schema; just insert rows at each poll |
| Slack message formatting | Manual string concatenation | Slack Block Kit JSON template | Consistent with WF5/WF6 Slack patterns |

## Common Pitfalls

### Pitfall 1: LinkedIn API Permission Trap

**What goes wrong:** Attempting to use the LinkedIn Comments API (`socialActions/comments` GET) or Social Metadata API without `r_member_social` or `r_member_social_feed` permission.
**Why it happens:** The LinkedIn API docs show these endpoints exist, but the permissions are CLOSED and not accepting applications.
**How to avoid:** Use Apify exclusively for reading data. Only use the LinkedIn API for write operations (posting comments via `w_member_social`).
**Warning signs:** 403 errors, "Not Enough Permissions" responses.

### Pitfall 2: Apify Rate Limits and Costs

**What goes wrong:** Polling too frequently burns through Apify credits. At 10-min intervals for 2 hours (12 calls), then 30-min for 6 hours (12 calls), then hourly for 24 hours (16 calls), then daily for 7 days (7 calls) = ~47 Apify calls per published post.
**Why it happens:** Each Apify call costs money ($2/1k results for comments actor).
**How to avoid:** Batch multiple posts into single Apify calls where possible. The profile-posts actor can check engagement metrics for multiple posts at once. Only call the dedicated comments actor for posts with new comment_count changes.
**Warning signs:** Apify bill exceeding budget, slow Apify responses.

### Pitfall 3: Wait Node Loop Instability

**What goes wrong:** n8n Wait node loops stop after one iteration or exceed execution timeouts.
**Why it happens:** n8n serializes execution state to database when waiting. Long-running executions can hit timeout limits. Known issue documented in n8n community.
**How to avoid:** Use schedule trigger + state-based filtering pattern instead of Wait loops.
**Warning signs:** Workflow execution shows as "waiting" but never resumes.

### Pitfall 4: Comment Deduplication Across Polls

**What goes wrong:** Same comments get stored multiple times across polling iterations.
**Why it happens:** Each Apify call returns ALL comments on the post, not just new ones.
**How to avoid:** Use `linkedin_comment_id` as a unique identifier. Use Supabase upsert (POST with `on_conflict=linkedin_comment_id` header, or pre-query existing IDs and filter in Code node).
**Warning signs:** Duplicate comment rows, inflated comment counts.

### Pitfall 5: Disagreement Thread State Tracking

**What goes wrong:** The two-step disagreement flow loses track of which disagreements have had follow-up questions asked.
**Why it happens:** Thread state is complex -- need to track which comments are replies to which.
**How to avoid:** Use `parent_comment_id` and `thread_state` columns. When a new disagreement is detected, set `thread_state = 'new'`. When the reply suggestion is generated, set `thread_state = 'follow_up_sent'`. On next poll, check if there are new replies to follow_up_sent comments.
**Warning signs:** Same disagreement gets follow-up question suggestion repeatedly.

### Pitfall 6: Supabase Anon Key Permissions

**What goes wrong:** n8n workflow can't read/write new tables because RLS policies don't include anon role.
**Why it happens:** n8n uses the Supabase anon key via `httpHeaderAuth` credential `Dy6aCSbL5Tup4TnE`. New tables need explicit anon grants.
**How to avoid:** Every migration for new tables MUST include `GRANT ... TO anon` and anon RLS policies. Follow the pattern in `20260215_linkedin_engine_engagement_grants.sql`.
**Warning signs:** 401 or empty results from n8n HTTP Request nodes hitting Supabase.

## Code Examples

### Apify: Scrape Comments for a Specific Post

```javascript
// n8n HTTP Request node configuration
// Method: POST
// URL: https://api.apify.com/v2/acts/harvestapi~linkedin-post-comments/run-sync-get-dataset-items?token={{ $env.APIFY_API_TOKEN }}&timeout=120

// Body:
{
  "postUrls": ["{{ $json.linkedin_post_url }}"],
  "maxItems": 100
}

// Response: Array of comment objects
// Each comment has:
// - id: string
// - commentary: string (comment text)
// - createdAt: ISO timestamp
// - actor: { name, linkedinUrl, position, pictureUrl }
// - numComments: int (replies to this comment)
// - reactionTypeCounts: [{ reactionType, count }]
```

### Alternative: Profile Posts Actor with scrapeComments

```javascript
// Uses the same actor as WF6 but with comments enabled
// URL: https://api.apify.com/v2/acts/harvestapi~linkedin-profile-posts/run-sync-get-dataset-items?token={{ $env.APIFY_API_TOKEN }}&timeout=300

// Body:
{
  "profileUrls": ["https://www.linkedin.com/in/mike-van-horn/"],
  "maxPosts": 1,
  "scrapeComments": true,
  "maxComments": 50,
  "scrapeReactions": false,
  "includeReposts": false
}

// Returns post with nested comments array
// Useful for getting engagement metrics (likes, comments, shares) alongside comments
```

### Claude: Comment Classification and Reply Generation

```javascript
// Anthropic API call pattern (matches WF6)
// credential: anthropic-api
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 800,
  "messages": [{
    "role": "user",
    "content": `You are helping Mike Van Horn ("The HR Technologist") respond to comments on his LinkedIn posts. Mike is CEO of IAML, a 45-year employment law training company. He bridges genuine AI expertise and deep-domain HR/employment law knowledge.

REPLY TONE: More conversational than post content. No emojis. Professional but approachable.

ORIGINAL POST:
${postFullText}

COMMENT by ${commenterName}:
"${commentText}"

1. Classify this comment as one of: question, agreement, disagreement, addition, spam
2. ${commentType === 'spam' ? 'Skip reply generation for spam.' : 'Generate a reply suggestion.'}

Reply length guidelines:
- agreement: 1 sentence (brief acknowledgment)
- question: 2-3 sentences (answer with expertise)
- disagreement: ${threadState === 'new' ? 'Ask a follow-up question (1-2 sentences). Do NOT argue.' : 'Acknowledge their point and bridge to your perspective (2-3 sentences).'}
- addition: 1-2 sentences (build on their point)

Respond with ONLY valid JSON:
{"type": "question|agreement|disagreement|addition|spam", "reply": "..."}`
  }]
}
```

### Supabase: Upsert Comment with Dedup

```javascript
// n8n HTTP Request node
// Method: POST
// URL: https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/post_incoming_comments
// Headers:
//   Content-Type: application/json
//   Prefer: resolution=merge-duplicates,return=representation
//   Accept-Profile: linkedin_engine
//   Content-Profile: linkedin_engine

// Body: The comment data
// ON CONFLICT on linkedin_comment_id prevents duplicates
```

### Supabase: Query Posts Needing Monitoring

```javascript
// GET posts where monitoring is active and published_at is within 7 days
// URL: https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/posts?status=eq.published&monitoring_status=eq.active&select=id,linkedin_post_id,full_text,hook_text,published_at,last_polled_at
// Headers:
//   Accept-Profile: linkedin_engine
```

### Engagement Velocity Calculation

```javascript
// Calculate velocity (reactions per hour) for a post
function calculateVelocity(currentMetrics, previousMetrics, hoursSincePublish) {
  const reactionsPerHour = currentMetrics.reactions_total / Math.max(hoursSincePublish, 0.1);
  const commentsPerHour = currentMetrics.comments_count / Math.max(hoursSincePublish, 0.1);

  return {
    reactions_per_hour: Math.round(reactionsPerHour * 10) / 10,
    comments_per_hour: Math.round(commentsPerHour * 10) / 10,
    engagement_rate: currentMetrics.engagement_rate || 0,
    delta_reactions: currentMetrics.reactions_total - (previousMetrics?.reactions_total || 0),
    delta_comments: currentMetrics.comments_count - (previousMetrics?.comments_count || 0)
  };
}
```

### Slack: Priority Comment Notification

```javascript
// Slack Block Kit for priority comment (question or disagreement)
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `:speech_balloon: *New ${commentType} on your post*\n\n*Post:* ${hookText}\n*From:* ${commenterName}\n*Comment:* "${commentText.substring(0, 150)}..."\n\n<${dashboardUrl}|View in Dashboard>`
      }
    }
  ]
}
```

### Slack: Viral Velocity Alert

```javascript
// Slack Block Kit for viral threshold notification
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `:fire: *Post going viral!*\n\n*Post:* ${hookText}\n*Reactions:* ${reactionsTotal} (${reactionsPerHour}/hr)\n*Comments:* ${commentsCount}\n*Threshold:* 2x avg (${avgReactions} avg, ${viralThreshold} threshold)\n\nEngagement boost triggered -- WF6 warming will amplify.\n<${linkedinUrl}|View on LinkedIn>`
      }
    }
  ]
}
```

## Codebase Patterns to Follow

### n8n Workflow Patterns (from WF5/WF6)

| Pattern | WF5/WF6 Implementation | WF7 Should Follow |
|---|---|---|
| Schedule trigger | `n8n-nodes-base.scheduleTrigger` with cron expression | Use `*/10 * * * *` (every 10 min) |
| UUID generation | Code node with `uuidv4()` function | Same pattern for run_id |
| Workflow run logging | POST to `workflow_runs` at start and end | Same pattern, workflow_name: `wf7-post-publish-monitor` |
| Supabase REST | HTTP Request + headers (Accept-Profile, Content-Profile) | Same credential `Dy6aCSbL5Tup4TnE` |
| Apify sync endpoint | `run-sync-get-dataset-items?token={{ $env.APIFY_API_TOKEN }}&timeout=X` | Same pattern for comment scraping |
| Claude API | HTTP Request to `api.anthropic.com/v1/messages` with credential `anthropic-api` | Same pattern for classification/reply gen |
| Error handling | Canary pattern with error output routing | Same pattern |
| Slack notifications | HTTP Request POST to webhook URL | Same webhook: `https://hooks.slack.com/services/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` |

### Dashboard Patterns (from Engagement Tab)

| Pattern | Current Implementation | WF7 Dashboard Additions |
|---|---|---|
| Data fetching | Parallel `Promise.all` in `getLinkedInContentDashboardData()` | Add `getRecentIncomingComments()` to the parallel fetch |
| TypeScript types | Interface per table in `linkedin-content-queries.ts` | Add `PostIncomingCommentDb` interface |
| Tab layout | 12-col grid, left 8 cols for main content, right 4 for sidebar | Add comment section below ROI metrics within Engagement tab |
| Supabase queries | `.schema('linkedin_engine').from('table')` pattern | Same pattern for new `post_incoming_comments` table |
| API routes | `/api/linkedin-content/...` with Supabase mutations | Not needed unless comment view has interactive actions |

### Key Files That Will Be Modified

| File | Change |
|---|---|
| `n8n-workflows/linkedin-engine/wf7-post-publish-monitor.json` | NEW -- main workflow file |
| `supabase/migrations/20260216_linkedin_engine_monitoring.sql` | NEW -- schema migration |
| `dashboard/src/lib/api/linkedin-content-queries.ts` | ADD `PostIncomingCommentDb` type + `getRecentIncomingComments()` query |
| `dashboard/src/app/dashboard/marketing/linkedin-content/linkedin-content.tsx` | ADD incoming comments section to Engagement tab |
| `business-os/workflows/README-wf7-post-publish-monitor.md` | NEW -- workflow documentation |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| LinkedIn socialActions/comments GET | Apify scraping | 2024+ (permission closure) | LinkedIn closed `r_member_social` to new apps; scraping is the only option for personal accounts |
| Long-running Wait loops in n8n | Schedule trigger + state-based polling | n8n v2.0+ | Wait node loops are unreliable for multi-hour/day durations |
| LinkedIn API v1 (ugcPosts) | LinkedIn API v2 (rest/) with versioned headers | 2023 | Must use `Linkedin-Version: YYYYMM` and `X-Restli-Protocol-Version: 2.0.0` headers |
| socialActions/likes | Reactions API (`/rest/reactions/`) | 2023 | Reactions replaced likes with 7 types: LIKE, PRAISE, EMPATHY, INTEREST, APPRECIATION, ENTERTAINMENT |

**Deprecated/outdated:**
- `r_member_social` permission: CLOSED, not accepting applications
- LinkedIn API version `202501` and `202502`: Sunset -- must use `202603` or later
- `socialActions/likes`: Replaced by Reactions API

## LinkedIn API Permissions Summary

| Permission | Status | What It Does | Relevant to WF7? |
|---|---|---|---|
| `w_member_social` | OPEN (self-service) | Post, comment, react on behalf of member | YES -- for posting reply comments |
| `r_member_social` | CLOSED | Read posts, comments, likes on behalf of member | YES but NOT AVAILABLE |
| `r_member_postAnalytics` | Marketing API (needs approval) | Read post impressions, reactions, comments counts | Useful for analytics but may not be available |
| `w_member_social_feed` | Migration from w_member_social | Same as above, new name | Same as w_member_social |

**Implication for WF7:**
- READ operations (get comments, get reaction counts) --> Use Apify
- WRITE operations (post replies) --> Can use LinkedIn API with `w_member_social` (but WF7 only generates suggestions, not auto-posts replies)

## Apify Data Approach (Recommended)

### Two-Actor Strategy

1. **Comments Actor** (`harvestapi~linkedin-post-comments`): Given a post URL, returns all comments with author info, text, timestamp, reaction counts. Use this for comment monitoring.
   - Input: `{ "postUrls": ["https://www.linkedin.com/feed/update/urn:li:activity:XXX/"] }`
   - Output: Array of comment objects with `commentary`, `actor.name`, `actor.linkedinUrl`, `createdAt`, `numComments`, `reactionTypeCounts`

2. **Profile Posts Actor** (`harvestapi~linkedin-profile-posts`): Given Mike's profile URL, returns recent posts with engagement metrics (likes, comments, shares counts). Use this for engagement velocity tracking.
   - Input: `{ "profileUrls": ["https://www.linkedin.com/in/mike-van-horn/"], "maxPosts": 5, "scrapeComments": false, "scrapeReactions": false }`
   - Output: Post objects with `likes`, `comments`, `shares` counts

### Cost Estimation

Per published post (4 posts/week):
- 12 polls in first 2 hours (comments actor): 12 calls
- 12 polls in hours 2-8 (comments actor): 12 calls
- 16 polls in hours 8-24 (comments actor): 16 calls
- 7 daily polls (comments actor): 7 calls
- Total: ~47 Apify calls per post
- At 4 posts/week: ~188 calls/week, ~800 calls/month
- Cost: Negligible within Apify Starter plan ($49/mo, 100 Actor runs/day)

**Optimization:** Only call comments actor when profile-posts actor shows `comments` count has changed since last poll. This could reduce calls by 50-70%.

## Open Questions

1. **LinkedIn `r_member_postAnalytics` availability**
   - What we know: Requires Marketing API access (Community Management product). Need to be a legally registered entity.
   - What's unclear: Whether IAML's existing LinkedIn developer app has this permission, or if it can be requested.
   - Recommendation: Assume NOT available. Use Apify profile-posts actor for engagement metrics. If the permission becomes available later, it can be added as an optimization in Phase 9.

2. **Apify post URL format for comments actor**
   - What we know: Accepts both `linkedin.com/posts/...` and `linkedin.com/feed/update/urn:li:activity:...` formats.
   - What's unclear: Whether the `linkedin_post_id` stored by WF5 (which is a URN like `urn:li:activity:XXX`) can be directly converted to a URL format the comments actor accepts.
   - Recommendation: Construct URL as `https://www.linkedin.com/feed/update/${linkedin_post_id}/` -- this format is confirmed to work.

3. **Reply posting automation**
   - What we know: WF7 generates reply suggestions but does NOT auto-post them. User reviews on dashboard.
   - What's unclear: Whether a future phase should auto-post approved replies via the LinkedIn API.
   - Recommendation: Keep as dashboard-only for Phase 8. Reply posting could be a Phase 10 enrichment item.

4. **Apify `harvestapi~linkedin-post-comments` vs `harvestapi~linkedin-profile-posts` with scrapeComments**
   - What we know: Both can retrieve comments. The dedicated actor takes a post URL directly; the profile actor takes a profile URL and returns all posts.
   - What's unclear: Whether the dedicated comments actor supports the `run-sync-get-dataset-items` pattern used by WF6.
   - Recommendation: Test the dedicated comments actor first. If it doesn't support sync, fall back to profile-posts with `scrapeComments: true` and `maxPosts: 1`.

## Sources

### Primary (HIGH confidence)
- [LinkedIn Comments API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api?view=li-lms-2026-01) -- API structure, response format, permissions
- [LinkedIn Reactions API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/reactions-api?view=li-lms-2026-01) -- Reaction types (LIKE, PRAISE, EMPATHY, INTEREST, APPRECIATION, ENTERTAINMENT)
- [LinkedIn Social Metadata API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/social-metadata-api?view=li-lms-2026-01) -- Comment counts, reaction summaries
- [LinkedIn Member Post Statistics](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics?view=li-lms-2025-11) -- memberCreatorPostAnalytics endpoint
- [LinkedIn Getting Access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) -- Open permissions: ONLY `w_member_social`, `r_member_social` is CLOSED
- Existing codebase: WF5, WF6 workflow JSON, dashboard TypeScript files, migration SQL

### Secondary (MEDIUM confidence)
- [HarvestAPI LinkedIn Profile Posts (GitHub)](https://github.com/HarvestAPI/apify-linkedin-profile-posts) -- Input/output schema for profile-posts actor
- [HarvestAPI Post Comments API docs](https://elrix.mintlify.app/linkedin-api-reference/post/post-comments) -- Input/output for dedicated comments actor
- [Apify LinkedIn Post Comments actor](https://apify.com/harvestapi/linkedin-post-comments) -- Pricing, capabilities
- [n8n Wait node docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/) -- Wait node limitations
- [n8n Sub-workflows docs](https://docs.n8n.io/flow-logic/subworkflows/) -- Execute Workflow node patterns

### Tertiary (LOW confidence)
- [n8n Community: Polling loops](https://community.n8n.io/t/how-to-build-a-polling-loop/110997) -- Community reports of Wait node instability
- [n8n GitHub Issue #15123](https://github.com/n8n-io/n8n/issues/15123) -- Wait node timeout causing infinite loops

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Apify actors verified via official docs and GitHub; LinkedIn API permissions verified via official Microsoft docs
- Architecture: HIGH -- State-driven polling pattern is well-established; avoids documented n8n pitfalls
- Schema design: HIGH -- Follows existing linkedin_engine patterns from Phase 1-7 migrations
- Pitfalls: HIGH -- LinkedIn permission closure verified directly from official "Getting Access" page
- Dashboard integration: HIGH -- Existing Engagement tab code analyzed line-by-line

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days -- LinkedIn API permissions rarely change; Apify actors stable)
