# Build Packet: Update Fallback Sample Dates in All Program Pages

**Type:** Quick Fix  
**Priority:** HIGH  
**Created:** 2026-05-01  
**Source:** Content Review (worker c71527f4)  
**Estimated effort:** 30–45 minutes (15 files)

---

## Problem

Every program HTML page has a `getSampleData()` JavaScript function that provides fallback session data if the Airtable API call fails. All fallback sessions use 2025 dates (February–April 2025), which are now over a year in the past.

If the Airtable API is unavailable (network issue, rate limit, outage), users are shown these stale sessions, which makes it look like there are no upcoming sessions.

## Pattern to Fix

In each program file, find the `getSampleData()` function (marked with a comment `/* SAMPLE DATA (FALLBACK) */`) and update the `startDate` and `endDate` fields to future dates in late 2026 or 2027.

The fallback data should feel realistic but clearly be placeholder — use Q3/Q4 2026 dates.

### Current Pattern (hr-law-fundamentals.html example)
```javascript
function getSampleData(){
  return [
    {
      id: 'sample-inperson-1',
      program: 'HR Law Fundamentals',
      format: 'In-Person',
      startDate: '2025-03-15',   // ← OUTDATED
      endDate: '2025-03-19',     // ← OUTDATED
      ...
    },
    {
      id: 'sample-inperson-2',
      ...
      startDate: '2025-04-12',   // ← OUTDATED
      endDate: '2025-04-16',     // ← OUTDATED
      ...
    },
    {
      id: 'sample-virtual-1',
      ...
      startDate: '2025-02-20',   // ← OUTDATED
      endDate: '2025-02-24',     // ← OUTDATED
      ...
    },
```

### Updated Pattern (use these dates consistently)
Replace 2025 sample dates with these 2026 dates:
- **In-Person session 1:** startDate: `'2026-09-14'`, endDate: `'2026-09-18'`
- **In-Person session 2:** startDate: `'2026-10-12'`, endDate: `'2026-10-16'`
- **Virtual session:** startDate: `'2026-08-17'`, endDate: `'2026-08-21'`

On-Demand sessions have `startDate: null` — leave those unchanged.

## Files to Update (15 total)

For each file, search for `getSampleData` and update the three in-person/virtual `startDate` / `endDate` values:

1. `/website/programs/hr-law-fundamentals.html`
2. `/website/programs/advanced-employee-benefits-law.html`
3. `/website/programs/advanced-employment-law.html`
4. `/website/programs/benefit-plan-claims-appeals-litigation.html`
5. `/website/programs/comprehensive-labor-relations.html`
6. `/website/programs/discrimination-prevention-defense.html`
7. `/website/programs/employee-benefits-law.html`
8. `/website/programs/employee-relations-law.html`
9. `/website/programs/retirement-plans.html`
10. `/website/programs/special-issues-employment-law.html`
11. `/website/programs/strategic-hr-leadership.html`
12. `/website/programs/strategic-hr-management.html`
13. `/website/programs/welfare-benefits-plan-issues.html`
14. `/website/programs/workplace-investigations.html`
15. `/website/programs/_template.html`

## Approach

The most reliable approach is a targeted search-and-replace per file. The date patterns are consistent across all 15 files:
- `'2025-03-15'` → `'2026-09-14'`
- `'2025-03-19'` → `'2026-09-18'`
- `'2025-04-12'` → `'2026-10-12'`
- `'2025-04-16'` → `'2026-10-16'`
- `'2025-02-20'` → `'2026-08-17'`
- `'2025-02-24'` → `'2026-08-21'`

**Note:** These exact patterns may only appear inside `getSampleData()`. Confirm context before replacing to avoid touching any content-area date references (e.g., "2024 final regulations" in curriculum copy — do NOT change those).

## Acceptance Criteria

- [ ] All 15 program pages have `getSampleData()` returning only future dates (post 2026-05-01)
- [ ] On-Demand entries with `startDate: null` are unchanged
- [ ] Curriculum copy dates (e.g., "2024 regulations", "2023 legislation") are NOT changed
- [ ] Pages still load correctly — no JS errors introduced
- [ ] Changes committed in a single PR: `fix: update fallback sample session dates to 2026`
