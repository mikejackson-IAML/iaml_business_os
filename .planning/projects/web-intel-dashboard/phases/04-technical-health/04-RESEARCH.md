# Phase 4: Technical Health - Research

**Researched:** 2026-01-24
**Domain:** Core Web Vitals display, Google Search Console metrics, status badges
**Confidence:** HIGH

## Summary

Phase 4 implements the Technical Health tab on the existing Web Intelligence dashboard. The infrastructure is largely complete: TypeScript types for `CoreWebVitals` and `SearchPerformance` already exist in `web-intel-queries.ts`, along with working query functions (`getCoreWebVitals()`, `getSearchPerformance()`) and transformation functions. The database schema `web_intel.core_web_vitals` stores CWV data with percentage breakdowns for each metric by device type, and `web_intel.search_performance` stores GSC query-level data with clicks, impressions, CTR, and position.

The main implementation work involves creating new UI components: (1) a unified CWV card with mobile/desktop toggle and status badges, (2) GSC summary metric cards following the `TrafficMetricsRow` pattern, and (3) a simple top queries list. The existing `Badge` component from dashboard-kit can be extended with CWV-specific status variants (Good/Needs Work/Poor), and the `DateRangeSelector` pattern provides a template for the mobile/desktop toggle.

**Primary recommendation:** Reuse the existing data layer completely. Focus implementation on new display components: `CoreWebVitalsCard` (unified card with toggle), `GscMetricsRow` (4 mini-cards following traffic pattern), and `TopQueriesList` (simple ranked list).

## Existing Infrastructure

### Types Already Defined (web-intel-queries.ts)

```typescript
// CoreWebVitals type (lines 307-321)
export interface CoreWebVitals {
  id: string;
  collectedDate: Date;
  deviceType: 'mobile' | 'desktop';
  lcpGoodPct: number | null;
  lcpNeedsImprovementPct: number | null;
  lcpPoorPct: number | null;
  fidGoodPct: number | null;         // INP stored in FID columns
  fidNeedsImprovementPct: number | null;
  fidPoorPct: number | null;
  clsGoodPct: number | null;
  clsNeedsImprovementPct: number | null;
  clsPoorPct: number | null;
  overallStatus: 'good' | 'needs_improvement' | 'poor' | null;
}

// SearchPerformance type (lines 333-342)
export interface SearchPerformance {
  id: string;
  collectedDate: Date;
  query: string | null;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}
```

### Query Functions Already Implemented

| Function | Description | Status |
|----------|-------------|--------|
| `getCoreWebVitals()` | Fetches most recent CWV for mobile + desktop | Ready to use |
| `getSearchPerformance(days, limit)` | Fetches GSC query data ordered by clicks | Ready to use |
| `transformCoreWebVitals(data)` | Transforms snake_case to camelCase | Ready to use |
| `transformSearchPerformance(data)` | Transforms snake_case to camelCase | Ready to use |

### Dashboard Data Already Includes CWV and GSC

The `WebIntelDashboardData` interface already includes:
- `coreWebVitals: CoreWebVitals[]` (fetched in parallel with other data)
- `searchPerformance: SearchPerformance[]` (fetched in parallel)

**No new data fetching needed.** The `page.tsx` already fetches this data via `getWebIntelDashboardData()`.

## Data Schema

### web_intel.core_web_vitals

```sql
-- Key columns from 20260121_create_web_intel_schema.sql (lines 231-257)
CREATE TABLE IF NOT EXISTS web_intel.core_web_vitals (
  id UUID PRIMARY KEY,
  collected_date DATE NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop')),

  -- LCP percentages (sum to 100%)
  lcp_good_pct NUMERIC(5,2),
  lcp_needs_improvement_pct NUMERIC(5,2),
  lcp_poor_pct NUMERIC(5,2),

  -- INP percentages (stored in fid_ columns)
  fid_good_pct NUMERIC(5,2),
  fid_needs_improvement_pct NUMERIC(5,2),
  fid_poor_pct NUMERIC(5,2),

  -- CLS percentages
  cls_good_pct NUMERIC(5,2),
  cls_needs_improvement_pct NUMERIC(5,2),
  cls_poor_pct NUMERIC(5,2),

  -- Overall assessment
  overall_status TEXT CHECK (overall_status IN ('good', 'needs_improvement', 'poor')),

  UNIQUE(collected_date, device_type)
);
```

