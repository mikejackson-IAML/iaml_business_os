# Phase 9: Ready-to-Build Queue & Prioritization - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-prioritized queue of projects that have completed planning (PACKAGE phase). Includes goals management for priority weighting, AI scoring with reasoning, queue display, and the flow to start building a project. Build tracking itself is Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Goals management
- Business goals only — no personal or learning goals
- Priority expressed as tiers: Must-have / Should-have / Nice-to-have
- Maximum 3-5 active goals at a time (forces focus)
- Goals live on a settings-style page — configure and forget, not a primary navigation destination

### Priority scoring
- Multi-factor scoring: goal alignment + effort estimate + recency + completeness of planning docs
- Display as score + one-line summary (e.g., "87 — Strong revenue alignment, low effort")
- Recalculate automatically when goals change, plus manual "Refresh priorities" button
- Manual override via pin-to-top — pinned items always sort first regardless of AI score

### Queue presentation
- Ranked list layout — vertical, sorted by priority score (pinned items first)
- Each item shows: name, priority score, one-line AI summary, goal alignment tag, document count
- Actions per item: View project details, Start Build, Export (copy Claude Code command + download GSD package)
- Empty state shows project counts by phase with guidance on what to do next (link to pipeline)

### Start build flow
- Multiple concurrent builds allowed
- Transition project status to 'building', record build_started_at

### Claude's Discretion
- Whether Start Build shows a confirmation modal or transitions directly
- Whether starting a build auto-copies the Claude Code command to clipboard
- Whether an "Abandon Build" option exists to return projects to queue
- Priority score scale (0-100 or other)
- Exact goal CRUD form design

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-ready-to-build-queue-prioritization*
*Context gathered: 2026-01-27*
