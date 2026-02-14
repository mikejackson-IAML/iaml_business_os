# LinkedIn Content Engine -- State

## Current Status

| Field | Value |
|-------|-------|
| **Milestone** | v1.0 |
| **Current Phase** | 4 (Topic Scoring & Selection) -- next to plan |
| **Last Completed Phase** | 1 (Foundation) |
| **Phases Awaiting Import** | 2 (WF1), 3 (WF2) |
| **Last Updated** | 2026-02-13 |

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation | Done |
| 2 | Daily RSS Research | Built -- awaiting n8n import + test |
| 3 | Weekly Deep Research | Built -- awaiting n8n import + test |
| 4 | Topic Scoring & Selection | Ready to plan (blocked by 2, 3 verification) |
| 5 | Content Generation & Drafts | Blocked by 4 |
| 6 | Publishing | Blocked by 5 |
| 7 | Engagement Engine | Blocked by 6 |
| 8 | Post-Publish Monitor | Blocked by 6 |
| 9 | Analytics & Feedback Loop | Blocked by 8 |
| 10 | Enrichment | Blocked by 9 |

## Artifacts Awaiting Import

### WF1: Daily RSS Monitor
- **JSON:** `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json`
- **README:** `business-os/workflows/README-wf1-daily-rss-monitor.md`
- **n8n-brain:** Pattern `ba02d758` registered
- **Nodes:** 26 nodes, schedule trigger 6 AM CST
- **Action:** Import into n8n, verify credentials, test, activate

### WF2: Weekly Deep Research
- **JSON:** `n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json`
- **README:** `business-os/workflows/README-wf2-weekly-deep-research.md`
- **n8n-brain:** Pattern `3d6e3a95` registered
- **Nodes:** 25 nodes, schedule trigger Sunday 8 PM CST
- **Action:** Import into n8n, set APIFY_API_TOKEN env var, verify credentials, test, activate

## Next Action

1. Import both workflows into n8n and test
2. After both verified, plan Phase 4: `/gsd:plan-phase 4 --project linkedin-content-engine`

## Decisions Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-02-13 | GSD project initialized | Formalizing existing planning into GSD structure |
| 2026-02-13 | Phase 1 marked complete | Schema, dashboard, calendar, pivot all validated |
| 2026-02-13 | 10-phase roadmap adopted | Linear dependency chain with Phase 2-3 parallel |
| 2026-02-13 | Phase 2 planned and executed | WF1 built with 26 nodes, 7 RSS feeds |
| 2026-02-13 | Phase 3 planned and executed | WF2 built with 25 nodes, Reddit + LinkedIn via Apify |
| 2026-02-13 | Supabase REST over postgres nodes | Avoids known connection pooling bugs in n8n |
| 2026-02-13 | 48-hour recency filter over dedup (WF1) | Simpler than DB lookup, RSS items naturally deduplicate |
| 2026-02-13 | Source URL dedup via REST GET (WF2) | Prevents duplicate signals from weekly scrapes |
| 2026-02-13 | Apify sync endpoint preferred | run-sync-get-dataset-items avoids polling complexity |
| 2026-02-13 | Schema-scoped REST headers | Accept-Profile/Content-Profile: linkedin_engine for all Supabase calls |
| 2026-02-13 | Both n8n-brain patterns registered | WF1: ba02d758, WF2: 3d6e3a95 |

## Open Questions

- Some RSS feed URLs (WF1) are best-guess and may need adjustment after first test run (SHRM, Fisher Phillips most likely)
- Apify actor IDs (WF2) should be verified in Apify Store before first run
- APIFY_API_TOKEN env var needs to be set in n8n settings
