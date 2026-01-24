# Phase 7: Workflows & Dependencies - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the UI for viewing and managing workflows (grouped tasks) and task dependencies (what blocks what). Includes workflow list page, workflow detail page with task visualization, blocked task treatment, and handling dismissal of tasks that have dependents.

</domain>

<decisions>
## Implementation Decisions

### Workflow list display
- Table rows format (matches task list pattern, not card grid)
- Columns: Name, Status, Progress, Due date — essentials only
- Progress shown as text: "3/5 complete"
- Filter by status (not_started, in_progress, blocked, completed) AND department

### Workflow detail layout
- Tasks shown as ordered list with dependency indentation
- Dependent tasks indented with arrow icon showing what blocks them
- Progress indicator in header area (progress bar or ring alongside workflow title)
- Clicking a task: Claude's discretion on navigation pattern (navigate vs inline vs slide-over)

### Blocked task behavior
- Visual treatment: Claude's discretion (muted opacity + icon, warning border, or badge)
- Enforcement: Claude's discretion but prioritize user experience over build simplicity
  - Soft block with warning is the PRD default (DEP-03)
- Dependency sections: Claude's discretion but show both directions if best for UX
  - Must show "Blocked by" (incomplete dependencies)
  - "Blocking" (what this task blocks) included if valuable for user
- Unblock signal: Claude's discretion but prioritize UX
  - Consider activity log entry or visual indicator when task becomes unblocked

### Dismiss with dependents
- Cascade behavior: Claude's discretion but prioritize UX
  - PRD specifies decision task (DEP-06), so likely that approach
  - Alternative: immediate modal with options
- Decision task options: Claude's discretion
  - Consider: dismiss all / keep open (now unblocked) / reassign dependencies
- Context in decision task: Claude's discretion
  - Consider including dismiss reason and link to parent task
- Assignment: Claude's discretion
  - Consider same as dismissed task owner, or workflow owner if applicable

### Claude's Discretion
- Task navigation pattern from workflow detail (navigate, inline expand, or slide-over)
- Blocked task visual treatment (muted + icon, warning border, or badge)
- Dependency enforcement strictness (soft with warning vs configurable per-workflow)
- Whether to show "Blocking" section in addition to "Blocked by"
- Unblock notification approach (visual highlight, activity log, or none)
- Dismiss cascade UX (decision task vs immediate modal)
- Decision task options and context included
- Decision task assignment logic

**Guiding principle for discretion:** Choose what's best for the user experience, not what's easiest to build. This is a single-user CEO tool — clarity and actionability matter more than simplicity.

</decisions>

<specifics>
## Specific Ideas

- Workflow list should match the visual style of the task list (table with same patterns)
- Indent + arrow pattern for dependencies makes the parent-child relationship clear
- User explicitly requested UX-first decisions, even if more complex to implement

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-workflows-dependencies*
*Context gathered: 2026-01-24*
