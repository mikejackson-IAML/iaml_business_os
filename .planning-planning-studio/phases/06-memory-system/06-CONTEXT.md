# Phase 6: Memory System - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract memories from AI planning conversations, store them with vector embeddings, and enable semantic search at both project and global levels. This phase covers memory extraction, embedding generation, storage, semantic search, project-scoped Ask AI, and global Cmd+K search.

</domain>

<decisions>
## Implementation Decisions

### Memory extraction trigger
- Claude's Discretion on timing (end of session vs continuous)
- Claude's Discretion on user notification of extraction
- Extract **everything notable**: decisions, insights, pivots, user preferences, constraints, rejected alternatives
- Claude's Discretion on conversation summary generation threshold

### Search experience
- **Conversational answer** — AI synthesizes a natural language response from memories, with source attribution
- Claude's Discretion on source attribution style (inline citations vs sources section)
- **Multi-turn** — Users can ask follow-up questions that build on previous answer context
- Claude's Discretion on empty results behavior (no matches, general knowledge fallback, or related topics)

### Cmd+K global search
- Claude's Discretion on modal design (Spotlight-style vs side panel)
- Claude's Discretion on whether Cmd+K also handles navigation or is memory-search only
- Claude's Discretion on how project attribution appears in results
- Claude's Discretion on project filter availability

### Memory visibility
- Claude's Discretion on where memories are displayed (sidebar panel, separate page, or hidden)
- Claude's Discretion on whether users can edit/delete memories
- Memories categorized by **both type and phase** — filterable by type (decision, insight, pivot, constraint, preference) and by planning phase
- Claude's Discretion on source linking granularity (message-level vs session-level)

### Claude's Discretion
Memory extraction has broad discretion — Claude should pick the best UX patterns for extraction timing, notification, summary thresholds, and Cmd+K design. The key locked decisions are: extract everything notable, conversational answers, multi-turn search, and type+phase categorization.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User gave broad discretion on UX patterns, trusting Claude to pick the best implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-memory-system*
*Context gathered: 2026-01-27*
