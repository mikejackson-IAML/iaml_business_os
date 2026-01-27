# Phase 3: AI Search & Intelligence - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can search contacts with natural language and view AI-generated intelligence summaries on contact profiles. This phase adds AI-powered search (parsing queries into structured filters) and AI-generated contact summaries. Bulk actions, integrations, and opportunities are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Search interaction
- Rotating placeholder text cycles through example queries (e.g., "Try: attorneys in Florida who attended a seminar")
- Inline shimmer in the filter area while AI processes the query — table stays visible
- If AI can't parse the query, show "Couldn't understand that query" with a suggestion to rephrase
- Search bar placement and mode (single vs toggle): Claude's discretion

### Filter pill behavior
- Pill layout (dedicated row vs merged with existing filters): Claude's discretion
- Pill editing (click to edit value vs remove only): Claude's discretion
- Clear all button behavior: Claude's discretion
- Original query visibility after pills generated: Claude's discretion

### AI summary content
- Conversational tone — friendly narrative style, not clinical or sales-brief
- Length: Short paragraph at top with expandable detailed sections below (engagement, company context, etc.)
- Whether to include recommended next actions: Claude's discretion
- Placement on contact profile: Claude's discretion

### Caching & regeneration
- Auto-generate summary on first profile view, with manual refresh button for later
- Show "Generated X days ago" with age indicator; refresh button becomes prominent when stale
- Freshness threshold: 30 days before showing staleness warning
- Regeneration loading UX (keep old visible vs skeleton): Claude's discretion

### Claude's Discretion
- Search bar implementation (single bar vs toggle mode)
- Filter pill layout and edit behavior
- Clear all filters pattern
- Query text display after pill generation
- AI summary placement on profile (top of Overview vs dedicated tab vs sidebar)
- Whether summaries include suggested next actions
- Regeneration loading UX

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants the experience to feel conversational and friendly, not clinical.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-ai-search-intelligence*
*Context gathered: 2026-01-27*
