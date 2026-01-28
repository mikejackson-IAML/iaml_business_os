# Phase 10: Build Tracker - Research

**Researched:** 2026-01-28
**Domain:** Build progress tracking and project status transitions
**Confidence:** HIGH

## Summary

This research focused on the existing codebase patterns for implementing the Build Tracker phase. The phase involves making the "Building" and "Shipped" columns functional in the pipeline view, with modals for build actions and progress tracking.

The codebase already has:
- Complete schema with build tracking fields (build_phase, build_total_phases, build_progress_percent, shipped_at)
- Working pipeline with Building/Shipped columns (just need card enhancements and action modals)
- Established patterns for modals (Dialog, AlertDialog), server actions, and data fetching
- Reusable export functionality from QueueActions component

**Primary recommendation:** Create a BuildModal component that opens when clicking a Building column card, containing progress display, Claude Code command with copy, and Mark Shipped action. Reuse existing patterns from QueueActions and phase-transition-modal.

## Standard Stack

The phase uses existing project dependencies. No new libraries needed.

### Core (Already in Project)
| Library | Purpose | Current Usage |
|---------|---------|---------------|
| @radix-ui/react-dialog | Dialog primitives | `@/components/ui/dialog.tsx` |
| @radix-ui/react-alert-dialog | Confirmation dialogs | `@/components/ui/alert-dialog.tsx` |
| lucide-react | Icons | Throughout planning components |
| sonner | Toast notifications | `toast.success()`, `toast.error()` |
| react-markdown + remark-gfm | Markdown rendering | doc-preview-modal.tsx |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| jszip + file-saver | ZIP export | Already in QueueActions for GSD export |

**No new dependencies required.**

## Architecture Patterns

### Existing Component Structure
```
dashboard/src/app/dashboard/planning/
├── components/
│   ├── pipeline-board.tsx       # DnD context, status filtering
│   ├── pipeline-column.tsx      # Column with status color
│   ├── project-card.tsx         # Card with phase badge, progress
│   └── capture-modal.tsx        # Modal pattern example
├── queue/
│   └── components/
│       ├── queue-actions.tsx    # AlertDialog + DropdownMenu pattern
│       └── queue-item.tsx       # Score badge, actions
└── [projectId]/
    └── components/
        ├── phase-transition-modal.tsx  # AlertDialog confirmation
        ├── doc-preview-modal.tsx       # Dialog with markdown
        └── export-panel.tsx            # ZIP + copy command
```

