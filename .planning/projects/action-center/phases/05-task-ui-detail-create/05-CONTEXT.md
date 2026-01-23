# Phase 5: Task UI - Detail & Create - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the task detail page showing all task attributes with actions, plus a create task modal. Includes approval task UI with Approve/Modify/Reject flow. Dependencies display and comments/activity are in scope. Workflow management UI and SOP editing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Page Structure
- Full page for task detail (navigate to `/action-center/tasks/:id`)
- Back button returns to list
- Two-column layout: left = task content/instructions/description, right = metadata sidebar (status, priority, dates, assignee, workflow)

### Comments & Activity
- Tabs below main content: "Comments" tab and "Activity" tab
- Keeps them separate, user switches between views

### Workflow Context
- When task belongs to workflow: show workflow name, progress bar (X/Y complete), and collapsible list of other tasks in the workflow
- Full context available without navigating away

### Primary Actions
- Action buttons (Complete, Dismiss, Start Working) in top page header at right
- Always visible regardless of scroll position

### Status Change
- Both: dropdown in sidebar for direct status changes, plus action buttons for common transitions
- Flexible for different user preferences

### Complete Action
- Click Complete → optional completion note dialog → done
- Note is nice-to-have, not required
- Fast path available when documentation isn't needed

### Dismiss Action
- Click Dismiss → required dropdown reason (no longer relevant, duplicate, will not do) + optional free-text notes → done
- Structured data from dropdown enables reporting, optional text captures context

### Approval Tasks - Display
- Highlighted recommendation box (yellow/blue callout) at top showing recommendation and reasoning
- Clearly distinguished from task description
- Ensures decision-makers see recommendation before acting

### Approval Tasks - Actions
- Claude's Discretion: Modify & Approve flow (modal vs inline)
- Claude's Discretion: Reject flow (required vs optional reason)
- Claude's Discretion: Whether to replace Complete/Dismiss with approval-specific buttons or show approval buttons conditionally

### Create Task
- Claude's Discretion: Modal from list page vs full create page
- Balanced field display: show all fields upfront, but only title required
- Power users fill what they need, fast path for simple tasks
- Claude's Discretion: Quick create options (keyboard shortcut, inline add)

### After Create
- Stay on list page after creating task
- Modal closes, new task appears in list (optionally highlight briefly)
- Supports workflow of creating multiple tasks in a row

### Claude's Discretion
- Modify & Approve UI pattern (modal vs inline expansion)
- Reject reason requirement (required vs optional)
- Approval button strategy (replace vs conditional display)
- Create task trigger (modal vs page)
- Quick create features (keyboard shortcut, inline add)

</decisions>

<specifics>
## Specific Ideas

- Two-column layout with metadata sidebar is similar to Linear issue view or GitHub PR page
- Recommendation callout for approvals should feel like a system suggestion, not user content
- Collapsible workflow task list allows context without overwhelming

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-task-ui-detail-create*
*Context gathered: 2026-01-23*
