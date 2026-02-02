# Phase 7: AI Reporting Chat - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Natural language interface for querying program data. Users ask questions in plain English and get answers as tables or charts. Read-only access to programs, registrations, companies, payments, attendance, and evaluations. No data modifications through chat.

</domain>

<decisions>
## Implementation Decisions

### Chat Interface Placement
- Floating button + slide-out panel pattern
- Available from BOTH programs list AND program detail pages
- Wide panel (700-800px) to accommodate tables and charts
- Panel persists across navigation within Programs section
- Context-aware: knows which program you're viewing (if any)

### Query Response Format
- AI decides format based on query type (comparisons → charts, lists → tables, counts → text)
- Bar charts only for v1 — simple, readable, covers most use cases
- CSV export button on tables for downloading results

### Conversation Behavior
- Multi-turn conversations with context ("Show me just the top 3" follows up on previous query)
- No persistence across sessions — fresh conversation on refresh
- Show 3-4 example queries when chat is empty (clickable to run)

### Data Scope and Access
- Full program data queryable: programs, registrations, companies, payments, attendance, evaluations
- Archived/completed programs included by default (historical analysis)
- Read-only — no data modifications through chat

### Claude's Discretion
- Table row limits before scrolling/pagination
- Context-aware suggestions (program-specific vs global)
- Rate limiting approach (if any)

</decisions>

<specifics>
## Specific Ideas

- Example queries from requirements:
  - "Compare Austin ERL 2025 vs 2024"
  - "Which companies sent the most attendees?"
  - "Average revenue per program by city"
- Chat should feel like asking a question to a colleague who knows all the data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-ai-reporting-chat*
*Context gathered: 2026-02-02*
