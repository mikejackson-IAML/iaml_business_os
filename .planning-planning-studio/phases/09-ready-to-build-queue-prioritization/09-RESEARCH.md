# Phase 9: Ready-to-Build Queue & Prioritization - Research

**Researched:** 2026-01-27
**Domain:** Goals CRUD, AI priority scoring, queue UI, build flow
**Confidence:** HIGH

## Summary

This phase builds on well-established patterns in the codebase. The goals page skeleton already exists at `/dashboard/planning/goals/`. Server actions pattern is mature with `ActionResult` return type. GSD export (ZIP + Claude Code command copy) is fully built in the `ExportPanel` component and `/api/planning/documents/export` route. The Claude API route pattern exists from Phase 8 chat/ask features.

The main design decision is mapping the user's "Must-have / Should-have / Nice-to-have" tier system onto the existing `user_goals.priority` integer field (1-10). The simplest approach: use the `priority` field as a tier enum stored as integer (3=Must-have, 2=Should-have, 1=Nice-to-have) rather than a 1-10 scale. This avoids a migration.

**Primary recommendation:** Reuse existing export panel, server action patterns, and Claude API route patterns. Map tiers to priority integers. Add `pinned` boolean column to projects table via migration.

## Standard Stack

Already established by prior phases -- no new libraries needed.

### Core
| Library | Purpose | Already In Use |
|---------|---------|----------------|
| Next.js App Router | Pages, server components, server actions | Yes |
| Supabase JS | DB queries via `.schema('planning_studio')` | Yes |
| Claude API (claude-sonnet-4-20250514) | Priority calculation | Yes (chat/ask routes) |
| shadcn/ui | UI components | Yes |
| JSZip + file-saver | GSD ZIP export (client-side) | Yes |

### New Dependencies
None required.

## Architecture Patterns

### Goals Page Structure
```
dashboard/src/app/dashboard/planning/goals/
├── page.tsx              # Already exists - server component with Suspense
├── goals-content.tsx     # Already exists - replace empty state with CRUD
├── goals-skeleton.tsx    # Already exists
└── components/
    └── goal-form.tsx     # New - add/edit goal dialog
```

### Queue Page Structure
```
dashboard/src/app/dashboard/planning/queue/
├── page.tsx              # Server component - fetch ready_to_build projects + goals
├── queue-content.tsx     # Client component - ranked list with actions
├── queue-skeleton.tsx    # Loading state
└── components/
    ├── queue-item.tsx    # Single project row: name, score, summary, tags, actions
    └── empty-queue.tsx   # Phase counts + guidance
```

### Pattern 1: Server Actions for Mutations
**What:** All mutations go through `actions.ts` with `ActionResult` return type
**When:** Creating/updating/deleting goals, starting builds, pinning projects, triggering priority refresh
**Example:** Follow exact pattern from existing `actions.ts` - `createServerClient()`, `.schema('planning_studio')`, `revalidatePath()`.

### Pattern 2: API Route for Claude Calls
**What:** POST API route that calls Claude API, returns JSON (not streaming for priority calc)
**When:** Priority calculation - send project data + goals, get back score + reasoning
**Example:** Similar to `/api/planning/ask/route.ts` but non-streaming, batch processing.

### Pattern 3: Reuse ExportPanel
**What:** The existing `ExportPanel` component handles ZIP download + Claude Code command copy
**When:** Queue item actions - extract export logic into reusable functions or import the component directly.

### Anti-Patterns to Avoid
- **Don't create a separate priorities table** -- priority_score, priority_reasoning, priority_updated_at already exist on the projects table
- **Don't stream priority results** -- batch calculation returns JSON, not a stream
- **Don't over-engineer goal types** -- the decision says business goals only, keep GoalType but filter to relevant ones (revenue, strategic, quick_win)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP export | New export logic | Existing `ExportPanel` + `/api/planning/documents/export` | Already built and tested in Phase 7 |
| Clipboard copy | Custom clipboard util | Existing `handleCopyCommand` pattern from ExportPanel | Works cross-browser |
| Form validation | Custom validation | shadcn form + simple client validation | Consistent with rest of app |
| Priority sorting | Complex sort logic | SQL `ORDER BY pinned DESC NULLS LAST, priority_score DESC NULLS LAST` | Database handles it |

## Common Pitfalls

### Pitfall 1: Goal Tier vs Priority Integer Mismatch
**What goes wrong:** The DB has `priority INTEGER DEFAULT 5` (1-10 scale) but user wants Must-have/Should-have/Nice-to-have tiers.
**How to avoid:** Repurpose the integer as tier: 3=Must-have, 2=Should-have, 1=Nice-to-have. The `GoalType` enum already handles categorization (revenue/strategic/quick_win). The `priority` field becomes the tier weight. No migration needed -- just use 1/2/3 instead of 1-10.

