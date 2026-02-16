# WF5: Publishing & First Comment

> **CEO Summary:** Automatically publishes approved LinkedIn post drafts on schedule (Tue-Fri 8 AM CST), posts a first comment 45 seconds later to boost engagement, logs results to Supabase, and sends rich Slack notifications -- turning approved drafts into live LinkedIn content without manual intervention.

## Overview

| Field | Value |
|-------|-------|
| **Workflow** | WF5: Publishing & First Comment |
| **System** | LinkedIn Content Engine |
| **Trigger** | Schedule: Tue-Fri 8:00 AM CST (14:00 UTC) |
| **Input** | `linkedin_engine.content_calendar` + `linkedin_engine.posts` |
| **Output** | LinkedIn post + comment, updated statuses in Supabase |
| **Dependencies** | LinkedIn OAuth2, Supabase REST, Slack |
| **Error Handling** | Canary pattern + retry (1x with 5-min wait) + revert to approved |
| **n8n Tags** | linkedin-content-engine |
| **JSON File** | `n8n-workflows/linkedin-engine/wf5-publishing-first-comment.json` |

## What It Does

WF5 is the publishing automation that turns approved drafts into live LinkedIn posts. Every weekday morning (Tue-Fri at 8 AM CST), it:

1. **Checks today's calendar slot** -- looks up `content_calendar` for today's date and finds the linked `post_id`
2. **Validates the post** -- fetches the post record and verifies status is `approved`
3. **Marks as scheduled** -- updates post status to `scheduled` (signals intent to publish)
4. **Publishes to LinkedIn** -- uses the native LinkedIn node with OAuth2 to create the post
5. **Extracts the post URN** -- captures the LinkedIn post identifier from the API response
6. **Updates Supabase** -- stores `linkedin_post_id` and `published_at` on the post, updates calendar to `published`
7. **Waits 45 seconds** -- delay before first comment (LinkedIn best practice for engagement)
8. **Posts the first comment** -- via LinkedIn REST API Comments endpoint with the same OAuth2 credential
9. **Sends Slack notification** -- rich format with title, series, pillar, hook details, character count, and LinkedIn link
10. **Logs the run** -- records completion in `workflow_runs` table

### Status Flow

```
approved -> scheduled -> published
```

If publishing fails after retry:
```
approved -> scheduled -> approved (reverted, auto-retries next day)
```

### Skip Logic

If there is no calendar slot for today, or the slot has no linked post, or the post status is not `approved`, the workflow skips silently. No Slack alert is sent for skips -- the run is logged to `workflow_runs` with `items_processed: 0` and a `skip_reason` in metadata.

### Retry Logic

- **Publish failure:** Waits 5 minutes, retries once. If the retry also fails, reverts the post status back to `approved` and sends a Slack error alert. The post will automatically retry on the next scheduled run if a calendar slot exists.
- **Comment failure:** Retries the comment once immediately. If the retry also fails, sends a Slack alert but does NOT change the post status -- the post stays `published` since it was already live on LinkedIn.

## Trigger

**Schedule:** Cron `0 14 * * 2-5` (Tuesday through Friday at 14:00 UTC = 8:00 AM CST)

**Timezone:** America/Chicago

**Execution Timeout:** 600 seconds (10 minutes, accommodates the 45-second Wait node plus 5-minute retry wait)

## Input / Output

### Input

