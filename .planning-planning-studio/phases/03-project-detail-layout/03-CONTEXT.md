# Phase 3: Project Detail View — Layout - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the project detail page structure: phase progress bar, sidebar panels (sessions, documents, research), main conversation area shell, and incubation state UI. No AI conversation functionality — just layout and data display from the database.

</domain>

<decisions>
## Implementation Decisions

### Page layout & structure
- Dashboard navigation will eventually move to the left side — factor this into layout decisions to avoid conflicts
- Claude's discretion on two-column vs three-column layout, sidebar collapsibility, progress bar placement, and header design
- Layout should accommodate the future left-nav without requiring a major rework

### Phase progress bar
- Show time spent per phase: duration displayed (e.g., "3 days"), with relative date on hover (e.g., "2 days ago")
- Animate transitions when a phase completes (fill/check animation to next step)
- Show incubation countdown inline in the progress bar when current phase is locked
- Claude's discretion on visual style (dots, segments, stepper), phase name visibility, click behavior for past phases, and locked phase appearance

### Sidebar panels
- Three panels: Sessions, Documents, Research
- Claude's discretion on organization pattern (accordion, tabs, or always-visible), empty state design, session item metadata, and document version display

### Incubation state
- Encouraging/calm tone — "Great work. Let this marinate." warmth, not corporate
- Countdown shows approximate time ("Available tomorrow morning"), not exact countdown
- Claude's discretion on whether incubation replaces conversation area or full page, and Skip Incubation button prominence

### Claude's Discretion
- Two-column vs three-column layout decision
- Sidebar collapsibility
- Progress bar visual style and placement
- Header design (breadcrumb vs minimal)
- Sidebar panel organization pattern
- Empty state design per panel
- Session and document list item density
- Incubation screen scope (conversation area vs full page)
- Skip Incubation button prominence

</decisions>

<specifics>
## Specific Ideas

- Dashboard nav is moving to the left side eventually — layout must not conflict with that future change
- Incubation should feel like a feature, not a blocker — the tone is "this is good for your idea"
- Time-in-phase data adds accountability and awareness to the progress bar

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-project-detail-layout*
*Context gathered: 2026-01-27*
