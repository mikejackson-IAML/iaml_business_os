# Phase 2: Traffic Overview - Research

**Researched:** 2026-01-24
**Domain:** Traffic metrics visualization, date range selection, charting
**Confidence:** HIGH

## Summary

Phase 2 builds traffic visualization on top of the existing Phase 1 foundation. The `web-intel-queries.ts` file already contains all necessary types, database queries, and transformation functions for `DailyTraffic` data. The dashboard uses Tremor (`@tremor/react` v3.18.7) for charts, which provides `AreaChart` and `BarChart` components suitable for the stacked area chart showing traffic sources over time.

The existing metric card pattern from `dashboard-kit/components/dashboard/metric-card.tsx` supports delta values, trend direction, and status indicators - perfect for the 4-metric grid design. Date range selection needs to be built fresh as no existing pattern exists in this dashboard, but similar implementations use simple button groups with preset values (7d, 30d, 90d).

**Primary recommendation:** Use Tremor's `AreaChart` for the stacked traffic sources chart, reuse the existing `MetricCard` component for the 4-metric row, and create a simple `DateRangeSelector` component with preset buttons plus URL state persistence.

## Standard Stack

The established libraries/tools for this phase:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tremor/react | 3.18.7 | Charts (AreaChart, BarChart) | Already used for BarList charts, provides full chart suite |
| lucide-react | 0.562.0 | Icons for metric cards | Consistent icon library across dashboard |
| tailwindcss | 3.4.19 | Styling | Design system foundation |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | (via date-fns-tz 3.2.0) | Date calculations | Period comparisons, date formatting |
| framer-motion | 12.26.1 | Animations | Optional skeleton loading transitions |
| clsx + tailwind-merge | 2.1.1 / 3.4.0 | Class name utilities | Conditional styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tremor AreaChart | Recharts directly | Tremor wraps Recharts with better defaults, consistent styling |
| Custom date picker | @radix-ui/react-calendar | Preset buttons simpler for 7d/30d/90d use case |

**Installation:** No additional packages needed - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/app/dashboard/web-intel/
├── page.tsx                    # Existing - Server component data loader
├── web-intel-content.tsx       # Existing - Main client component (modify)
├── web-intel-skeleton.tsx      # Existing - Loading skeleton (modify)
└── components/
    ├── traffic-metrics-row.tsx # NEW - 4-column metric cards
    ├── traffic-sources-chart.tsx # NEW - Stacked area chart
    └── date-range-selector.tsx # NEW - 7d/30d/90d + Custom selector
```

### Pattern 1: Server-Side Data Fetching with Date Range
**What:** Fetch traffic data based on URL `searchParams` for date range, pass to client component
**When to use:** When date range affects multiple components and needs shareable URLs
**Example:**
```typescript
// page.tsx
interface PageProps {
  searchParams: { range?: string };
}

