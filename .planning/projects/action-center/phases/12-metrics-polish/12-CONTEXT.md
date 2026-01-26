# Phase 12: Metrics & Polish - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Stats, reporting, and edge case handling for the Action Center. Personal completion metrics, system/department aggregations, health score integration, and robust handling of edge cases (deleted entities, chain dismissals, overdue tasks, task reopening).

</domain>

<decisions>
## Implementation Decisions

### Personal Stats
- Completion-focused metrics: tasks completed today/week, completion rate, streak-style tracking
- Display in both places: dashboard widget + banner at top of task list
- Weekly goal system: user can set a weekly target, show progress toward it (gamification element)

### Metrics Aggregation
- Access control: department heads see their department metrics, admins see system-wide
- Metrics: Claude's discretion on specific metrics, prioritizing actionable task health data

### Health Score Integration
- Integration approach: Claude's discretion on whether direct component vs alert-based vs both
- Negative signals: Claude's discretion on what conditions hurt scores
- Scope: Claude's discretion on which departments
- Update frequency: Claude's discretion based on performance tradeoffs

### Edge Case Behaviors
- Deleted entity handling: Claude's discretion (safest approach)
- Chain dismissal: Claude's discretion based on existing implementation
- Overdue escalation: Claude's discretion on appropriate escalation
- Task reopening: Claude's discretion on sensible UX

### Claude's Discretion
- Time ranges for completion metrics (today + week vs rolling windows)
- Specific department/system metrics to show
- Whether metrics have drill-down capability (click to filter)
- Where system/department metrics live (dashboard vs dedicated page vs both)
- Health score formula weights and update timing
- Edge case implementation details across all four scenarios

</decisions>

<specifics>
## Specific Ideas

- Weekly goal is the preferred gamification approach (not daily streaks)
- Personal stats appear in BOTH places — dashboard widget AND task list page banner
- Metrics access is role-based: regular users see personal, dept heads see department, admins see system

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-metrics-polish*
*Context gathered: 2026-01-26*
