# Phase 7: AI Recommendations - Research

**Researched:** 2026-01-25
**Domain:** AI Recommendations UI for Web Intel Dashboard
**Confidence:** HIGH

## Summary

This phase adds UI for displaying and acting on AI-generated SEO recommendations. The database schema already exists (`web_intel.recommendations` table with full status tracking), and the existing codebase provides clear patterns to follow: AlertTypeFilter for priority chips, AlertCard/AlertsSection for card patterns, and server actions for mutations.

The implementation will:
1. Add a "Recommendations" tab to the existing TabsList in web-intel-content.tsx
2. Create a query function to fetch recommendations (following web-intel-queries.ts patterns)
3. Create mutation functions for complete/snooze actions
4. Build a RecommendationsSection component with PriorityFilter and RecommendationCard components

**Primary recommendation:** Follow the AlertsSection/AlertCard pattern closely - the structure is nearly identical (filter chips, card list, dismiss actions) with minor adaptations for snooze dropdown and 2-column grid layout.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18+ | Component framework | Already in use throughout dashboard |
| Next.js | 14+ | Server actions, server components | Already configured with `'use server'` pattern |
| Tailwind CSS | 3.x | Styling | Project standard, cn() utility available |
| Lucide React | latest | Icons | Already imported in alert-card.tsx |
| class-variance-authority | latest | Variant styling | Used by Badge component |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-tabs | 1.1.13 | Tab component | Already used in web-intel-content.tsx |
| @radix-ui/react-tooltip | 1.2.8 | Tooltips | For snooze button hover state |

### Not Needed
| Instead of | Why Not Needed | Use Instead |
|------------|----------------|-------------|
| @radix-ui/react-dropdown-menu | Not in current deps | Custom dropdown (like UserMenu) or simple HTML select |
| Framer Motion | Not in current deps | Tailwind CSS transitions |
| React Query | Server components | Direct Supabase queries + revalidatePath |

**Installation:**
No new dependencies required. All needed packages are already installed.

## Architecture Patterns

### Recommended File Structure
```
dashboard/src/app/dashboard/web-intel/
├── page.tsx                        # Add getRecommendations() to data loader
├── web-intel-content.tsx           # Add Recommendations tab + RecommendationsSection
├── actions.ts                      # Add completeRecommendation, snoozeRecommendation actions
└── components/
    ├── recommendations-section.tsx # Main section with filter + grid
    ├── recommendation-card.tsx     # Individual card component
    └── priority-filter.tsx         # Reusable filter (like AlertTypeFilter)

dashboard/src/lib/api/
├── web-intel-queries.ts           # Add getRecommendations() query + types
└── web-intel-mutations.ts         # Add completeRecommendation(), snoozeRecommendation()
```

### Pattern 1: PriorityFilter (adapt from AlertTypeFilter)
**What:** Horizontal chip bar filtering by priority level
**When to use:** For filtering recommendations by high/medium/low priority
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/web-intel/components/alert-type-filter.tsx
export type PriorityFilterValue = 'all' | 'high' | 'medium' | 'low';

const filterOptions: { value: PriorityFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// Use URL params for filter state (like AlertTypeFilter does)
const handleChange = (value: PriorityFilterValue) => {
  const params = new URLSearchParams(searchParams.toString());
  if (value === 'all') {
    params.delete('priority');
  } else {
    params.set('priority', value);
  }
  router.push(`?${params.toString()}`);
};
```

### Pattern 2: Card with Optimistic UI (adapt from AlertCard)
**What:** Cards that handle actions with immediate visual feedback
**When to use:** For the Mark Complete action
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/web-intel/components/alert-card.tsx
const [isPending, startTransition] = useTransition();
const [isDismissing, setIsDismissing] = useState(false);

const handleComplete = () => {
  setIsDismissing(true);
  startTransition(async () => {
    const result = await completeRecommendationAction(id);
    if (result.success) {
      onComplete?.(id);
    } else {
      setIsDismissing(false);
    }
  });
};

// Fade out animation via className
className={cn(
  'relative p-4 rounded-lg bg-card border transition-all',
  isDismissing && 'opacity-50 scale-95',
)}
```

### Pattern 3: Server Action (adapt from actions.ts)
**What:** Server-side mutation with revalidation
**When to use:** For complete/snooze mutations
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/web-intel/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { completeRecommendation, snoozeRecommendation } from '@/lib/api/web-intel-mutations';

export async function completeRecommendationAction(id: string): Promise<ActionResult> {
  try {
    await completeRecommendation(id);
    revalidatePath('/dashboard/web-intel');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete recommendation',
    };
  }
}
```

### Pattern 4: Snooze Dropdown
**What:** Simple dropdown for duration selection
**When to use:** For snooze action with 1d/7d/30d options
**Example:**
```typescript
// Custom dropdown pattern (no Radix - follow UserMenu pattern)
const [isOpen, setIsOpen] = useState(false);
const menuRef = useRef<HTMLDivElement>(null);

