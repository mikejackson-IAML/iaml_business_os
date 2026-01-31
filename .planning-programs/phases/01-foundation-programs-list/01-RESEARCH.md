# Phase 1: Foundation & Programs List - Research

**Researched:** 2026-01-30
**Domain:** Next.js Dashboard with Supabase, Programs Management UI
**Confidence:** HIGH

## Summary

This phase establishes the foundation for the Programs Dashboard by extending existing Supabase schema, creating TypeScript types, setting up the route structure, and building the programs list view. The codebase already has extensive patterns to follow from Lead Intelligence, Web Intel, and Action Center dashboards.

The existing `program_instances`, `program_readiness`, `registrations`, and related tables provide most of the required data model. The primary addition needed is a `parent_program_id` column for virtual certificate linking. The dashboard-kit component library provides all necessary UI primitives (DataTable, Badge, Progress, etc.).

**Primary recommendation:** Follow the established Server Components + Suspense pattern from Web Intel dashboard, extend existing programs-queries.ts with list-specific queries, and leverage dashboard-kit components for consistent UI.

## Standard Stack

The stack is already defined by this codebase. No external library decisions needed.

### Core (Already in Dashboard)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.x | React framework | Already in use, Server Components pattern |
| React | 19.x | UI library | Already in use |
| TypeScript | 5.x | Type safety | Already in use throughout |
| Tailwind CSS | 3.x | Styling | Already in use, matches dashboard-kit |
| Supabase | 2.x | Database & Auth | Already configured with service role |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dashboard-kit | internal | UI components | All dashboard components |
| Lucide React | 0.x | Icons | All icons |
| class-variance-authority | 0.x | Component variants | Badge/Button variants |
| Radix UI | latest | Primitives | Select, Tabs, etc. |
| sonner | 0.x | Toast notifications | Success/error feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom table | dashboard-kit DataTable | DataTable already handles sort, pagination, formatting |
| Custom filters | ContactFilters pattern | ContactFilters pattern is proven, extensible |

**Installation:**
No additional packages needed. All dependencies exist in dashboard.

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/app/dashboard/programs/
├── page.tsx                    # Server Component with Suspense
├── programs-content.tsx        # Client Component with full UI
├── programs-skeleton.tsx       # Loading skeleton matching layout
├── error.tsx                   # Error boundary (optional)
└── components/
    ├── program-list.tsx        # List view with table
    ├── program-row.tsx         # Individual row component
    ├── program-filters.tsx     # Filter panel (city, type, status, date)
    ├── program-status-badge.tsx # GO/CLOSE/NEEDS badge
    ├── logistics-progress.tsx  # X/Y - Z warnings display
    └── archive-toggle.tsx      # Show/hide completed

dashboard/src/lib/api/
└── programs-queries.ts         # EXTEND existing file with list queries
    # Already exists with getProgramsSummary, getReadinessBreakdown, etc.
    # Add: getProgramsList, getProgramsListFiltered

dashboard/src/dashboard-kit/types/departments/
└── programs.ts                 # EXTEND existing types
    # Already exists with ProgramSummary, ReadinessBreakdown, etc.
    # Add: ProgramListItem, ProgramFilters, ProgramListParams
```

### Pattern 1: Server Component + Suspense (Page)
**What:** Page is async server component that wraps data loader in Suspense
**When to use:** Every dashboard page
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/web-intel/page.tsx
export default async function ProgramsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);

  return (
    <Suspense fallback={<ProgramsSkeleton />}>
      <ProgramsDataLoader filters={filters} />
    </Suspense>
  );
}

async function ProgramsDataLoader({ filters }: { filters: ProgramFilters }) {
  const [programs, readiness] = await Promise.all([
    getProgramsList(filters),
    getReadinessBreakdown(),
  ]);

  return (
    <ProgramsContent
      programs={programs}
      readiness={readiness}
      filters={filters}
    />
  );
}
```

### Pattern 2: Client Content Component
**What:** 'use client' component that handles all interactivity
**When to use:** Main content area of every dashboard
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/lead-intelligence/lead-intelligence-content.tsx
'use client';

export function ProgramsContent({
  programs,
  readiness,
  filters,
}: ProgramsContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter state managed via URL params
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '_all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/dashboard/programs?${params.toString()}`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      {/* Filters */}
      {/* Table */}
    </div>
  );
}
```

### Pattern 3: URL-Based Filter State
**What:** Filters stored in URL search params, not React state
**When to use:** Any filterable list
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/lead-intelligence/components/contact-filters.tsx
const updateFilter = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams.toString());
  if (value && value !== '_all') {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  params.set('page', '1');
  router.push(`/dashboard/programs?${params.toString()}`);
};
```

