# Phase 6: Content & Competitors - Research

**Researched:** 2026-01-24
**Domain:** Content health monitoring, competitor tracking, SERP share visualization
**Confidence:** HIGH

## Summary

This phase adds two major sections to the Content tab: a Content Health section (combining decay warnings and thin content) and a Competitors section (tracked domains, shared keywords, SERP share). The database schema already has all required tables (`content_inventory`, `content_decay`, `thin_content`, `competitors`, `competitor_rankings`, `serp_share`) and the existing query patterns from previous phases provide clear implementation templates.

Key findings:
1. **Database tables are fully defined** - The `web_intel` schema includes all required tables for content decay, thin content, competitors, and SERP share tracking. Views like `content_health` already exist.
2. **Tremor BarList is the horizontal bar chart pattern** - Used in `channel-performance-chart.tsx` for displaying distributions; ideal for SERP share visualization.
3. **Content tab placeholder exists** - The Content tab in `web-intel-content.tsx` has a placeholder that needs to be replaced with actual components.
4. **Sparkline pattern already established** - The `RankingSparkline` component uses Tremor `SparkAreaChart`; same pattern applies for content decay sparklines.

**Primary recommendation:** Build `ContentHealthSection` and `CompetitorsSection` as two distinct card components. Use Tremor BarList for SERP share. Follow the established table/list patterns from Rankings and Alerts tabs.

## Standard Stack

The established libraries for this phase:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tremor/react | ^3.18.7 | BarList for SERP share, SparkAreaChart for decay sparklines | Already used throughout dashboard |
| lucide-react | ^0.562.0 | Icons (TrendingDown, FileWarning, Users2, Trophy, etc.) | Project standard |
| @radix-ui primitives | (via dashboard-kit) | Tooltips, buttons | Already installed |

### Supporting (Already Available)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| cn utility | Class name merging | Conditional styling for win/loss colors |
| date-fns | (if needed) | Date formatting for decay detection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tremor BarList | Recharts BarChart | Would add dependency; BarList fits horizontal bar use case perfectly |
| Inline expand | Modal for "view all" | User decision: inline expand is simpler and matches progressive disclosure pattern |
| Custom table | dashboard-kit DataTable | DataTable works well for competitors since no expandable rows needed |

**Installation:**
No new packages needed - all requirements met by existing dependencies.

## Architecture Patterns

### Recommended Component Structure
```
dashboard/src/app/dashboard/web-intel/
├── components/
│   ├── content-health-section.tsx    # Combines decay + thin content
│   ├── content-decay-row.tsx         # Individual decay item with sparkline
│   ├── thin-content-row.tsx          # Individual thin content flag
│   ├── content-summary-cards.tsx     # Total indexed, avg word count metrics
│   ├── competitors-section.tsx       # Main competitors container
│   ├── competitor-list.tsx           # List of tracked domains
│   ├── shared-keywords-table.tsx     # Position comparison table
│   └── serp-share-chart.tsx          # BarList for share of voice
├── web-intel-content.tsx             # Update Content tab to use new components
```

### Pattern 1: Content Health Combined Section
**What:** Single card grouping decay and thin content as "pages needing attention"
**When to use:** When multiple related issues should be viewed together
**Example:**
```typescript
// Source: Based on AlertsSection pattern
'use client';

interface ContentHealthSectionProps {
  decayPages: ContentDecayWithUrl[];
  thinPages: ThinContentWithUrl[];
  summary: { totalIndexed: number; avgWordCount: number };
}

export function ContentHealthSection({ decayPages, thinPages, summary }: ContentHealthSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileWarning className="h-5 w-5" />
          Content Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary metrics at top */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-semibold">{summary.totalIndexed}</div>
            <div className="text-sm text-muted-foreground">Indexed Pages</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-semibold">{summary.avgWordCount}</div>
            <div className="text-sm text-muted-foreground">Avg Word Count</div>
          </div>
        </div>

        {/* Decaying content */}
        <ContentDecayList pages={decayPages} />

        {/* Thin content */}
        <ThinContentList pages={thinPages} />
      </CardContent>
    </Card>
  );
}
```