// Click outside handler
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

// Or use native HTML select for simplicity
<select onChange={(e) => handleSnooze(e.target.value)}>
  <option value="">Snooze...</option>
  <option value="1">1 day</option>
  <option value="7">7 days</option>
  <option value="30">30 days</option>
</select>
```

### Anti-Patterns to Avoid
- **Installing new UI libraries:** Project uses custom dropdowns, not Radix dropdown-menu. Don't add new dependencies.
- **Client-side data fetching:** Use server components with Suspense, not useEffect/fetch patterns.
- **Local state for filter:** Use URL params (searchParams) for filter state to enable shareable URLs.
- **Blocking UI during mutations:** Use useTransition for non-blocking updates with optimistic UI.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Priority badges | Custom color logic | Badge component with new variants | Consistent styling, dark mode support |
| Filter chips | Custom button styling | Copy AlertTypeFilter pattern exactly | URL state management built-in |
| Skeleton loading | Custom skeleton | Skeleton component from dashboard-kit | Consistent shimmer animation |
| Server mutations | Custom fetch calls | Server actions pattern | Type safety, revalidation built-in |
| Optimistic updates | Custom state management | useTransition + local state | React 18 pattern, non-blocking |

**Key insight:** The AlertsSection/AlertCard implementation is 90% of what's needed. The main differences are:
1. Grid layout instead of vertical stack
2. Snooze action instead of just dismiss
3. Priority colors instead of severity colors

## Common Pitfalls

### Pitfall 1: Forgetting to add snoozed_until column
**What goes wrong:** Snooze action has no effect because there's no way to track when snooze expires
**Why it happens:** The current `web_intel.recommendations` schema has `status` but no `snoozed_until` timestamp
**How to avoid:** Either:
  - Add a `snoozed_until TIMESTAMPTZ` column to the schema
  - Or use `status = 'dismissed'` with a scheduled job to unsnooze (simpler for now)
**Warning signs:** Snoozed items immediately reappear on page refresh

### Pitfall 2: Not filtering out completed/dismissed recommendations
**What goes wrong:** Completed items keep appearing in the list
**Why it happens:** Query doesn't filter by status
**How to avoid:** Always filter: `.eq('status', 'new')` or `.in('status', ['new', 'in_progress'])`
**Warning signs:** "All caught up!" never appears

### Pitfall 3: Missing priority badge variants
**What goes wrong:** Badge colors don't match design spec (red/yellow/gray)
**Why it happens:** Badge component has `healthy/warning/critical` variants but not `high/medium/low`
**How to avoid:** Add new Badge variants or use inline className override
**Warning signs:** All badges appear the same color

### Pitfall 4: Not updating count in tab badge
**What goes wrong:** Tab shows stale count after completing recommendations
**Why it happens:** Count is calculated at page load, not updated after mutations
**How to avoid:** Either:
  - Count from client-side filtered array (like AlertsSection does)
  - Or use revalidatePath + count from server
**Warning signs:** Tab says "5" but only 3 items visible

### Pitfall 5: Click outside handler memory leak
**What goes wrong:** Console warnings about state updates on unmounted component
**Why it happens:** Event listener not cleaned up
**How to avoid:** Always return cleanup function from useEffect
**Warning signs:** React dev warnings in console

## Code Examples

### Database Types (add to web-intel-queries.ts)
```typescript
// Source: supabase/migrations/20260121_create_web_intel_schema.sql lines 649-671
export interface RecommendationDb {
  id: string;
  title: string;
  description: string;
  category: string | null;  // 'content', 'technical', 'rankings', 'backlinks'
  priority: string;  // 'high', 'medium', 'low' (not 'critical' in this table)
  estimated_impact: string | null;  // 'low', 'medium', 'high'
  source_workflow: string | null;
  source_data: Record<string, unknown>;
  status: 'new' | 'in_progress' | 'completed' | 'dismissed';
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string | null;
  status: 'new' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: Date;
}
```

### Query Function (add to web-intel-queries.ts)
```typescript
// Pattern from: getWebIntelAlerts()
export async function getRecommendations(activeOnly: boolean = true): Promise<RecommendationDb[]> {
  const supabase = getServerClient();

  let query = supabase.from('web_intel.recommendations').select('*');

  if (activeOnly) {
    query = query.in('status', ['new', 'in_progress']);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }

  // Sort by priority manually (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = (data as RecommendationDb[])?.sort((a, b) => {
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sorted || [];
}
```

### Mutation Functions (add to web-intel-mutations.ts)
```typescript
// Pattern from: acknowledgeAlert()
export async function completeRecommendation(id: string): Promise<void> {
  const supabase = getServerClient() as any;

  const { error } = await supabase
    .from('web_intel.recommendations')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to complete recommendation: ${error.message}`);
  }
}

export async function snoozeRecommendation(id: string, days: number): Promise<void> {
  const supabase = getServerClient() as any;

  // For now, mark as dismissed. A scheduled job could unsnooze later.
  // Alternatively, add snoozed_until column to schema.
  const { error } = await supabase
    .from('web_intel.recommendations')
    .update({
      status: 'dismissed',
      // If snoozed_until column exists:
      // snoozed_until: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to snooze recommendation: ${error.message}`);
  }
}
```

### Priority Badge Colors
```typescript
// Add to badge.tsx or use inline className
const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

