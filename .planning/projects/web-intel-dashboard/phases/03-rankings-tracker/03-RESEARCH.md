# Phase 3: Rankings Tracker - Research

**Researched:** 2026-01-24
**Domain:** React table components, sparklines, filtering, URL state management
**Confidence:** HIGH

## Summary

This phase requires building a keyword rankings table with sorting, filtering, expandable rows, and sparkline position history. The codebase has established patterns for all of these features that should be followed consistently.

Key findings:
1. **Tremor already has SparkLineChart/SparkAreaChart** - No new dependencies needed. The dashboard uses @tremor/react which includes sparkline components.
2. **Filtering pattern exists in action-center** - The `TaskFilterToolbar` component provides a complete filter dropdown pattern with URL state consideration.
3. **DataTable component exists in dashboard-kit** - Provides sorting, pagination, search - but custom table with expandable rows is the better pattern for this use case (matching task-table).
4. **URL state for date range already implemented** - The `DateRangeSelector` component uses `useRouter` and `useSearchParams` for URL-based state.

**Primary recommendation:** Build a custom `KeywordRankingsTable` component following the `TaskTable`/`TaskRow` pattern, with a simpler single-dropdown priority filter matching the established style.

## Standard Stack

The established libraries for this phase:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tremor/react | ^3.18.7 | SparkAreaChart for position history | Already used for TrafficSourcesChart, provides SparkLineChart |
| lucide-react | ^0.562.0 | Icons (ArrowUp, ArrowDown, AlertTriangle, ChevronDown) | Project standard icon library |
| date-fns | (via dashboard) | Date formatting | Used throughout codebase |
| next/navigation | built-in | useRouter, useSearchParams for URL state | Already used in DateRangeSelector |

### Supporting (Already Available)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| @radix-ui/react-tooltip | Sparkline tooltips (if needed) | Optional hover interaction |
| framer-motion | Expandable row animation | Already installed, use for smooth row expand |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tremor SparkLineChart | react-sparklines | Would add dependency; Tremor already available |
| Custom table | DataTable from dashboard-kit | DataTable doesn't support expandable rows cleanly |
| Multi-filter dropdowns | Single priority filter | Simpler UX matches user decision for single filter |

**Installation:**
No new packages needed - all requirements are met by existing dependencies.

## Architecture Patterns

### Recommended Component Structure
```
dashboard/src/app/dashboard/web-intel/
├── components/
│   ├── keywords-table.tsx         # Main table container
│   ├── keyword-row.tsx            # Individual row (compact)
│   ├── keyword-row-expanded.tsx   # Expanded row with sparkline + SERP features
│   ├── position-change.tsx        # Change indicator component
│   ├── priority-filter.tsx        # Single dropdown filter
│   └── sparkline-chart.tsx        # Wrapper for Tremor SparkAreaChart
```

