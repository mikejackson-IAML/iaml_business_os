# Phase 6: Program Status & Alerts - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Display GO/CLOSE/NEEDS program status badges and logistics readiness with alert thresholds. Users see at-a-glance which programs need attention based on registration counts and logistics completion. Dashboard display only — no push notifications or external integrations in this phase.

</domain>

<decisions>
## Implementation Decisions

### Status Badge Display
- Badges appear on BOTH programs list AND program detail page header
- Traffic light colors: GO=green, CLOSE=yellow, NEEDS=red
- Badge content includes count: "GO (8)" or "NEEDS (2)"
- Registration count always visible in badge

### Alert Urgency Tiers
- Visual distinction: Warning=yellow/triangle icon, Critical=red/exclamation icon
- Alerts visible on BOTH list (count badge) and detail (full breakdown)
- List shows count badge: "⚠️ 3" or "❌ 2" for warnings/criticals
- Dashboard display only — no push/email notifications for v1
- Once critical, stays critical until resolved (no aging/escalation)
- Payment alerts roll up to program level ("3 unpaid") not individual alerts
- Thresholds from requirements are FIXED for v1 (not configurable)

### Logistics Readiness Format
- Display format: "8/10 - 2 warnings" (fraction with warning count)
- Dynamic denominator: in-person shows X/10, virtual shows X/6
- Status summary appears in program header area, full details in Logistics tab

### Edge States
- No alerts: Hide alert area entirely (clean display, no visual noise)
- Archived/completed programs: No badges shown
- On-demand programs: Skip status/logistics entirely (N/A pattern)

### Claude's Discretion
- Tooltip behavior on badge hover (whether to show breakdown)
- Alert dismissal/snooze capability (if any)
- Click behavior on logistics readiness (navigate vs popover)
- New programs with no logistics data (0/N vs "Not started")

</decisions>

<specifics>
## Specific Ideas

- Traffic light metaphor is intentional — intuitive at-a-glance without learning curve
- Count in badge prevents needing to click to see registration numbers
- Fraction format ("8/10") is more informative than percentage

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-program-status-alerts*
*Context gathered: 2026-02-02*
