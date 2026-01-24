# Phase 6: SOP Templates - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Build SOP management UI (list, detail/edit, preview) and progressive instruction display in task detail. The SOP API already exists (Phase 3). This phase creates the frontend to manage SOPs and integrates mastery-based instructions into the task experience.

**Delivers:**
- SOP list page with search and category grouping
- SOP detail/edit page with step management
- Mastery level preview functionality
- Progressive instructions in task detail view
- Usage stats showing tasks referencing each SOP
- Mastery auto-increment on task completion

</domain>

<decisions>
## Implementation Decisions

### SOP List Organization
- Category grouping with collapsible sections (e.g., "Website Monitoring", "Campaign Setup")
- Not tabs or flat list — groups provide structure within a single scrollable view

### SOP Row Content
- Standard format: "Name • X steps • ~Y min • Category"
- Balanced information density — enough to make decisions without clicking into each SOP

### Usage Stats Display
- Show task count badge in list view ("Used by 12 tasks")
- Clickable count opens task list filtered to tasks using that SOP
- Both approaches combined for discoverability and quick navigation

### Step Reordering
- Both drag-and-drop handles AND up/down arrow buttons
- Accessibility-friendly approach that works with keyboard navigation

### Expert Level Display
- Minimal acknowledgment: "You know this task" with link to full SOP
- Not hidden entirely — always available if user wants to reference

### Claude's Discretion
- Search scope (title/description only vs. including step content)
- Editor type (plain text markdown vs. rich text WYSIWYG)
- Step links approach (inline vs. separate field vs. both)
- Time estimate handling (per-step only vs. mastery-based times)
- Novice level display style (numbered checklist vs. accordion vs. full list)
- Proficient level summary format (bullets vs. key points vs. collapsible)
- Detail toggle persistence (session vs. per-SOP vs. global)
- Preview location (inline vs. modal vs. tab)
- Variable substitution testing (examples vs. test input vs. both)
- "Test as task" feature inclusion
- Version history for SOP edits

</decisions>

<specifics>
## Specific Ideas

No specific references provided — open to standard approaches.

**Implicit guidance from previous phases:**
- Follow existing Action Center patterns (task list structure, filter toolbar style)
- Maintain consistency with task detail page layout for SOP detail page
- Reuse component patterns from Phase 4/5 where applicable

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-sop-templates*
*Context gathered: 2026-01-24*
