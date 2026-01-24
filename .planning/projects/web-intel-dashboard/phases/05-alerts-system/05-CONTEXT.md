# Phase 5: Alerts System - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Display and manage web intelligence alerts in the dashboard. Users can view active alerts sorted by severity, acknowledge them to remove from active list, and filter by alert type (traffic, ranking, technical). Alert data comes from `web_intel.alerts` table.

</domain>

<decisions>
## Implementation Decisions

### Alert list layout
- Card-based layout, vertically stacked
- Each card shows: severity icon (colored), title, message (2-line truncation), relative timestamp
- Severity indicated by colored icon (warning triangle, info circle, etc.) — no border stripes
- Message text truncated at ~2 lines with ellipsis

### Acknowledge behavior
- Single-click dismiss — no confirmation dialog
- Dismiss button appears on hover only (cleaner default look)
- Fade out animation when dismissed, remaining cards slide up
- "Dismiss All" button available to acknowledge all visible alerts at once

### Filter and count display
- Horizontal chip/pill bar for type filters: All | Traffic | Ranking | Technical
- Each chip shows count in parentheses: "Traffic (3)"
- Total alert count shown in both section header AND tab/nav element
- Multi-select for chips: Claude's discretion (will decide based on typical usage)

### Empty and loading states
- Empty state: simple "No alerts" text, no icon or illustration
- Loading state: 2-3 skeleton card placeholders with shimmer
- Filtered empty: same "No alerts" message regardless of active filter
- Error state: Claude's discretion (follow dashboard error patterns)

### Claude's Discretion
- Whether filter chips allow multi-select or single-select
- Error state UI handling
- Exact skeleton count and animation timing
- Icon choices for severity levels

</decisions>

<specifics>
## Specific Ideas

- User explicitly does NOT want left borders or top borders for severity indication — always use icons
- Dismiss All is a single button for all visible alerts (not filtered-only)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-alerts-system*
*Context gathered: 2026-01-24*
