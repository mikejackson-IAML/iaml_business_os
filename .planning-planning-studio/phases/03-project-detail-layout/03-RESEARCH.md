# Phase 3: Project Detail View — Layout - Research

**Researched:** 2026-01-27
**Domain:** Next.js layout composition, sidebar patterns, progress indicators, Tailwind CSS
**Confidence:** HIGH

## Summary

This phase builds the project detail page layout. The existing codebase already has the `[projectId]/page.tsx` route with a placeholder, established query functions for all needed data (project, phases, conversations, documents), and comprehensive TypeScript types including helper functions for phase labels, colors, icons, and incubation time formatting.

The skeleton component (`project-skeleton.tsx`) already defines the intended layout: progress bar on top, left sidebar (1 col) with Sessions/Documents/Research cards, main conversation area (3 cols). This is the blueprint to follow.

No new libraries are needed. All data-fetching functions exist. The work is purely component composition using existing shadcn/ui primitives (Card, Badge, Button, Skeleton, Tabs, Tooltip, Progress).

**Primary recommendation:** Replace the placeholder `ProjectContent` with real layout components, following the skeleton's established grid structure (1+3 columns) and using existing query functions and type helpers.

## Standard Stack

### Core (Already Available)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| shadcn/ui Card | Panel containers | Already used everywhere |
| shadcn/ui Tabs | Sidebar panel switching (if tabbed) | Available in ui/ |
| shadcn/ui Tooltip | Phase duration on hover | Available in ui/ |
| shadcn/ui Badge | Status indicators | Already used |
| shadcn/ui Button | Actions (New Session, Skip Incubation) | Already used |
| shadcn/ui Progress | Progress bar base | Available in ui/ |
| lucide-react | Icons per phase type | Already used, icon map exists in types |

### No New Dependencies Needed

All required UI primitives exist. No installation step.

## Architecture Patterns

### Recommended Component Structure
```
dashboard/src/app/dashboard/planning/[projectId]/
├── page.tsx                    # Already exists - server component with Suspense
├── project-content.tsx         # Replace placeholder with real layout
├── project-skeleton.tsx        # Already exists - matches target layout
└── components/
    ├── phase-progress-bar.tsx  # 6-phase visual stepper
    ├── sessions-panel.tsx      # Left sidebar - conversation list
    ├── documents-panel.tsx     # Left sidebar - document list
    ├── research-panel.tsx      # Left sidebar - research runs
    ├── conversation-shell.tsx  # Main area - message display + input placeholder
    └── incubation-overlay.tsx  # Incubation state display
```

### Pattern 1: Server-to-Client Data Flow
**What:** Fetch all data in ProjectContent (or a server wrapper), pass to client sub-components.
**When to use:** Always for this page - matches existing pattern.
```typescript
// project-content.tsx fetches data, renders layout
// Each panel receives typed props, no client-side fetching needed for initial render
```

### Pattern 2: Layout Grid (from existing skeleton)
**What:** `grid grid-cols-1 lg:grid-cols-4 gap-6` with sidebar as 1 col, main as `lg:col-span-3`.
**Why:** The skeleton already defines this. Match it exactly.

### Pattern 3: Phase Progress as Stepper
**What:** Horizontal stepper showing 6 phases with current highlighted.
**Data available:** `PlanningPhase[]` with `phase_type`, `status`, `started_at`, `completed_at`, `incubation_ends_at`.
**Helpers available:** `PHASE_ORDER`, `getPhaseLabel()`, `getPhaseIcon()`, `getPhaseStatusColor()`, `getPhaseIndex()`.

### Pattern 4: Incubation Display
**What:** When `isIncubating(project)` returns true, show calm incubation UI.
**Data available:** `phase_locked_until` on project, `getIncubationTimeRemaining()` helper already formats time.
**Decision:** Show approximate time per context ("Available tomorrow morning" style). The existing helper returns exact time - wrap it to approximate.

