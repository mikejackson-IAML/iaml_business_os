# Phase 6: Publishing - Research

**Researched:** 2026-02-15
**Domain:** n8n workflow (WF5 Publishing & First Comment) + LinkedIn API (Posts + Comments) + LinkedIn OAuth2
**Confidence:** HIGH

## Summary

Phase 6 builds WF5, the publishing workflow that takes approved posts from the database, publishes them to LinkedIn via API, posts a first comment 30-60 seconds later, logs results to Supabase, updates the content calendar, and sends Slack notifications. This is purely an n8n workflow -- no dashboard UI changes.

The critical technical discovery is that **n8n's native LinkedIn node can ONLY create posts -- it cannot post comments**. The node supports text posts, article posts, and image posts, but has no comment operation. This means:
- Use the **n8n native LinkedIn node** (with `linkedInOAuth2Api` credential) to publish the main post
- Use an **HTTP Request node** with the LinkedIn OAuth2 credential (`predefinedCredentialType: "linkedInOAuth2Api"`) to post the first comment via the REST API `/rest/socialActions/{postUrn}/comments` endpoint

A secondary discovery is the **Wait node 65-second threshold**: for waits under 65 seconds, n8n does NOT offload execution to the database -- it keeps the process running in memory. Since we want a 30-60 second delay between post and comment, the Wait node will work correctly (it stays in-process, which is fine for a short delay), but the workflow execution timeout must accommodate the total execution time including the wait.

**Primary recommendation:** Use the native LinkedIn node for post creation (simplest auth handling), HTTP Request node with LinkedIn OAuth2 credential for the comment, a Wait node set to 45 seconds for the delay, and follow all established WF1-WF4 patterns for Supabase REST, canary error handling, and Slack notifications.

## Standard Stack

The stack is fully locked by prior phases. One new credential is needed.

### Core (Already in Use)
| Library/Tool | Version | Purpose | Already Established |
|---------|---------|---------|---------------------|
| n8n (self-hosted) | Latest | Workflow orchestration for WF5 | Yes - WF1-WF4 built |
| Supabase REST API | v1 | Database reads/writes from n8n | Yes - `Dy6aCSbL5Tup4TnE` credential |
| Slack Webhook | N/A | Notifications to #linkedin-content | Yes - used in WF4 |

### New for This Phase
| Library/Tool | Purpose | Setup Required |
|---------|---------|----------------|
| n8n LinkedIn node (`n8n-nodes-base.linkedIn`) | Publish text posts to LinkedIn | Configure `linkedInOAuth2Api` credential |
| LinkedIn REST API (`api.linkedin.com/rest/`) | Post first comment (not supported by native node) | Uses same OAuth2 credential via HTTP Request node |

### No New npm Packages
All required n8n nodes are built-in. No community nodes needed.

## Architecture Patterns

### WF5 Workflow Flow

```
Schedule Trigger (Tue-Fri 8 AM CST = 14:00 UTC)
  |
  v
Fetch Today's Calendar Slot (HTTP Request GET content_calendar)
  |
  v
IF: Has calendar slot with post_id? --NO--> Skip Silently (no-op)
  |YES
  v
Fetch Post Details (HTTP Request GET posts)
  |
  v
IF: Post status == 'approved'? --NO--> Skip Silently (no-op)
  |YES
  v
Update Post Status to 'scheduled' (HTTP Request PATCH posts)
  |
  v
Publish to LinkedIn (LinkedIn Node - Create Post)
  |
  v                                    |--FAIL--> Wait 5 min --> Retry Once
Extract Post URN from response header  |--FAIL--> Revert to 'approved' + Slack Alert
  |
  v
Update Post: linkedin_post_id + published_at (HTTP Request PATCH posts)
  |
  v
Update Calendar: status='published' (HTTP Request PATCH content_calendar)
  |
  v
Wait Node (45 seconds)
  |
  v
Post First Comment (HTTP Request POST to LinkedIn Comments API)
  |                                    |--FAIL--> Retry Once --> Slack Alert (post stays 'published')
  v
Slack Notification (Rich format: title, hook, series, pillar, char count, link)
  |
  v
Log Run Complete (HTTP Request POST workflow_runs)
```

### Error Branch (Canary Pattern)
```
Error Trigger
  |
  v
Log Error to workflow_runs (HTTP Request POST)
  |
  v
Revert Post Status if needed (HTTP Request PATCH posts -> 'approved')
  |
  v
Slack Error Alert (#linkedin-content)
```

