# Phase 5: Phase Transitions & Incubation - Research

**Researched:** 2026-01-27
**Domain:** Phase state machine, SSE marker detection, incubation enforcement
**Confidence:** HIGH

## Summary

This phase adds the operational logic for moving projects between planning phases. The existing codebase has strong foundations: the phase progress bar renders all 6 phases with status indicators, the incubation overlay exists with a skip confirmation dialog (placeholder logic), the conversation shell streams SSE from Claude, and the types/helpers for incubation time calculations are already built.

The core work is: (1) detecting completion markers in Claude's streamed response, (2) new server actions for phase transitions, (3) wiring the incubation overlay's skip button to real DB operations, (4) making the phase progress bar clickable for navigation, and (5) adding readiness check instructions to system prompts.

**Primary recommendation:** Use a JSON marker format in Claude's response (e.g., `<!--PHASE_COMPLETE-->`) that the SSE consumer in `conversation-shell.tsx` detects post-stream, then surfaces a transition confirmation UI.

## Standard Stack

No new libraries needed. Everything builds on the existing stack.

### Core (already installed)
| Library | Purpose | Status |
|---------|---------|--------|
| @anthropic-ai/sdk | Claude streaming | In use |
| @supabase/supabase-js | DB operations | In use |
| lucide-react | Icons | In use |
| shadcn/ui AlertDialog | Confirmation modals | In use (incubation-overlay.tsx) |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| `useEffect` + `setInterval` | Countdown timer | Incubation countdown display |

No new packages to install.

## Architecture Patterns

### Existing File Structure (relevant)
```
dashboard/src/
├── app/dashboard/planning/
│   ├── actions.ts                          # Server actions (updateProjectStatus, createProject)
│   └── [projectId]/
│       ├── project-content.tsx             # Server component - fetches data, renders PhaseProgressBar
│       ├── project-detail-client.tsx        # Client wrapper - isIncubating() check, shows overlay vs shell
│       └── components/
│           ├── phase-progress-bar.tsx       # Phase circles with tooltips, has onPhaseClick prop
│           ├── incubation-overlay.tsx        # Placeholder skip logic, AlertDialog built
│           ├── conversation-shell.tsx        # SSE consumer, message state management
│           ├── chat-input.tsx
│           └── message-list.tsx
├── app/api/planning/
│   └── chat/route.ts                       # SSE streaming endpoint
├── lib/planning/
│   └── system-prompts.ts                   # Phase-specific prompts with buildContextBlock
├── lib/api/
│   ├── planning-queries.ts                 # All read queries (getPhaseByType, etc.)
│   └── planning-chat.ts                    # saveMessage, createConversation, loadChatContext
└── dashboard-kit/types/departments/
    └── planning.ts                         # Types + helpers (isIncubating, PHASE_ORDER, etc.)
```

### Pattern 1: Completion Marker Detection
**What:** Claude includes a special HTML comment marker in its response when signaling phase completion. The frontend detects it after the stream completes.
**When to use:** After every `done` SSE event.
**How it works:**
1. System prompt instructs Claude: "When you believe this phase is complete, include `<!--PHASE_COMPLETE-->` at the end of your response."
2. In `conversation-shell.tsx`, after stream `done`, check `accumulated.includes('<!--PHASE_COMPLETE-->')`
3. Strip marker from displayed content, set a `phaseCompleteDetected` state
4. Show transition confirmation banner/modal
5. User confirms -> call server action -> update phase + project

**Why HTML comment:** Invisible in rendered markdown, won't confuse the user, easy to parse, no false positives.

### Pattern 2: Readiness Check Marker
**What:** Claude includes `<!--READINESS_CHECK-->` when initiating a readiness check conversation.
**When to use:** At DISCOVER->DEFINE and DEVELOP->VALIDATE transitions.
**How it works:**
1. System prompt includes readiness check instructions
2. Claude asks readiness questions naturally, then includes marker + pass/fail: `<!--READINESS_PASS-->` or `<!--READINESS_FAIL:reason-->`
3. Frontend detects and shows appropriate UI (green checkmark vs nudge to continue)

### Pattern 3: Server Actions for Phase Transitions
**What:** Add new server actions to `actions.ts` for transition operations.
**Actions needed:**
- `completePhaseAction(projectId, phaseType)` - marks phase complete, sets incubation, advances current_phase
- `skipIncubationAction(projectId)` - clears phase_locked_until, sets incubation_skipped, logs
- `navigateToPhaseAction(projectId, targetPhase)` - changes current_phase, creates phase record if needed
- `saveReadinessCheckAction(phaseId, passed, notes)` - stores readiness check result

### Pattern 4: Incubation Countdown Timer
**What:** Real-time countdown using `setInterval` in the incubation overlay.
**Implementation:** `useEffect` with 60-second interval updating `getIncubationTimeRemaining(project)`. Auto-unlock when timer reaches zero by calling `router.refresh()`.

