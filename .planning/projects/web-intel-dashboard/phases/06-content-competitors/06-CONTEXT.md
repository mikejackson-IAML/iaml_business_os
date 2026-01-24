# Phase 6: Content & Competitors - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Monitor content health (decay warnings, thin content flags, inventory summary) and competitive position (tracked domains, shared keyword positions, SERP share of voice). This phase adds two new sections to the web-intel dashboard — Content Health and Competitors.

</domain>

<decisions>
## Implementation Decisions

### Content Decay Display
- 30% traffic drop threshold triggers decay flag
- Compare current period vs previous period (e.g., 30d vs prior 30d)
- Show URL + drop percentage + sparkline for each decaying page
- Display top 5 decaying pages by default

### Thin Content Warnings
- Flag pages with <300 words OR bounce rate >70%
- Display inline with decay under unified "Content Health" section
- Show URL + word count + bounce rate for each flagged page
- Display top 5 thin content pages (matches decay count)

### Competitor Comparison UI
- Competitor list shows domain + quick stats (shared keywords count, wins/losses summary)
- Shared keywords table shows our position vs all tracked competitors in columns
- Color-coded cells: green if we rank higher, red if lower, neutral if similar
- Show top 10 keywords with "view all" expansion

### SERP Share Visualization
- Horizontal bar chart for share of voice comparison
- Measure estimated search visibility (weighted by search volume)
- Show +/- change arrow next to current percentage

### Claude's Discretion
- Our share prominently displayed (likely as header metric above competitor bars)
- Exact color shades for win/loss highlighting
- "View all" expansion UX pattern (modal vs inline expand)
- Content summary card layout (total indexed pages, avg word count)

</decisions>

<specifics>
## Specific Ideas

- Content Health combines decay and thin content in one section — both are "pages needing attention"
- SEO industry standard for share of voice is search visibility weighted by volume (matches SEMrush/Ahrefs approach)
- Competitive landscape at a glance matters more than drilling into one competitor at a time

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-content-competitors*
*Context gathered: 2026-01-24*
