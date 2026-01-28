# Phase 11: Analytics & Polish - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a metrics dashboard showing planning funnel data and apply UI polish across the Planning Studio. Analytics page displays key metrics with period selection. Polish covers loading, error, and empty states across all pages.

</domain>

<decisions>
## Implementation Decisions

### Metrics & Calculations
- Primary metrics: **Ideas shipped** (count) and **Velocity** (average time)
- Velocity measured as: capture to shipped (total journey time)
- Time periods: selectable dropdown (week, month, quarter, all time)
- Do NOT track incubation skip rate — not useful

### Dashboard Layout
- Layout structure: summary cards at top, funnel visualization below
- Sparklines embedded in summary cards for trends
- Spacious design — breathing room, focus on key metrics only

### Polish Scope
- All UI states need equal attention: loading, empty, error
- Moderate animation: smooth transitions, hover effects, loading animations (no celebration moments)
- Scope: whole Planning Studio, not just analytics page

### Mobile Support
- Desktop-first approach — mobile should "not break"
- Quick capture must work on mobile
- Chat on mobile: view-only (can read, not add messages)
- No special tablet optimization

### Claude's Discretion
- Funnel visualization style (horizontal bars vs classic funnel shape)
- Funnel stages (all statuses vs simplified view)
- Which existing pages need most polish attention (audit and prioritize)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-analytics-polish*
*Context gathered: 2026-01-28*
