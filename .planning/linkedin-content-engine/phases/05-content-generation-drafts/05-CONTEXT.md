# Phase 5: Content Generation & Drafts - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build WF4 (Content Generation Pipeline) n8n workflow and dashboard Drafts tab. WF4 takes approved topics from Phase 4 and generates post drafts with 3 hook variations, full post text, and first comments. The Drafts tab enables reviewing, comparing hooks, editing, regenerating, and approving drafts. Calendar slot assignment connects approved drafts to specific publishing dates.

Publishing, engagement, and analytics are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Editing & revision flow
- Selective regeneration supported — user can regenerate just hooks, just the body, or the full post independently
- Regeneration accepts user instructions (e.g., "make it more data-driven" or "focus on the compliance angle") via a text input field
- Plain text editing (LinkedIn posts are plain text) — Claude decides between inline vs modal editing pattern

### Generation trigger & status
- Auto-generate on topic approval — approving a topic in the "This Week" tab immediately triggers WF4 with no extra step
- Notification: both Slack (#linkedin-content) AND dashboard badge on the Drafts tab when generation completes
- Failure handling: auto-retry once, then alert via Slack and show error status in dashboard. User can manually retry from dashboard after that.

### Calendar slot assignment
- Auto-assign based on series/day rules (e.g., "not_being_told" → Tuesday), with user override (drag to rearrange)
- Each draft card in the Drafts tab shows its assigned calendar date (e.g., "Scheduled: Tue Feb 18") once assigned
- Claude decides: assignment timing (on topic approval vs draft approval) and slot conflict resolution

### Claude's Discretion
- Draft review layout — how drafts are presented (list vs focused single-draft view)
- Hook comparison pattern — tabs vs side-by-side cards vs other approach
- LinkedIn preview styling — whether to mock LinkedIn's appearance or keep it plain
- Information density per draft card — essential metadata vs full context
- Draft storage model — one row with hooks in JSONB vs separate rows per hook variant
- Editing UX — inline editing vs modal/side-panel
- Calendar assignment timing — reserve slot on topic approval or on draft approval
- Calendar slot conflict resolution — overflow to flex day, queue to next week, or other approach

</decisions>

<specifics>
## Specific Ideas

- Content generation prompt template is fully defined in PROMPT.md — use it as-is for the Claude prompt in WF4
- Context package for generation includes: topic angle, research signals, top hooks from library, product roadmap phase
- 3 hook categories always: data/statistic, contrarian, observation
- Post text target: 1,800-2,000 characters following all brand voice rules from PROMPT.md
- Pillar-specific framing (legacy_future, building_in_public, partnered_authority) must be applied per PROMPT.md template
- Follow existing dashboard patterns: page.tsx → data-loader.tsx → content.tsx + skeleton.tsx

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-content-generation-drafts*
*Context gathered: 2026-02-15*