### Schedule Trigger Configuration

8 AM CST = 14:00 UTC. Tue-Fri only.

Cron expression: `0 14 * * 2-5`

Breaking it down:
- `0` = minute 0
- `14` = hour 14 (UTC) = 8 AM CST (UTC-6)
- `*` = any day of month
- `*` = any month
- `2-5` = Tuesday(2) through Friday(5)

**Source:** Verified against WF1 pattern which uses `0 12 * * *` for 6 AM CST (12:00 UTC). Confirmed: n8n uses standard 5-field cron, with 0=Sunday.

```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 14 * * 2-5"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2
}
```

### LinkedIn Node for Post Creation

The native LinkedIn node (`n8n-nodes-base.linkedIn`) creates posts with OAuth2 authentication. It handles token refresh automatically.

**Node configuration:**
```json
{
  "parameters": {
    "person": "={{ $json.person_urn }}",
    "text": "={{ $json.full_text }}",
    "options": {}
  },
  "type": "n8n-nodes-base.linkedIn",
  "typeVersion": 1,
  "credentials": {
    "linkedInOAuth2Api": {
      "id": "<credential_id>",
      "name": "LinkedIn OAuth2"
    }
  }
}
```

The node returns the response with the post URN in the `id` field or in the `X-RestLi-Id` header. The URN format is `urn:li:share:XXXXX` or `urn:li:ugcPost:XXXXX`.

**Critical note:** The person URN (`urn:li:person:{id}`) must be obtained during OAuth2 setup. During the credential configuration flow, the authenticated user's profile can be fetched via `GET https://api.linkedin.com/v2/userinfo` (with `openid` + `profile` scopes) or `GET https://api.linkedin.com/v2/me`. The `sub` claim from userinfo or `id` field from `/v2/me` gives the person ID to construct `urn:li:person:{id}`.

**Alternative approach (recommended for simplicity):** If the n8n LinkedIn node handles the person URN automatically (which it appears to -- it has a "Person" field that may auto-populate), this becomes simpler. Otherwise, hardcode the person URN in the workflow since this is Mike's personal profile only.

### HTTP Request Node for First Comment

The Comments API requires a direct REST API call since the native LinkedIn node does not support commenting.

**Endpoint:** `POST https://api.linkedin.com/rest/socialActions/{postUrn}/comments`

**Required headers:**
- `Authorization: Bearer {token}` (handled by n8n OAuth2 credential)
- `Content-Type: application/json`
- `X-Restli-Protocol-Version: 2.0.0`
- `LinkedIn-Version: 202402` (use a recent stable version in YYYYMM format)

**Request body:**
```json
{
  "actor": "urn:li:person:{personId}",
  "object": "{postUrn}",
  "message": {
    "text": "{{ first_comment_text }}"
  }
}
```

**Source:** LinkedIn Comments API official docs (Microsoft Learn, updated 2025-10-16)

**n8n HTTP Request node configuration:**
```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://api.linkedin.com/rest/socialActions/{{ encodeURIComponent($json.linkedin_post_urn) }}/comments",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "linkedInOAuth2Api",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "Content-Type", "value": "application/json" },
        { "name": "X-Restli-Protocol-Version", "value": "2.0.0" },
        { "name": "LinkedIn-Version", "value": "202402" }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={ ... comment payload ... }"
  },
  "credentials": {
    "linkedInOAuth2Api": {
      "id": "<credential_id>",
      "name": "LinkedIn OAuth2"
    }
  }
}
```

**Important:** The `{postUrn}` in the URL must be URL-encoded. A `urn:li:share:123456` becomes `urn%3Ali%3Ashare%3A123456`. Use `encodeURIComponent()` in n8n expressions.

### Wait Node Configuration

For the 30-60 second delay between post and comment:

```json
{
  "parameters": {
    "resume": "timeInterval",
    "interval": 45,
    "unit": "seconds"
  },
  "type": "n8n-nodes-base.wait",
  "typeVersion": 1.1
}
```

**Key finding:** n8n's Wait node has a 65-second threshold. For waits UNDER 65 seconds, the workflow stays in memory (does not offload to database). This is actually ideal for our 45-second delay -- the process keeps running without the overhead of serialize/deserialize. However, the **workflow execution timeout** must be long enough to cover the full execution including the wait. Set `executionTimeout: 600` (10 minutes) in workflow settings to be safe.

