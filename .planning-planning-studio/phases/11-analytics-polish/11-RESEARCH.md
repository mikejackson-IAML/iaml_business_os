# Phase 11: Analytics & Polish - Research

**Researched:** 2026-01-28
**Domain:** Dashboard analytics, UI state patterns, charting
**Confidence:** HIGH

## Summary

This phase adds a metrics dashboard to the Planning Studio and applies UI polish across all pages. The project already has Tremor 3.18.7 installed with established patterns for sparklines (SparkAreaChart) and horizontal bar charts (BarList). The database schema includes all necessary timestamp fields (`created_at`, `shipped_at`) to calculate velocity metrics.

Framer-motion is available for animations but not yet used in Planning Studio. The existing patterns use simple CSS transitions (`transition-colors`) for hover states. Loading states use a Skeleton component with `animate-pulse`, and empty states follow a Card + icon + message pattern.

**Primary recommendation:** Build analytics using existing Tremor patterns (SparkAreaChart for trend sparklines, BarList for funnel visualization), create an RPC function for period-filtered metrics calculation, and systematically audit/polish all Planning Studio pages for consistent loading, empty, and error states.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tremor/react | 3.18.7 | Charts/sparklines | Already used in dashboard for ranking-sparkline, traffic-sources-chart, conversion-funnel-chart |
| framer-motion | 12.26.1 | Animations | Already installed, used in lead-intelligence for AnimatePresence/motion |
| tailwindcss-animate | 1.0.7 | CSS animations | Already installed, provides animate-pulse for skeletons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns-tz | 3.2.0 | Date formatting | For period calculations and display |
| lucide-react | 0.562.0 | Icons | Consistent with all Planning Studio icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tremor | recharts directly | More control but inconsistent with existing dashboard patterns |
| framer-motion | CSS animations | Simpler but less sophisticated for enter/exit animations |

**Installation:**
No new packages needed - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/app/dashboard/planning/
├── analytics/
│   ├── page.tsx              # Suspense wrapper (exists)
│   ├── analytics-content.tsx # Main content (needs implementation)
│   ├── analytics-skeleton.tsx# Loading state (exists)
│   └── components/
│       ├── metric-card.tsx        # Summary card with sparkline
│       ├── period-selector.tsx    # Week/month/quarter/all dropdown
│       └── funnel-visualization.tsx # BarList-based funnel
└── components/
    └── ... (existing components need polish audit)
```

### Pattern 1: Suspense + Content + Skeleton
**What:** Next.js server component page with Suspense boundary and client content
**When to use:** All Planning Studio pages follow this pattern
**Example:**
```typescript
// page.tsx
import { Suspense } from 'react';
import { AnalyticsSkeleton } from './analytics-skeleton';
import { AnalyticsContent } from './analytics-content';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
```

### Pattern 2: Server Data Fetch in Content Component
**What:** Content component fetches data server-side using planning-queries
**When to use:** All data-driven pages
**Example:**
```typescript
// analytics-content.tsx
import { getAnalyticsData } from '@/lib/api/planning-queries';

export async function AnalyticsContent() {
  const data = await getAnalyticsData('month'); // Default period
  // Component is server component, can pass data to client components
  return <AnalyticsContentClient data={data} />;
}
```

### Pattern 3: Metric Card with Embedded Sparkline
**What:** Summary card showing metric value with inline trend sparkline
**When to use:** Analytics dashboard summary section
**Example:**
```typescript
// Source: existing pattern in dashboard/src/app/dashboard/web-intel/components/ranking-sparkline.tsx
import { SparkAreaChart } from '@tremor/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: Array<{ date: string; value: number }>;
  color?: string;
}

