---
phase: 06-publishing
plan: 01
subsystem: workflow
tags: [n8n, linkedin-oauth2, publishing, first-comment, supabase-rest, slack, schedule]

# Dependency graph
requires:
  - phase: 05-content-generation-drafts
    provides: Approved post drafts with full_text and first_comment_text in linkedin_engine.posts
provides:
  - WF5 Publishing & First Comment n8n workflow (schedule-triggered, Tue-Fri 8 AM CST)
  - LinkedIn OAuth2 publishing with native LinkedIn node
  - First comment via LinkedIn REST API Comments endpoint
  - Post status flow: approved -> scheduled -> published
  - Retry logic with revert-to-approved on failure
  - Rich Slack notifications to #linkedin-content
  - Workflow documentation with CEO summary and OAuth2 setup prerequisites
affects: [07-engagement-engine, 08-post-publish-monitor, dashboard-calendar-visual]

# Tech tracking
tech-stack:
  added:
    - "n8n-nodes-base.linkedIn (native LinkedIn post publishing via OAuth2)"
    - "LinkedIn REST API Comments endpoint (HTTP Request with predefinedCredentialType)"
  patterns:
    - "Schedule-triggered daily publishing workflow"
    - "LinkedIn OAuth2 credential shared between native node and HTTP Request"
    - "45-second Wait node for first comment delay (under 65s threshold)"
    - "Retry-once-then-revert pattern for publish failures"
    - "Error output routing (onError: continueErrorOutput) for graceful failure handling"

key-files:
  created:
    - n8n-workflows/linkedin-engine/wf5-publishing-first-comment.json
    - business-os/workflows/README-wf5-publishing-first-comment.md
  modified:
    - business-os/workflows/README.md

key-decisions:
  - "LinkedIn native node for posts, HTTP Request for comments (node can't comment)"
  - "45-second wait for first comment (midpoint of 30-60s range, under 65s threshold)"
  - "PLACEHOLDER values for LinkedIn OAuth2 credential ID and Person URN (user replaces after setup)"
  - "Separate retry branches for publish and comment failures with different outcomes"
  - "Comment failure does not affect post status (post stays published)"
  - "Slack webhook URL B0A9T7E254K for #linkedin-content (different from WF4's channel)"

patterns-established:
  - "LinkedIn OAuth2 credential reuse: native node for posts, predefinedCredentialType for comments"
  - "Retry-once-revert pattern: attempt -> retry -> revert status + alert"
  - "Error output routing for expected failures (onError: continueErrorOutput)"
  - "URL-encoded URN in LinkedIn Comments API path"

# Metrics
duration: 6min
completed: 2026-02-15
---

# Phase 6 Plan 1: Publishing & First Comment Summary

**WF5 n8n workflow (32 nodes) with schedule trigger (Tue-Fri 8 AM CST), LinkedIn native node publishing, first comment via REST API after 45s wait, retry-once-revert pattern, and rich Slack notifications to #linkedin-content**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-16T02:03:32Z
- **Completed:** 2026-02-16T02:09:56Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- WF5 Publishing & First Comment workflow: 32-node schedule-triggered n8n workflow
- LinkedIn native node for post creation with OAuth2 credential placeholder
- First comment via LinkedIn REST API Comments endpoint with URL-encoded URN
- Retry logic: publish retry once with 5-min wait, comment retry once immediately
- Comprehensive documentation with CEO summary and step-by-step OAuth2 setup instructions
- Workflow index updated with WF5 entry

## Task Commits

Each task was committed atomically:

1. **Task 1: Build WF5 Publishing & First Comment n8n workflow JSON** - `7dcd0287` (feat)
2. **Task 2: Write WF5 documentation and update workflow index** - `dc501a85` (docs)

## Files Created/Modified
- `n8n-workflows/linkedin-engine/wf5-publishing-first-comment.json` - 32-node WF5 workflow (1203 lines)
- `business-os/workflows/README-wf5-publishing-first-comment.md` - Full workflow documentation with OAuth2 setup guide
- `business-os/workflows/README.md` - Workflow index updated with WF5 entry

## Decisions Made
- **LinkedIn native node for posts, HTTP Request for comments:** The n8n LinkedIn node only supports post creation, not commenting. Used `predefinedCredentialType: "linkedInOAuth2Api"` on HTTP Request nodes to share the same OAuth2 token for comments.
- **45-second wait between post and comment:** Midpoint of 30-60 second range specified in plan. Under the 65-second n8n Wait node threshold, so workflow stays in-process (no database offload).
- **PLACEHOLDER approach for credentials:** Since LinkedIn OAuth2 requires manual setup (developer app, consent screen), the workflow uses clearly-marked PLACEHOLDER values that the user replaces after completing the 5-step setup process.
- **32 nodes (above 22-27 estimate):** The plan specified 22-27 nodes but also required comprehensive retry branches for both publish and comment failures, plus separate error handling for each. The additional nodes (comment retry prep, retry first comment, slack comment error, separate retry publish node, revert node) are all necessary for the specified failure handling.
- **Slack webhook B0A9T7E254K:** Used the #linkedin-content channel webhook from CONTEXT.md, not the WF4 webhook (B0A8XLFMN6M) which goes to a different channel.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

LinkedIn OAuth2 credentials must be configured before WF5 can run. Full setup instructions are in the README:

1. Create LinkedIn Developer App at developer.linkedin.com
2. Add "Share on LinkedIn" and "Sign In with LinkedIn" products
3. Copy Client ID and Client Secret
4. Create LinkedIn OAuth2 API credential in n8n, authorize as Mike's account
5. Get Person URN via `GET /v2/userinfo`, construct `urn:li:person:{sub}`
6. Replace 5 PLACEHOLDER values in the workflow JSON

## Next Phase Readiness
- WF5 workflow JSON ready for import into n8n at n8n.realtyamp.ai
- LinkedIn OAuth2 setup required before activation (documented in README)
- After setup: replace PLACEHOLDERs, import, test with manual trigger, then activate schedule
- Phase 7 (Engagement Engine) can proceed with planning -- depends on Phase 6 being functional
- Phase 8 (Post-Publish Monitor) can also proceed -- depends on published posts existing in the database
- WF5 n8n-brain pattern registration pending (register after n8n import)

---
*Phase: 06-publishing*
*Completed: 2026-02-15*