### Pattern 4: Query File Structure
**What:** All Supabase queries in lib/api/*-queries.ts with types
**When to use:** Every data fetch
**Example:**
```typescript
// Source: dashboard/src/lib/api/programs-queries.ts (extend existing)
export interface ProgramListItem {
  id: string;
  instance_name: string;
  program_name: string;
  format: 'in-person' | 'virtual' | 'on-demand';
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  state: string | null;
  current_enrolled: number;
  days_until_start: number | null;
  readiness_score: number;
  readiness_warnings: number;
  parent_program_id: string | null;  // NEW: for virtual block linking
}

export async function getProgramsList(params: ProgramListParams): Promise<ProgramListItem[]> {
  const supabase = getServerClient();

  let query = supabase
    .from('program_dashboard_summary')
    .select('*');

  // Apply filters
  if (params.city) {
    query = query.eq('city', params.city);
  }
  // ... more filters

  // Apply sort
  query = query.order(params.sort ?? 'start_date', {
    ascending: params.order !== 'desc'
  });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching programs list:', error);
    return [];
  }

  return data as ProgramListItem[];
}
```

### Anti-Patterns to Avoid
- **Fetching data in client components:** Use server components with Suspense instead
- **Storing filter state in React state:** Use URL params for shareable/bookmarkable state
- **Custom table implementations:** Use DataTable from dashboard-kit
- **Inline styles:** Use Tailwind classes
- **Hardcoded colors:** Use design tokens (bg-emerald-100, text-amber-600, etc.)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data table with sort/pagination | Custom table component | `DataTable` from dashboard-kit | Has sort icons, pagination, loading states, formatters |
| Status badges with colors | Custom div with inline styles | `Badge` with variant prop | Already has healthy/warning/critical variants |
| Progress indicators | Custom progress bar | `Progress` or `ColoredProgress` | Has color thresholds built in |
| Checklist display | Custom list | `ChecklistProgress` | Already handles progress %, color coding |
| Skeleton loading | Custom placeholders | `Skeleton` from dashboard-kit | Consistent styling |
| Filter dropdowns | Custom select | `Select` from Radix UI | Already styled, accessible |
| Date formatting | Manual formatting | `formatDate`, `formatDateShort` from dashboard-kit/lib/utils | Consistent format |

**Key insight:** Dashboard-kit exists specifically to avoid rebuilding these patterns. Every component supports dark mode and follows design system.

## Common Pitfalls

### Pitfall 1: Forgetting to Extend Existing Schema
**What goes wrong:** Creating new tables instead of adding columns to existing
**Why it happens:** Not reviewing migrations_archive for existing tables
**How to avoid:** Always check existing schema first, use ALTER TABLE for additions
**Warning signs:** Migration creates table that sounds similar to existing one

### Pitfall 2: Client-Side Data Fetching
**What goes wrong:** Using useEffect + fetch instead of Server Components
**Why it happens:** Familiarity with old React patterns
**How to avoid:** Follow Web Intel pattern: async page component, Suspense, data loader
**Warning signs:** `useState` for initial data, `useEffect` for data fetching

### Pitfall 3: Filter State in React State
**What goes wrong:** Filters not bookmarkable, lost on refresh
**Why it happens:** Seems simpler to use useState
**How to avoid:** Use URL searchParams, router.push for filter changes
**Warning signs:** Filters reset when user navigates away and back

### Pitfall 4: Missing Skeleton Loading States
**What goes wrong:** Blank screen during data load
**Why it happens:** Forgetting to create skeleton component
**How to avoid:** Create skeleton that matches final layout structure
**Warning signs:** Flash of empty content before data appears

### Pitfall 5: Not Handling Empty States
**What goes wrong:** Confusing blank areas when no data
**Why it happens:** Focus on happy path
**How to avoid:** Add emptyMessage prop to DataTable, explicit empty state UI
**Warning signs:** Silent failure, user confusion

### Pitfall 6: Ignoring Virtual Block Linking
**What goes wrong:** Virtual blocks show standalone without certificate context
**Why it happens:** Treating all programs identically
**How to avoid:** Check parent_program_id, show "Part of: [Certificate Name]" link
**Warning signs:** Virtual blocks showing without parent context

## Code Examples

Verified patterns from the codebase:

### Server Page with Suspense
```typescript
// Source: dashboard/src/app/dashboard/web-intel/page.tsx
import { Suspense } from 'react';
import { ProgramsSkeleton } from './programs-skeleton';
import { ProgramsContent } from './programs-content';
import { getProgramsList, getReadinessBreakdown } from '@/lib/api/programs-queries';

export const revalidate = 300; // 5 minutes
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    city?: string;
    type?: string;
    status?: string;
    sort?: string;
    order?: string;
  }>;
}

async function ProgramsDataLoader({ searchParams }: { searchParams: PageProps['searchParams'] }) {
  const params = await searchParams;

  const [programs, readiness] = await Promise.all([
    getProgramsList(params),
    getReadinessBreakdown(),
  ]);

  return (
    <ProgramsContent
      programs={programs}
      readiness={readiness}
      currentFilters={params}
    />
  );
}

export default async function ProgramsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ProgramsSkeleton />}>
      <ProgramsDataLoader searchParams={searchParams} />
    </Suspense>
  );
}
```

### Filter Panel Component
```typescript
// Source: Based on dashboard/src/app/dashboard/lead-intelligence/components/contact-filters.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/dashboard-kit/components/ui/button';

const CITY_OPTIONS = [
  { value: 'Austin', label: 'Austin' },
  { value: 'Chicago', label: 'Chicago' },
  { value: 'San Francisco', label: 'San Francisco' },
  // ... from distinct cities in database
];

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

export function ProgramFilters({ isOpen, currentFilters }: ProgramFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!isOpen) return null;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '_all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/dashboard/programs?${params.toString()}`);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* City filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">City</label>
          <Select
            value={currentFilters.city ?? '_all'}
            onValueChange={(v) => updateFilter('city', v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Cities</SelectItem>
              {CITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* More filters... */}
      </div>
    </div>
  );
}
```

### Program Status Badge (GO/CLOSE/NEEDS)
```typescript
// Custom component following Badge pattern
import { Badge } from '@/dashboard-kit/components/ui/badge';