### Pattern 1: URL State for Filter/Sort
**What:** Store filter and sort state in URL search params
**When to use:** When state should persist on refresh/share
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/web-intel/components/date-range-selector.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function usePriorityFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const priority = searchParams.get('priority') || 'all';
  const sortBy = searchParams.get('sort') || 'priority';
  const sortDir = searchParams.get('dir') || 'desc';

  const setParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || value === 'priority' || value === 'desc') {
        params.delete(key); // Remove default values from URL
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`);
  };

  return { priority, sortBy, sortDir, setParams };
}
```

### Pattern 2: Expandable Table Row
**What:** Click row to expand and show additional details
**When to use:** When compact table needs to show more data on demand
**Example:**
```typescript
// Source: Based on action-center/components/task-row.tsx pattern
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface KeywordRowProps {
  keyword: KeywordWithRanking;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function KeywordRow({ keyword, isExpanded, onToggleExpand }: KeywordRowProps) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggleExpand}
        className="w-full grid grid-cols-[1fr_80px_80px_100px_120px] gap-4 px-6 py-3 hover:bg-muted/50 transition-colors text-left items-center"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium truncate">{keyword.keyword}</span>
        </div>
        {/* ... other columns */}
      </button>
      {isExpanded && <KeywordRowExpanded keyword={keyword} />}
    </div>
  );
}
```

### Pattern 3: Position Change Indicator
**What:** Visual indicator for ranking change with color and arrow
**When to use:** Displaying position deltas
**Example:**
```typescript
// Component for RANK-02
import { ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-react';
import { cn } from '@/dashboard-kit/lib/utils';

interface PositionChangeProps {
  change: number | null;
}

export function PositionChange({ change }: PositionChangeProps) {
  if (change === null || change === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const isImprovement = change < 0; // Lower position = better
  const isDramaticDrop = change >= 10;
  const absChange = Math.abs(change);

  return (
    <span className={cn(
      'flex items-center gap-1 text-sm font-medium',
      isImprovement ? 'text-success' : 'text-error'
    )}>
      {isDramaticDrop && <AlertTriangle className="h-3.5 w-3.5" />}
      {isImprovement ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )}
      <span>{isImprovement ? '+' : '-'}{absChange}</span>
    </span>
  );
}
```

### Anti-Patterns to Avoid
- **Don't use DataTable for expandable rows:** The dashboard-kit DataTable doesn't support expandable rows well; build custom table following TaskTable pattern
- **Don't store filter state in component only:** Use URL params so state persists on refresh
- **Don't fetch sparkline data per-row:** Fetch all 7-day rankings in one query, then distribute to rows
- **Don't build multi-select filter:** User decided on single priority filter; keep it simple

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sparkline charts | Custom SVG path calculation | Tremor SparkAreaChart | Already installed, handles scaling/styling |
| URL state management | Custom useEffect + history.pushState | useRouter + useSearchParams | Next.js standard, handles edge cases |
| Sort icons | Custom SVG or text | DataTable's SortIcon pattern or lucide ChevronUp/ChevronDown | Consistent with codebase |
| Filter dropdown | Complex popover library | Simple button + portal div (see TaskFilterToolbar pattern) | Lightweight, matches existing pattern |

**Key insight:** The codebase already has patterns for everything this phase needs. The main work is composition, not invention.

## Common Pitfalls

### Pitfall 1: Sparkline Y-Axis Direction
**What goes wrong:** Position 1 displayed at bottom, position 100 at top (standard chart orientation)
**Why it happens:** Default chart behavior; lower values at bottom
**How to avoid:** Invert the data or use custom domain. For rankings, "up is good" means position 1 should be at TOP of sparkline.
**Warning signs:** Users confused that "going up" shows as line going down

```typescript
// Solution: Invert position values for sparkline
const sparklineData = rankings.map(r => ({
  date: r.collected_date,
  position: r.position ? (101 - r.position) : null // Invert so position 1 = 100
}));
```

### Pitfall 2: Missing Rankings Data
**What goes wrong:** Sparkline breaks when some days have no data
**Why it happens:** Keyword may not have ranked every day
**How to avoid:** Use `connectNulls={true}` on Tremor chart, or fill gaps with null values
**Warning signs:** Sparkline shows discontinuous lines or errors

### Pitfall 3: Sorting by Position When Null
**What goes wrong:** Keywords with no ranking sort inconsistently
**Why it happens:** null position needs special handling
**How to avoid:** Treat null as position 101 (worst) for sorting purposes
**Warning signs:** Unranked keywords appear randomly in sorted list

```typescript
const sortByPosition = (a: Keyword, b: Keyword) => {
  const posA = a.currentPosition ?? 101;
  const posB = b.currentPosition ?? 101;
  return posA - posB; // Ascending: best (1) first
};
```

### Pitfall 4: Mobile Table Overflow
**What goes wrong:** Table too wide for mobile screens
**Why it happens:** 5+ columns don't fit on 320px screen
**How to avoid:** Per user decision: Claude's discretion on mobile treatment. Recommend card layout for mobile or horizontal scroll container.
**Warning signs:** Table content cut off or overlapping

## Code Examples

### Tremor SparkAreaChart Usage
```typescript
// Source: https://www.tremor.so/docs/visualizations/spark-chart
import { SparkAreaChart } from '@tremor/react';

interface SparklineProps {
  data: Array<{ date: string; position: number | null }>;
}

export function RankingSparkline({ data }: SparklineProps) {
  // Invert positions so "up is good" (position 1 at top)
  const chartData = data.map(d => ({
    date: d.date,
    value: d.position ? (101 - d.position) : null
  }));

  // Handle no data
  if (chartData.every(d => d.value === null)) {
    return <div className="h-8 w-24 bg-muted rounded" />; // Placeholder
  }

  return (
    <SparkAreaChart
      data={chartData}
      categories={['value']}
      index="date"
      colors={['blue']}
      className="h-8 w-24"
      connectNulls={true}
    />
  );
}
```

### Priority Filter Component
```typescript
// Based on TaskFilterToolbar pattern
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const priorities = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function PriorityFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('priority') || 'all';

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('priority');
    } else {
      params.set('priority', value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="px-4 py-2 border border-border rounded-lg text-sm bg-background"
    >
      {priorities.map(p => (
        <option key={p.value} value={p.value}>{p.label}</option>
      ))}
    </select>
  );
}
```

### Sortable Table Header
```typescript
// Based on DataTable sorting pattern
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDir: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export function SortableHeader({ label, sortKey, currentSort, currentDir, onSort }: SortableHeaderProps) {
  const isActive = currentSort === sortKey;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
    >
      {label}
      {isActive ? (
        currentDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-sparklines package | Tremor SparkAreaChart | Already in project | One less dependency to maintain |
| Client-side only state | URL-based state | Established pattern | Shareable URLs, browser back works |
| Inline styles for colors | Tailwind text-success/text-error | Project standard | Consistent theming |

**Deprecated/outdated:**
- None identified for this phase; all patterns are current

## Open Questions

Things that couldn't be fully resolved:

1. **Mobile layout decision (Claude's discretion)**
   - What we know: Desktop uses 5-column grid at ~40px row height
   - What's unclear: Card layout vs truncated table vs horizontal scroll
   - Recommendation: Use horizontal scroll container with min-widths; simpler to implement and maintains table mental model

2. **Sparkline tooltip interaction (Claude's discretion)**
   - What we know: Tremor supports tooltips but adds complexity
   - What's unclear: Whether tooltips provide enough value vs visual-only
   - Recommendation: Start visual-only (no tooltip); add if users request

3. **SERP features icon set**
   - What we know: Need icons for featured snippet, PAA, local pack, etc.
   - What's unclear: Exact icon mappings not specified
   - Recommendation: Use lucide icons - Star for featured snippet, HelpCircle for PAA, MapPin for local pack, Video for video results

## Sources

### Primary (HIGH confidence)
- `/dashboard/src/app/dashboard/web-intel/components/traffic-sources-chart.tsx` - Tremor AreaChart usage pattern
- `/dashboard/src/app/dashboard/web-intel/components/date-range-selector.tsx` - URL state pattern
- `/dashboard/src/app/dashboard/action-center/components/task-table.tsx` - Table structure pattern
- `/dashboard/src/app/dashboard/action-center/components/task-row.tsx` - Row component pattern
- `/dashboard/src/app/dashboard/action-center/components/task-filters.tsx` - Filter dropdown pattern
- `/dashboard/src/dashboard-kit/components/dashboard/data-table.tsx` - Sorting pattern reference
- `/supabase/migrations/20260120_create_web_intel_schema.sql` - Database schema for keywords/rankings

### Secondary (MEDIUM confidence)
- [Tremor Spark Chart Documentation](https://www.tremor.so/docs/visualizations/spark-chart) - SparkAreaChart API

### Tertiary (LOW confidence)
- None - all findings verified with codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified in package.json and existing components
- Architecture: HIGH - patterns directly from codebase
- Pitfalls: HIGH - identified from domain knowledge and codebase patterns

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (stable patterns, no fast-moving dependencies)