export default async function WebIntelPage({ searchParams }: PageProps) {
  const range = searchParams.range || '30d';
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const data = await getWebIntelDashboardData(days);
  return <WebIntelContent data={data} range={range} />;
}
```

### Pattern 2: Period Comparison for Delta Values
**What:** Calculate % change by comparing current period to prior period of equal length
**When to use:** For showing trend indicators on metric cards
**Example:**
```typescript
// Calculate % change for sessions
function calculatePeriodChange(traffic: DailyTraffic[], days: number): number {
  if (traffic.length < days * 2) return 0;

  const current = traffic.slice(0, days).reduce((sum, d) => sum + d.sessions, 0);
  const previous = traffic.slice(days, days * 2).reduce((sum, d) => sum + d.sessions, 0);

  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
```

### Pattern 3: Traffic Source Aggregation
**What:** Group traffic_sources by source category (organic, direct, referral, social)
**When to use:** For the stacked area chart visualization
**Example:**
```typescript
// Aggregate sources into categories
function categorizeTrafficSources(sources: TrafficSource[]): CategorySessions[] {
  const categories = {
    organic: ['google', 'bing', 'yahoo', 'duckduckgo'],
    social: ['facebook', 'twitter', 'linkedin', 'instagram'],
    referral: [], // Everything not organic/social/direct
    direct: ['(direct)'],
  };

  // Group by date, then categorize
  // Return format: { date: string, organic: number, direct: number, referral: number, social: number }
}
```

### Anti-Patterns to Avoid
- **Fetching data in client components:** Use server components for initial data load, pass via props
- **Hardcoding date ranges in queries:** Pass days parameter, don't create separate 7d/30d/90d functions
- **Building custom charts from scratch:** Tremor provides styled, accessible charts - use them

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart visualization | SVG paths, Canvas | `@tremor/react` AreaChart | Handles responsiveness, tooltips, legends, accessibility |
| Metric cards with trends | Custom card + trend logic | `MetricCard` from dashboard-kit | Already supports delta, trend, status, formatting |
| Number formatting | `toLocaleString()` everywhere | `formatNumber`, `formatPercent` from dashboard-kit | Consistent formatting, handles nulls |
| Period comparison math | Manual date subtraction | Array slice by days | Data already sorted by date descending |

**Key insight:** Phase 1 built extensive type definitions and query functions. Reuse `getDailyTraffic(days)`, `transformDailyTraffic()`, and the existing `DailyTraffic` interface rather than creating new patterns.

## Common Pitfalls

### Pitfall 1: Bounce Rate Color Logic (Inverse)
**What goes wrong:** Using standard "green = up, red = down" for bounce rate when lower is better
**Why it happens:** Default trend indicators assume higher = better
**How to avoid:** Add `inverseColors: true` prop or explicitly flip the color logic for bounce rate
**Warning signs:** Bounce rate showing red when it decreases (which is good)

### Pitfall 2: Missing Data Handling
**What goes wrong:** Charts crash or show misleading visualizations when no data exists
**Why it happens:** New deployments or date ranges with no GA4 data yet
**How to avoid:** Check `dailyTraffic.length` before rendering charts, show meaningful empty state
**Warning signs:** "Cannot read property of undefined" errors, blank charts

### Pitfall 3: Date Range Affecting Multiple Queries
**What goes wrong:** Traffic metrics show 7d data but traffic sources chart shows 30d
**Why it happens:** Date range state not propagated to all queries
**How to avoid:** Single `days` parameter passed through server component to ALL queries
**Warning signs:** Inconsistent numbers between cards and charts

### Pitfall 4: Stale Data on Range Change
**What goes wrong:** Changing date range shows old cached data
**Why it happens:** Next.js ISR caching or React Query stale data
**How to avoid:** Use URL `searchParams` for range (triggers server re-fetch), set appropriate `revalidate`
**Warning signs:** Same numbers after switching between 7d/30d/90d

### Pitfall 5: Tremor Chart Height
**What goes wrong:** Chart doesn't render or has zero height
**Why it happens:** Tremor requires explicit height (h-64, h-80, etc.) - `h-full` doesn't work
**How to avoid:** Always set explicit height class like `className="h-80"` on AreaChart
**Warning signs:** Empty space where chart should be, no console errors

## Code Examples

Verified patterns from official sources and existing codebase:

### Tremor AreaChart for Traffic Sources
```typescript
// Source: https://www.tremor.so/docs/visualizations/area-chart
import { AreaChart, Card, Title } from '@tremor/react';

interface TrafficSourcesChartProps {
  data: Array<{
    date: string;
    organic: number;
    direct: number;
    referral: number;
    social: number;
  }>;
}

export function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
  return (
    <Card>
      <Title>Traffic Sources</Title>
      <AreaChart
        className="h-80"
        data={data}
        index="date"
        categories={['organic', 'direct', 'referral', 'social']}
        colors={['emerald', 'slate', 'blue', 'violet']}
        valueFormatter={(n) => n.toLocaleString()}
        stack={true}  // Stacked area chart
        showLegend={true}
        showAnimation={true}
      />
    </Card>
  );
}
```

### MetricCard with Delta (Existing Pattern)
```typescript
// Source: dashboard/src/dashboard-kit/components/dashboard/metric-card.tsx
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { Users } from 'lucide-react';

<MetricCard
  label="Sessions"
  value={12543}
  format="number"
  delta={15.2}  // Percentage change
  deltaDirection="up"  // 'up' | 'down' | 'neutral'
  status="healthy"  // Optional status indicator
  icon={Users}
/>
```

### Bounce Rate Status (Inverse Logic)
```typescript
// Bounce rate: lower is better
function getBounceRateStatus(rate: number): HealthStatus {
  if (rate < 40) return 'healthy';  // Green
  if (rate < 60) return 'warning';  // Yellow
  return 'critical';  // Red (>60%)
}