### Pattern 2: SERP Share BarList
**What:** Horizontal bar chart showing share of voice percentages
**When to use:** Comparing relative metrics across entities
**Example:**
```typescript
// Source: Based on channel-performance-chart.tsx
import { BarList, Card, Title, Text } from '@tremor/react';

interface SerpShareChartProps {
  ourShare: number;
  ourShareChange: number;
  competitors: Array<{ domain: string; share: number }>;
}

export function SerpShareChart({ ourShare, ourShareChange, competitors }: SerpShareChartProps) {
  // Combine our share with competitors for BarList
  const data = [
    { name: 'Our Site (iaml.com)', value: ourShare },
    ...competitors.map(c => ({ name: c.domain, value: c.share }))
  ].sort((a, b) => b.value - a.value);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Title>SERP Share of Voice</Title>
        <div className="text-right">
          <div className="text-2xl font-semibold">{ourShare.toFixed(1)}%</div>
          <div className={cn(
            'text-sm flex items-center gap-1',
            ourShareChange >= 0 ? 'text-success' : 'text-error'
          )}>
            {ourShareChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {ourShareChange >= 0 ? '+' : ''}{ourShareChange.toFixed(1)}%
          </div>
        </div>
      </div>
      <BarList
        data={data}
        valueFormatter={(v) => `${v.toFixed(1)}%`}
        color="cyan"
      />
    </Card>
  );
}
```

### Pattern 3: Shared Keywords Comparison Table
**What:** Table showing keyword + our position + competitor positions in columns
**When to use:** Comparing positions across multiple competitors
**Example:**
```typescript
// Color-coded position cells (green = winning, red = losing)
function PositionCell({ ourPosition, competitorPosition }: { ourPosition: number | null; competitorPosition: number | null }) {
  if (ourPosition === null || competitorPosition === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  const isWinning = ourPosition < competitorPosition;
  const isLosing = ourPosition > competitorPosition;

  return (
    <span className={cn(
      'font-medium',
      isWinning && 'text-success bg-success/10 px-2 py-0.5 rounded',
      isLosing && 'text-error bg-error/10 px-2 py-0.5 rounded',
      !isWinning && !isLosing && 'text-muted-foreground'
    )}>
      {competitorPosition}
    </span>
  );
}
```