**Note:** The schema uses `fid_` prefix for the second metric. FID (First Input Delay) was replaced by INP (Interaction to Next Paint) as a Core Web Vital in March 2024. The column names remain `fid_*` but contain INP data. Frontend should display as "INP".

### web_intel.search_performance

```sql
-- Key columns (lines 262-276)
CREATE TABLE IF NOT EXISTS web_intel.search_performance (
  id UUID PRIMARY KEY,
  collected_date DATE NOT NULL,
  query TEXT,              -- Search query text
  page TEXT,               -- Page URL (nullable for site-level)
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4),        -- CTR as decimal (0.0234 = 2.34%)
  position NUMERIC(5,2),   -- Average position (1.0 = first)
);
```

## Component Patterns

### Pattern 1: TrafficMetricsRow (Reusable for GSC)

The existing `traffic-metrics-row.tsx` provides the exact pattern for GSC summary metrics:

```typescript
// From traffic-metrics-row.tsx (lines 118-159)
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard
    label="Sessions"
    value={sessions.current}
    format="number"
    icon={MousePointerClick}
    delta={hasComparisonData ? sessions.change : undefined}
    deltaDirection={hasComparisonData ? sessions.direction : undefined}
    description={`vs previous ${days}d`}
  />
  {/* ... 3 more cards */}
</div>
```

**Apply to GSC:** Create `GscMetricsRow` with same structure:
- Clicks (number, icon: MousePointerClick)
- Impressions (number, icon: Eye)
- CTR (percent, icon: Percent)
- Avg Position (number with 1 decimal, icon: TrendingUp, lower is better)

### Pattern 2: DateRangeSelector (Reusable for Device Toggle)

The existing `date-range-selector.tsx` provides the toggle pattern:

```typescript
// From date-range-selector.tsx (lines 29-46)
<div className={cn('flex gap-1 p-1 bg-muted rounded-lg', className)}>
  {ranges.map((r) => (
    <button
      key={r.value}
      onClick={() => handleRangeChange(r.value)}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
        currentRange === r.value
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
      )}
    >
      {r.label}
    </button>
  ))}
</div>
```

**Apply to CWV:** Create `DeviceToggle` using same visual pattern:
- Two buttons: [Mobile] [Desktop]
- Mobile is default (per CONTEXT.md)
- Use local state (no URL persistence needed for device toggle)

### Pattern 3: Badge Component (Extend for CWV Status)

The existing `Badge` component supports status variants:

```typescript
// From badge.tsx (lines 18-25)
healthy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
```

**CWV Status Mapping:**
| CWV Status | Badge Variant | Label |
|------------|---------------|-------|
| `good` | `healthy` | "Good" |
| `needs_improvement` | `warning` | "Needs Work" |
| `poor` | `critical` | "Poor" |

**Overall Status Mapping:**
| Overall Status | Badge Variant | Label |
|----------------|---------------|-------|
| `good` | `healthy` | "Passing" |
| `needs_improvement` or `poor` | `warning` | "Needs Work" |

## Implementation Notes

### CWV Thresholds (for reference, not displayed)

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4.0s | > 4.0s |
| INP | < 200ms | 200ms - 500ms | > 500ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |

Per CONTEXT.md, thresholds are "hidden by default (power users know them)". Display only the value + status badge, not the threshold ranges.

### CWV Value Display

The database stores percentages (e.g., `lcp_good_pct = 75.5` means 75.5% of pages have good LCP). The UI needs to show a representative value, not the percentage.

**Decision needed:** The current schema doesn't store actual LCP/INP/CLS values, only the percentage distributions. Options:
1. Show the "Good %" as the metric value (e.g., "LCP: 75% Good")
2. Add columns for P75 values in a future schema update
3. Derive status from percentage distribution

**Recommendation:** Use the good percentage as the value and derive status:
- If `good_pct >= 75`: status = "good" (Green)
- If `good_pct >= 50`: status = "needs_improvement" (Yellow)
- Otherwise: status = "poor" (Red)

