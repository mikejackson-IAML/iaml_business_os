# 04-01 Summary: Supabase Admin Functions

## Status: Complete

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Phase 4 migration | `supabase/migrations/20260121_faculty_scheduler_phase4.sql` |

## What Was Built

### Functions Created

1. **`release_all(p_tier_0_days, p_tier_1_days)`** — Bulk-releases all draft programs to tier_0 in a single transaction. Returns count and array of released program IDs.

2. **`skip_tier(p_program_id, p_target_tier)`** — Safely advances a program to tier_1 or tier_2 with comprehensive validation:
   - Validates target_tier is 'tier_1' or 'tier_2'
   - Checks program exists
   - Prevents skipping for draft/filled/completed programs
   - Prevents redundant skips (already at target tier)
   - Adjusts tier end dates appropriately

3. **`get_programs_needing_reminder()`** — Returns programs at 45-55% of their current tier window that:
   - Have open blocks
   - Haven't had a reminder notification sent yet
   - Returns tier timing info including percent_elapsed

4. **`get_instructors_needing_reminder(p_scheduled_program_id)`** — Returns eligible instructors for reminder who:
   - Are qualified for the program
   - Are eligible at current tier
   - Haven't already received a reminder for this program
   - Includes open_block_count for email templates

5. **`get_instructors_for_rerelease(p_scheduled_program_id, p_block_id)`** — Returns eligible instructors for re-release notification who:
   - Are qualified for the program
   - Are eligible at current tier
   - Don't already have an active claim on any block in this program
   - Includes program details (name, city, state) for email templates

### Schema Change

Added `'rerelease'` to the `notification_type` CHECK constraint on `faculty_scheduler.notifications` table.

## Commits

| Hash | Description |
|------|-------------|
| 7a31671 | feat(04-01): add admin functions for release controls and reminders |

## Issues Encountered

None.

## Deviations from Plan

None.
