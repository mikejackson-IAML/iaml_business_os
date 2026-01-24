# Phase 3: Rankings Tracker - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Display keyword positions in a sortable, filterable table with position change indicators and 7-day sparkline trends. Users can monitor ranking changes over time and filter by priority. Table rows expand to reveal sparklines and SERP features.

</domain>

<decisions>
## Implementation Decisions

### Table layout & density
- Compact row height (~40px) to maximize visible keywords
- Default visible columns: Keyword, Position, Change, Priority, URL
- Sparklines and SERP features hidden in expandable row (click to expand)
- Mobile: Claude's discretion (recommend truncated table or card layout)

### Position change indicators
- Green arrow + number for improvements (e.g., ↑ +5)
- Red arrow + number for drops (e.g., ↓ -3)
- Dash (—) for no change
- No threshold — color any movement, even ±1
- Warning icon (⚠️) for drops of 10+ positions

### Sparkline treatment
- Claude's discretion on data range (recommend 7-day to match requirement)
- Inverted Y-axis — position 1 at top, higher positions at bottom ("up is good")
- Flat horizontal line for keywords with no ranking history
- Claude's discretion on hover interaction (tooltip vs visual-only)

### Filter & sort behavior
- Default sort: Priority (high first)
- Claude's discretion on priority filter default (recommend showing all)
- Filter and sort state persists in URL (matches date range pattern from Phase 2)
- Claude's discretion on multi-column sort (recommend single-column for simplicity)

### Claude's Discretion
- Mobile table treatment (truncated columns vs card layout)
- Sparkline data range (7-day, 14-day, or 30-day)
- Sparkline hover interaction (tooltip vs visual-only)
- Priority filter default (all vs high-only)
- Multi-column sort support

</decisions>

<specifics>
## Specific Ideas

- Match the URL state pattern established in Phase 2 for date range
- Warning icon for dramatic drops gives quick visual scan for problems
- Expandable rows keep the table clean while making details accessible

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-rankings-tracker*
*Context gathered: 2026-01-24*
