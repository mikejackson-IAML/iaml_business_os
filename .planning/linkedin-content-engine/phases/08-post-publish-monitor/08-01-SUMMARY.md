---
phase: 08-post-publish-monitor
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, typescript, schema-migration]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: linkedin_engine schema, posts table, post_analytics table
  - phase: 07-engagement-engine
    provides: engagement_digests table, anon grant patterns
provides:
  - post_incoming_comments table for storing scraped LinkedIn comments
  - Monitoring columns on posts table (monitoring_status, monitoring_started_at, last_polled_at, monitoring_ends_at)
  - PostIncomingCommentDb TypeScript interface
  - getRecentIncomingComments() query function in dashboard data loader
  - Anon grants for n8n workflow access to posts, post_analytics, post_incoming_comments
affects:
  - 08-post-publish-monitor (plans 02 and 03 depend on this schema)
  - 09-analytics-feedback-loop (will consume post_analytics and incoming comments data)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Monitoring state columns on existing table (not separate state table)"
    - "linkedin_comment_id unique index for Apify comment dedup"
    - "Thread tracking via parent_comment_id self-reference and thread_state enum"

key-files:
  created:
    - supabase/migrations/20260216_linkedin_engine_monitoring.sql
  modified:
    - dashboard/src/lib/api/linkedin-content-queries.ts

key-decisions:
  - "Monitoring columns added to posts table (not separate monitoring_state table)"
  - "UNIQUE index on linkedin_comment_id for dedup via ON CONFLICT"
  - "Management API workaround continues for migration deployment"

patterns-established:
  - "State-driven monitoring columns on posts table for WF7 polling"
  - "PostIncomingCommentDb type with comment classification enum (question/agreement/disagreement/addition/spam)"

# Metrics
duration: 4min
completed: 2026-02-16
---

# Phase 8 Plan 1: Monitoring Schema & Types Summary

**post_incoming_comments table with linkedin_comment_id unique dedup index, monitoring columns on posts table, anon/authenticated grants, and PostIncomingCommentDb TypeScript type with getRecentIncomingComments() query in dashboard data loader**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T05:27:29Z
- **Completed:** 2026-02-16T05:31:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Schema migration deployed: post_incoming_comments table (20 columns) with 5 indexes including unique dedup on linkedin_comment_id
- Monitoring columns added to posts table: monitoring_status, monitoring_started_at, last_polled_at, monitoring_ends_at with COMMENTs
- Anon grants for n8n: posts (SELECT/UPDATE), post_analytics (SELECT/INSERT), post_incoming_comments (SELECT/INSERT/UPDATE)
- RLS policies: service_role full access, authenticated read, anon full access for n8n on all three tables
- PostIncomingCommentDb TypeScript interface with comment_type union and thread_state enum
- getRecentIncomingComments() query function fetching non-spam comments ordered by detected_at
- LinkedInContentSummary updated with incomingComments field in parallel dashboard fetch

## Task Commits

Each task was committed atomically:

1. **Task 1: Create monitoring schema migration** - `5c2f0c9d` (feat)
2. **Task 2: Add TypeScript types and query function** - `a1012334` (feat)

## Files Created/Modified
- `supabase/migrations/20260216_linkedin_engine_monitoring.sql` - Schema migration: post_incoming_comments table, monitoring columns, indexes, RLS, grants
- `dashboard/src/lib/api/linkedin-content-queries.ts` - Added PostIncomingCommentDb interface, getRecentIncomingComments() query, updated LinkedInContentSummary and dashboard data loader

## Decisions Made
- Continued using Supabase Management API workaround for migration deployment (supabase db push history still out of sync)
- Monitoring columns on posts table (not a separate table) -- follows the plan and keeps related data co-located
- UNIQUE index on linkedin_comment_id (not regular index) -- enables Supabase upsert with ON CONFLICT for dedup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema and types are ready for Plan 2 (WF7 n8n workflow build)
- Plan 3 (dashboard incoming comments UI) can also proceed
- All tables accessible via anon key (verified with REST API calls)

---
*Phase: 08-post-publish-monitor*
*Completed: 2026-02-16*
