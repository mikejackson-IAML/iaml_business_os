# Summary: 07-01 Database Migration for Teaching History

## What Was Built

Created the database infrastructure for tracking instructor teaching history automatically when claims are made.

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260122_faculty_scheduler_phase7_history.sql` | Complete migration with table, triggers, functions, and view |

## Database Objects

### Table: `faculty_scheduler.teaching_history`

Stores one record per instructor per program with:
- Denormalized program info (name, type, city, state, dates)
- `block_count` - number of blocks claimed for this program
- `status` - pending/completed/cancelled
- Timestamps for claimed_at, completed_at, cancelled_at

### Triggers

| Trigger | Event | Purpose |
|---------|-------|---------|
| `trg_claims_insert_history` | AFTER INSERT on claims | Creates/updates history when claim confirmed |
| `trg_claims_cancel_history` | AFTER UPDATE on claims | Decrements block_count or marks cancelled |

### Functions

| Function | Purpose |
|----------|---------|
| `create_or_update_teaching_history()` | Upserts history record with program details |
| `update_teaching_history_on_cancel()` | Handles cancellation logic |
| `complete_past_teaching_history()` | Auto-completes records where program has ended (for n8n daily job) |

### View: `faculty_scheduler.instructor_history_summary`

Aggregates per instructor:
- `total_programs` - all programs
- `completed_count` - finished teaching
- `pending_count` - upcoming
- `cancelled_count` - cancelled assignments
- `last_program_date` - most recent program

## Key Design Decisions

1. **Denormalized Program Info** - Store program name, type, city, state at claim time for historical accuracy (program details may change)

2. **Block Count Tracking** - Single history record per instructor/program with block_count that increments/decrements as blocks are claimed/cancelled

3. **UPSERT Pattern** - Uses `INSERT ... ON CONFLICT DO UPDATE` for efficient create-or-update logic

4. **Automatic Completion** - `complete_past_teaching_history()` function designed to run daily via n8n to mark programs as completed

## Verification Checklist

- [x] `teaching_history` table exists with all columns and constraints
- [x] Unique constraint on (instructor_id, scheduled_program_id)
- [x] Trigger fires on claims INSERT (status='confirmed')
- [x] Trigger fires on claims UPDATE (confirmed -> cancelled)
- [x] `complete_past_teaching_history()` function exists
- [x] `instructor_history_summary` view exists
- [x] Updated_at trigger configured
- [x] Comments added for documentation

## Commit

```
183eeee feat(07-01): add teaching history table and triggers
```
