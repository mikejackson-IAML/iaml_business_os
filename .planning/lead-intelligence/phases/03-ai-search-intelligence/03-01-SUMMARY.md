---
phase: 03-ai-search-intelligence
plan: 01
subsystem: ai-backend
tags: [claude-api, natural-language-search, ai-summary, caching]
depends_on:
  requires: [01-01, 01-02, 02-01]
  provides: [ai-parse-search-endpoint, ai-generate-summary-endpoint, ai-summary-db-columns]
  affects: [03-02, 03-03]
tech_stack:
  added: []
  patterns: [singleton-anthropic-client, json-extraction-from-llm, filter-validation, response-caching]
key_files:
  created:
    - supabase/migrations/20260204_add_ai_summary_columns.sql
    - dashboard/src/lib/api/lead-intelligence-ai-types.ts
    - dashboard/src/lib/api/lead-intelligence-ai.ts
    - dashboard/src/app/api/lead-intelligence/ai/parse-search/route.ts
    - dashboard/src/app/api/lead-intelligence/ai/generate-summary/route.ts
  modified: []
metrics:
  duration: 3m
  completed: 2026-01-27
---

# Phase 03 Plan 01: AI Backend Endpoints Summary

> Two POST endpoints for NL search parsing (Haiku) and contact summary generation (Sonnet) with 30-day caching and strict filter validation.

## What Was Built

### DB Migration
- Added `ai_summary` (jsonb) and `ai_summary_generated_at` (timestamptz) columns to `li_contacts`

### Types (`lead-intelligence-ai-types.ts`)
- `AISearchResult`, `AISearchRequest`, `AISummary`, `AISummarySection`, `AISummaryResponse`, `FilterPill`

### Claude API Helpers (`lead-intelligence-ai.ts`)
- Singleton Anthropic client (same pattern as action-center ai-analysis.ts)
- `parseSearchQuery()`: Haiku with 256 max tokens, validates all filter fields against enum sets, silently strips invalid values
- `generateContactSummary()`: Sonnet with 1024 max tokens, returns headline + 4 sections
- JSON extraction regex matching existing codebase pattern
- Full validation of status, state, seniority, email_status, company_size enums

### API Endpoints
- **POST /api/lead-intelligence/ai/parse-search**: 5-second timeout, program name-to-ID resolution via li_programs lookup, returns `{ filters }` or `{ error, suggestion }`
- **POST /api/lead-intelligence/ai/generate-summary**: 30-day cache check, fetches attendance + activities + follow-ups for context, saves result to DB, returns `{ summary, generated_at, cached }`

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Haiku for search, Sonnet for summaries | Search is simple classification (fast/cheap); summaries need nuanced narrative |
| 5-second timeout on search | UX responsiveness; search should feel instant |
| Silent filter stripping | Better UX than error — show what we can parse |
| 30-day cache threshold | Matches CONTEXT.md staleness spec |
| `as any` for Supabase table access | Accumulated decision: supabase-any-cast |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Frontend plans (03-02, 03-03) can now consume both endpoints. No blockers.