**Recommendation:** Use 45 seconds (midpoint of 30-60 range). This is under the 65-second threshold, so the workflow stays in-process -- simpler and more reliable.

### Post URN Extraction

The LinkedIn Posts API (and n8n LinkedIn node) returns the post URN in the response. Two formats are possible:
- `urn:li:share:XXXXX` (older)
- `urn:li:ugcPost:XXXXX` (newer)

Either can be used with the Comments API `socialActions` endpoint. The workflow must extract this URN from the LinkedIn node response and pass it to:
1. The Supabase update (store as `linkedin_post_id`)
2. The Comments API URL
3. The Slack notification (construct LinkedIn URL: `https://www.linkedin.com/feed/update/{urn}`)

### Supabase REST Patterns (Established)

All Supabase calls follow the exact same pattern as WF1-WF4:

**Headers:**
```
Accept-Profile: linkedin_engine
Content-Profile: linkedin_engine
Content-Type: application/json
```

**Credential:** `Dy6aCSbL5Tup4TnE` (httpHeaderAuth, Supabase REST)

**Base URL:** `https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/`

**Key queries:**
- Fetch today's calendar slot: `GET /content_calendar?post_date=eq.{today}&status=eq.approved&select=*,posts(*)`
- Update post status: `PATCH /posts?id=eq.{post_id}` with body
- Update calendar status: `PATCH /content_calendar?id=eq.{calendar_id}` with body
- Log workflow run: `POST /workflow_runs` with body

### Slack Notification Pattern

Rich notification to #linkedin-content channel:

**URL:** `https://hooks.slack.com/services/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`

**Rich format:**
```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Published to LinkedIn* :white_check_mark:\n*Title:* {hook_text}\n*Series:* {series}\n*Pillar:* {pillar}\n*Hook:* {hook_category} ({hook_variation})\n*Characters:* {char_count}\n*Link:* <https://www.linkedin.com/feed/update/{linkedin_post_urn}|View on LinkedIn>"
      }
    }
  ]
}
```

**Note:** The Slack webhook URL for `#linkedin-content` is different from the one used in WF4 (which goes to a different channel). Use the URL from CONTEXT.md: `B0A9T7E254K` not `B0A8XLFMN6M`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LinkedIn OAuth2 token management | Custom token refresh logic | n8n's built-in LinkedIn OAuth2 credential | n8n handles token storage, refresh, and injection automatically |
| Post scheduling | Custom cron runner | n8n Schedule Trigger with cron expression | Battle-tested, timezone-aware, handles missed runs |
| Delay between post and comment | setTimeout or polling loop | n8n Wait node | Purpose-built, handles execution state correctly |
| LinkedIn post creation | HTTP Request to Posts API | n8n native LinkedIn node | Handles auth headers, API versioning, and response parsing |
| Error retry logic | Custom retry counter | n8n's built-in retry on error + IF node for manual retry | Simpler, more reliable |

**Key insight:** The only manual HTTP Request to LinkedIn needed is for the comment -- everything else uses built-in n8n nodes or established Supabase REST patterns.

## Common Pitfalls

### Pitfall 1: LinkedIn Node Cannot Comment
**What goes wrong:** Assuming the n8n LinkedIn node handles all LinkedIn operations including comments.
**Why it happens:** The LinkedIn node documentation says "post, comment, and like" in the OAuth2 scope description, which sounds comprehensive. But the n8n node itself only implements the "create post" operation.
**How to avoid:** Use HTTP Request node with `predefinedCredentialType: "linkedInOAuth2Api"` for comments. This reuses the same OAuth2 token.
**Warning signs:** 404 or "operation not supported" errors when trying to comment via the LinkedIn node.

### Pitfall 2: Post URN URL Encoding in Comments API
**What goes wrong:** The Comments API URL includes the post URN as a path segment: `/rest/socialActions/{postUrn}/comments`. If the URN is not URL-encoded, the colons in `urn:li:share:123` break the URL.
**Why it happens:** URNs contain colons which are special characters in URLs.
**How to avoid:** Use `encodeURIComponent()` on the URN in the n8n expression: `{{ encodeURIComponent($json.linkedin_post_urn) }}`.
**Warning signs:** 400 Bad Request or 404 errors on the comment API call.

### Pitfall 3: LinkedIn API Version Header Required
**What goes wrong:** The LinkedIn REST API requires a `LinkedIn-Version` header in YYYYMM format. Missing it returns a 400 error.
**Why it happens:** LinkedIn versioned their API and made this header mandatory.
**How to avoid:** Always include `LinkedIn-Version: 202402` (or a recent stable version) in HTTP Request headers.
**Warning signs:** "Missing required header" or "Unsupported API version" errors.

