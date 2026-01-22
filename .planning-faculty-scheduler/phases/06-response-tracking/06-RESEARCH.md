# Phase 6: Response Tracking - Research

**Researched:** 2026-01-22
**Status:** Complete

## Schema Findings

### Notifications Table Structure (Phase 2)

**Location:** `faculty_scheduler.notifications` table

**Current columns:**
- `id` (UUID, PK)
- `instructor_id` (UUID, FK to faculty)
- `scheduled_program_id` (UUID, FK to scheduled_programs)
- `notification_type` (tier_release, reminder, claim_confirmation, claim_cancelled, program_update, rerelease)
- `tier` (which tier triggered notification: 0, 1, 2)
- `email_sent_at` (TIMESTAMPTZ)
- `email_status` (pending, sent, failed, bounced)
- `email_subject`, `email_to`, `error_message`
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ)

**What's Missing:** No `viewed_at` column exists yet. This needs to be added.

---

## Token Validation Flow

### Magic Link Entry Point

**File:** `faculty-portal/src/app/schedule/page.tsx`

**Flow:**
1. Token is passed as query param: `/schedule?token=abc123`
2. Page validates token via `validateToken()` function
3. Validation calls Supabase RPC: `validate_magic_token(p_token)`
4. If invalid, redirects to `/invalid-token`
5. If valid, wraps page in `InstructorProvider` with instructor data + token

**Key Insight:** The `validate_magic_token()` RPC in Phase 2 already updates usage stats (`last_used_at`, `use_count`), so infrastructure for recording clicks exists.

### Location for View Tracking

The `validate_magic_token()` RPC in Supabase (`20260121_faculty_scheduler_phase2.sql`, lines 97-122) is the ideal place to record views.

**Current RPC returns:**
```sql
RETURNS TABLE (
  instructor_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  firm_name TEXT,
  firm_state TEXT,
  tier_designation TEXT,
  is_valid BOOLEAN,
  is_expired BOOLEAN,
  expires_at TIMESTAMPTZ,
  -- ... more fields
)
```

---

## Dashboard View Structure

### Key Views (Phase 5)

1. **not_responded_instructors** - Filters for instructors notified but not claimed
   - File: `20260122_faculty_scheduler_phase5_dashboard.sql`, lines 131-160
   - Returns: instructor_id, full_name, email, firm_state, tier_designation, scheduled_program_id, program_name, notified_at, tier_when_notified
   - **Key:** Determines "not responded" by checking for claims

2. **dashboard_recruitment_pipeline** - Main pipeline table view
   - File: `20260122_faculty_scheduler_phase5_dashboard.sql`, lines 18-125
   - Returns: notified_count, responded_count, plus all program details
   - Uses CTEs to aggregate notification counts

3. **dashboard_summary_stats** - Single-row aggregates
   - File: `20260122_faculty_scheduler_phase5_dashboard.sql`, lines 166-217
   - Provides: total_notified, total_responded, response_rate

### For Phase 6

- Update `not_responded_instructors` view to include `viewed_at`
- Dashboard queries should expand to include `viewed_count` alongside `notified_count` and `responded_count`

---

## UI Component Patterns

### Badge Usage in Dashboard

**File:** `dashboard/src/app/dashboard/faculty-scheduler/components/recruitment-pipeline-table.tsx`

**Pattern:**
```typescript
<Badge variant={config.variant} className={config.className}>
  {tierDisplay}
</Badge>
```

**Variants used:**
- `variant="default"` with custom className (purple, blue, emerald colors)
- `variant="secondary"` for filled/completed status
- `variant="outline"` for draft status

### NotRespondedList Component

**File:** `dashboard/src/app/dashboard/faculty-scheduler/components/not-responded-list.tsx`

**Pattern:**
- Shows instructors grouped by program
- Uses simple text display with `text-muted-foreground` for metadata
- Uses helper functions: `getTierLabel()`, `formatTimeAgo()`

### Recommendation for Viewed Badge

- Use `<Badge variant="outline">Viewed</Badge>` with neutral gray color
- Add to instructor row in not-responded list
- Use Lucide `Eye` icon (optional)
- Tooltip on hover showing timestamp: "Viewed Jan 22 at 3:45 PM"

---

## Query File Structure

**File:** `dashboard/src/lib/api/faculty-scheduler-queries.ts`

### Organization Pattern

- Type definitions at top (interfaces for all query return types)
- Functional query functions (one per Supabase table/view)
- Main bundler function: `getFacultySchedulerDashboardData()` does Promise.all() for parallel fetching

### Key Functions

- `getRecruitmentPipeline()` - from dashboard_recruitment_pipeline view
- `getNotRespondedInstructors()` - from not_responded_instructors view
- `getDashboardSummaryStats()` - from dashboard_summary_stats view
- `getEligibleInstructors()` - calls RPC function
- `getProgramBlocks()` - direct table query with instructor name join

### Error Handling Pattern

```typescript
if (error || !data) {
  console.error('Error:', error)
  return [] // or sensible defaults
}
```

---

## Implementation Recommendations

### Plan 1: Database Migration

1. Add `viewed_at TIMESTAMPTZ` column to `notifications` table
2. Create index on `viewed_at` for filtering
3. Create/update helper function to record view from token validation
4. Update `not_responded_instructors` view to include `viewed_at`
5. Update `dashboard_summary_stats` to include viewed metrics

### Plan 2: Faculty Portal Updates

1. Modify `validate_magic_token()` RPC to update `viewed_at` on first call
2. Query logic: `UPDATE notifications SET viewed_at = NOW() WHERE instructor_id = ? AND scheduled_program_id = ? AND viewed_at IS NULL`
3. Per context: Record even if token is expired (instructor saw the notification)

### Plan 3: Dashboard Updates

1. Update `NotRespondedInstructor` type to include `viewed_at: string | null`
2. Update `getNotRespondedInstructors()` query to include viewed_at
3. Update UI to show "Viewed" badge
4. Implement sort order: Not Viewed first
5. Add tooltip with formatted timestamp

---

## Key Files to Modify

| File | Changes |
|------|---------|
| New migration file | Add viewed_at column, update views |
| `validate_magic_token()` RPC | Record view on token validation |
| `faculty-scheduler-queries.ts` | Update types and queries |
| `not-responded-list.tsx` | Add Viewed badge and sorting |

---

## Testing Considerations

- Tokens with `viewed_at` already set should not update
- Expired tokens should still record view
- Dashboard filtering with both viewed and not-viewed instructors
- UI badge appears correctly with tooltip
- SQL query performance with viewed_at index

---
*Research completed: 2026-01-22*
