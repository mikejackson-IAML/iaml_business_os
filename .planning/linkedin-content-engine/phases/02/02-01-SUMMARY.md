---
phase: 02-daily-rss-research
plan: 01
subsystem: workflows
tags: [n8n, rss, claude-classification, supabase-rest, linkedin-content-engine]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: linkedin_engine schema with research_signals, workflow_runs tables
provides:
  - WF1 Daily RSS Monitor n8n workflow JSON (importable)
  - README documentation with CEO summary
  - Central workflow index updated with LinkedIn Content Engine section
affects: [03-weekly-deep-research, 04-topic-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RSS feed ingestion with per-source tagging via Set nodes"
    - "Claude Sonnet API classification via HTTP Request with httpHeaderAuth credential"
    - "Supabase REST API with Accept-Profile/Content-Profile headers for schema-scoped access"
    - "SplitInBatches + Wait 1s for rate-limited API calls"
    - "Canary error pattern: errorTrigger -> workflow_errors insert"

key-files:
  created:
    - n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json
    - business-os/workflows/README-wf1-daily-rss-monitor.md
  modified:
    - business-os/workflows/README.md

key-decisions:
  - "Supabase REST API with schema headers over postgres/supabase nodes (connection pooling bugs)"
  - "48-hour recency filter over dedup lookup (simpler, fewer API calls)"
  - "Claude Sonnet for classification with 3000-char truncation to limit token spend"
  - "signal_week calculated as Monday of current week for weekly aggregation"

patterns-established:
  - "LinkedIn Engine workflow naming: wf{N}-{kebab-name}.json in n8n-workflows/linkedin-engine/"
  - "Schema-scoped Supabase REST: Content-Profile and Accept-Profile headers"
  - "7 parallel RSS feeds merging into single processing pipeline"

# Metrics
duration: 3min
completed: 2026-02-13
---

# Phase 2 Plan 1: WF1 Daily RSS Monitor Summary

**26-node n8n workflow reading 7 HR/AI RSS feeds daily, classifying articles via Claude Sonnet, and storing signals in linkedin_engine.research_signals via Supabase REST API**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-13T23:56:45Z
- **Completed:** 2026-02-13T23:59:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Complete n8n workflow JSON with 26 nodes: schedule trigger, 7 RSS readers, 7 source taggers, 48-hour filter, batch processor, Claude classifier, Supabase inserter, run logger, and canary error handler
- CEO-summary README documentation with node map, source table, credential refs, and import instructions
- Central workflow index updated with LinkedIn Content Engine section

## Task Commits

Each task was committed atomically:

1. **Task 1: Build WF1 Daily RSS Monitor workflow JSON** - `8dcde68d` (feat)
2. **Task 2: Create README documentation and update workflow index** - `6acdcd16` (docs)

## Files Created/Modified
- `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json` - Complete 26-node n8n workflow for daily RSS monitoring and Claude classification
- `business-os/workflows/README-wf1-daily-rss-monitor.md` - CEO-summary documentation with node map, sources, credentials, import steps
- `business-os/workflows/README.md` - Added LinkedIn Content Engine section with WF1 entry

## Decisions Made
- Used Supabase REST API with `Accept-Profile: linkedin_engine` / `Content-Profile: linkedin_engine` headers instead of postgres nodes (avoids known connection pooling bugs)
- 48-hour recency filter via Code node instead of dedup lookup against database (simpler, fewer API calls, RSS items naturally deduplicate by pubDate)
- Claude Sonnet (claude-sonnet-4-20250514) for article classification with 3000-char body truncation to limit token costs
- signal_week calculated as Monday of current week using JavaScript date arithmetic
- All RSS feed read nodes have `onError: continueRegularOutput` so one failing feed does not block others

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed signal_week calculation to avoid mutating `now` date**
- **Found during:** Task 1 (Parse Claude Response code node)
- **Issue:** Plan's signal_week code used `now.setDate(diff)` which mutates the `now` Date object, potentially causing incorrect year/month when crossing month boundaries
- **Fix:** Used `new Date(now.getFullYear(), now.getMonth(), diff)` to construct Monday date without mutation
- **Files modified:** n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json
- **Verification:** Code review confirms correct Monday calculation
- **Committed in:** 8dcde68d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix essential for correct signal_week dates. No scope creep.

## Issues Encountered
- n8n-brain `store_pattern` MCP tool was not available in this session. Pattern registration deferred to manual step or future session.

## User Setup Required

**Workflow import and activation required.** After review:
1. Import `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json` into n8n
2. Verify credential mappings: Supabase REST (`Dy6aCSbL5Tup4TnE`) and Anthropic API (`anthropic-api`)
3. Test execution manually to validate RSS URLs
4. Activate for daily 6 AM CST schedule

## Next Phase Readiness
- WF1 workflow JSON ready for import and testing
- Phase 3 (Weekly Deep Research) can be planned/executed in parallel
- Phase 4 (Topic Scoring) depends on research_signals being populated by WF1

---
*Phase: 02-daily-rss-research*
*Completed: 2026-02-13*
