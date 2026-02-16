# Phase 6: Publishing - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build WF5 (Publishing & First Comment) n8n workflow that publishes approved posts to LinkedIn via OAuth2, posts the first comment, logs results to Supabase, and sends Slack notifications. Content calendar entries updated to 'published' status. No dashboard UI changes in this phase — calendar visual updates come in Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Publishing method
- LinkedIn OAuth2 direct via n8n's native LinkedIn node (NOT Buffer API)
- Credential `linkedInOAuth2Api` — plan should include OAuth2 setup instructions (LinkedIn Developer App, scopes, n8n credential config)
- First comment uses same OAuth2 credential with a Wait node (30-60 second delay)
- Slack notifications go to #linkedin-content channel (webhook URL in PROMPT.md)

### Post selection logic
- Calendar slot matching: WF5 queries `content_calendar` for today's date, finds linked `post_id`, publishes that post
- Verify post status is 'approved' before publishing — skip if draft/rejected/already published
- Status flow: approved → scheduled (at pickup) → published (after LinkedIn confirms)
- If no calendar slot or no approved post for today: skip silently (no Slack alert)

### Failure & recovery
- If LinkedIn publish fails: wait 5 min, retry once. If still fails, revert status to 'approved', send Slack alert with error details
- If first comment fails after successful post: retry comment once, then Slack alert. Mark post as 'published' regardless
- Log all failures to `workflow_runs` table (canary pattern) AND Slack
- Failed posts reverted to 'approved' automatically retry on next scheduled run (next day) if calendar slot exists

### Pre-publish confirmation
- Fully automatic: if post is 'approved' and calendar slot matches today, publish at 8 AM CST with no human confirmation
- Rich Slack notification on success: post title, hook used, series, pillar, character count, and direct link to LinkedIn post

### Calendar & hook tracking
- DB status update only: set `content_calendar.status = 'published'` — no dashboard UI changes in this phase
- Hook selection already handled during draft approval (Phase 5) — WF5 publishes whatever `full_text` is on the post

### Claude's Discretion
- Wait node delay duration within 30-60 second range
- Exact Slack message formatting and block structure
- Retry wait timing (5 min suggested, Claude can adjust)
- Workflow node layout and error branch structure
- Whether to use n8n's LinkedIn node or HTTP Request for commenting (depends on node capabilities)

</decisions>

<specifics>
## Specific Ideas

- Schedule is Tue-Fri 8 AM CST (matches content series rotation)
- "Don't edit posts within first hour" — workflow should NOT modify posts after publishing
- "Don't use LinkedIn's native scheduler" — use API publishing at the scheduled time instead
- Follow existing n8n patterns: Supabase REST API (not Postgres nodes), canary error handling, HTTP Request for Supabase queries
- n8n-brain pattern should be registered after workflow is built

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-publishing*
*Context gathered: 2026-02-15*
