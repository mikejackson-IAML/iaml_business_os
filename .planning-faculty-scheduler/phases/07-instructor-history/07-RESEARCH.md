# Phase 7 Research: Instructor History

**Completed:** 2026-01-22
**Requirements:** IH-01, IH-02, IH-03

## Current State

### Existing Schema

The Faculty Scheduler system currently has these relevant tables:

**faculty (public schema)**
- `id` UUID - Primary key
- `full_name`, `first_name`, `last_name` - Instructor name
- `email`, `firm_state` - Contact and location info
- `tier_designation` - 0 = VIP, NULL = normal
- `faculty_status` - 'active' or 'inactive'

**faculty_scheduler.scheduled_programs**
- `id` UUID - Primary key
- `program_id` UUID - FK to catalog `programs` table
- `name`, `program_type` - Program identification
- `city`, `state`, `venue` - Location (denormalized for display)
- `start_date`, `end_date` - Program dates
- `status` - 'draft', 'tier_0', 'tier_1', 'tier_2', 'filled', 'completed'

**faculty_scheduler.program_blocks**
- `id` UUID - Primary key
- `scheduled_program_id` UUID - FK to scheduled_programs
- `block_name`, `sequence_order` - Block identification
- `start_date`, `end_date` - Block dates
- `instructor_id` UUID - FK to faculty (assigned instructor)
- `status` - 'open', 'claimed', 'confirmed', 'completed'

**faculty_scheduler.claims**
- `id` UUID - Primary key
- `instructor_id` UUID - FK to faculty
- `block_id` UUID - FK to program_blocks
- `status` - 'confirmed', 'cancelled', 'completed'
- `claimed_at` TIMESTAMPTZ - When claim was made
- `cancelled_at`, `cancelled_by`, `cancelled_reason` - Cancellation tracking

### Current Data Flow

1. Instructor claims a block via portal -> Creates `claims` record (status='confirmed')
2. Block gets `instructor_id` set, `status='claimed'`
3. No current mechanism to mark claims/blocks as 'completed' after program ends
4. Cancelled claims remain in `claims` table with status='cancelled'

### Existing Dashboard Patterns

**Query Layer** (`faculty-scheduler-queries.ts`):
- Types defined for all data structures
- `getFacultySchedulerDashboardData()` fetches programs, notResponded, summaryStats in parallel
- `getEligibleInstructors()` and `getProgramBlocks()` called on-demand for modals

**UI Components**:
- `RecruitmentPipelineTable` - Simple table with action dropdown, no expandable rows
- `AssignInstructorModal` - Fetches eligible instructors and blocks when opened, shows list with search
- `NotRespondedList` - Groups instructors by program, uses Badge for status indicators
- Status badges use color coding: green=completed, yellow/amber=pending, gray=cancelled

**Component Patterns**:
- Cards with CardHeader/CardTitle/CardContent
- Badge component for status indicators with variant styling
- Tooltip component for additional info on hover
- No existing accordion/collapsible component - would need to create expandable row pattern

## Technical Analysis

### Database Schema Needs

**New Table: `faculty_scheduler.teaching_history`**

```sql
CREATE TABLE faculty_scheduler.teaching_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationships
  instructor_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  scheduled_program_id UUID NOT NULL REFERENCES faculty_scheduler.scheduled_programs(id) ON DELETE CASCADE,

  -- Denormalized program info (captured at claim time for historical accuracy)
  program_name TEXT NOT NULL,
  program_type TEXT,
  city TEXT,
  state TEXT,

  -- Teaching details
  start_date DATE NOT NULL,
  end_date DATE,
  block_count INTEGER DEFAULT 1,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Claimed but program hasn't ended
    'completed',   -- Program end date passed (auto-completed)
    'cancelled'    -- Claim was cancelled
  )),

  -- Timestamps
  claimed_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(instructor_id, scheduled_program_id)  -- One history record per instructor per program
);
```

**Key Design Decisions:**

1. **Program-level records, not block-level** - One history record per instructor per program, with `block_count` to track how many blocks they claimed. Simpler to display and query.

2. **Denormalized program info** - Store `program_name`, `program_type`, `city`, `state` at claim time so history remains accurate even if program details change.

3. **Auto-complete via end_date** - No manual completion workflow. A scheduled job (or trigger) marks records as 'completed' when `end_date < NOW()`.

4. **Cancelled records preserved** - Don't delete on cancellation; mark as 'cancelled'. This tracks patterns (frequent cancellations).

5. **No backfill** - Start fresh from this phase forward. Existing claims won't be migrated.

### Trigger/Function Needs

**Create history record when claim is made:**
```sql
-- Trigger on claims INSERT
-- Creates teaching_history record if not exists for this instructor/program
-- If exists (multiple blocks same program), increments block_count
```

**Update history on cancellation:**
```sql
-- Trigger on claims UPDATE to status='cancelled'
-- Decrements block_count; if block_count=0, marks history as 'cancelled'
```

**Auto-complete based on end_date:**
Two options:
1. **n8n scheduled job** - Daily job runs `UPDATE teaching_history SET status='completed', completed_at=NOW() WHERE status='pending' AND end_date < CURRENT_DATE`
2. **View-based** - Create a view that computes status dynamically based on end_date

