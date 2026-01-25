# Phase 11: AI Integration - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build AI-powered task analysis and suggestions. The system analyzes user tasks to detect patterns, suggest new tasks, recommend priority/due date changes, and deliver weekly focus summaries. Users interact with suggestions individually through an accept/reject flow.

</domain>

<decisions>
## Implementation Decisions

### AI Input Data
- Look back **90 days** for pattern analysis — captures seasonal trends and quarterly patterns
- Scope to **user's tasks only** — AI sees what the user sees, provides personal suggestions
- Include **full context**: status, priority, due dates, completion times, comments, activity log, dismiss reasons, workflow context
- **Action Center only** — no external data sources (health dashboard, calendar, etc.)

### Suggestion Types
- AI can suggest: **new tasks, priority changes, and due date recommendations**
- **Explain reasoning when confidence < 80%** — obvious suggestions skip explanation, lower-confidence ones include "Why: [reason]"
- Pattern detection: **recurring neglect, workload imbalance, completion velocity, deadline clustering**
- **Cap at 10 suggestions per week** — avoid noise, focus on most impactful

### Acceptance Flow
- **Individual review only** — no bulk accept, handle one suggestion at a time
- **Accept creates task immediately** — user edits normally afterward if needed
- **Optional rejection reason** — helps AI learn over time without adding friction
- **Auto-expire after 7 days** — unreviewed suggestions disappear

### Weekly Focus Format
- Runs **Sunday evening** (planning) and **Friday recap** (reflection)
- Contains **full analysis**: summary + recommendations + pattern insights + last week review
- Delivered as **dashboard widget** — prominent card on dashboard with this week's focus
- Tone: **Encouraging coach** — "Good progress last week! This week, let's focus on..."

### Claude's Discretion
- Specific AI model and prompt engineering approach
- Dashboard widget layout and design details
- Confidence score calculation formula
- Pattern detection algorithms and thresholds
- Data aggregation and query optimization

</decisions>

<specifics>
## Specific Ideas

- AI should feel like a helpful assistant, not a demanding overseer
- "Encouraging coach" tone means acknowledging progress before calling out problems
- Suggestions should feel like helpful nudges, not overwhelming to-do additions
- Optional rejection reasons should be quick to select (predefined options + free text)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-ai-integration*
*Context gathered: 2026-01-25*
