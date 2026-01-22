# Phase 5 Research: Business OS Dashboard Integration

## 1. Dashboard Architecture Overview

**Location:** `/dashboard/src/app/dashboard/`

**Structure:**
- Main dashboard at `/dashboard/page.tsx` - CEO overview with quick links
- Department dashboards in subdirectories: `/dashboard/`, `/leads/`, `/programs/`, `/marketing/`, `/digital/`
- Each dashboard follows the pattern: **page.tsx** → **content.tsx** → **components/**

**Key Pattern:**
```
page.tsx (Server component)
  ↓ (uses Suspense + async data fetching)
  → Data Loader (async function)
      ↓
      → content.tsx (Client component, 'use client')
          ↓
          → Sub-components
```

**Example:** Programs Dashboard
- `page.tsx` - Fetches data with `getProgramsDashboardData()`, renders with Suspense fallback
- `programs-content.tsx` - Client component that renders layout and displays data
- `components/` - Reusable UI components (tables, cards, charts)

---

## 2. Widget/Component Patterns Found

**Common Building Blocks** (from `dashboard-kit/components/dashboard/`):
- `MetricCard` - KPI display with icon, value, delta, status
- `HealthScore` - Circular health indicator with breakdown
- `Card` - Generic container with header/content
- `AlertList` / `ActivityFeed` - Scrollable lists
- `Progress` - Progress bar with status coloring
- `StatusIndicator` / `StatusBadge` - Status visualization

**Typical Widget Layout:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Widget Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content grid, table, or list */}
  </CardContent>
</Card>
```

**Status Colors:**
- `healthy` → emerald/green
- `warning` → amber/yellow
- `critical` → red

---

## 3. Data Fetching Patterns

**Server-Side Data Loading:**
```tsx
// page.tsx (server)
async function DataLoader() {
  const data = await Promise.all([
    getMetrics(),
    getDetails(),
  ]);
  return <Content {...data} />;
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DataLoader />
    </Suspense>
  );
}
```

**Supabase Client:**
- Uses `getServerClient()` from `/lib/supabase/server.ts`
- Service role key for full database access
- Queries views or tables directly

**Query File Location:** `/lib/api/[domain]-queries.ts`
- Example: `programs-queries.ts` exports `getProgramsDashboardData()`, `getRecentRegistrations()`, etc.
- Returns strongly-typed interfaces

**Revalidation:**
```tsx
export const revalidate = 300; // 5 minutes
```

---

## 4. Action Button Patterns

**In-Table Actions:**
```tsx
// Example from registrations-table.tsx
<td className="py-3">
  <button
    onClick={() => handleAction(item.id)}
    className="text-sm text-primary hover:underline"
  >
    View Details
  </button>
</td>
```

**Button Variants** (from button.tsx):
```tsx
<Button variant="default" size="sm">Primary Action</Button>
<Button variant="outline" size="sm">Secondary</Button>
<Button variant="success" size="sm">Confirm</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="ghost" size="sm">Subtle</Button>
```

**Server Actions Pattern** (for mutations):
```tsx
// In a server action file
'use server'
export async function skipTier(programId: string) {
  const supabase = getServerClient();
  await supabase.rpc('skip_tier', { p_program_id: programId });
  revalidatePath('/dashboard/faculty-scheduler');
}

// In client component
<form action={skipTier.bind(null, program.id)}>
  <Button type="submit" variant="outline" size="sm">Skip Tier</Button>
</form>
```

---

## 5. Supabase Integration Points

**Available Views & Functions (from Phase 1-4):**

| Item | Purpose |
|------|---------|
| `programs` table | Programs with status, tier dates |
| `program_blocks` table | Individual claimable blocks |
| `instructors` table | Faculty with tier_designation |
| `claims` table | Instructor claims with status |
| `notifications` table | Notification history |
| `skip_tier(p_program_id)` | Advance program to next tier |
| `release_all()` | Bulk-release all draft programs |
| `get_programs_needing_reminder()` | Programs at 45-55% tier window |
| `get_instructors_needing_reminder()` | Instructors to send reminders |
| `get_instructors_for_rerelease()` | Instructors for re-release notification |

**New Views Needed for Dashboard:**

1. `faculty_scheduler.recruitment_pipeline` - Aggregated dashboard view
   - Program ID, name, dates, location
   - Current status/tier
   - Days remaining in tier
   - Notification counts
   - Response counts
   - Assigned instructor

2. `faculty_scheduler.not_responded_view` - Instructors notified but not responded

---

## 6. Faculty Scheduler Schema Analysis

**Existing Tables:**
```sql
-- programs: id, name, location_city, location_state, status (draft/tier_0/tier_1/open/claimed/confirmed),
--           release_date, tier_0_ends, tier_1_ends
-- program_blocks: id, program_id, block_name, dates, instructor_id, claimed_at
-- instructors: id, first_name, last_name, email, state, tier_designation
-- claims: id, instructor_id, block_id, claimed_at, status, cancelled_at
-- notifications: id, instructor_id, program_id, tier, sent_at, type
```

**Dashboard Query Needs:**
1. Programs with current tier status + days remaining calculation
2. Notification counts per program (# notified)
3. Response counts per program (# responded = # claims or views)
4. Instructor assignment status per program
5. Instructors who haven't responded (notified - claimed)

---

## 7. Recommended Approach

### Phase 5 Plan Structure

**Wave 1: Data Layer**
- Create Supabase views for dashboard
- Create query file with TypeScript types
- Create server actions for admin operations

**Wave 2: Dashboard Page**
- Create page.tsx with Suspense pattern
- Create content.tsx with layout
- Add summary cards (metrics)

**Wave 3: Program Table**
- Create recruitment pipeline table
- Add tier status badges
- Add days remaining column
- Add action buttons (skip tier, nudge, override)

**Wave 4: Not Responded View**
- Create instructor activity view
- Show who's been notified but hasn't claimed
- Add manual assign action

### File Structure
```
dashboard/src/
├── app/dashboard/faculty-scheduler/
│   ├── page.tsx              # Server component with Suspense
│   ├── content.tsx           # Main layout component
│   ├── actions.ts            # Server actions (skip tier, assign, etc.)
│   └── components/
│       ├── recruitment-pipeline-table.tsx
│       ├── summary-cards.tsx
│       └── not-responded-list.tsx
└── lib/api/
    └── faculty-scheduler-queries.ts  # Data fetching
```

---

## 8. Key Decisions Needed

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Dashboard location | Main dashboard widget vs dedicated page | **Dedicated page** at `/dashboard/faculty-scheduler` with link from main dashboard |
| Real-time updates | Polling vs subscriptions | **Polling with revalidate** (simpler, matches existing patterns) |
| Assign instructor | Modal vs inline select | **Modal** with instructor search/filter |
| Skip tier action | One-click vs confirmation | **One-click** with toast feedback |
| Override claim | One-click vs confirmation | **Modal with reason** (destructive action) |

---

## Summary

The Business OS Dashboard follows well-established Next.js 14+ patterns with:
- Server-side data fetching with Suspense
- Client-side rendering with 'use client'
- Reusable dashboard-kit components
- Server actions for mutations

For Faculty Scheduler integration:
1. Create dedicated dashboard page at `/dashboard/faculty-scheduler`
2. Add Supabase views for aggregated dashboard data
3. Create query file with TypeScript types
4. Use existing component patterns (MetricCard, Card, tables)
5. Add server actions for admin operations (skip tier, assign, override)

**Confidence Level:** High - Patterns are well-established, schema is complete.