interface ProgramStatusBadgeProps {
  enrolledCount: number;
  showCount?: boolean;
}

export function ProgramStatusBadge({ enrolledCount, showCount = true }: ProgramStatusBadgeProps) {
  let status: 'healthy' | 'warning' | 'critical';
  let label: string;

  if (enrolledCount >= 6) {
    status = 'healthy';
    label = 'GO';
  } else if (enrolledCount >= 4) {
    status = 'warning';
    label = 'CLOSE';
  } else {
    status = 'critical';
    label = 'NEEDS';
  }

  return (
    <Badge variant={status}>
      {label} {showCount && `| ${enrolledCount}`}
    </Badge>
  );
}
```

### Logistics Progress Display
```typescript
// Source: Based on dashboard-kit/components/dashboard/checklist-progress.tsx
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { cn } from '@/dashboard-kit/lib/utils';

interface LogisticsProgressProps {
  completed: number;
  total: number;
  warnings: number;
}

export function LogisticsProgress({ completed, total, warnings }: LogisticsProgressProps) {
  const percent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <Progress value={percent} className="h-2 w-20" />
      <span className="text-sm text-muted-foreground">
        {completed}/{total}
      </span>
      {warnings > 0 && (
        <span className="text-sm text-amber-600 dark:text-amber-400">
          - {warnings} {warnings === 1 ? 'warning' : 'warnings'}
        </span>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| getServerSideProps | Server Components + Suspense | Next.js 13+ (2023) | Better streaming, simpler data flow |
| Client-side filtering | URL param filtering | Codebase standard | Shareable, bookmarkable URLs |
| Custom loading states | Suspense + Skeleton | Codebase standard | Consistent UX |
| useState for filters | useSearchParams | Codebase standard | Server-side filtering |

**Deprecated/outdated:**
- `getServerSideProps` / `getStaticProps`: Use async server components
- React Query for initial data: Use server components
- `useState` for filter state: Use URL params via `useSearchParams`

## Existing Schema Analysis

### Tables That EXIST (from migrations_archive/20260113_create_programs_schema.sql)

**program_instances** (core table)
```sql
- id UUID PRIMARY KEY
- airtable_id TEXT UNIQUE
- instance_name TEXT NOT NULL
- program_name TEXT NOT NULL
- format TEXT                     -- 'in-person', 'virtual', 'on-demand'
- start_date DATE
- end_date DATE
- city TEXT
- state TEXT
- venue_name TEXT
- current_enrolled INTEGER DEFAULT 0
- min_capacity INTEGER DEFAULT 15
- max_capacity INTEGER DEFAULT 35
- status TEXT DEFAULT 'scheduled' -- 'scheduled', 'confirmed', 'cancelled', 'completed'
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

**program_readiness** (10-point checklist)
```sql
- id UUID PRIMARY KEY
- program_instance_id UUID (FK)
- faculty_confirmed_at TIMESTAMPTZ
- faculty_brief_sent_at TIMESTAMPTZ
- venue_confirmed_at TIMESTAMPTZ
- materials_ordered_at TIMESTAMPTZ
- materials_received_at TIMESTAMPTZ
- shrm_approved_at TIMESTAMPTZ
- av_ordered_at TIMESTAMPTZ
- catering_confirmed_at TIMESTAMPTZ
- room_block_active_at TIMESTAMPTZ
- registration_page_live_at TIMESTAMPTZ
- notes TEXT
```

**registrations** (from migrations_archive/20260116_create_registrations_schema.sql)
```sql
- id UUID PRIMARY KEY
- program_instance_id UUID (FK)
- first_name, last_name, email, phone, job_title TEXT
- company_name TEXT
- registration_date TIMESTAMPTZ
- registration_source TEXT
- registration_status TEXT DEFAULT 'Confirmed'
- payment_status TEXT DEFAULT 'Pending'
- selected_blocks TEXT[]
- utm_source, utm_medium, utm_campaign TEXT
```

**Views That EXIST:**
- `program_dashboard_summary` - Main query view with readiness scores
- `registrations_by_program` - Aggregated registration stats per program
- `at_risk_programs` - Programs needing attention
- `room_block_alerts` - Room blocks approaching cutoff
- `faculty_gaps` - Programs with unconfirmed faculty

### Schema Additions NEEDED

**1. Add parent_program_id for virtual block linking:**
```sql
ALTER TABLE program_instances
ADD COLUMN parent_program_id UUID REFERENCES program_instances(id);

-- Index for faster lookups
CREATE INDEX idx_program_instances_parent ON program_instances(parent_program_id);
```

This enables:
- PROG-07: Virtual blocks display as separate events with link to parent certificate
- PROG-08: Virtual certificate shows rollup of registration counts across blocks

### Existing TypeScript Types

Located in `dashboard/src/lib/api/programs-queries.ts`:
- `ProgramSummary` - Full program with readiness details
- `ReadinessBreakdown` - Aggregate readiness stats
- `AtRiskProgram` - At-risk program with risk level
- `RegistrationSummary` - Registration with program info

Located in `dashboard/src/dashboard-kit/types/departments/programs.ts`:
- `ProgramInstance` - UI-focused program type
- `ReadinessChecklist` - Boolean checklist
- `Registration` - Payment-focused registration type

## Open Questions

Things that couldn't be fully resolved:

1. **Distinct cities list for filter dropdown**
   - What we know: Cities are in program_instances.city column
   - What's unclear: Need to query distinct cities dynamically vs. hardcode
   - Recommendation: Create RPC `get_distinct_cities()` or query on page load

2. **Archive toggle exact behavior**
   - What we know: PROG-09 says "Archive toggle to show/hide completed programs"
   - What's unclear: Default state (show or hide completed?)
   - Recommendation: Default to hiding completed (next 90 days view per AUTONOMOUS-BUILD-GUIDE)

3. **Virtual block parent name resolution**
   - What we know: Need to show "Part of: [Certificate Name]" for virtual blocks
   - What's unclear: Best query pattern for this join
   - Recommendation: Extend program_dashboard_summary view or use subquery

## Sources

### Primary (HIGH confidence)
- `supabase/migrations_archive/20260113_create_programs_schema.sql` - Existing schema
- `supabase/migrations_archive/20260116_create_registrations_schema.sql` - Registration schema
- `dashboard/src/lib/api/programs-queries.ts` - Existing query patterns
- `dashboard/src/app/dashboard/web-intel/` - Reference implementation
- `dashboard/src/app/dashboard/lead-intelligence/` - Reference implementation
- `dashboard/src/dashboard-kit/` - Component library source

### Secondary (MEDIUM confidence)
- `.planning-programs/AUTONOMOUS-BUILD-GUIDE.md` - Pre-answered decisions
- `.planning-programs/REQUIREMENTS.md` - Full requirements list

### Tertiary (LOW confidence)
- None - all findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in codebase
- Architecture: HIGH - Following existing patterns exactly
- Existing schema: HIGH - Verified from migration files
- UI patterns: HIGH - Dashboard-kit components verified

**Research date:** 2026-01-30
**Valid until:** 2026-02-28 (stable codebase patterns)