### GSC Aggregation

For the 4 summary metrics, aggregate across all queries in the selected period:
- **Clicks:** SUM of all clicks
- **Impressions:** SUM of all impressions
- **CTR:** Total clicks / Total impressions (don't average CTRs)
- **Avg Position:** Weighted average by impressions (more accurate than simple average)

```typescript
function aggregateGscMetrics(data: SearchPerformance[]): GscSummary {
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
  const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0);

  const ctr = totalImpressions > 0
    ? (totalClicks / totalImpressions) * 100
    : 0;

  // Weighted average position
  const weightedPosition = totalImpressions > 0
    ? data.reduce((sum, d) => sum + (d.position ?? 0) * d.impressions, 0) / totalImpressions
    : 0;

  return { totalClicks, totalImpressions, ctr, avgPosition: weightedPosition };
}
```

### Top Queries List

Simple list format per CONTEXT.md: `"1. 'query term' — 1,234 clicks"`

```typescript
// Top 10 queries by clicks (already sorted by getSearchPerformance)
{searchPerformance.slice(0, 10).map((sp, i) => (
  <div key={sp.id} className="py-2 border-b last:border-0">
    <span className="text-muted-foreground">{i + 1}.</span>{' '}
    <span className="font-medium">'{sp.query}'</span>{' '}
    <span className="text-muted-foreground">— {sp.clicks.toLocaleString()} clicks</span>
  </div>
))}
```

### Component Structure

```
dashboard/src/app/dashboard/web-intel/components/
├── core-web-vitals-card.tsx    # NEW - Unified CWV card
├── device-toggle.tsx           # NEW - Mobile/Desktop toggle
├── cwv-metric.tsx              # NEW - Single CWV metric with badge
├── gsc-metrics-row.tsx         # NEW - 4-card GSC summary
├── top-queries-list.tsx        # NEW - Simple query list
```

### Technical Tab Integration

The `web-intel-content.tsx` already has a placeholder Technical tab (lines 163-174):

```typescript
<TabsContent value="technical">
  <Card>
    <CardHeader>
      <CardTitle>Technical SEO Health</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Technical health tab will be implemented in Phase 4.
      </p>
    </CardContent>
  </Card>
</TabsContent>
```

Replace this with the new components.

## Open Questions

1. **CWV Value Display Format**
   - What we know: Database stores percentage distributions, not actual P75 values
   - What's unclear: Should we show "75% Good" or calculate a derived score?
   - Recommendation: Show `good_pct` as a percentage with "Good" label badge. E.g., "LCP: 75.5%" with green "Good" badge. The percentage represents "% of pages meeting the Good threshold."

2. **GSC Period Comparison**
   - What we know: Traffic metrics show delta vs previous period
   - What's unclear: Should GSC metrics also show period comparison deltas?
   - Recommendation: Yes, follow traffic pattern. Calculate same-length prior period for delta display.

3. **Device Toggle State Persistence**
   - What we know: Date range uses URL params for persistence
   - What's unclear: Should device toggle also persist in URL?
   - Recommendation: No, use local state. Device toggle is a UI preference within the card, not a page-level filter worth bookmarking.

## Sources

### Primary (HIGH confidence)
- Codebase: `dashboard/src/lib/api/web-intel-queries.ts` - Types, queries, transforms (all exist)
- Codebase: `supabase/migrations/20260121_create_web_intel_schema.sql` - Database schema
- Codebase: `dashboard/src/app/dashboard/web-intel/components/traffic-metrics-row.tsx` - MetricCard pattern
- Codebase: `dashboard/src/app/dashboard/web-intel/components/date-range-selector.tsx` - Toggle pattern
- Codebase: `dashboard/src/dashboard-kit/components/ui/badge.tsx` - Status badge variants

### Secondary (MEDIUM confidence)
- Google Web.dev CWV documentation for threshold values (verified current)

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Data layer: HIGH - All types, queries, and transforms already implemented
- Component patterns: HIGH - Clear reusable patterns from Phase 2
- CWV display logic: MEDIUM - Schema stores percentages not values, need decision on display format
- GSC aggregation: HIGH - Standard calculation methods

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable patterns, no expected major changes)
