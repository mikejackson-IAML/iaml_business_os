# Phase 7: Instructor History - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Store and display instructor teaching history in the dashboard so IAML can make better assignment decisions. History records track claims through the portal system, showing which programs each instructor has taught (or is scheduled to teach) along with completion status.

</domain>

<decisions>
## Implementation Decisions

### Data Capture

- Records created when instructor claims block(s), then updated to completed after program end date passes
- Auto-complete based on program end date (no manual confirmation workflow)
- Program-level records with block count (one history record per program, not per block)
- Metadata captured: instructor, program, dates, block count, completed status, PLUS program type and location (city/state) at time of teaching
- Start fresh — only track history from this phase forward (no backfill of existing claims)
- Cancellations marked in history (not deleted) — tracks pattern but without reason tracking

### History Display

- Expandable row pattern — click/expand instructor row in dashboard to see their history
- Simple list view showing: program name, date, location, status
- Color-coded visual indicators for status: green=completed, yellow=pending, red=cancelled

### Assign Modal

- Claude's Discretion — best UX approach for showing history when selecting an instructor

</decisions>

<specifics>
## Specific Ideas

- Status indicators should be intuitive at a glance (similar to existing tier badges in dashboard)
- History view keeps it simple — no summary stats or grouping, just a clean list

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-instructor-history*
*Context gathered: 2026-01-22*
