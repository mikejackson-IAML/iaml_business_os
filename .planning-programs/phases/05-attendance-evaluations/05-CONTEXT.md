# Phase 5: Attendance/Evaluations Tab - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Post-program attendance tracking and evaluation display. Recording who actually attended each block (vs who registered) and displaying evaluation survey responses with aggregate scores. Virtual certificates track attendance across linked blocks.

</domain>

<decisions>
## Implementation Decisions

### Attendance Tracking UX
- Individual checkboxes plus "Mark all attended" bulk action button
- No undo needed — checkbox is a toggle, click again to revert
- Reuse same roster table as Registrations tab, add attendance columns after block columns
- Cancelled registrations shown but greyed out with checkboxes disabled
- Checkboxes save immediately on click (no submit button)

### Evaluation Display Format
- Aggregate summary shown first at top, individual responses below (expandable)
- Rating scores displayed as numbers with color coding (green/yellow/red based on score)
- Individual responses shown in expandable cards — click attendee name to see full response
- Final "overall thoughts" question shown as excerpt in aggregate view (first 2-3 responses visible, "Show more" for rest)
- Other free-text comments only visible in individual expanded views

### Survey Template Structure
- 1-5 rating scale (Poor to Excellent)
- Four rating categories:
  1. Instructor quality (knowledge, presentation, responsiveness)
  2. Content/materials (relevance, clarity, usefulness)
  3. Venue/logistics (location, food, facilities) — skip for virtual
  4. Overall satisfaction (would recommend, met expectations)
- Two free-text questions:
  1. "What did you like most?"
  2. "What could be improved?"
- Virtual programs use same template but hide venue/logistics section

### Virtual Certificate Handling
- Block-by-block detail showing each linked block and attendance status
- No special badge for certificate completion — just show "3/3 blocks"
- Evaluations are per-block (each block event gets its own evaluation after that block)

### Claude's Discretion
- When viewing a block event, whether to show certificate progress inline or as a link
- Exact wording for rating scale labels (e.g., 1=Poor, 5=Excellent)
- Empty state messaging when no evaluations submitted yet

</decisions>

<specifics>
## Specific Ideas

- Aggregate view should prominently show the final "overall thoughts" excerpts — this is the most valuable quick insight
- Color coding for ratings: green for 4-5, yellow for 3, red for 1-2
- Bulk "Mark all attended" should have a brief confirmation since it affects many rows
- Virtual certificate progress should be easy to scan — show which blocks are complete vs pending

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-attendance-evaluations*
*Context gathered: 2026-02-01*
