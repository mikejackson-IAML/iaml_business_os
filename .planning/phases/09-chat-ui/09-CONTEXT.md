# Phase 9: Chat UI - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the iOS chat interface for natural language conversations with the AI assistant. Users can type or speak messages, see streaming responses in real-time, scroll through conversation history, and confirm before high-risk actions execute. Creating the chat API is Phase 8 (complete) — this phase builds the UI that consumes it.

</domain>

<decisions>
## Implementation Decisions

### Message bubbles & layout
- Avatar + alignment: AI messages on left with avatar, user messages aligned right (no avatar)
- AI avatar: User will provide a custom image asset
- Timestamps hidden by default, revealed on long-press/tap
- Floating capsule input area — rounded pill-shaped, modern feel

### Streaming display
- Fade in chunks: New text fades in smoothly as tokens arrive (no character-by-character animation)
- Skeleton shimmer while waiting for first token — gray placeholder lines that shimmer
- Smart auto-scroll: Follow latest text when user is at bottom, pause if they've scrolled up
- Queue messages: User can type and send while AI is responding, new message waits until current response finishes

### Voice input experience
- Voice-first design: Floating mic button always visible and prominent
- Keyboard hidden by default — user taps to access keyboard, not visible by default
- Ethereal, pulsing, moving visual while recording — ambient and elegant, not a standard waveform
- Tap to stop, auto-send: Tap mic to start, tap again to stop, sends automatically after transcription
- Transcribed text shows as user message bubble so user sees what was understood

### Confirmation dialogs
- Inline in chat: Confirmation appears as a special message bubble with approve/reject buttons
- Full preview: Show detailed preview of exactly what will happen, parameters, targets
- Context-specific button labels: "Send emails" / "Cancel" — matches the specific action
- AI explains result after user approves — follow-up message describes what happened

### Claude's Discretion
- Exact animation curves and durations for fade effects
- Skeleton shimmer implementation details
- Input capsule exact styling (colors, shadows, corner radius)
- Recording visual implementation (particle system, gradient animation, etc.)
- Confirmation bubble card styling

</decisions>

<specifics>
## Specific Ideas

- "I love the Wispr Flow technology where it doesn't exactly transcribe me but it will also allow me to make changes to something. I love the Wispr Flow functionality. If we can incorporate that here, that would be amazing."
  - Wispr Flow-style intelligent transcription: interprets intent rather than literal transcription, handles edits, corrections, and commands naturally
- Voice input should feel like the primary interaction mode — keyboard is secondary
- The recording visual should feel "ethereal" — more ambient and magical than utilitarian

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-chat-ui*
*Context gathered: 2026-01-20*