### Pattern 4: "View All" Inline Expansion
**What:** Show limited items with button to expand and show all
**When to use:** When showing top 5/10 items with option to see more
**Example:**
```typescript
// Source: Based on workflow-health.tsx pattern + user decision for inline expand
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';

interface ExpandableListProps<T> {
  items: T[];
  initialCount: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function ExpandableList<T>({ items, initialCount, renderItem }: ExpandableListProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, initialCount);
  const hasMore = items.length > initialCount;

  return (
    <div className="space-y-2">
      {displayItems.map((item, i) => renderItem(item, i))}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              View all ({items.length})
            </>
          )}
        </Button>
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Don't fetch content inventory for every decay item:** Join in SQL or query once and merge on frontend
- **Don't use modals for "view all":** User decision is inline expand; modals break flow
- **Don't hard-code competitor colors:** Use a color scale or let Tremor handle it
- **Don't calculate decay percentage on frontend:** Database already stores `decay_percentage`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal bar chart | Custom div widths | Tremor BarList | Handles scaling, formatting, responsive |
| Traffic sparklines | Custom SVG | Tremor SparkAreaChart | Already used for rankings sparklines |
| Win/loss color logic | Complex conditionals | Simple ternary with cn() | Matches existing position-change.tsx pattern |
| URL truncation | Custom string slicing | CSS truncate + title attr | More reliable, shows full on hover |
| Percentage formatting | `${num}%` | `num.toFixed(1)}%` | Consistent decimal places |

**Key insight:** The codebase already has the BarList pattern in channel-performance-chart.tsx and the sparkline pattern in ranking-sparkline.tsx. Reuse these patterns exactly.

## Common Pitfalls

### Pitfall 1: Decay Sparkline Direction
**What goes wrong:** Traffic sparklines show "up is good" but decay shows traffic dropping
**Why it happens:** Unlike ranking position, traffic values should NOT be inverted
**How to avoid:** For decay sparklines, use raw traffic values (higher = better). Show red trendline when declining.
**Warning signs:** Users confused about whether red/green means improving or getting worse

```typescript
// Decay sparkline: raw values, NOT inverted
const sparklineData = trafficHistory.map(d => ({
  date: d.date,
  value: d.sessions // Raw value, NOT inverted
}));
// Use red color if trend is negative
const color = decayPercentage > 0 ? 'red' : 'blue';
```

### Pitfall 2: Missing URL in Content Decay
**What goes wrong:** Content decay table only has content_id, not the actual URL
**Why it happens:** `content_decay` references `content_inventory` via foreign key
**How to avoid:** Join tables in SQL query or include content_inventory in fetch
**Warning signs:** Table shows UUID instead of page path

```sql
-- Correct query pattern
SELECT cd.*, ci.url, ci.title, ci.word_count
FROM web_intel.content_decay cd
JOIN web_intel.content_inventory ci ON cd.content_id = ci.id
WHERE cd.is_addressed = FALSE
ORDER BY cd.decay_percentage DESC;
```

### Pitfall 3: Competitor Positions Sparse Data
**What goes wrong:** Not all competitors rank for all keywords
**Why it happens:** Competitors may not target every keyword we track
**How to avoid:** Handle null positions gracefully with "-" display
**Warning signs:** Empty cells or errors in shared keywords table

### Pitfall 4: SERP Share Calculation
**What goes wrong:** Share percentages don't add to 100%
**Why it happens:** Share of voice is visibility estimate, not exact market share
**How to avoid:** Don't expect 100%; explain metric in tooltip if needed
**Warning signs:** Users confused about math

### Pitfall 5: Content Summary Stats
**What goes wrong:** Total indexed pages differs from index_coverage table
**Why it happens:** `index_coverage` is from GSC; `content_inventory` is our tracked content
**How to avoid:** Use `content_inventory` count for "our tracked pages"; clarify in label
**Warning signs:** Conflicting numbers between Technical tab and Content tab

## Code Examples

### Query Functions Needed
```typescript
// Source: Extend web-intel-queries.ts

// Content decay with URL (join content_inventory)
export interface ContentDecayWithUrl extends ContentDecay {
  url: string;
  title: string | null;
  wordCount: number | null;
}

export async function getContentDecayWithUrls(limit: number = 5): Promise<ContentDecayDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.content_decay')
    .select(`
      *,
      content_inventory:content_id (
        url,
        title,
        word_count
      )
    `)
    .eq('is_addressed', false)
    .order('decay_percentage', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching content decay:', error);
    return [];
  }

  return data || [];
}

// Thin content with URL
export async function getThinContentWithUrls(limit: number = 5): Promise<ThinContentDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.thin_content')
    .select(`
      *,
      content_inventory:content_id (
        url,
        title,
        word_count
      )
    `)
    .eq('is_addressed', false)
    .order('bounce_rate', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching thin content:', error);
    return [];
  }

  return data || [];
}

// Content summary stats
export async function getContentSummary(): Promise<{ totalIndexed: number; avgWordCount: number }> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.content_inventory')
    .select('word_count')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching content summary:', error);
    return { totalIndexed: 0, avgWordCount: 0 };
  }

  const wordCounts = (data || [])
    .map(d => d.word_count)
    .filter((wc): wc is number => wc !== null);

  return {
    totalIndexed: data?.length || 0,
    avgWordCount: wordCounts.length > 0
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 0
  };
}

