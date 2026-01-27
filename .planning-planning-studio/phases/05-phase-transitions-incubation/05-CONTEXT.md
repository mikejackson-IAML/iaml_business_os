# Phase 5: Phase Transitions & Incubation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Orchestrate how projects move between planning phases (DISCOVER, DEFINE, DEVELOP, VALIDATE, PACKAGE). Enforce incubation periods between phases. Handle readiness checks at critical gates. Enable backward and forward phase navigation. Skip incubation and skip-ahead flows with proper logging.

</domain>

<decisions>
## Implementation Decisions

### Completion Detection
- Claude signals phase completion AND user confirms via button (both required)
- Claude emits a completion marker in conversation; frontend detects it and surfaces a confirmation UI
- User can also force-complete without Claude's signal, but gets a warning: "Claude hasn't confirmed this phase is done — proceed anyway?"
- Marker format and confirmation UI design: Claude's discretion

### Incubation Behavior
- Incubation duration is configurable per phase type (e.g., DISCOVER may have shorter incubation than DEFINE)
- During incubation, user can view completed phase content and jot down new ideas/notes
- Ideas captured during incubation are stored (not full AI conversations — just user notes)
- User cannot advance to the next phase until timer expires or they skip
- Idea capture mechanism and default durations per phase: Claude's discretion

### Skip Incubation Flow
- Confirmation modal with explanation of why incubation exists
- Sets incubation_skipped flag on project
- Logs the skip in conversation metadata
- Unlocks immediately

### Readiness Check UX
- Conversational format — Claude asks questions naturally in the chat before transition
- On fail: soft block with nudge — Claude explains what's missing, offers to help address gaps right now, but user can override with warning
- Which transitions get readiness checks: Claude's discretion (roadmap suggests DISCOVER→DEFINE and DEVELOP→VALIDATE)
- Whether to persist check results visibly: Claude's discretion

### Phase Navigation
- Full access when going backward — can have new conversations, edit docs, full functionality in any past phase
- Can skip ahead to future phases with a warning that earlier phases aren't complete
- No re-incubation on revisits — only first completion triggers incubation
- Navigation UI approach: Claude's discretion (existing phase progress bar is a natural candidate)

### Claude's Discretion
- Completion marker format (special token, JSON block, etc.)
- Transition confirmation UI pattern (modal, banner, etc.)
- Idea capture mechanism during incubation (note field, mini chat, etc.)
- Default incubation durations per phase type
- Whether incubation durations are user-editable
- Which phase transitions require readiness checks
- Whether readiness check results are persisted/displayed
- Phase navigation UI pattern

</decisions>

<specifics>
## Specific Ideas

- During incubation, the user specifically wants to be able to "add ideas to it" — capture thoughts that come up during the cooling period, even though they can't act on them yet
- Readiness checks should feel natural and conversational, not like a quiz or gate

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-phase-transitions-incubation*
*Context gathered: 2026-01-27*
