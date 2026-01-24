# Phase 2: Traffic Overview - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Display website traffic metrics at a glance with trends. Users see sessions, users, bounce rate, and traffic source distribution with date range controls. Detailed drill-down views and GA integration setup belong in other phases.

</domain>

<decisions>
## Implementation Decisions

### Metric card design
- 4-column grid layout: Sessions, Users, Bounce Rate, Avg Duration in one row
- Medium density: headline number + % change + 7-day sparkline in each card
- Chart gets dedicated space below cards, not competing in same row

### Traffic sources visualization
- Stacked area chart showing source mix over time (organic, direct, referral, social)
- Shows how traffic composition changes across the selected date range
- More informative than static pie chart

### Date range behavior
- Preset buttons (7d, 30d, 90d) plus Custom picker option
- Auto comparison: selecting 30d automatically compares to prior 30 days
- % change always visible, calculated from same prior period

### Layout considerations
- Left sidebar navigation (upcoming change) — content area is everything to the right
- Date range selector and metric cards must fit within the main content area
- Responsive design that works with sidebar navigation

### Claude's Discretion
- Trend indicator style (arrow + percentage vs. background chip)
- Inverse metric handling for bounce rate (lower = better color logic)
- Chart interactivity level (tooltips, legend toggles)
- Traffic source color scheme (semantic vs. brand gradient)
- Whether to add a secondary sessions trend line chart
- Date range selector position (top right vs. inline with header)
- Date range persistence (URL params vs. localStorage vs. no persistence)
- Skeleton loading animation style (pulsing vs. shimmer)
- Empty state design for no data
- Loading behavior (together vs. independent card loading)
- Error state handling pattern

</decisions>

<specifics>
## Specific Ideas

- Card layout matches Google Analytics mental model — 4 metrics in a row for quick scanning
- Stacked area chart chosen over donut because it shows change over time, not just current snapshot
- Left sidebar navigation is coming — ensure layout accommodates this

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-traffic-overview*
*Context gathered: 2026-01-24*