// Usage
<span className={cn(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
  priorityColors[priority]
)}>
  {priority}
</span>
```

### Empty State
```typescript
// Celebratory empty state
{sortedRecommendations.length === 0 && (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
      <CheckCircle className="h-8 w-8 text-emerald-500" />
    </div>
    <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
    <p className="text-sm text-muted-foreground mt-1">
      No pending recommendations right now.
    </p>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useEffect + fetch | Server Components + Suspense | Next.js 13+ | Better performance, simpler code |
| Redux for optimistic UI | useTransition | React 18 | Native React, no library needed |
| styled-components | Tailwind CSS + CVA | Project convention | Consistent with codebase |

**Deprecated/outdated:**
- None relevant - the existing patterns in the codebase are current best practices

## Open Questions

Things that couldn't be fully resolved:

1. **Snooze persistence strategy**
   - What we know: Schema has `status` but no `snoozed_until` column
   - What's unclear: Whether snooze should be time-limited or permanent dismiss
   - Recommendation: Start with dismiss behavior, add `snoozed_until` column if time-based unsnooze is needed later

2. **Tab placement**
   - What we know: Current tabs are Overview, Rankings, Technical, Alerts, Content
   - What's unclear: Whether Recommendations should be its own tab or within Content
   - Recommendation: Add as new tab after "Content" - recommendations span all categories

3. **Recommendation count in tab badge**
   - What we know: Alerts tab shows count badge
   - What's unclear: Whether Recommendations tab should also show count
   - Recommendation: Yes, show count badge for consistency (users can see at-a-glance if action needed)

## Sources

### Primary (HIGH confidence)
- `/Users/mike/IAML Business OS/supabase/migrations/20260121_create_web_intel_schema.sql` - recommendations table schema (lines 649-675)
- `/Users/mike/IAML Business OS/dashboard/src/app/dashboard/web-intel/components/alert-type-filter.tsx` - filter pattern
- `/Users/mike/IAML Business OS/dashboard/src/app/dashboard/web-intel/components/alert-card.tsx` - card pattern
- `/Users/mike/IAML Business OS/dashboard/src/app/dashboard/web-intel/actions.ts` - server action pattern
- `/Users/mike/IAML Business OS/dashboard/src/lib/api/web-intel-mutations.ts` - mutation pattern
- `/Users/mike/IAML Business OS/dashboard/src/lib/api/web-intel-queries.ts` - query pattern

### Secondary (MEDIUM confidence)
- `/Users/mike/IAML Business OS/dashboard/src/components/UserMenu.tsx` - custom dropdown pattern (for snooze)

### Tertiary (LOW confidence)
- None - all findings verified with existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use
- Architecture: HIGH - clear patterns from existing AlertsSection implementation
- Pitfalls: HIGH - based on actual schema review and pattern analysis

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable patterns)