### Pitfall 2: Missing `pinned` Field on Projects
**What goes wrong:** Pin-to-top requires a field that doesn't exist yet.
**How to avoid:** Add a migration: `ALTER TABLE planning_studio.projects ADD COLUMN pinned BOOLEAN DEFAULT FALSE;` Also add `pinned` to the TypeScript types.

### Pitfall 3: Claude Priority Prompt Getting Stale Context
**What goes wrong:** Priority calculation uses outdated project data if not fetching fresh.
**How to avoid:** Always fetch current project data + documents + goals at calculation time, never cache. Include document count, types, and phase completion in the prompt.

### Pitfall 4: Goal Type Enum Includes "Learning" and "Passion"
**What goes wrong:** User decided business goals only, but `GoalType` includes `learning` and `passion`.
**How to avoid:** Filter available goal types in the UI to only show: `revenue`, `strategic`, `quick_win`. Don't remove from the TypeScript enum (backward compat) but don't offer them in the form.

### Pitfall 5: Revalidation After Priority Recalc
**What goes wrong:** Queue page shows stale scores after recalculation.
**How to avoid:** After batch priority update, call `revalidatePath('/dashboard/planning/queue')` and `revalidatePath('/dashboard/planning')`.

## Code Examples

### Goal Tier Mapping
```typescript
// Map tier labels to priority integers
export const GOAL_TIERS = {
  'must-have': { value: 3, label: 'Must-have', color: 'red' },
  'should-have': { value: 2, label: 'Should-have', color: 'amber' },
  'nice-to-have': { value: 1, label: 'Nice-to-have', color: 'gray' },
} as const;

export type GoalTier = keyof typeof GOAL_TIERS;

export function getTierFromPriority(priority: number): GoalTier {
  if (priority >= 3) return 'must-have';
  if (priority >= 2) return 'should-have';
  return 'nice-to-have';
}
```

### Priority Calculation Prompt Structure
```typescript
const prompt = `You are a project prioritization assistant. Score this project 0-100 based on:

ACTIVE GOALS (weighted by tier):
${goals.map(g => `- [${getTierLabel(g.priority)}] ${g.goal_type}: ${g.description}`).join('\n')}

PROJECT:
- Title: ${project.title}
- One-liner: ${project.one_liner}
- Documents: ${documents.length} (types: ${docTypes.join(', ')})
- Created: ${project.created_at}
- Time in pipeline: ${daysSinceCreation} days

SCORING FACTORS:
1. Goal Alignment (40%): How well does this project serve the must-have/should-have goals?
2. Effort Estimate (20%): Based on document complexity, prefer lower effort
3. Recency (15%): Recently created ideas may reflect current priorities
4. Doc Completeness (25%): More complete planning = more ready to build

Return JSON: { "score": number, "reasoning": "one line summary", "goal_alignment": "primary goal tag" }`;
```

### Queue Data Fetching
```typescript
// Enhanced query for queue page
export async function getReadyToBuildQueueWithDetails(): Promise<QueueProject[]> {
  const supabase = createServerClient();

  const { data: projects } = await supabase
    .schema('planning_studio')
    .from('projects')
    .select('*')
    .eq('status', 'ready_to_build')
    .order('pinned', { ascending: false, nullsFirst: false })
    .order('priority_score', { ascending: false, nullsFirst: false });

  // Fetch document counts per project
  const { data: docs } = await supabase
    .schema('planning_studio')
    .from('documents')
    .select('project_id')
    .in('project_id', (projects || []).map(p => p.id));

  // Build counts map and return enriched data
  // ...
}
```

### Start Build Server Action
```typescript
export async function startBuildAction(projectId: string): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .schema('planning_studio')
      .from('projects')
      .update({
        status: 'building',
        build_started_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) throw error;

    revalidatePath('/dashboard/planning');
    revalidatePath('/dashboard/planning/queue');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to start build' };
  }
}
```

## State of the Art

No version changes or deprecations relevant -- all existing patterns are current.

## Open Questions

1. **Goal count enforcement (3-5 max):** Enforce in UI only (disable "Add" button) or also in DB (check constraint)? Recommend UI-only for flexibility.

2. **Batch vs individual priority calc:** Calculate all ready_to_build projects at once in a single Claude call, or one-by-one? Single batch call is more efficient and allows relative comparison. Recommend batch (send all projects in one prompt, get back array of scores).

3. **Auto-recalc trigger:** When goals change, recalculate immediately (synchronous) or queue for background? Since there are likely <20 ready_to_build projects, synchronous is fine -- just show a loading state.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `actions.ts`, `planning-queries.ts`, `export-panel.tsx`, `export/route.ts`
- DB schema: `2026012700_create_planning_studio_schema.sql`
- Types: `planning.ts`
- Context file: `09-CONTEXT.md`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use
- Architecture: HIGH - follows established codebase patterns exactly
- Pitfalls: HIGH - derived from direct code inspection of schema vs requirements

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable codebase patterns)