- **Source:** `linkedin_engine.content_calendar` (today's slot by `post_date`)
- **Fields:** id, post_id, series, pillar, status
- **Linked:** `linkedin_engine.posts` (full post record by `post_id`)
- **Post Fields:** full_text, first_comment_text, hook_text, hook_category, hook_variation, series, pillar, status

### Output

- **LinkedIn:** Published text post + first comment
- **Supabase posts:** `status=published`, `linkedin_post_id={urn}`, `published_at={timestamp}`
- **Supabase content_calendar:** `status=published`
- **Supabase workflow_runs:** Run log entry with status, items_processed, metadata
- **Slack:** Rich success notification to #linkedin-content

## Flow Diagram

```
Schedule (Tue-Fri 8 AM CST)
  |
  Build Today's Date & Log Run Start
  |
  Fetch Calendar Slot -> Check Slot -> Has Post? --NO--> Log Skip
  |YES
  Fetch Post Details -> Status == approved? --NO--> Log Skip
  |YES
  Set Status 'scheduled'
  |
  Prepare Publish Data
  |
  LinkedIn: Publish Post --FAIL--> Check Retry Count
  |                                   |
  |                              Should Retry?
  |                              |YES            |NO
  |                         Wait 5 min      Revert to 'approved'
  |                              |                |
  |                         Retry Publish    Slack Publish Error
  |                         |SUCCESS  |FAIL
  |                         |         +-> Revert to 'approved' -> Slack Publish Error
  |<------------------------+
  |
  Extract Post URN
  |
  Update Post (linkedin_post_id, published_at, status=published)
  |
  Update Calendar (status=published)
  |
  Wait 45 seconds
  |
  Post First Comment --FAIL--> Comment Retry Prep
  |                                   |
  |                              Retry First Comment
  |                              |SUCCESS  |FAIL
  |                              |    Slack Comment Error (post stays published)
  |<-----------------------------+
  |
  Slack Success Notification
  |
  Log Run Complete

Error Trigger -> Log Error (canary) -> Slack Error Alert
```

## Prerequisites

### LinkedIn OAuth2 Setup (One-Time)

Before importing WF5 into n8n, you must set up LinkedIn OAuth2 credentials:

#### Step 1: Create LinkedIn Developer App

1. Go to https://developer.linkedin.com/
2. Click "Create App"
3. Fill in: App name ("IAML Content Engine"), LinkedIn Page (link to IAML company page), App logo
4. Accept terms and create

#### Step 2: Add Required Products

1. In the app dashboard, go to "Products" tab
2. Add **"Share on LinkedIn"** -- grants `w_member_social` scope (post, comment, like)
3. Add **"Sign In with LinkedIn using OpenID Connect"** -- grants `openid`, `profile` scopes
4. Wait for product approval (usually instant for "Share on LinkedIn")

#### Step 3: Get Credentials

1. Go to "Auth" tab in the app dashboard
2. Copy **Client ID** and **Primary Client Secret**
3. Verify scopes include: `w_member_social`, `openid`, `profile`

#### Step 4: Configure in n8n

1. In n8n, go to Credentials > Add Credential > LinkedIn OAuth2 API
2. Enter Client ID and Client Secret
3. Click "Connect" -- opens LinkedIn OAuth2 consent screen
4. Authorize as Mike's LinkedIn account
5. n8n stores access + refresh tokens automatically
6. **Note the credential ID** assigned by n8n (needed for workflow JSON)

#### Step 5: Get Person URN

1. In n8n, create a temporary workflow with an HTTP Request node
2. Set: `GET https://api.linkedin.com/v2/userinfo`
3. Authentication: Predefined Credential Type > LinkedIn OAuth2 API
4. Execute and copy the `sub` field from the response
5. Construct Person URN: `urn:li:person:{sub_value}`

#### After Setup: Update Workflow JSON

Replace these two PLACEHOLDER values in `wf5-publishing-first-comment.json`:

| Placeholder | Replace With |
|-------------|-------------|
| `PLACEHOLDER_LINKEDIN_CREDENTIAL_ID` | The credential ID from n8n (Step 4) |
| `PLACEHOLDER_PERSON_URN` | The Person URN from Step 5 (e.g., `urn:li:person:abc123`) |

Search for "PLACEHOLDER" in the JSON file to find all 5 occurrences that need replacement.

## Node List

| # | ID | Name | Type |
|---|-----|------|------|
| 1 | wf5-schedule-trigger | Tue-Fri 8 AM CST | scheduleTrigger |
| 2 | wf5-build-date | Build Today's Date | code |
| 3 | wf5-log-run-start | Log Run Start | httpRequest |
| 4 | wf5-fetch-calendar | Fetch Calendar Slot | httpRequest |
| 5 | wf5-check-calendar | Check Calendar Slot | code |
| 6 | wf5-if-has-slot | Has Calendar Slot? | if |
| 7 | wf5-fetch-post | Fetch Post Details | httpRequest |
| 8 | wf5-if-approved | Post Approved? | if |
| 9 | wf5-set-scheduled | Set Status Scheduled | httpRequest |
| 10 | wf5-prepare-publish | Prepare Publish Data | code |
| 11 | wf5-linkedin-publish | LinkedIn: Publish Post | linkedIn |
| 12 | wf5-extract-urn | Extract Post URN | code |
| 13 | wf5-update-post-published | Update Post Published | httpRequest |
| 14 | wf5-update-calendar-published | Update Calendar Published | httpRequest |
| 15 | wf5-wait-45s | Wait 45 Seconds | wait |
| 16 | wf5-post-first-comment | Post First Comment | httpRequest |
| 17 | wf5-slack-success | Slack Success Notification | httpRequest |
| 18 | wf5-log-run-complete | Log Run Complete | httpRequest |
| 19 | wf5-log-skip-reason | Log Skip Reason | code |
| 20 | wf5-log-skip-run | Log Skip Run | httpRequest |
| 21 | wf5-check-retry | Check Retry Count | code |
| 22 | wf5-if-should-retry | Should Retry? | if |
| 23 | wf5-wait-5min-retry | Wait 5 Min Retry | wait |
| 24 | wf5-linkedin-retry | LinkedIn: Retry Publish | linkedIn |
| 25 | wf5-revert-to-approved | Revert to Approved | httpRequest |
| 26 | wf5-slack-publish-error | Slack Publish Error | httpRequest |
| 27 | wf5-comment-retry-prep | Comment Retry Prep | code |
| 28 | wf5-comment-retry | Retry First Comment | httpRequest |
| 29 | wf5-slack-comment-error | Slack Comment Error | httpRequest |
| 30 | wf5-error-trigger | Error Trigger | errorTrigger |
| 31 | wf5-log-error | Log Error (Canary) | httpRequest |
| 32 | wf5-slack-error-canary | Slack Error Alert (Canary) | httpRequest |

## Credentials

| Service | Credential ID | Type | Purpose |
|---------|--------------|------|---------|
| Supabase REST | `Dy6aCSbL5Tup4TnE` | httpHeaderAuth | Read calendar/posts, update statuses, log runs |
| LinkedIn OAuth2 | `PLACEHOLDER_LINKEDIN_CREDENTIAL_ID` | linkedInOAuth2Api | Publish posts and comments to LinkedIn |
| Slack | Webhook URL (hardcoded) | webhook | Success/error notifications to #linkedin-content |

## Monitoring

### Verify Workflow is Running

Check workflow runs in Supabase:
```sql
SELECT * FROM linkedin_engine.workflow_runs
WHERE workflow_name = 'wf5-publishing-first-comment'
ORDER BY started_at DESC LIMIT 10;
```

Check published posts:
```sql
SELECT id, hook_text, linkedin_post_id, published_at, status
FROM linkedin_engine.posts
WHERE status = 'published'
ORDER BY published_at DESC LIMIT 10;
```

Check calendar status:
```sql
SELECT post_date, status, post_id
FROM linkedin_engine.content_calendar
WHERE status = 'published'
ORDER BY post_date DESC LIMIT 10;
```

### Slack Channel

Monitor `#linkedin-content` for:
- Success notifications (green checkmark with post details and LinkedIn link)
- Publish error alerts (red X with error details)
- Comment error alerts (warning with manual action needed)
- Canary error alerts (rotating light with execution details)

### Token Expiration

| Token | Lifetime | Auto-Refresh |
|-------|----------|--------------|
| Access token | ~60 days | Yes (n8n handles automatically) |
| Refresh token | ~365 days | Manual re-authorization required |

If publishing fails with 401 Unauthorized after a period of working correctly, the OAuth2 token likely needs re-authorization. Go to n8n Credentials > LinkedIn OAuth2 > Re-connect.

### Rate Limits

LinkedIn allows 150 requests/day per member for the "Share on LinkedIn" product. WF5 uses 2-4 requests per run (1 post + 1 comment + potential retries), well within limits at one post per day Tue-Fri.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "No calendar slot for today" in workflow_runs | Verify content_calendar has a row with today's post_date and a non-null post_id |
| "Post status is not approved" | Post linked to today's calendar slot is still draft/scheduled. Approve it in the dashboard Drafts tab. |
| 401 Unauthorized from LinkedIn | OAuth2 token expired. Re-authorize in n8n Credentials > LinkedIn OAuth2 |
| Post published but comment failed | Check Slack for comment error. Post the first comment manually on LinkedIn. |
| Post reverted to approved after failure | LinkedIn API error. Check n8n execution log. Will auto-retry next scheduled run. |
| PLACEHOLDER errors in execution | OAuth2 setup not completed. Replace PLACEHOLDER values in workflow JSON. |
| Workflow not running | Ensure workflow is active (toggle on) in n8n. Check schedule trigger timezone. |

## Monthly Cost Impact

- LinkedIn API: Free (within rate limits)
- n8n execution: Minimal (self-hosted, 1 run/day Tue-Fri)
- **Monthly total: $0** (no per-call API costs for LinkedIn publishing)

## n8n-brain Registration

After importing the workflow into n8n, register the pattern:

```javascript
// Via n8n-brain MCP tool: store_pattern
{
  "name": "WF5 Publishing & First Comment",
  "description": "Publishes approved LinkedIn posts on schedule, posts first comment after 45s delay, logs to Supabase, notifies via Slack",
  "workflow_json": "<contents of wf5-publishing-first-comment.json>",
  "tags": ["publishing", "linkedin", "first-comment", "oauth2", "schedule"],
  "services": ["linkedin", "supabase", "slack"],
  "node_types": ["scheduleTrigger", "linkedIn", "wait", "httpRequest", "code", "if", "errorTrigger"],
  "trigger_type": "schedule",
  "notes": "LinkedIn node for posts, HTTP Request for comments (node can't comment). 45s Wait node under 65s threshold. Retry once on publish fail, revert to approved. Person URN hardcoded."
}
```

## File Location

`n8n-workflows/linkedin-engine/wf5-publishing-first-comment.json`
