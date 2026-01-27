# Phase 4: Conversation Engine - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Functional AI conversations within project detail pages. Users converse with Claude to develop their ideas through the 6 planning phases (CAPTURE, DISCOVER, DEFINE, DEVELOP, VALIDATE, PACKAGE). This phase delivers the chat API, streaming responses, context management, message storage, conversation UI, and session management.

Out of scope: Phase transition logic (Phase 5), memory extraction (Phase 6), document generation (Phase 7), research integration (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Streaming & Response Feel
- Markdown renders after response completes — plain text shown during streaming (user wants it to feel like conversing with Claude)
- Claude has discretion on: streaming approach (token-by-token vs chunked), loading indicator style, and whether to include a stop button

### Context Loading Strategy
- Previous session summaries injected when starting a new session in the same phase — continuity across sessions is required
- The system must produce GSD-ready documentation — the entire goal is: plan in the Studio, then copy a Claude Code command to build. Research agent should deeply analyze the GSD process (PROJECT.md, REQUIREMENTS.md, ROADMAP.md structure) to ensure the conversation engine produces compatible output
- Claude has discretion on: conversation history windowing strategy, which documents to include from earlier phases, and prompt architecture (phase-specific prompts vs single prompt with phase variable)
- Reference: `.planning-planning-studio/references/system_prompts.md` contains detailed phase-specific prompt templates with context injection patterns — research should evaluate whether to use these as-is or adapt them

### Session Lifecycle
- Users can continue any previous session (not read-only) — flexibility over strict history
- Claude has discretion on: session creation triggers (explicit button, auto on phase change, or both), session titling approach, and navigation-away behavior

### Conversation UI Behavior
- Conversation area uses the existing Phase 3 layout (center panel with sidebar panels)
- The Phase 3 conversation shell (disabled input) will be wired to the real conversation engine
- Claude has discretion on: input bar design (single-line vs expandable), message styling (avatars, names, bubble colors), and error handling UX

</decisions>

<specifics>
## Specific Ideas

- User explicitly wants the streaming experience to feel like conversing with Claude — plain text during stream, rendered markdown after completion
- The Planning Studio's core value proposition: plan everything in the Studio, then when a project reaches PACKAGE/ready-to-build, copy a single command to Claude Code and build. The conversation engine must be designed with this end state in mind
- System prompts reference doc exists with full templates for all 6 phases (CAPTURE, DISCOVER, DEFINE, DEVELOP, VALIDATE, PACKAGE) including context injection patterns, conversation style guidance, memory extraction triggers, readiness checks, and phase completion criteria

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-conversation-engine*
*Context gathered: 2026-01-27*
