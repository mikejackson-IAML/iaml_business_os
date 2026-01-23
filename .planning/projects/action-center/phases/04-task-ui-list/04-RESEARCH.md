# Phase 04: Task UI - List - Research

**Researched:** 2026-01-22
**Focus:** Existing dashboard patterns, components, and implementation approach

## Stack & Patterns

### Page Structure Pattern

The dashboard uses a consistent three-layer pattern:

1. **page.tsx** - Suspense wrapper with skeleton fallback
2. **Data loader** - Async server component that fetches data
3. **Content component** (`'use client'`) - Receives data as props, handles interactivity

```typescript
// Example from leads page
export default function LeadIntelligenceDashboardPage() {
  return (
    <Suspense fallback={<LeadsSkeleton />}>
      <LeadsDataLoader />
    </Suspense>
  );
}
```

### Layout Pattern

- FallingPattern background component
- 12-column grid layout
- UserMenu component in header
- Back navigation link when nested

## Existing Components to Reuse

| Need | Component | Location |
|------|-----------|----------|
| Card wrapper | Card | `@/dashboard-kit/components/ui/card` |
| Badge | Badge | `@/dashboard-kit/components/ui/badge` |
| Skeleton | Skeleton, TableRowSkeleton | `@/dashboard-kit/components/ui/skeleton` |
| Tabs | Tabs, TabsList, TabsTrigger | `@/dashboard-kit/components/ui/tabs` (Radix) |
| Button | Button | `@/dashboard-kit/components/ui/button` |
| Input | Input | `@/dashboard-kit/components/ui/input` |
| Icons | ChevronRight, ChevronDown, etc. | `lucide-react` |

## Filter Pattern

From **workflows-content.tsx**:
- Filter state with `useState`
- Native `<select>` dropdowns with TailwindCSS styling
- Client-side filtering with `useMemo`
- Search input with icon

```typescript
// Filter dropdown styling
<select className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary">
```

## Table Pattern

Best pattern from **workflows-content.tsx** (inline table, not DataTable component):

```css
/* Header */
text-left text-sm text-muted-foreground border-b border-border

/* Row */
border-b border-border last:border-0 hover:bg-muted/50 transition-colors
```

**Note:** Do NOT use DataTable component - it navigates on row click, doesn't support inline expand.

## Inline Expand Pattern

From **instructor-list.tsx**:

```typescript
const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});

const handleToggle = (id: string) => {
  setExpanded(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};
```

Visual pattern:
- ChevronRight → ChevronDown icon toggle
- Content appears below row within same container
- Use Tailwind transition for smooth expand

## Skeleton Pattern

**skeleton.tsx** provides:
- `Skeleton` - Base with `animate-pulse`
- `TableRowSkeleton` - Pre-built for tables

Match skeleton structure to actual content structure.

## CSS Variables Available

From globals.css:
```css
/* Colors */
--background, --foreground, --muted-foreground
--accent-primary, --success, --warning, --error, --info

/* Spacing */
--space-1 through --space-16

/* Border */
--border, --border-subtle

/* Radius */
--radius-sm, --radius-md, --radius-lg
```

Utility classes:
- `.dashboard-card` - Card styling
- `.status-dot-*` - Status dots
- `.badge-*` - Badge variants

## Task API Integration

**Types from task-types.ts:**
- `TaskExtended` - Full task with computed fields (is_overdue, due_category, is_blocked)
- `TaskListParams` - Filter interface
- `TaskListResponse` - API response shape

**API endpoint GET /api/tasks:**
- Query params: status, priority, task_type, source, due_category, department, search, cursor, limit
- Returns: `{ data: TaskExtended[], meta: { cursor, has_more } }`

## Recommended Approach

### File Structure

```
dashboard/src/app/dashboard/action-center/
├── page.tsx                    # Suspense wrapper
├── action-center-skeleton.tsx  # Loading skeleton
├── action-center-content.tsx   # Main component
└── components/
    ├── task-filters.tsx        # Filter toolbar
    ├── task-table.tsx          # Table with expand
    ├── task-row.tsx            # Single row
    ├── task-row-expanded.tsx   # Expanded details
    └── view-tabs.tsx           # View preset tabs
```

### Data Flow

1. Server component fetches initial tasks (My Focus view by default)
2. Client component handles filter changes (client-side for snappy UX)
3. Expanded row shows inline details from existing data (no extra fetch needed for list view)

### State Shape

```typescript
interface TaskListState {
  activeView: string;                    // Current tab
  filters: Record<string, string[]>;     // Multi-select filters
  expandedTaskId: string | null;         // Currently expanded row
  searchQuery: string;                   // Search input
}
```

### Priority Icon Config

```typescript
const priorityConfig = {
  critical: { color: 'bg-red-500', text: 'Critical', emoji: '🔴' },
  high: { color: 'bg-orange-500', text: 'High', emoji: '🟠' },
  normal: { color: 'bg-gray-400', text: 'Normal', emoji: '⚪' },
  low: { color: 'bg-blue-500', text: 'Low', emoji: '🔵' },
};
```

### View Presets

```typescript
const viewPresets = {
  'my-focus': {
    priority: ['critical', 'high'],
    due_category: ['today'],
    status: ['open', 'in_progress'],
  },
  overdue: { due_category: ['overdue'] },
  waiting: { status: ['waiting'] },
  approvals: { task_type: ['approval'] },
  'ai-suggested': { source: ['ai'] },
  all: {},
};
```

## Pitfalls to Avoid

1. **Don't use DataTable** - Navigates on click, no inline expand support

2. **Client-side filtering** - Fetch broader set, filter client-side for speed. Server-side pagination only if list grows large.

3. **Different empty states:**
   - Filter empty: "No tasks match your filters" + Clear Filters
   - My Focus empty: "All caught up! Review upcoming tasks?" + link to All

4. **Accessibility:**
   - Use `<button>` for expandable rows
   - `aria-expanded` attribute
   - Keyboard navigation

5. **Mobile:** Table needs horizontal scroll or column hiding

6. **Auth:** API uses `X-API-Key` header (already set up in API patterns)

## Reference Files

- `dashboard/src/app/dashboard/digital/workflows/workflows-content.tsx` - Table + filters + tabs pattern
- `dashboard/src/app/dashboard/faculty-scheduler/components/instructor-list.tsx` - Inline expand pattern
- `dashboard/src/lib/api/task-types.ts` - Task types
- `dashboard/src/lib/api/task-queries.ts` - Query functions
- `dashboard/src/app/globals.css` - CSS variables

---
*Research completed: 2026-01-22*