### Pattern 5: Phase Navigation via Progress Bar
**What:** Make all phases clickable (not just completed ones).
**Change:** The `PhaseProgressBar` already has `onPhaseClick` prop but only enables it for completed phases. Expand to allow clicking any phase with appropriate warnings.

### Anti-Patterns to Avoid
- **Don't detect markers during streaming** - Wait for stream completion. Partial matches during streaming will cause false positives.
- **Don't use client-side timers for incubation enforcement** - Always verify `phase_locked_until` server-side on page load and API calls. Client countdown is display-only.
- **Don't modify conversation history on phase change** - Each phase gets its own conversations. Backward navigation shows that phase's conversations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirmation dialogs | Custom modal | shadcn AlertDialog | Already used in incubation-overlay.tsx |
| Time formatting | Custom formatter | Existing `getIncubationTimeRemaining()` | Already handles all cases in planning.ts |
| Phase ordering | Manual index math | `PHASE_ORDER` array + `getPhaseIndex()` | Already defined in planning.ts |
| Incubation check | Custom logic | `isIncubating()` helper | Already defined in planning.ts |

## Common Pitfalls

### Pitfall 1: Race Condition on Phase Transition
**What goes wrong:** User clicks "Complete Phase" while Claude is still streaming, or double-clicks the button.
**Why it happens:** Async operations without guards.
**How to avoid:** Disable transition button while streaming. Use optimistic UI with server validation. Add `transitioning` state flag.

### Pitfall 2: Stale Project Data After Transition
**What goes wrong:** After completing a phase, the page still shows old phase/incubation state.
**Why it happens:** `project-content.tsx` is a server component that fetched data at render time.
**How to avoid:** Call `router.refresh()` after successful server action to refetch server component data. Or use `revalidatePath` in server actions (already done in existing actions).

### Pitfall 3: Incubation Bypass via Direct URL
**What goes wrong:** User bookmarks the project page and returns after incubation without the UI checking.
**Why it happens:** Client-only check.
**How to avoid:** `project-detail-client.tsx` already checks `isIncubating(project)` on render. The server component re-fetches project data on each page load. This is already handled correctly.

### Pitfall 4: Phase Record Doesn't Exist for Target Phase
**What goes wrong:** Navigating to a phase that has no record in the `phases` table.
**Why it happens:** Phase records may only be created when first entered.
**How to avoid:** `navigateToPhaseAction` must create the phase record if it doesn't exist (upsert pattern).

### Pitfall 5: Marker Appears in User-Visible Content
**What goes wrong:** `<!--PHASE_COMPLETE-->` shows up in the rendered message.
**Why it happens:** Markdown renderers may or may not strip HTML comments.
**How to avoid:** Strip markers from content before adding to messages state. Do this in the `done` handler.

## Code Examples

### Marker Detection in Conversation Shell
```typescript
// In conversation-shell.tsx, after stream 'done':
const PHASE_COMPLETE_MARKER = '<!--PHASE_COMPLETE-->';
const READINESS_PASS_MARKER = '<!--READINESS_PASS-->';
const READINESS_FAIL_MARKER = /<!--READINESS_FAIL:(.+?)-->/;

// Strip markers and detect signals
let displayContent = accumulated;
let phaseCompleteDetected = false;
let readinessResult: { passed: boolean; reason?: string } | null = null;

if (accumulated.includes(PHASE_COMPLETE_MARKER)) {
  phaseCompleteDetected = true;
  displayContent = displayContent.replace(PHASE_COMPLETE_MARKER, '').trim();
}
if (accumulated.includes(READINESS_PASS_MARKER)) {
  readinessResult = { passed: true };
  displayContent = displayContent.replace(READINESS_PASS_MARKER, '').trim();
}
const failMatch = accumulated.match(READINESS_FAIL_MARKER);
if (failMatch) {
  readinessResult = { passed: false, reason: failMatch[1] };
  displayContent = displayContent.replace(READINESS_FAIL_MARKER, '').trim();
}
```

