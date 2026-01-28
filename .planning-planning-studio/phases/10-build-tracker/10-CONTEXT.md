# Phase 10: Build Tracker - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Track active development progress for projects in "building" status. Users can see build progress, update phase manually, access Claude Code commands, and mark projects as shipped. The Building and Shipped columns already exist in the pipeline — this phase makes them functional.

</domain>

<decisions>
## Implementation Decisions

### Progress Display
- Phase-based stepper showing current phase (e.g., "Phase 3 of 8") with visual step indicator
- Last activity shown as relative time ("2 hours ago", "Yesterday")

### Build Workflow
- Start Build: Confirmation modal that also prompts for GSD package export
- Progress updates: Manual only — user clicks to update phase/progress in the UI
- Mark Shipped: Confirmation modal, sets shipped_at timestamp, moves to 'shipped' status

### External Links
- GSD package export: Always available on build cards (not just at start)
- Open in Claude Code: Modal showing the command with copy button
- PRD viewing: Display command in modal

### Layout & Location
- Active builds shown in existing "Building" column in pipeline view (no dedicated page)
- Clicking a Building card opens a build-specific modal (not project detail)
- Modal contains: progress display, actions, Claude Code command

### Claude's Discretion
- Stepper visualization (full steps vs current + count) based on available space
- Whether to include "building for X days" duration indicator
- GitHub repo field: include if useful without adding complexity
- PRD view approach: modal vs navigate to project detail
- Building card enhancements vs standard cards with badge
- Modal layout and action button arrangement

</decisions>

<specifics>
## Specific Ideas

- Pipeline already has 5 columns: Idea | Planning | Ready to Build | Building | Shipped
- Just need to wire up Building column functionality — structure exists

</specifics>

<deferred>
## Deferred Ideas

- Claude Code event sync: Automatic progress sync from Claude Code events would require building a hook/extension — noted for future consideration
- Webhook sync from GSD state files: Could read .planning/STATE.md on commits — deferred for now

</deferred>

---

*Phase: 10-build-tracker*
*Context gathered: 2026-01-28*
