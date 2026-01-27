# Phase 2: Pipeline View — Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Kanban-style dashboard showing all planning projects organized by status columns. Users can see project cards, search/filter, drag between columns to change status, and quick-capture new ideas. This is the main entry point for Planning Studio.

</domain>

<decisions>
## Implementation Decisions

### Column layout & organization
- Claude's discretion on column-to-status mapping (use the data model statuses as columns)
- Horizontal scroll when columns overflow the viewport
- Column headers show name + count badge (e.g., "Active (7)")
- Drag-and-drop between columns to change project status

### Project card design
- Standard density: title, one-liner description, phase badge, progress bar, last activity timestamp
- Claude's discretion on phase indicator style (colored badge vs progress dots)
- Incubating projects: dimmed/greyed card + lock icon + countdown badge ("2d left")
- Claude's discretion on card click behavior (navigate vs expand)

### Search, filter & sorting
- Claude's discretion on search bar placement and filter set
- Claude's discretion on filter behavior (hide vs dim) and default sort order
- Must support search across project titles and filter by status/phase at minimum

### Quick capture experience
- Capture modal collects: title + one-liner description + category
- New ideas land in "Active" status (Capture phase) — no forced incubation on creation
- Button-only trigger ("+ Capture Idea" in header) — no keyboard shortcut
- Claude's discretion on post-capture behavior (close vs offer to open)

### Claude's Discretion
- Column-to-status mapping
- Phase indicator visual treatment on cards
- Card click behavior (navigate to detail vs expand inline)
- Search bar placement and filter options
- Filter behavior (hide vs dim non-matching)
- Default sort order within columns
- Post-capture modal behavior

</decisions>

<specifics>
## Specific Ideas

- "Act as a world-renowned project manager" — the dashboard should feel like a tool a PM lives in daily: fast, glanceable, zero friction
- Incubating cards should make the locked state very obvious (dimmed + countdown)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-pipeline-view*
*Context gathered: 2026-01-27*
