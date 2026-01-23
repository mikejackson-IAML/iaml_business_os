# Phase 4: Task UI - List - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Task list page with table view, filtering, and saved views. Users can browse tasks, apply filters, and click to expand task details inline. Navigation to task detail page and task creation are separate phases.

</domain>

<decisions>
## Implementation Decisions

### List layout
- Table layout (rows with columns), like Linear or Jira
- 5 essential columns: Priority icon, Title, Due date, Department, Source
- Priority displayed as color dot + text (🔴 Critical, 🟠 High, ⚪ Normal, 🔵 Low)
- Clicking a task row expands it inline (shows details without navigation)

### Filter experience
- Filters in horizontal toolbar above table
- Individual filters use dropdown menus
- Multi-select enabled (can pick status: open + in_progress)
- Active filters shown as removable chips below toolbar
- "Clear all" action to reset filters

### Default views
- Views appear as horizontal tabs above the filter toolbar
- Tab order: All | My Focus | Overdue | Waiting | Approvals | AI Suggested
- Clicking a tab resets manual filters and applies the preset
- My Focus = Critical + High priority + Due today
- Default landing view is My Focus
- My Focus empty state guides to next action: "All caught up! Review upcoming tasks?"

### Empty and loading states
- Loading: skeleton rows (gray pulsing placeholders showing table structure)
- No results from filter: "No tasks match your filters" + Clear Filters button
- API error: inline error message with Retry button in table area

### Claude's Discretion
- Exact skeleton row animation and styling
- Number of skeleton rows to show during load
- Mobile responsive behavior (table collapse strategy)
- Specific wording for empty state messages
- Search debounce timing

</decisions>

<specifics>
## Specific Ideas

- Table follows existing website patterns (vanilla JS, CSS variables, no framework)
- Use existing design tokens from website CSS (--space-*, --gray-*, etc.)
- Row expand pattern should feel smooth — show/hide with transition
- Priority colors should match severity colors used elsewhere (red for critical, orange for high)

</specifics>

<deferred>
## Deferred Ideas

- Error monitoring dashboard in Digital Department — centralized place to track workflow uptimes and API failures (mentioned during error handling discussion)
- Task detail as separate page (user chose inline expand instead)
- Sidebar filter layout (user chose toolbar)

</deferred>

---

*Phase: 04-task-ui-list*
*Context gathered: 2026-01-22*
