# Phase 8: Chat API - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend supports streaming AI chat with tool use capabilities. POST /api/mobile/chat accepts messages and returns streaming SSE responses. The endpoint proxies to Claude API without exposing API key to client. Tool definitions for workflow triggers and data operations. Auth required (uses same middleware from Phase 7).

Chat UI is Phase 9 — this phase delivers the API only.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all implementation decisions. Standard patterns apply:

**Streaming format:**
- SSE (Server-Sent Events) for streaming responses
- Event types for different content (text chunks, tool calls, tool results, done)
- Standard event format that iOS SSE libraries can parse

**Tool responses:**
- Tools defined for workflow triggers and data operations
- Tool calls and results streamed as distinct event types
- Claude handles tool execution server-side, results included in stream

**Error handling:**
- 401 for unauthenticated requests (consistent with Phase 7)
- Appropriate HTTP status codes for different error types
- Error events in stream for mid-conversation failures
- User-friendly error messages (not raw Claude API errors)

**Conversation scope:**
- Stateless per-request (messages array sent with each request)
- No server-side session storage
- iOS app manages conversation history locally

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

User will review context before planning and can provide feedback at that point.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-chat-api*
*Context gathered: 2026-01-20*
