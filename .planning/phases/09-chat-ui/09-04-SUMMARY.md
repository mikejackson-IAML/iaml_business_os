---
phase: 09-chat-ui
plan: 04
subsystem: ui
tags: [swift, swiftui, chat, streaming, viewmodel, observable]

# Dependency graph
requires:
  - phase: 09-02
    provides: ChatViewModel with sendMessage, streaming state, error handling
  - phase: 09-03
    provides: MessageBubble, StreamingBubble, SkeletonBubble, ChatInputBar components
provides:
  - Fully wired ChatView with real-time streaming display
  - Auto-scroll behavior during streaming and new messages
  - Error alert with retry/dismiss options
  - NetworkError.userMessage for UI-friendly error display
affects: [09-05, voice-input, confirmation-dialogs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@StateObject for ChatViewModel ownership"
    - "@Environment(AppState.self) for auth context access"
    - "ScrollViewReader with onChange for auto-scroll"
    - "Simplified auto-scroll (always scroll during streaming)"

key-files:
  created: []
  modified:
    - BusinessCommandCenter/Features/Chat/ChatView.swift
    - BusinessCommandCenter/Core/Network/NetworkError.swift

key-decisions:
  - "Simplified auto-scroll: always scroll during streaming (iOS 17 compatible)"
  - "Used .constant(viewModel.showError) for isPresented to work with computed property"
  - "Added userMessage to NetworkError for consistent user-facing error messages"

patterns-established:
  - "@StateObject ChatViewModel: view owns its ViewModel instance"
  - "onChange auto-scroll: separate onChange for streaming, message count, and waiting state"
  - "Error alert pattern: alert with Retry and OK buttons using NetworkError.userMessage"

# Metrics
duration: 2min
completed: 2026-01-21
---

# Phase 09 Plan 04: ViewModel Wiring Summary

**Fully wired ChatView with real-time streaming, auto-scroll, and error handling using ChatViewModel**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-21T03:30:00Z
- **Completed:** 2026-01-21T03:32:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Wired ChatView to ChatViewModel with @StateObject for streaming chat
- Connected @Environment(AppState.self) for LAContext auth context access
- Implemented auto-scroll during streaming with ScrollViewReader and onChange
- Added error alert with Retry/OK buttons using NetworkError.userMessage
- Added userMessage computed property to NetworkError for user-friendly messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire ChatView to ChatViewModel with streaming** - `8ee76d0` (feat)

## Files Modified

- `BusinessCommandCenter/Features/Chat/ChatView.swift` - Full ViewModel integration with streaming display
- `BusinessCommandCenter/Core/Network/NetworkError.swift` - Added userMessage property for UI display

## Decisions Made

- **Simplified auto-scroll** - Always scroll during streaming instead of tracking scroll position. This is iOS 17 compatible (onScrollGeometryChange is iOS 18+) and matches user expectations during streaming responses.
- **userMessage on NetworkError** - Added dedicated property for UI-friendly messages, keeping errorDescription for developer context.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation was straightforward.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ChatView fully functional with streaming responses
- Voice input button wired but implementation deferred to Plan 05
- Confirmation dialog for high-risk tools ready for Plan 06
- isNearBottom state preserved for future smart auto-scroll enhancement
- Ready for 09-05: Voice input with SpeechService integration

---
*Phase: 09-chat-ui*
*Completed: 2026-01-21*