### Pitfall 4: Wait Node vs Workflow Timeout
**What goes wrong:** The 45-second Wait node delay, combined with the rest of the workflow execution time, exceeds the default workflow timeout.
**Why it happens:** Default n8n execution timeout might be shorter than the total workflow time (schedule check + LinkedIn publish + 45s wait + comment + Supabase updates).
**How to avoid:** Set `executionTimeout: 600` (10 minutes) in workflow settings, matching WF4's timeout.
**Warning signs:** Workflow killed mid-execution, comment never posted.

### Pitfall 5: Post Editing Within First Hour
**What goes wrong:** If the workflow updates the post text after publishing (e.g., to fix a typo), LinkedIn's algorithm resets the post's distribution.
**Why it happens:** LinkedIn penalizes post edits within the first hour of publishing.
**How to avoid:** The workflow MUST NOT modify the LinkedIn post after publishing. All content should be finalized during the approval step (Phase 5). The workflow only reads `full_text`, never writes back to LinkedIn.
**Warning signs:** Dramatically lower impressions on posts that were edited.

### Pitfall 6: OAuth2 Token Expiration
**What goes wrong:** LinkedIn OAuth2 access tokens expire (typically 60 days). If the token expires between runs, publishing fails silently.
**Why it happens:** Unlike API keys, OAuth2 tokens have limited lifespans. n8n can refresh them automatically IF the refresh token is still valid.
**How to avoid:** n8n's LinkedIn OAuth2 credential handles automatic refresh. However, if the refresh token also expires (365 days), a manual re-authentication is required. Set up a monitoring check -- if publishing fails with 401, the Slack error alert should specifically flag "OAuth2 token may need re-authorization".
**Warning signs:** 401 Unauthorized errors from LinkedIn API after a long period of no issues.

### Pitfall 7: Rate Limits
**What goes wrong:** LinkedIn enforces rate limits: 150 requests/day per member for the Share on LinkedIn product.
**Why it happens:** Publishing once per day plus one comment is only 2 calls, well within limits. But if retries pile up or other workflows hit the same token, limits could be reached.
**How to avoid:** Keep retry count at 1 (not unlimited retries). Log all API calls. Our schedule (one post Tue-Fri) uses max 8 calls/week, far under the 150/day limit.
**Warning signs:** 429 Too Many Requests from LinkedIn API.

### Pitfall 8: Calendar Slot Query Date Matching
**What goes wrong:** The calendar slot query uses `post_date = today()`, but if the n8n server timezone differs from CST, "today" might be wrong.
**Why it happens:** The workflow runs at 8 AM CST, but if the n8n server is in UTC, `$now.toISODate()` could return yesterday's or tomorrow's date.
**How to avoid:** The workflow settings already set `timezone: "America/Chicago"`. Use `$now.toISODate()` which respects the workflow timezone setting. Verify this matches the database `post_date` format (DATE type, no time component).
**Warning signs:** "No calendar slot for today" errors when a slot clearly exists in the database.

## Code Examples

### 1. Fetch Today's Approved Post via Calendar

```javascript
// Code node: Build today's date in CST timezone
// n8n $now respects workflow timezone setting (America/Chicago)
const today = $now.toISODate(); // "2026-02-18" format

return [{
  json: {
    today: today,
    run_id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }),
    started_at: new Date().toISOString()
  }
}];
```

HTTP Request to fetch calendar slot:
```
GET https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/content_calendar?post_date=eq.{today}&select=*
```

Then check if a `post_id` is linked and the slot status allows publishing.

### 2. Extract Post URN from LinkedIn Node Response

```javascript
// Code node: Extract the post URN from LinkedIn node response
// The LinkedIn node returns the response differently than raw API
// Check both possible locations

const response = $input.first().json;

// The LinkedIn n8n node may return the URN in different fields
// depending on the node version and API version
let postUrn = response.id || response.urn || response['x-restli-id'];

// If using HTTP Request node directly, check headers
if (!postUrn && response.$response?.headers?.['x-restli-id']) {
  postUrn = response.$response.headers['x-restli-id'];
}

if (!postUrn) {
  throw new Error('Failed to extract LinkedIn post URN from response');
}

// Construct the LinkedIn post URL
const linkedinUrl = `https://www.linkedin.com/feed/update/${postUrn}`;

