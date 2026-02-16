# LinkedIn Content Engine -- State

## Current Status

| Field | Value |
|-------|-------|
| **Milestone** | v1.0 |
| **Current Phase** | 6 (Publishing) -- complete |
| **Last Completed Phase** | 6 (Publishing) |
| **Phases Awaiting Import** | 2 (WF1), 3 (WF2), 4 (WF3), 5 (WF4), 6 (WF5) |
| **Last Updated** | 2026-02-15 |

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation | Done |
| 2 | Daily RSS Research | Built -- awaiting n8n import + test |
| 3 | Weekly Deep Research | Built -- awaiting n8n import + test |
| 4 | Topic Scoring & Selection | Done (WF3 awaiting n8n import, dashboard deployed) |
| 5 | Content Generation & Drafts | Done (WF4 built, Drafts tab deployed, awaiting n8n import) |
| 6 | Publishing | Done (WF5 built, awaiting LinkedIn OAuth2 setup + n8n import) |
| 7 | Engagement Engine | Ready to plan |
| 8 | Post-Publish Monitor | Ready to plan |
| 9 | Analytics & Feedback Loop | Blocked by 8 |
| 10 | Enrichment | Blocked by 9 |

Progress: [======----] 60% (6/10 phases)

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

### WF3: Topic Scoring Engine
- **JSON:** `n8n-workflows/linkedin-engine/wf3-topic-scoring-engine.json`
- **README:** `business-os/workflows/README-wf3-topic-scoring-engine.md`
- **n8n-brain:** Pattern not yet registered (register manually)
- **Nodes:** 19 nodes, schedule trigger Monday 5 AM CST
- **Action:** Import into n8n, verify credentials, test, activate

### WF4: Content Generation Pipeline
- **JSON:** `n8n-workflows/linkedin-engine/wf4-content-generation-pipeline.json`
- **README:** `business-os/workflows/README-wf4-content-generation-pipeline.md`
- **n8n-brain:** Pattern not yet registered
- **Nodes:** 20 nodes, webhook trigger (POST `linkedin-content-generate`)
- **Action:** Import into n8n, verify credentials, test with approved topic_id

### WF5: Publishing & First Comment
- **JSON:** `n8n-workflows/linkedin-engine/wf5-publishing-first-comment.json`
- **README:** `business-os/workflows/README-wf5-publishing-first-comment.md`
- **n8n-brain:** Pattern not yet registered
- **Nodes:** 32 nodes, schedule trigger Tue-Fri 8 AM CST
- **Prerequisites:** LinkedIn OAuth2 setup (developer app, credential in n8n, Person URN)
- **Action:** Complete OAuth2 setup, replace PLACEHOLDER values, import into n8n, test, activate

## Next Action

1. Import WF1-WF5 into n8n and test
2. Complete LinkedIn OAuth2 setup for WF5 (see README-wf5-publishing-first-comment.md Prerequisites)
3. `/gsd:discuss-phase 7 --project linkedin-content-engine` or `/gsd:plan-phase 7 --project linkedin-content-engine`

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
| 2026-02-15 | Phase 4 planned and executed | WF3 built (19 nodes), dashboard interactive tab deployed |
| 2026-02-15 | Two-pass Claude scoring architecture | Pass 1 clusters, Pass 2 scores across 5 dimensions |
| 2026-02-15 | Dot notation over .schema() for Supabase | Matches existing codebase pattern, avoids TS errors |
| 2026-02-15 | Vercel project configured | rootDirectory=dashboard, framework=nextjs, env vars set |
| 2026-02-15 | Phase 5 Plan 1 executed | WF4 built (20 nodes), schema migrated, TypeScript types synced |
| 2026-02-15 | Webhook async pattern for WF4 | Responds immediately, dashboard polls workflow_runs for status |
| 2026-02-15 | hook_variations JSONB on single post row | Stores all 3 hooks in JSONB array, Hook A selected by default |
| 2026-02-15 | Calendar slot assigned on draft creation | Not on topic approval, because series/pillar confirmed during generation |
| 2026-02-15 | Migration via Management API workaround | supabase db push blocked by pre-existing history sync issues |
| 2026-02-15 | Phase 5 Plan 2 executed | Drafts tab with hook selector, edit, approve/reject, regeneration |
| 2026-02-15 | Focused single-draft view for review | One draft at a time with navigation, more space for hook comparison |
| 2026-02-15 | Hook selector as clickable cards (3-col) | Visual comparison over tabs for A/B/C hook selection |
| 2026-02-15 | Added 'rejected' to PostDb status type | Was missing from union, needed for draft rejection flow |
| 2026-02-15 | Topic approval auto-triggers WF4 | Fire-and-forget webhook POST on status change to 'approved' |
| 2026-02-15 | Phase 6 Plan 1 executed | WF5 built (32 nodes), publishing + first comment workflow |
| 2026-02-15 | LinkedIn native node for posts, HTTP Request for comments | n8n LinkedIn node can't comment, use predefinedCredentialType |
| 2026-02-15 | 45-second wait for first comment | Under 65s n8n threshold, workflow stays in-process |
| 2026-02-15 | PLACEHOLDER approach for LinkedIn OAuth2 | User replaces after manual OAuth2 setup (5-step process) |
| 2026-02-15 | Retry-once-revert pattern | Publish fails -> 5 min wait -> retry -> revert to approved + alert |
| 2026-02-15 | Comment failure keeps post published | Post is live on LinkedIn, only comment failed |

## Open Questions

- Some RSS feed URLs (WF1) are best-guess and may need adjustment after first test run (SHRM, Fisher Phillips most likely)
- Apify actor IDs (WF2) should be verified in Apify Store before first run
- APIFY_API_TOKEN env var needs to be set in n8n settings
- WF3 n8n-brain pattern needs manual registration
- WF4 n8n-brain pattern needs registration after import
- WF5 n8n-brain pattern needs registration after import
- supabase db push migration history is out of sync -- needs repair or continued Management API workaround
- LinkedIn OAuth2 setup must be completed before WF5 can be activated

## Session Continuity

Last session: 2026-02-15
Stopped at: Phase 6 complete, WF5 built
Resume file: None
