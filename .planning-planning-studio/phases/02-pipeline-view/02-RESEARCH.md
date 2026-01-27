# Phase 2: Pipeline View (Main Dashboard) - Research

**Researched:** 2026-01-27
**Domain:** React Kanban board with drag-and-drop, Next.js App Router
**Confidence:** HIGH

## Summary

Research focused on the existing dashboard codebase patterns to ensure Phase 2 follows established conventions. The dashboard is a Next.js App Router project using Tailwind CSS, Radix UI primitives, lucide-react icons, and a custom `dashboard-kit` component library. Critically, `@dnd-kit/core` and `@dnd-kit/sortable` are **already installed** and used in the action-center SOP step list, providing a proven drag-and-drop pattern to follow.

Phase 1 delivered TypeScript types (`PlanningProjectSummary`, `PlanningDashboardData`, `ProjectStatus`), query functions (`getPlanningDashboardData`, `getPlanningProjects`), helper functions (`getStatusColor`, `getStatusLabel`, `isIncubating`, `getIncubationTimeRemaining`), and a shell page at `/dashboard/planning` with skeleton loading.

**Primary recommendation:** Build the Kanban board using `@dnd-kit/core` (already installed), follow the existing modal pattern from `create-task-modal.tsx`, use server actions with `revalidatePath` for mutations, and leverage the existing `getPlanningDashboardData()` which already groups projects by status.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.3.1 | Drag-and-drop engine | Already installed and used in codebase |
| @dnd-kit/sortable | ^10.0.0 | Sortable containers | Already installed |
| @dnd-kit/utilities | ^3.2.2 | CSS transform utilities | Already installed |
| lucide-react | ^0.562.0 | Icons | Used throughout dashboard |
| framer-motion | ^12.26.1 | Animations | Already installed (optional for card transitions) |

### Supporting (Already Available)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| dashboard-kit/ui/card | Card, CardHeader, CardContent, etc. | Project cards |
| dashboard-kit/ui/badge | Status/phase badges | Column headers, phase indicators |
| dashboard-kit/ui/button | Buttons | Capture button, filter toggles |
| dashboard-kit/ui/input | Text inputs | Search bar, capture modal fields |
| dashboard-kit/ui/skeleton | Loading states | Already built in PlanningSkeleton |
| dashboard-kit/ui/progress | Progress bar | Phase progress on cards |
| sonner | Toast notifications | Post-capture feedback |

### No New Dependencies Needed
Everything required is already installed. Do NOT add new packages.

## Architecture Patterns

### Existing Codebase Patterns (MUST FOLLOW)

**1. Page Structure Pattern:**
```
planning/
  page.tsx              # Server component with Suspense + skeleton fallback
  planning-content.tsx  # 'use client' - main content component
  planning-skeleton.tsx # 'use client' - loading skeleton
  actions.ts            # 'use server' - server actions for mutations
  components/           # Feature-specific components
```

**2. Data Fetching Pattern:**
- Server components fetch data and pass as props (or use `getPlanningDashboardData()` in a server component wrapper)
- Client components receive data via props
- Mutations via server actions in `actions.ts` using `revalidatePath`

**3. Server Action Pattern (from action-center):**
```typescript
'use server';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export async function updateProjectStatusAction(
  projectId: string,
  newStatus: ProjectStatus
): Promise<ActionResult> {
  try {
    // Supabase mutation
    revalidatePath('/dashboard/planning');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}
```

**4. Modal Pattern (from create-task-modal.tsx):**
- `isOpen` boolean prop, `onClose` callback
- Fixed overlay with `bg-black/50` backdrop
- Card-based modal body with `max-w-lg`
- `useTransition` for pending state during submission
- Form state with `useState`, not form libraries
- Close resets form state

**5. dnd-kit Pattern (from sop-step-list.tsx):**
```typescript
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

**6. Styling Pattern:**
- Tailwind CSS classes exclusively (no CSS modules, no styled-components)
- Dark theme: cards use `hsl(218 30% 15% / 0.8)` with backdrop blur
- `text-foreground`, `text-muted-foreground`, `border-border` CSS variables
- `cn()` utility from `dashboard-kit/lib/utils` for conditional classes

### Recommended Component Structure
```
planning/
  page.tsx                          # Suspense wrapper (exists)
  planning-content.tsx              # Replace with pipeline dashboard
  planning-skeleton.tsx             # Update skeleton (exists)
  actions.ts                        # NEW: server actions
  components/
    pipeline-board.tsx              # Kanban board with DndContext
    pipeline-column.tsx             # Single column with droppable area
    project-card.tsx                # Draggable project card
    capture-modal.tsx               # Quick capture modal
    pipeline-search-filter.tsx      # Search + filter bar
```

### dnd-kit for Kanban (Cross-Container Drag)
The existing codebase uses dnd-kit for sortable lists. For Kanban cross-column drag, use `DndContext` with custom `onDragEnd` that detects which column the item was dropped into. Key difference from existing usage: use `rectIntersection` collision detection (better for columns) instead of `closestCenter`.

```typescript
import { DndContext, DragOverlay, rectIntersection, DragStartEvent, DragEndEvent } from '@dnd-kit/core';