### Phase Transition Server Action
```typescript
// In actions.ts
const INCUBATION_HOURS: Record<PhaseType, number> = {
  capture: 24,
  discover: 36, // 24-48h, use 36 as default
  define: 0,
  develop: 24,
  validate: 0,
  package: 0,
};

export async function completePhaseAction(
  projectId: string,
  phaseType: PhaseType
): Promise<ActionResult> {
  const supabase = createServerClient();
  const now = new Date();
  const incubationHours = INCUBATION_HOURS[phaseType];
  const nextPhase = PHASE_ORDER[PHASE_ORDER.indexOf(phaseType) + 1];

  // 1. Mark current phase complete
  await supabase.schema('planning_studio').from('phases')
    .update({ status: 'complete', completed_at: now.toISOString() })
    .eq('project_id', projectId).eq('phase_type', phaseType);

  // 2. Set incubation if applicable
  const lockUntil = incubationHours > 0
    ? new Date(now.getTime() + incubationHours * 60 * 60 * 1000).toISOString()
    : null;

  // 3. Update project
  await supabase.schema('planning_studio').from('projects')
    .update({
      current_phase: nextPhase,
      phase_locked_until: lockUntil,
      incubation_skipped: false,
      updated_at: now.toISOString(),
    })
    .eq('id', projectId);

  // 4. Create next phase record
  await supabase.schema('planning_studio').from('phases')
    .upsert({
      project_id: projectId,
      phase_type: nextPhase,
      status: lockUntil ? 'incubating' : 'in_progress',
      started_at: lockUntil ? null : now.toISOString(),
    }, { onConflict: 'project_id,phase_type' });

  revalidatePath(`/dashboard/planning/${projectId}`);
  return { success: true };
}
```

### Countdown Timer Hook
```typescript
// Custom hook for incubation countdown
function useIncubationCountdown(project: PlanningProject) {
  const [timeRemaining, setTimeRemaining] = useState(
    getIncubationTimeRemaining(project)
  );

  useEffect(() => {
    if (!project.phase_locked_until) return;
    const interval = setInterval(() => {
      const remaining = getIncubationTimeRemaining(project);
      setTimeRemaining(remaining);
      if (!remaining) {
        // Incubation expired, refresh page
        clearInterval(interval);
        window.location.reload(); // or router.refresh()
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [project.phase_locked_until]);

  return timeRemaining;
}
```

### System Prompt Addition for Markers
```typescript
// Append to each phase prompt in system-prompts.ts:
const COMPLETION_MARKER_INSTRUCTIONS = `
## Completion Signaling (IMPORTANT)
When you believe this phase is complete based on the conversation:
1. Summarize what was accomplished
2. Include the marker <!--PHASE_COMPLETE--> at the very end of your message
3. The user will see a confirmation prompt to advance

Do NOT include this marker unless you genuinely believe the phase goals are met.
`;

const READINESS_CHECK_INSTRUCTIONS = `
## Readiness Check (IMPORTANT)
Before completing this phase, conduct the readiness check described above.
- If the user passes: include <!--READINESS_PASS--> at the end
- If the user doesn't pass: include <!--READINESS_FAIL:brief reason--> and offer to help address gaps
- The user can override a fail, but encourage them to address gaps first
`;
```

## State of the Art

| What Exists | What Needs Building | Effort |
|-------------|---------------------|--------|
| `PhaseProgressBar` with `onPhaseClick` prop (completed-only) | Expand to all phases, add warning modals | Low |
| `IncubationOverlay` with skip dialog (placeholder `console.log`) | Wire to `skipIncubationAction`, add countdown, add idea capture | Medium |
| `ConversationShell` SSE consumer | Add marker detection + transition UI triggers | Medium |
| `isIncubating()` + time helpers | Already complete, just wire up | Done |
| System prompts per phase | Add completion marker + readiness check instructions | Low |
| `actions.ts` with `updateProjectStatus` | Add `completePhase`, `skipIncubation`, `navigateToPhase`, `saveReadinessCheck` | Medium |
| `planning-queries.ts` with `getPhaseByType` | May need phase upsert query | Low |

## Open Questions

1. **Idea capture during incubation** - The CONTEXT says users should be able to "jot down ideas" during incubation. Where to store these? Options: (a) A simple notes field on the phase record, (b) A special "incubation_notes" conversation type, (c) A textarea that saves to message metadata. Recommendation: Simple textarea in the incubation overlay that saves to a `notes` field on the phase record or a dedicated notes array in project metadata. Simplest approach.

2. **Phase record creation timing** - Currently unclear when phase records are created. The `createConversation` in `planning-chat.ts` requires a `phase.id`. The chat route calls `getPhaseByType` which will fail if no record exists. Need to ensure phase records are created either on project creation (all 6) or on-demand when entering a phase. Recommendation: Create all 6 phase records on project creation.

3. **Force-complete without Claude signal** - The CONTEXT says users can force-complete. This needs a separate UI element (not dependent on marker detection). Recommendation: Add a "Mark Phase Complete" option in a dropdown menu on the conversation header.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all files listed above
- `planning.ts` types file - complete type definitions and helpers
- `conversation-shell.tsx` - SSE parsing pattern
- `incubation-overlay.tsx` - existing placeholder implementation
- `phase-progress-bar.tsx` - existing navigation component
- `system-prompts.ts` - current prompt structure
- `actions.ts` - server action pattern
- `planning-queries.ts` - all DB query patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, everything exists
- Architecture: HIGH - direct codebase analysis, clear extension points
- Pitfalls: HIGH - identified from reading actual implementation details

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable internal codebase)