// Competitors list
export async function getCompetitors(): Promise<CompetitorDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.competitors')
    .select('*')
    .eq('is_active', true)
    .order('domain');

  if (error) {
    console.error('Error fetching competitors:', error);
    return [];
  }

  return data || [];
}

// SERP share data
export async function getSerpShare(): Promise<SerpShareDb | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.serp_share')
    .select('*')
    .order('collected_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching SERP share:', error);
    return null;
  }

  return data;
}

// Shared keywords comparison
export async function getSharedKeywordsComparison(limit: number = 10): Promise<SharedKeywordComparison[]> {
  // This needs a custom RPC or view joining daily_rankings, competitor_rankings, tracked_keywords
  // For now, can be done with multiple queries + frontend merge
  // ...
}
```

### Transform Functions
```typescript
export function transformContentDecayWithUrl(
  data: ContentDecayDbWithJoin[]
): ContentDecayWithUrl[] {
  return data.map(item => ({
    id: item.id,
    contentId: item.content_id,
    detectedDate: new Date(item.detected_date),
    baselineSessions: item.baseline_sessions,
    currentSessions: item.current_sessions,
    decayPercentage: item.decay_percentage ? Number(item.decay_percentage) : null,
    severity: item.severity,
    isAddressed: item.is_addressed,
    // Joined fields
    url: item.content_inventory?.url || '',
    title: item.content_inventory?.title || null,
    wordCount: item.content_inventory?.word_count || null,
  }));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Modal for "view all" | Inline expand with show more/less | User decision 2026-01-24 | Simpler UX, no context switch |
| Separate decay/thin tabs | Combined "Content Health" section | User decision 2026-01-24 | Both are "pages needing attention" |
| Custom bar widths | Tremor BarList | Already in project | Consistent styling, responsive |

**Deprecated/outdated:**
- None identified; patterns are current

## Open Questions

Things that couldn't be fully resolved:

1. **Shared keywords data aggregation**
   - What we know: Need to join our rankings + competitor rankings + keywords
   - What's unclear: Best approach - SQL view/RPC vs multiple queries
   - Recommendation: Create SQL view `web_intel.shared_keyword_positions` for efficiency

2. **Historical SERP share for change calculation**
   - What we know: Need current share + previous period for +/- change
   - What's unclear: What period for comparison (7d? 30d?)
   - Recommendation: Compare to 7 days ago (weekly change), matches other tabs

3. **Content inventory population**
   - What we know: Schema exists but may have no data yet
   - What's unclear: How content inventory gets populated (separate workflow)
   - Recommendation: Handle empty state gracefully; show "No content tracked" message

## Sources

### Primary (HIGH confidence)
- `/supabase/migrations/20260121_create_web_intel_schema.sql` - Full schema for content_decay, thin_content, content_inventory, competitors, serp_share
- `/supabase/migrations/20260120_web_intel_phase3_tables.sql` - Competitor rankings schema
- `/dashboard/src/app/dashboard/web-intel/components/ranking-sparkline.tsx` - Sparkline pattern
- `/dashboard/src/app/dashboard/components/channel-performance-chart.tsx` - BarList pattern
- `/dashboard/src/app/dashboard/web-intel/web-intel-content.tsx` - Current Content tab placeholder
- `/dashboard/src/lib/api/web-intel-queries.ts` - Existing query patterns and types
- `/dashboard/src/app/dashboard/web-intel/components/alerts-section.tsx` - Section card pattern

### Secondary (MEDIUM confidence)
- `/dashboard/src/app/dashboard/action-center/components/progressive-instructions.tsx` - Show more/less pattern
- `/dashboard/src/app/dashboard/digital/components/workflow-health.tsx` - "View All" link pattern

### Tertiary (LOW confidence)
- None - all findings verified with codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified in package.json and existing components
- Architecture: HIGH - patterns directly from codebase
- Pitfalls: HIGH - identified from schema inspection and domain knowledge
- Query patterns: MEDIUM - some custom joins/views may be needed

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (stable patterns, no fast-moving dependencies)