// Each column is a droppable area using useDroppable
// Each card is draggable using useDraggable
// DragOverlay renders the card being dragged
```

### Anti-Patterns to Avoid
- **Do NOT use SortableContext for columns** -- cards don't need to be sorted within columns (they have a fixed sort order), only moved between columns
- **Do NOT fetch data in client components** -- follow the existing pattern of server component data fetching
- **Do NOT use Radix Dialog** -- the codebase uses a custom modal pattern with fixed positioning, not Radix Dialog

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag and drop | Custom mouse/touch handlers | @dnd-kit/core (installed) | Touch support, accessibility, keyboard navigation |
| Project grouping by status | Manual grouping logic | `getPlanningDashboardData()` | Already returns `projectsByStatus` |
| Status colors/labels | Inline color maps | `getStatusColor()`, `getStatusLabel()` | Already exists in planning types |
| Incubation detection | Date comparison logic | `isIncubating()`, `getIncubationTimeRemaining()` | Already exists in planning types |
| Phase progress | Custom calculation | `phases_completed / total_phases` | Already in `PlanningProjectSummary` |
| Loading skeleton | Custom shimmer | `PlanningSkeleton` | Already exists, just needs update |

## Common Pitfalls

### Pitfall 1: dnd-kit with Next.js App Router SSR
**What goes wrong:** dnd-kit uses browser APIs and fails during SSR
**How to avoid:** All dnd-kit components must be in `'use client'` files. The pipeline-board component and all children using dnd-kit hooks must be client components.

### Pitfall 2: Supabase Schema Access
**What goes wrong:** Default Supabase client queries `public` schema
**How to avoid:** Must use `.schema('planning_studio')` as shown in existing query functions. All new queries/mutations must include this.

### Pitfall 3: Optimistic Updates with Server Actions
**What goes wrong:** Dragging a card to a new column feels laggy if waiting for server roundtrip
**How to avoid:** Use optimistic state updates in the client -- move the card immediately in local state, then fire the server action. Revert on failure.

### Pitfall 4: Horizontal Scroll on Mobile
**What goes wrong:** Kanban columns don't scroll horizontally on small screens
**How to avoid:** Use `overflow-x-auto` on the columns container with `flex-nowrap` and fixed minimum column widths (`min-w-[280px]`).

### Pitfall 5: Column Status Mapping
**What goes wrong:** The context mentions "Incubating" as a column, but the data model has `idea` status
**How to avoid:** Map statuses to display columns carefully. The `ProjectStatus` type has: `idea`, `planning`, `ready_to_build`, `building`, `shipped`, `archived`. "Incubating" is NOT a status -- it's a state within any status (detected via `phase_locked_until`). Show incubating projects in their actual status column but with dimmed styling.

## Code Examples

### Droppable Column
```typescript
import { useDroppable } from '@dnd-kit/core';

function PipelineColumn({ status, projects, children }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[280px] flex-shrink-0 flex flex-col',
        isOver && 'ring-2 ring-primary/50 rounded-lg'
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <h3 className="text-sm font-medium text-foreground">{getStatusLabel(status)}</h3>
        <Badge variant="secondary" className="text-xs">{projects.length}</Badge>
      </div>
      {/* Cards */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
```

### Draggable Project Card
```typescript
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function ProjectCard({ project }: { project: PlanningProjectSummary }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    data: { status: project.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const incubating = project.phase_locked_until && new Date(project.phase_locked_until) > new Date();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('cursor-grab active:cursor-grabbing', incubating && 'opacity-60')}
    >
      <CardContent className="p-4">
        <h4 className="font-medium text-sm">{project.title}</h4>
        {project.one_liner && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.one_liner}</p>
        )}
        {/* Phase badge + progress */}
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">{getPhaseLabel(project.current_phase)}</Badge>
          <Progress value={(project.phases_completed / project.total_phases) * 100} className="flex-1 h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Server Action for Status Update
```typescript
'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProjectStatusAction(
  projectId: string,
  newStatus: string
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .schema('planning_studio')
      .from('projects')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;
    revalidatePath('/dashboard/planning');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update status' };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2022+ | rbd is unmaintained; dnd-kit is the standard |
| Page-level data fetching hooks | Server components + Suspense | Next.js 13+ | Already used in this codebase |
| Client-side mutations | Server Actions | Next.js 14+ | Already used in action-center |

## Open Questions

1. **Create project mutation path**
   - What we know: Need to insert into `planning_studio.projects` table
   - What's unclear: Whether an RPC function exists or if direct insert is needed
   - Recommendation: Use direct `.insert()` with `.schema('planning_studio')`, matching existing query patterns

2. **Column visibility for "archived" status**
   - What we know: `archived` is a valid ProjectStatus
   - What's unclear: Whether to show as a column or hide by default
   - Recommendation: Hide archived column by default, show via filter toggle

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `dashboard/package.json` - confirmed @dnd-kit already installed
- Codebase inspection: `dashboard/src/app/dashboard/action-center/components/sop-step-list.tsx` - dnd-kit usage pattern
- Codebase inspection: `dashboard/src/app/dashboard/action-center/components/create-task-modal.tsx` - modal pattern
- Codebase inspection: `dashboard/src/app/dashboard/action-center/actions.ts` - server action pattern
- Codebase inspection: `dashboard/src/lib/api/planning-queries.ts` - data fetching pattern
- Codebase inspection: `dashboard/src/dashboard-kit/types/departments/planning.ts` - types and helpers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in codebase
- Architecture: HIGH - follows established patterns found in codebase
- Pitfalls: HIGH - derived from actual codebase inspection and dnd-kit knowledge

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable codebase patterns)