return [{
  json: {
    linkedin_post_urn: postUrn,
    linkedin_url: linkedinUrl,
    published_at: new Date().toISOString()
  }
}];
```

### 3. Post First Comment via HTTP Request

```javascript
// The comment request body
// actor = person URN (hardcoded for Mike's profile)
// object = the post URN (activity URN format)
// message.text = first_comment_text from the posts table

{
  "actor": "urn:li:person:{MIKE_PERSON_ID}",
  "object": "{{ $json.linkedin_post_urn }}",
  "message": {
    "text": "{{ $json.first_comment_text }}"
  }
}
```

URL: `https://api.linkedin.com/rest/socialActions/{{ encodeURIComponent($json.linkedin_post_urn) }}/comments`

### 4. Retry Logic for LinkedIn Publish Failure

```javascript
// Code node: Check if this is a retry attempt
// Uses workflow static data or metadata to track retry count

const currentRetryCount = $json.retry_count || 0;
const MAX_RETRIES = 1;

if (currentRetryCount < MAX_RETRIES) {
  return [{
    json: {
      ...($input.first().json),
      retry_count: currentRetryCount + 1,
      should_retry: true
    }
  }];
} else {
  return [{
    json: {
      ...($input.first().json),
      should_retry: false,
      revert_to_approved: true
    }
  }];
}
```

### 5. Status Update Sequence

```
approved -> scheduled  (at workflow pickup, before LinkedIn call)
scheduled -> published  (after LinkedIn returns 201 with post URN)
published stays published  (even if first comment fails)
```

If LinkedIn publish fails after retry:
```
scheduled -> approved  (revert, auto-retry next day)
```

## LinkedIn OAuth2 Setup Instructions

This is a ONE-TIME manual setup required before WF5 can run.

### Step 1: Create LinkedIn Developer App

1. Go to https://developer.linkedin.com/
2. Click "Create App"
3. Fill in:
   - App name: "IAML Content Engine"
   - LinkedIn Page: Link to IAML's company page (required, create one if needed)
   - App logo: Any logo image
4. Accept terms and create

### Step 2: Add Required Products

1. In the app dashboard, go to "Products" tab
2. Add **"Share on LinkedIn"** -- grants `w_member_social` scope (post + comment + like)
3. Add **"Sign In with LinkedIn using OpenID Connect"** -- grants `openid`, `profile`, `email` scopes
4. Wait for product approval (usually instant for "Share on LinkedIn")

### Step 3: Get Credentials

1. Go to "Auth" tab in the app dashboard
2. Copy **Client ID**
3. Copy **Primary Client Secret**
4. Note the OAuth 2.0 scopes listed: should include `w_member_social`, `openid`, `profile`

### Step 4: Configure in n8n

1. In n8n, go to Credentials > Add Credential > LinkedIn OAuth2 API
2. Enter:
   - **Client ID:** (from step 3)
   - **Client Secret:** (from step 3)
3. Click "Connect" -- this opens LinkedIn's OAuth2 consent screen
4. Authorize as Mike's LinkedIn account
5. n8n stores the access token and refresh token automatically
6. Note the credential ID assigned by n8n (needed for workflow JSON)

### Step 5: Get Person URN

After OAuth2 is configured, make a test API call from n8n:
- HTTP Request node: `GET https://api.linkedin.com/v2/userinfo`
- Authentication: Predefined Credential Type > LinkedIn OAuth2 API
- The response `sub` field contains the person ID
- Construct URN: `urn:li:person:{sub_value}`
- Store this as a workflow variable or hardcode in the workflow

### Required Scopes Summary

| Scope | Provided By | Purpose |
|-------|-------------|---------|
| `w_member_social` | Share on LinkedIn product | Post, comment, like on behalf of member |
| `openid` | Sign In with LinkedIn | Get person ID via userinfo endpoint |
| `profile` | Sign In with LinkedIn | Access profile data |

### Token Lifecycle

| Token | Lifetime | Auto-Refresh |
|-------|----------|--------------|
| Access token | ~60 days | Yes (n8n handles) |
| Refresh token | ~365 days | Manual re-auth needed |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `v2/ugcPosts` API | `rest/posts` API (Posts API) | 2022-2023 | UgcPosts deprecated; use Posts API for new apps |
| `v2/socialActions` for comments | `rest/socialActions` for comments | Still current | Comments API endpoint unchanged, just base URL format |
| `r_liteprofile` scope | `openid` + `profile` scope (OIDC) | 2023 | Old profile scopes deprecated for new apps |
| No API versioning | `LinkedIn-Version: YYYYMM` header required | 2023 | All REST API calls need version header |
| 202501 API version | 202402+ (202501 sunset) | 2025 | Version 202501 has been sunset; use 202402 or later |

