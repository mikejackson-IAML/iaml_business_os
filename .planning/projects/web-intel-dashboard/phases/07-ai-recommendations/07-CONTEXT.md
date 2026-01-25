# Phase 7: AI Recommendations - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Display AI-generated SEO recommendations with priority indicators and action buttons. Users can view, complete, or snooze recommendations. Generating recommendations is handled elsewhere (n8n workflows); this phase is purely UI for displaying and acting on them.

</domain>

<decisions>
## Implementation Decisions

### Recommendation display
- Card grid layout (2 columns on desktop)
- Each card shows: title, description (2 lines truncated with ellipsis), category tag
- No expansion needed — cards show enough info
- Cards maintain uniform height due to truncation

### Priority visualization
- Colored badge on each card: red (high), yellow (medium), gray (low)
- Default sort order: high priority first
- Horizontal chip filter bar to filter by All / High / Medium / Low
- Badge position and exact styling: Claude's discretion

### Action behavior
- Two actions per card: Mark Complete and Snooze
- Mark Complete: card disappears immediately (fade out animation)
- Snooze: user picks duration from dropdown (1 day, 7 days, 30 days)
- No confirmation dialogs — actions happen immediately

### Empty & loading states
- Empty state: celebratory message ("All caught up!") with positive icon
- Loading: skeleton cards matching grid layout with shimmer animation
- No manual refresh button — updates on page load
- Show all recommendations (no pagination, natural page scroll)

### Claude's Discretion
- Exact badge positioning within card
- Specific icon for empty state celebration
- Animation timing for card disappearance
- Skeleton shimmer implementation details
- Snooze dropdown component choice

</decisions>

<specifics>
## Specific Ideas

- Cards should feel consistent with existing dashboard-kit card components
- Priority filter should match the chip/toggle pattern used in AlertTypeFilter
- "All caught up!" empty state should feel encouraging, not just informational

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-ai-recommendations*
*Context gathered: 2026-01-25*
