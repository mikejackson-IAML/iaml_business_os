---
phase: 06-content-competitors
plan: 02
subsystem: web-intel-content-health
tags: [components, content-decay, thin-content, ui]

dependency-graph:
  requires: [06-01]
  provides: [ContentDecayList, ThinContentList, ContentHealthSection]
  affects: [06-04]

tech-stack:
  added: []
  patterns: [expandable-list, severity-badges, summary-metrics]

key-files:
  created:
    - dashboard/src/app/dashboard/web-intel/components/content-decay-list.tsx
    - dashboard/src/app/dashboard/web-intel/components/thin-content-list.tsx
    - dashboard/src/app/dashboard/web-intel/components/content-health-section.tsx
  modified: []

decisions:
  - id: severity-badge-variants
    choice: "destructive/secondary/outline for severe/moderate/minor"
    reason: "Follows dashboard-kit Badge variants for consistent severity indication"
  - id: bounce-rate-threshold
    choice: "70% threshold for red text color"
    reason: "Matches CONTEXT.md definition of thin content (>70% bounce)"
  - id: healthy-content-message
    choice: "Show positive 'Content is healthy' when no issues"
    reason: "Better UX than showing empty sections"

metrics:
  duration: 2 min
  completed: 2026-01-24
---

# Phase 6 Plan 2: ContentHealthSection Component Summary

**One-liner:** Built ContentDecayList, ThinContentList, and ContentHealthSection components with expandable lists, severity badges, and summary metrics.

## What Was Built

Three React components for the Content Health card in the Content tab:

### ContentDecayList (`content-decay-list.tsx`)
- Displays decaying content pages with URL, decay percentage, severity badge
- TrendingDown icon with red percentage showing traffic drop
- Severity badges: severe=destructive (red), moderate=secondary, minor=outline
- Expandable list: top 5 items with "View all (N)" button
- Empty state: "No content decay detected"

### ThinContentList (`thin-content-list.tsx`)
- Displays thin content pages with URL, word count, bounce rate
- FileText icon with word count display
- Red text for bounce rate >70% (high bounce indicator)
- Expandable list: top 5 items with "View all (N)" button
- Empty state: "No thin content flags"

### ContentHealthSection (`content-health-section.tsx`)
- Wrapper card combining summary metrics + decay + thin content
- Summary grid: Total Indexed Pages and Avg Word Count
- Composes ContentDecayList and ThinContentList
- Shows "Content is healthy" with CheckCircle when both lists empty
- Icons: FileWarning (header), TrendingDown (decay), AlertTriangle (thin)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Severity badge variants | destructive/secondary/outline | Maps severe/moderate/minor to dashboard-kit Badge variants |
| Bounce rate threshold | 70% | Matches CONTEXT.md definition for thin content |
| Healthy state handling | Show positive message | Better UX than empty sections when no issues |
| Expand pattern | useState + slice | Matches existing patterns in AlertsSection |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Description |
|------|-------------|
| aec988f | feat(06-02): add ContentDecayList component |
| 4a692be | feat(06-02): add ThinContentList component |
| 92e23c4 | feat(06-02): add ContentHealthSection component |

## Files Created

- `dashboard/src/app/dashboard/web-intel/components/content-decay-list.tsx` (89 lines)
- `dashboard/src/app/dashboard/web-intel/components/thin-content-list.tsx` (76 lines)
- `dashboard/src/app/dashboard/web-intel/components/content-health-section.tsx` (77 lines)

## Verification

- [x] TypeScript compiles without errors for all 3 components
- [x] ContentDecayList shows severity badges with correct colors
- [x] ThinContentList shows word count and bounce rate
- [x] ContentHealthSection displays summary metrics prominently
- [x] "View all" expansion works on both lists
- [x] Empty states render correctly (tested via code review)

## Next Phase Readiness

**Ready for:** 06-03-PLAN.md (CompetitorsSection and SerpShareChart)

**Prerequisites met:**
- ContentHealthSection ready for Content tab integration
- Query functions from 06-01 work with these components
- Expandable list pattern established for reuse