export function MetricCard({ title, value, trend, color = 'blue' }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <SparkAreaChart
            data={trend}
            categories={['value']}
            index="date"
            colors={[color]}
            className="h-10 w-24"
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Pattern 4: Horizontal Funnel with BarList
**What:** Conversion funnel using Tremor BarList (horizontal bars)
**When to use:** Showing flow through pipeline stages
**Example:**
```typescript
// Source: existing pattern in dashboard/src/app/dashboard/components/conversion-funnel-chart.tsx
import { BarList } from '@tremor/react';

interface FunnelProps {
  stages: Array<{ name: string; value: number }>;
}

export function FunnelVisualization({ stages }: FunnelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <BarList
          data={stages}
          valueFormatter={(value) => `${value} projects`}
          color="blue"
        />
      </CardContent>
    </Card>
  );
}
```

### Pattern 5: Empty State with Icon + Message
**What:** Consistent empty state design
**When to use:** When no data available
**Example:**
```typescript
// Source: existing pattern in dashboard/src/app/dashboard/planning/queue/components/empty-queue.tsx
import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';

export function EmptyAnalytics() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No analytics data yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Ship some projects to see your pipeline metrics here.
        </p>
      </CardContent>
    </Card>
  );
}
```

### Pattern 6: Error Boundary
**What:** Next.js error.tsx for graceful error handling
**When to use:** Every route that fetches data
**Example:**
```typescript
// Source: existing pattern in dashboard/src/app/dashboard/lead-intelligence/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/dashboard-kit/components/ui/button';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Analytics page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        The analytics page encountered an error. This may be a temporary issue.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Custom chart implementations:** Always use Tremor - it's already styled for the dashboard
- **Missing loading states:** Every data-fetching component needs a skeleton
- **Inline error handling:** Use error.tsx boundaries, not inline try/catch UI
- **Heavy animations:** Keep to subtle transitions (150-200ms), no celebration moments

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sparkline charts | Custom SVG | `SparkAreaChart` from Tremor | Consistent styling, responsive, dark mode support |
| Funnel visualization | Custom bars | `BarList` from Tremor | Built-in formatting, consistent with dashboard |
| Select dropdown | Native `<select>` | `@radix-ui/react-select` (via `/components/ui/select.tsx`) | Accessible, styled, but native select is acceptable for simplicity |
| Loading skeletons | Custom shimmer | `Skeleton` from `/dashboard-kit/components/ui/skeleton.tsx` | Pre-built, consistent `animate-pulse` |
| Date calculations | Manual math | `date-fns-tz` already installed | Time zone aware, tested edge cases |
| List animations | Manual CSS | `framer-motion` AnimatePresence | Enter/exit animations handled automatically |

**Key insight:** The dashboard already has all the charting components needed. The analytics page is primarily about querying the right data and composing existing components.

## Common Pitfalls

### Pitfall 1: Incorrect Velocity Calculation
**What goes wrong:** Calculating average time incorrectly (e.g., including unshipped projects, wrong date diff)
**Why it happens:** Velocity = time from capture to shipped, only for shipped projects
**How to avoid:**
- Only include projects with `shipped_at IS NOT NULL`
- Calculate: `shipped_at - created_at` (not `build_started_at`)
- Use database-level aggregation (RPC function) not client-side
**Warning signs:** Unrealistic numbers, negative values, null handling errors

### Pitfall 2: Period Filtering Edge Cases
**What goes wrong:** "This week" shows different results at different times
**Why it happens:** Week boundaries, timezone issues
**How to avoid:**
- Define periods clearly: week = last 7 days, month = last 30 days, quarter = last 90 days
- Use server timezone for consistency
- Include boundary dates (>=, <)
**Warning signs:** Inconsistent counts when refreshing

### Pitfall 3: Missing Mobile Breakpoints
**What goes wrong:** Charts overflow or become unreadable on mobile
**Why it happens:** Tremor charts have minimum sizes
**How to avoid:**
- Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` for card grids
- Test sparkline visibility at narrow widths
- Funnel should stack vertically on mobile
**Warning signs:** Horizontal scroll, truncated labels

### Pitfall 4: Inconsistent Empty States Across Pages
**What goes wrong:** Each page handles "no data" differently
**Why it happens:** Built incrementally without design system
**How to avoid:**
- Audit all Planning Studio pages first
- Create checklist: icon, heading, description, CTA
- Use same spacing (py-12, text-center pattern)
**Warning signs:** Different icon sizes, inconsistent copy tone

### Pitfall 5: Loading State Flicker
**What goes wrong:** Brief flash of skeleton when data loads quickly
**Why it happens:** Server component renders skeleton, then immediately replaces
**How to avoid:**
- Use React 18+ Suspense which handles this automatically
- Don't add artificial delays
- Accept that fast loads might not show skeleton (that's good)
**Warning signs:** User complaints about "flashy" UI

## Code Examples

Verified patterns from official sources:

### Velocity Calculation Query (Server-Side)
```typescript
// For planning-queries.ts
export async function getAnalyticsMetrics(period: 'week' | 'month' | 'quarter' | 'all') {
  const supabase = createServerClient();

  // Calculate date boundary
  const now = new Date();
  let startDate: Date | null = null;

  switch (period) {
    case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case 'month': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case 'quarter': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
    case 'all': startDate = null; break;
  }

  // Shipped count
  let shippedQuery = supabase
    .schema('planning_studio')
    .from('projects')
    .select('id, created_at, shipped_at')
    .not('shipped_at', 'is', null);

  if (startDate) {
    shippedQuery = shippedQuery.gte('shipped_at', startDate.toISOString());
  }

  const { data: shippedProjects } = await shippedQuery;

  // Calculate velocity (average days from created to shipped)
  const velocities = (shippedProjects || [])
    .filter(p => p.shipped_at && p.created_at)
    .map(p => {
      const created = new Date(p.created_at).getTime();
      const shipped = new Date(p.shipped_at).getTime();
      return (shipped - created) / (1000 * 60 * 60 * 24); // days
    });

  const avgVelocity = velocities.length > 0
    ? velocities.reduce((a, b) => a + b, 0) / velocities.length
    : 0;

  return {
    shippedCount: shippedProjects?.length || 0,
    avgVelocityDays: Math.round(avgVelocity * 10) / 10, // 1 decimal
  };
}
```

### Period Selector Component
```typescript
// Source: pattern from pipeline-search-filter.tsx (native select)
'use client';

interface PeriodSelectorProps {
  value: 'week' | 'month' | 'quarter' | 'all';
  onChange: (period: 'week' | 'month' | 'quarter' | 'all') => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as typeof value)}
      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <option value="week">Last 7 days</option>
      <option value="month">Last 30 days</option>
      <option value="quarter">Last 90 days</option>
      <option value="all">All time</option>
    </select>
  );
}
```

### Subtle Hover Transition
```typescript
// Existing pattern used throughout Planning Studio
<div className="hover:bg-accent transition-colors">
  {/* content */}
</div>

// For cards
<Card className="hover:border-primary/50 transition-colors">
  {/* content */}
</Card>
```

### Framer Motion Enter/Exit Animation
```typescript
// Source: dashboard/src/app/dashboard/lead-intelligence/components/filter-pills.tsx
import { AnimatePresence, motion } from 'framer-motion';

// Wrap list items for smooth add/remove
<AnimatePresence mode="popLayout">
  {items.map((item) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
    >
      {/* item content */}
    </motion.div>
  ))}
</AnimatePresence>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native `<select>` | Radix Select available | Already in project | Use native for simplicity, Radix for styled |
| Manual skeletons | Reusable Skeleton component | Already in project | Use existing component |
| No error boundaries | Next.js error.tsx | App Router default | Add error.tsx to planning routes |

**Deprecated/outdated:**
- None identified - stack is current

## Open Questions

Things that couldn't be fully resolved:

1. **Funnel visualization style**
   - What we know: BarList (horizontal bars) is the established Tremor pattern, classic funnel shapes would require custom SVG
   - What's unclear: User preference for visual style
   - Recommendation: Use BarList (horizontal bars) for consistency with existing conversion-funnel-chart.tsx

2. **Funnel stages to show**
   - What we know: Statuses are: idea, planning, ready_to_build, building, shipped
   - What's unclear: Show all 5 stages or simplify to 3-4?
   - Recommendation: Show all 5 to give complete picture, hide archived

3. **Which pages need most polish attention**
   - What we know: All pages have skeletons, some have empty states
   - What's unclear: Current state of each page's loading/empty/error handling
   - Recommendation: Audit all Planning Studio routes before planning tasks

## Planning Studio Pages to Audit

For polish scope, these routes need review:

| Route | Has Skeleton | Has Empty State | Has Error Boundary | Notes |
|-------|-------------|-----------------|-------------------|-------|
| `/planning` (pipeline) | Yes | Via column emptiness | No | Needs error.tsx |
| `/planning/[projectId]` | Yes | Partial | No | Needs error.tsx |
| `/planning/queue` | Yes | Yes (EmptyQueue) | No | Needs error.tsx |
| `/planning/goals` | Yes | Yes (inline) | No | Needs error.tsx |
| `/planning/analytics` | Yes | Partial (needs impl) | No | Primary focus |

## Sources

### Primary (HIGH confidence)
- Project codebase: `dashboard/package.json` - Tremor 3.18.7 version confirmed
- Project codebase: `dashboard/src/app/dashboard/web-intel/components/ranking-sparkline.tsx` - SparkAreaChart usage
- Project codebase: `dashboard/src/app/dashboard/components/conversion-funnel-chart.tsx` - BarList usage
- Project codebase: `supabase/migrations/2026012700_create_planning_studio_schema.sql` - Schema with created_at, shipped_at fields

### Secondary (MEDIUM confidence)
- [Tremor Spark Chart Documentation](https://www.tremor.so/docs/visualizations/spark-chart) - API reference
- [Tremor NPM Changelog](https://npm.tremor.so/changelog) - Version features

### Tertiary (LOW confidence)
- None - all findings verified against project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified from package.json and existing usage
- Architecture: HIGH - Verified from existing Planning Studio patterns
- Pitfalls: MEDIUM - Based on common patterns and domain knowledge

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable stack)