Recommendation: n8n scheduled job is cleaner for this use case since we want actual status changes persisted.

### Query Patterns

**Fetch history for an instructor:**
```sql
SELECT * FROM faculty_scheduler.teaching_history
WHERE instructor_id = $1
ORDER BY start_date DESC
LIMIT 20;
```

**Fetch history summary for dashboard:**
```sql
-- For expandable row: count by status
SELECT
  instructor_id,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count
FROM faculty_scheduler.teaching_history
GROUP BY instructor_id;
```

### UI Integration Points

#### 1. Dashboard Instructor History (IH-02)

**Location:** New expandable pattern in a dedicated instructor list section, OR add to existing "Not Responded" component, OR create new "Instructors" tab/view.

**Recommended Approach:** Create expandable instructor rows. The current dashboard focuses on programs, not instructors. For instructor history:

Option A: Add "Instructors" section to dashboard with expandable rows
- New `InstructorList` component alongside existing `NotRespondedList`
- Each instructor row expands to show history list
- Uses ChevronRight/ChevronDown icons for expand toggle

Option B: Click instructor name anywhere -> opens modal with full history
- Simpler to implement, reuses modal pattern
- Less integrated into workflow

**Recommendation:** Option A (expandable rows) matches the context decision of "Expandable row pattern". Implement as:
- InstructorRow component with expand state
- On expand, fetch teaching history via new query
- Display as simple list with status badges

#### 2. Assign Modal History Display (IH-03)

**Location:** `AssignInstructorModal` - when selecting instructor, show their past programs

**Implementation:**
- Fetch history alongside eligible instructors
- Display under each instructor in the selection list
- Format: "Taught: Program X (2025), Program Y (2024)" or "3 programs taught"
- Could be tooltip or inline text below instructor name

**Data Flow:**
1. Modal opens -> fetches eligible instructors AND history for those instructors in parallel
2. History data joined/mapped to instructors by instructor_id
3. Rendered as part of instructor selection card

### File Changes Summary

**New Files:**
- `supabase/migrations/20260122_faculty_scheduler_phase7_history.sql` - Schema, triggers, functions
- `dashboard/src/app/dashboard/faculty-scheduler/components/instructor-history-row.tsx` - Expandable row component
- `dashboard/src/app/dashboard/faculty-scheduler/components/instructor-list.tsx` - Container for history display

**Modified Files:**
- `dashboard/src/lib/api/faculty-scheduler-queries.ts` - Add types and query functions for history
- `dashboard/src/app/dashboard/faculty-scheduler/components/assign-instructor-modal.tsx` - Add history display
- `dashboard/src/app/dashboard/faculty-scheduler/content.tsx` - Add instructor list section

## Implementation Approach

**Recommended Plan Order:**

### Plan 07-01: Database Migration
- Create `teaching_history` table with schema above
- Create trigger to populate history on claim INSERT
- Create trigger to update history on claim cancellation
- Create function for auto-completing past-end-date records
- Create helper view for history summary by instructor
- NO backfill of existing data

### Plan 07-02: Query Layer and Types
- Add `TeachingHistoryRecord` type
- Add `InstructorHistorySummary` type
- Add `getInstructorHistory(instructorId)` query function
- Add `getInstructorsWithHistory()` query for dashboard list
- Modify `getEligibleInstructors` to include history count

### Plan 07-03: Dashboard UI
- Create `InstructorHistoryRow` component with expand/collapse
- Create `InstructorList` component for dashboard section
- Update `AssignInstructorModal` to show history when selecting instructor
- Add status badges (green=completed, yellow=pending, red=cancelled)

## Risks/Considerations

### Edge Cases

1. **Instructor claims multiple blocks in same program**
   - Solution: Single history record with `block_count` field
   - Trigger must handle increment on additional claims

2. **Partial cancellation (cancel one block, keep another)**
   - Solution: Decrement `block_count`; only mark history 'cancelled' if count reaches 0

3. **Program with no end_date**
   - Solution: Auto-complete check uses `COALESCE(end_date, start_date) < CURRENT_DATE`

4. **Program rescheduled after claim**
   - Solution: History stores denormalized dates at claim time; OR update trigger syncs from scheduled_programs
   - Recommendation: Update on scheduled_programs change to keep dates accurate

### Performance

1. **History query in assign modal**
   - Could add latency when opening modal
   - Mitigation: Fetch in parallel with eligible instructors, use LIMIT

2. **Large instructor list with history**
   - Dashboard could slow with many instructors
   - Mitigation: Pagination, lazy load history on expand only

### Migration

1. **No backfill** - Per context decisions, only track from this phase forward
   - Existing claims won't appear in history
   - Clearly document this limitation

2. **Trigger on existing claims table**
   - Won't fire for existing records
   - Only new claims after migration get history records

### UI/UX

1. **Where to show instructor list?**
   - Options: New section, new tab, sidebar
   - Recommendation: Start as new section below "Not Responded" list
   - Can refactor to tabs later if dashboard gets crowded

2. **History in assign modal**
   - Don't clutter the selection interface
   - Show summary count by default, detail on hover/expand