function getBounceRateDelta(current: number, previous: number): { delta: number; direction: TrendDirection } {
  const delta = ((current - previous) / previous) * 100;
  // INVERSE: decrease is good (up arrow), increase is bad (down arrow)
  return {
    delta: Math.abs(delta),
    direction: delta < 0 ? 'up' : delta > 0 ? 'down' : 'neutral',
  };
}
```

### Date Range Selector Pattern
```typescript
// Client component with URL state
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const ranges = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
];

export function DateRangeSelector({ currentRange }: { currentRange: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => handleRangeChange(r.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            currentRange === r.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side data fetching | Server Components + props | Next.js 13+ | Better performance, no loading spinners for initial data |
| Custom chart libraries | Tremor with Recharts | 2023 | Consistent styling, fewer maintenance issues |
| localStorage for state | URL searchParams | Modern Next.js | Shareable URLs, better back/forward navigation |

**Deprecated/outdated:**
- Chart.js: Not installed, Tremor provides equivalent functionality with better Tailwind integration

## Data Layer Details

### Existing Query Functions (from web-intel-queries.ts)
| Function | Returns | Parameters | Notes |
|----------|---------|------------|-------|
| `getDailyTraffic(days)` | `DailyTrafficDb[]` | days: number (default 30) | Already implemented |
| `getTopPages(days, limit)` | `PageTrafficDb[]` | days, limit | Already implemented |
| `transformDailyTraffic(data)` | `DailyTraffic[]` | DailyTrafficDb[] | snake_case to camelCase |

### Missing Query Function Needed
```typescript
// New function needed for traffic sources
export async function getTrafficSources(days: number = 30): Promise<TrafficSourceDb[]> {
  const supabase = getServerClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('web_intel.traffic_sources')
    .select('*')
    .gte('collected_date', startDate.toISOString().split('T')[0])
    .order('collected_date', { ascending: true });

  if (error) {
    console.error('Error fetching traffic sources:', error);
    return [];
  }

  return (data as TrafficSourceDb[]) || [];
}
```

### Database Schema Reference (web_intel.traffic_sources)
```sql
-- From 20260121_create_web_intel_schema.sql
CREATE TABLE IF NOT EXISTS web_intel.traffic_sources (
  id UUID PRIMARY KEY,
  collected_date DATE NOT NULL,
  source TEXT NOT NULL,          -- e.g., 'google', 'facebook', '(direct)'
  medium TEXT NOT NULL,          -- e.g., 'organic', 'cpc', 'referral'
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2),
  pages_per_session NUMERIC(5,2),
  avg_session_duration NUMERIC(10,2),
  UNIQUE(collected_date, source, medium)
);
```

### Type Definitions (Already Exist)
- `DailyTraffic` interface in `web-intel-queries.ts` (lines 211-222)
- `TrafficSource` interface in `dashboard-kit/types/departments/web-intel.ts` (lines 41-52)
- `WebIntelDashboardData` interface already includes `dailyTraffic` array

## Open Questions

Things that couldn't be fully resolved:

1. **Traffic source categorization logic**
   - What we know: Database stores source + medium separately
   - What's unclear: Exact mapping of sources to categories (organic/direct/referral/social)
   - Recommendation: Implement standard GA4 categorization: organic = medium='organic', direct = source='(direct)', social = medium='social' OR source in known social list, referral = everything else

2. **Custom date range picker**
   - What we know: User wants preset buttons (7d/30d/90d) PLUS custom option
   - What's unclear: UI for custom date picker (calendar vs. inputs)
   - Recommendation: Start with presets only, defer custom picker to later iteration if needed

## Sources

### Primary (HIGH confidence)
- Codebase: `dashboard/src/lib/api/web-intel-queries.ts` - existing types, queries, transforms
- Codebase: `dashboard/src/dashboard-kit/components/dashboard/metric-card.tsx` - reusable component
- Codebase: `supabase/migrations/20260121_create_web_intel_schema.sql` - database schema
- [Tremor AreaChart Documentation](https://www.tremor.so/docs/visualizations/area-chart) - chart API

### Secondary (MEDIUM confidence)
- Codebase patterns from `lead-intelligence-queries.ts` for transformation patterns
- Existing chart usage in `channel-performance-chart.tsx` (uses Tremor BarList)

### Tertiary (LOW confidence)
- None - all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and used in codebase
- Architecture: HIGH - Follows established patterns from Phase 1 and other dashboard sections
- Data layer: HIGH - Queries and types already exist, only minor additions needed
- Pitfalls: HIGH - Based on documented Tremor behavior and codebase inspection

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable patterns, no expected major changes)