### Anti-Patterns to Avoid
- **Client-side data fetching for initial load:** Use server components or server-fetched data passed as props.
- **Building custom time formatting:** Use the existing `getIncubationTimeRemaining()` helper, extend for approximate display.
- **Hardcoding phase names/icons:** Use the existing helper functions from `planning.ts` types file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phase labels/colors/icons | Custom mapping objects | `getPhaseLabel()`, `getPhaseStatusColor()`, `getPhaseIcon()` | Already exist in types file |
| Incubation detection | Date comparison logic | `isIncubating()` helper | Already exists |
| Time remaining | Custom date math | `getIncubationTimeRemaining()` | Already exists (extend for approximate) |
| Phase ordering | Hardcoded arrays | `PHASE_ORDER` constant | Already exists |
| Data fetching | New query functions | Existing `getPlanningProject()`, `getProjectPhases()`, `getProjectConversations()`, `getProjectDocuments()` | Already exist in planning-queries.ts |

**Key insight:** The types file (`planning.ts`) has extensive helper functions that eliminate most utility work. The query layer is complete. This phase is purely UI composition.

## Common Pitfalls

### Pitfall 1: Missing Research Query
**What goes wrong:** There is no `getProjectResearch()` function in planning-queries.ts yet, but the Research panel needs research data.
**How to avoid:** Add a `getProjectResearch()` query function following the same pattern as `getProjectDocuments()`, querying `planning_studio.research` table. The `PlanningResearch` type already exists.

### Pitfall 2: Forgetting Promise<params> Pattern
**What goes wrong:** Next.js 15 requires `await params` in dynamic routes.
**How to avoid:** The existing `page.tsx` already handles this correctly. Don't change it.

### Pitfall 3: Approximate vs Exact Countdown
**What goes wrong:** Using `getIncubationTimeRemaining()` directly shows exact time ("3h 42m") but context requires approximate ("Available tomorrow morning").
**How to avoid:** Create a wrapper function that converts the lock-end timestamp to approximate language: "Available tomorrow morning", "Available in a couple hours", "Available soon".

### Pitfall 4: Schema-Qualified Queries
**What goes wrong:** Forgetting `.schema('planning_studio')` when adding new queries.
**How to avoid:** Follow existing query pattern exactly. All planning queries use `.schema('planning_studio')`.

## Code Examples

### Data Fetching Pattern (follow existing)
```typescript
// Add to planning-queries.ts
export async function getProjectResearch(projectId: string): Promise<PlanningResearch[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .schema('planning_studio')
    .from('research')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching project research:', error);
    return [];
  }
  return (data || []) as PlanningResearch[];
}
```

### Approximate Incubation Time
```typescript
export function getApproximateIncubationTime(project: PlanningProject): string | null {
  if (!project.phase_locked_until) return null;
  const lockEnd = new Date(project.phase_locked_until);
  const now = new Date();
  if (lockEnd <= now) return null;

  const hoursLeft = (lockEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursLeft > 36) return 'Available in a few days';
  if (hoursLeft > 20) return 'Available tomorrow morning';
  if (hoursLeft > 12) return 'Available tomorrow';
  if (hoursLeft > 4) return 'Available later today';
  if (hoursLeft > 1) return 'Available in a couple hours';
  return 'Available soon';
}
```

### Layout Grid (matches skeleton)
```typescript
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Left Sidebar */}
  <div className="space-y-4">
    <SessionsPanel conversations={conversations} />
    <DocumentsPanel documents={documents} />
    <ResearchPanel research={research} />
  </div>
  {/* Main Area */}
  <div className="lg:col-span-3">
    {isIncubating(project)
      ? <IncubationOverlay project={project} />
      : <ConversationShell />
    }
  </div>
</div>
```

## Open Questions

1. **Sidebar collapsibility**
   - What we know: Context says Claude's discretion
   - Recommendation: Skip collapsibility for now (YAGNI). The left nav will eventually take that space. Keep sidebar always visible in this phase, add collapse later if needed.

2. **Click behavior for past phases in progress bar**
   - What we know: Context says clickable past phases, but no routing target defined yet
   - Recommendation: Make past phases clickable but filter sidebar panels to show phase-specific conversations/documents. Use `getProjectConversations(projectId, phaseId)` which already supports phase filtering.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `project-skeleton.tsx` - established layout grid
- Existing codebase: `planning-queries.ts` - all query functions
- Existing codebase: `planning.ts` types - all helper functions and type definitions

### Notes
- No external research needed. This phase is entirely codebase-internal composition using existing patterns, types, and queries.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all components already in codebase
- Architecture: HIGH - skeleton already defines layout, query layer complete
- Pitfalls: HIGH - identified from direct code review (missing research query, approximate time)

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable - internal codebase patterns)
