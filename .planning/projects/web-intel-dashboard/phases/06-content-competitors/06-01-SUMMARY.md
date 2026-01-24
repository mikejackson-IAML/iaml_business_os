---
phase: 06-content-competitors
plan: 01
subsystem: web-intel-data-layer
tags: [queries, types, content, competitors, serp-share]

dependency-graph:
  requires: [01-02]
  provides: [content-decay-queries, thin-content-queries, competitor-queries, serp-share-queries]
  affects: [06-02, 06-03, 06-04]

tech-stack:
  added: []
  patterns: [supabase-joins, type-transformation, null-handling]

key-files:
  created: []
  modified:
    - dashboard/src/lib/api/web-intel-queries.ts

decisions:
  - id: join-syntax
    choice: "Supabase nested select for joins"
    reason: "content_inventory:content_id syntax matches existing patterns"
  - id: content-summary
    choice: "Calculate stats from content_inventory"
    reason: "totalIndexed from tracked pages, not GSC index_coverage"
  - id: serp-share-null
    choice: "Return null for no data"
    reason: "PGRST116 handled gracefully, matches getIndexCoverage pattern"

metrics:
  duration: 2 min
  completed: 2026-01-24
---

# Phase 6 Plan 1: Content & Competitor Query Functions Summary

**One-liner:** Added query functions for content decay, thin content, content summary, competitors, and SERP share with proper Supabase joins and type transformations.

## What Was Built

Extended `web-intel-queries.ts` with complete data layer for the Content tab:

### DB Types Added
- `ContentInventoryDb` - tracked pages with metadata
- `ThinContentDb` - thin content flags with recommendations
- `CompetitorDb` - tracked competitors
- `SerpShareDb` - SERP share of voice data

### Frontend Types Added
- `ContentInventory` - camelCase page data
- `ThinContent` - camelCase thin content data
- `ContentDecayWithInventory` - decay with joined URL/title/wordCount
- `ThinContentWithInventory` - thin content with joined URL/title
- `ContentSummary` - computed stats (totalIndexed, avgWordCount)
- `Competitor` - camelCase competitor data
- `SerpShare` - camelCase SERP share data

### Query Functions Added
- `getContentDecayWithInventory(limit)` - joins content_decay with content_inventory
- `getThinContentWithInventory(limit)` - joins thin_content with content_inventory
- `getContentSummary()` - calculates total indexed pages and avg word count
- `getCompetitors()` - returns active competitors ordered by domain
- `getSerpShare()` - returns latest SERP share or null

### Transform Functions Added
- `transformContentInventory(data)`
- `transformThinContent(data)`
- `transformCompetitors(data)`
- `transformSerpShare(data)`

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Join syntax | `content_inventory:content_id (...)` | Supabase nested select, matches existing patterns |
| Content summary source | `content_inventory` table | Represents our tracked pages, not GSC index_coverage |
| Thin content ordering | `bounce_rate DESC` | Highest bounce rate = worst performing content first |
| SERP share null handling | Return `null` if no data | PGRST116 error code, matches `getIndexCoverage` pattern |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Description |
|------|-------------|
| de5c07e | feat(06-01): add DB types for content and competitor tables |
| 5a0d87c | feat(06-01): add frontend types and transform functions |
| 2e3640e | feat(06-01): add query functions for content and competitor data |

## Files Modified

- `dashboard/src/lib/api/web-intel-queries.ts` (+357 lines)

## Verification

- [x] TypeScript compiles without errors in web-intel-queries.ts
- [x] All new types exported
- [x] Query functions handle errors gracefully (return [] or null)
- [x] Join queries use correct Supabase nested select syntax

## Next Phase Readiness

**Ready for:** 06-02-PLAN.md (ContentHealthSection component)

**Prerequisites met:**
- ContentDecayWithInventory type available
- ThinContentWithInventory type available
- ContentSummary type available
- Query functions ready for use in page.tsx