### Pattern 1: Confirmation Modal (AlertDialog)
**What:** Used for destructive or significant actions requiring user confirmation
**When to use:** Mark Shipped, Start Build
**Example:**
```typescript
// Source: queue-actions.tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button>Build</button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Start building {projectTitle}?</AlertDialogTitle>
      <AlertDialogDescription>
        This will move the project to active builds.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirm}>
        Start Build
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Pattern 2: Content Modal (Dialog)
**What:** Used for displaying content with actions
**When to use:** Build modal with progress and actions
**Example:**
```typescript
// Source: doc-preview-modal.tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
    <DialogHeader>
      <DialogTitle>Document Title</DialogTitle>
      <DialogDescription className="sr-only">Description</DialogDescription>
    </DialogHeader>
    <div className="flex-1 overflow-y-auto min-h-0">
      {/* Content */}
    </div>
    <DialogFooter>
      <Button variant="secondary" onClick={() => onOpenChange(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Pattern 3: Copy to Clipboard
**What:** Copy button with success feedback
**When to use:** Claude Code command display
**Example:**
```typescript
// Source: queue-actions.tsx, export-panel.tsx
const [copied, setCopied] = useState(false);

async function handleCopyCommand() {
  const command = `claude "Start building ${projectTitle} — see .planning/ for project docs"`;
  try {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
}

// In JSX:
<Button onClick={handleCopyCommand}>
  {copied ? (
    <Check className="h-3.5 w-3.5 text-green-500" />
  ) : (
    <Copy className="h-3.5 w-3.5" />
  )}
  {copied ? 'Copied!' : 'Copy Command'}
</Button>
```

### Pattern 4: Server Action with Transition
**What:** Using useTransition for non-blocking server action calls
**When to use:** Status updates, progress updates
**Example:**
```typescript
// Source: queue-actions.tsx
const [isPending, startTransition] = useTransition();

function handleStartBuild() {
  startTransition(async () => {
    const result = await startBuildAction(projectId);
    if (result.success) {
      router.push('/dashboard/planning');
    } else {
      setError(result.error || 'Failed to start build');
    }
  });
}
```

### Pattern 5: Relative Time Formatting
**What:** Human-readable time display
**When to use:** "Building for X days", "Last activity 2h ago"
**Example:**
```typescript
// Source: project-card.tsx
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}
```

### Anti-Patterns to Avoid
- **Direct API calls without error handling:** Always use try/catch and show toast on failure
- **Skipping router.refresh():** After mutations, call router.refresh() to revalidate server data
- **Inline modals without Dialog component:** Use the established Dialog/AlertDialog components

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Copy to clipboard | Custom clipboard logic | Pattern from queue-actions.tsx | Already tested, handles errors |
| ZIP export | Custom file bundling | ExportPanel/QueueActions pattern | Uses jszip, file-saver |
| Confirmation dialogs | Custom modal with buttons | AlertDialog component | Accessible, keyboard support |
| Relative time | Custom date formatting | formatRelativeTime function | Already exists in project-card.tsx |

**Key insight:** All the building blocks exist. This phase is wiring them together, not creating new primitives.

## Common Pitfalls

### Pitfall 1: Missing DialogDescription
**What goes wrong:** Accessibility warning in console, screen reader issues
**Why it happens:** Dialog requires DialogDescription for accessibility
**How to avoid:** Always include DialogDescription, use `className="sr-only"` if not visible
**Warning signs:** Console accessibility warnings

### Pitfall 2: Forgetting router.refresh()
**What goes wrong:** UI shows stale data after mutations
**Why it happens:** Server actions update DB but client cache is stale
**How to avoid:** Call `router.refresh()` after successful mutations
**Warning signs:** Need to manually refresh page to see changes

### Pitfall 3: Not handling pending state
**What goes wrong:** Double-clicks cause duplicate actions
**Why it happens:** Button stays enabled during async operation
**How to avoid:** Use `useTransition` and disable buttons while `isPending`
**Warning signs:** Multiple API calls in network tab

### Pitfall 4: Modal open state management
**What goes wrong:** Modal doesn't close, or closes unexpectedly
**Why it happens:** State not properly synced with Dialog's onOpenChange
**How to avoid:** Pass both `open` and `onOpenChange` to Dialog
**Warning signs:** Modal state doesn't match button clicks

## Code Examples

### Server Action for Mark Shipped (New - needed)
```typescript
// Source: Follows pattern from actions.ts - startBuildAction

/**
 * Mark a project as shipped — updates status and sets shipped_at.
 */
export async function markShippedAction(projectId: string): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .schema('planning_studio')
      .from('projects')
      .update({
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) throw error;

    revalidatePath('/dashboard/planning');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as shipped',
    };
  }
}
```

### Server Action for Update Build Progress (New - needed)
```typescript
/**
 * Update build progress for a project.
 */
export async function updateBuildProgressAction(
  projectId: string,
  buildPhase: number,
  totalPhases: number,
  progressPercent: number
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .schema('planning_studio')
      .from('projects')
      .update({
        build_phase: buildPhase,
        build_total_phases: totalPhases,
        build_progress_percent: progressPercent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) throw error;

    revalidatePath('/dashboard/planning');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress',
    };
  }
}
```

### Build Stepper Component (New - compact version)
```typescript
// Compact phase stepper for build modal
interface BuildStepperProps {
  currentPhase: number;
  totalPhases: number;
}

function BuildStepper({ currentPhase, totalPhases }: BuildStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        Phase {currentPhase} of {totalPhases}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: totalPhases }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full',
              i < currentPhase ? 'bg-blue-500' : 'bg-muted'
            )}
          />
        ))}
      </div>
    </div>
  );
}
```

### Claude Code Command Display
```typescript
// Follows pattern from export-panel.tsx
function ClaudeCodeCommand({ projectTitle }: { projectTitle: string }) {
  const [copied, setCopied] = useState(false);
  const command = `claude "Start building ${projectTitle} — see .planning/ for project docs"`;

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Claude Code Command:</p>
      <div className="flex items-center gap-2 p-3 rounded-md bg-muted font-mono text-sm">
        <code className="flex-1 break-all">{command}</code>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
```

## Existing Schema Fields

The projects table already has all required fields:

| Field | Type | Purpose |
|-------|------|---------|
| `build_phase` | INTEGER | Current build phase (1-indexed) |
| `build_total_phases` | INTEGER | Total phases in build roadmap |
| `build_progress_percent` | INTEGER | Overall progress 0-100 |
| `claude_code_command` | TEXT | Stored command (optional, can generate dynamically) |
| `github_repo` | VARCHAR(255) | Optional GitHub repo URL |
| `build_started_at` | TIMESTAMPTZ | When build was started |
| `shipped_at` | TIMESTAMPTZ | When marked shipped |
| `updated_at` | TIMESTAMPTZ | Last activity timestamp |

## Existing Type Definitions

From `planning.ts`:
```typescript
export interface PlanningProject {
  // ... other fields
  build_phase?: number;
  build_total_phases?: number;
  build_progress_percent: number;
  claude_code_command?: string;
  github_repo?: string;
  build_started_at?: string;
  shipped_at?: string;
}
```

## Document Access Pattern

To access PRD for a building project:
```typescript
// Source: lib/api/planning-queries.ts - getProjectDocuments
const documents = await getProjectDocuments(projectId);
const prdDoc = documents.find(d => d.doc_type === 'gsd_project');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modals | @radix-ui/react-dialog | Already in place | Accessible, composable |
| Manual state management | useTransition | React 18+ | Non-blocking updates |
| Page-based navigation | Modal-first | Design decision | Faster UX |

## Open Questions

1. **Card click behavior in Building column**
   - What we know: Cards in other columns link to project detail page
   - What's unclear: Should Building cards open modal OR link to detail page?
   - Recommendation: Per CONTEXT.md, clicking Building card opens build-specific modal

2. **GitHub repo field usage**
   - What we know: Schema has github_repo field
   - What's unclear: How to populate it, whether to display link/branch
   - Recommendation: Include optional input in build modal if user wants to add it, display if present

## Sources

### Primary (HIGH confidence)
- `dashboard/src/app/dashboard/planning/actions.ts` - Server action patterns
- `dashboard/src/app/dashboard/planning/queue/components/queue-actions.tsx` - AlertDialog + export patterns
- `dashboard/src/app/dashboard/planning/[projectId]/components/doc-preview-modal.tsx` - Dialog modal pattern
- `dashboard/src/dashboard-kit/types/departments/planning.ts` - Type definitions
- `supabase/migrations/2026012700_create_planning_studio_schema.sql` - Schema definition

### Secondary (MEDIUM confidence)
- `dashboard/src/components/ui/dialog.tsx` - Dialog component implementation

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified in package.json and component usage
- Architecture: HIGH - Verified by reading component source files
- Pitfalls: HIGH - Based on codebase patterns and React best practices

**Research date:** 2026-01-28
**Valid until:** No expiry - internal codebase patterns