**Current recommended API version:** `202402` (stable, not sunset)

## Open Questions

1. **LinkedIn Node Response Format**
   - What we know: The Posts API returns the post URN in the `x-restli-id` response header. The n8n LinkedIn node wraps this API.
   - What's unclear: Exactly which field the n8n LinkedIn node exposes the post URN in (it might be `id`, `$response.headers`, or a top-level field). Need to verify during implementation by testing the node.
   - Recommendation: Build the extraction Code node to check multiple locations. Test with a manual run before activating the schedule.

2. **Person URN Value**
   - What we know: The person URN format is `urn:li:person:{id}` where `id` comes from the `/v2/userinfo` endpoint.
   - What's unclear: Mike's exact person ID (obtained during OAuth2 setup).
   - Recommendation: Include a "Get Person URN" step in the plan as a prerequisite task. Once obtained, hardcode it in the workflow JSON.

3. **LinkedIn Node vs HTTP Request for Post Creation**
   - What we know: The native LinkedIn node simplifies post creation. HTTP Request with LinkedIn OAuth2 credential also works.
   - What's unclear: Whether the native node properly returns the post URN in a Code-node-accessible field.
   - Recommendation: Try the native LinkedIn node first. If URN extraction proves difficult, fall back to HTTP Request node with the same credential. The HTTP Request approach gives more control over response parsing.

4. **Comments API URN Format**
   - What we know: The Comments API accepts `shareUrn`, `ugcPostUrn`, or `commentUrn` in the URL path. Posts API returns `urn:li:share:XXX` or `urn:li:ugcPost:XXX`.
   - What's unclear: Whether the URN returned by the LinkedIn node can be used directly in the Comments API URL, or if a conversion to activity URN is needed.
   - Recommendation: Test with the raw share/ugcPost URN first. If it fails, the activity URN has the same numeric ID: `urn:li:activity:{same_id}`.

## Sources

### Primary (HIGH confidence)
- [LinkedIn Posts API - Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-01) - Full post creation endpoint, request/response format, permissions
- [LinkedIn Comments API - Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api?view=li-lms-2026-01) - Comment creation endpoint, request body schema, URN formats
- [LinkedIn Profile API - Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api) - Person URN retrieval via `/v2/me`
- [Share on LinkedIn Product - Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin) - OAuth2 scopes, rate limits (150/day member)
- [n8n LinkedIn Node Docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.linkedin/) - Node capabilities (post only, no comments)
- [n8n LinkedIn Credentials Docs](https://docs.n8n.io/integrations/builtin/credentials/linkedin/) - OAuth2 credential setup
- Existing workflow JSON files: `wf1-daily-rss-monitor.json`, `wf4-content-generation-pipeline.json` - Established patterns

### Secondary (MEDIUM confidence)
- [n8n Wait Node Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/) - Wait node configuration, 65-second threshold
- [LinkedIn Posting API 2025 Guide](https://getlate.dev/blog/linkedin-posting-api) - Step-by-step setup, common pitfalls
- [n8n Schedule Trigger Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/) - Cron expression format
- [n8n Community: Custom LinkedIn Node](https://community.n8n.io/t/new-custom-linkedin-node-for-n8n/218904) - Confirms native node limitations

### Tertiary (LOW confidence)
- [n8n Community: Wait node timing](https://community.n8n.io/t/how-long-does-the-wait-node-actually-wait-and-how-can-i-use-it-for-longer-waits/42521) - 65-second threshold details (community-sourced, consistent across multiple reports)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are established from prior phases except LinkedIn credential (well-documented)
- Architecture: HIGH - Workflow pattern mirrors WF1-WF4; LinkedIn API is well-documented by Microsoft
- LinkedIn OAuth2 setup: HIGH - Official Microsoft docs with clear step-by-step
- LinkedIn Comments via HTTP Request: HIGH - Official API docs with curl examples, verified endpoint format
- Wait node behavior: MEDIUM - Community-reported 65-second threshold, consistent but not in official docs
- n8n LinkedIn node response format: MEDIUM - Node is documented but URN extraction specifics need testing

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - LinkedIn API is stable, n8n nodes are stable)
