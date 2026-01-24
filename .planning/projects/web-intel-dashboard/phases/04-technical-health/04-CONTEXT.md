# Phase 4: Technical Health - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Display Core Web Vitals (LCP, CLS, INP) with pass/fail status and mobile/desktop toggle, plus Google Search Console metrics (clicks, impressions, CTR, avg position) with top 10 queries list. Read-only dashboard view — data comes from workflows via Supabase.

</domain>

<decisions>
## Implementation Decisions

### CWV Card Layout
- Single unified "Core Web Vitals" card (not 3 separate cards)
- 3 metrics displayed in horizontal row inside the card
- Overall status badge ("Passing" / "Needs Work") in card header, right-aligned
- Card header: Title left | Toggle center | Status Badge right

### Mobile/Desktop Toggle
- Toggle lives inside CWV card header (between title and status badge)
- Segmented control style: [Mobile] [Desktop] buttons, active highlighted
- Mobile is default view (aligns with Google's mobile-first indexing priority)
- Instant data swap on toggle — no animation

### Status Thresholds Display
- Each metric value followed by colored badge (green/yellow/red)
- Badge shows full words: "Good", "Needs Work", "Poor"
- Value text stays neutral color — badge carries the status
- Threshold ranges hidden by default (power users know them)
- Overall status uses "Passing" / "Needs Work" wording (mirrors Google)

### GSC Metrics Layout
- 4 summary metrics in horizontal row of mini-cards (matches traffic metrics pattern)
- Metrics: Clicks | Impressions | CTR | Avg Position
- Each metric shows value + delta arrow + % change (same as traffic)
- Top 10 queries displayed as simple list below metrics row
- List format: "1. 'query term' — 1,234 clicks" (not full table)

### Claude's Discretion
- Exact spacing and padding within unified CWV card
- Color shades for good/warning/poor badges
- Toggle control implementation details
- List styling for top queries
- Loading states and skeleton design

</decisions>

<specifics>
## Specific Ideas

- Design accounts for narrower viewport due to left sidebar
- Horizontal row of 3 CWV metrics should remain scannable even on narrow screens
- GSC metrics row follows same pattern as Phase 2 traffic metrics
- Top queries list is deliberately simple — just query text and click count

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-technical-health*
*Context gathered: 2026-01-24*
