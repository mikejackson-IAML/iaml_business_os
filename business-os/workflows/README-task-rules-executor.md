# Task Rules Executor Workflows

> **CEO Summary:** Two automated workflows that create tasks on schedule - one for recurring tasks (daily/weekly/monthly) and one for condition-based tasks that check database queries.

## Overview

These workflows execute task rules from the Action Center to automatically create tasks:

1. **Recurring Rules Executor** - Creates tasks for rules that run on a schedule (daily standup, weekly review, monthly reports)
2. **Condition Rules Executor** - Creates tasks when database conditions are met (overdue invoices, stale leads)

## Trigger

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| Recurring Rules | Daily 7:00 AM CT | Execute all active recurring rules |
| Condition Rules | Daily 7:05 AM CT | Execute all active condition rules |

## Data Flow

### Recurring Rules
1. Schedule trigger fires at 7am CT
2. Call `/api/action-center/execute-rules` with `rule_type: "recurring"`
3. API fetches all active recurring rules
4. For each rule, create task with dedupe key `{rule_id}:{date}`
5. Return summary of created tasks

### Condition Rules
1. Schedule trigger fires at 7:05am CT
2. Call `/api/action-center/execute-rules` with `rule_type: "condition"`
3. API fetches all active condition rules
4. For each rule, execute its `condition_query` SQL
5. For each result row, create task with dedupe key from row data
6. Return summary of created tasks

## Deduplication

- **Recurring rules**: Include date in dedupe key, so same rule creates one task per day
- **Condition rules**: Include entity ID from query results, so same entity doesn't create duplicate tasks

## Error Handling

- If any rule fails, error is logged and next rule continues
- If errors occur, Slack alert sent to #alerts
- Individual task creation failures don't stop other tasks

## Integrations

| Service | Purpose |
|---------|---------|
| Dashboard API | Execute rules endpoint |
| Supabase | Task storage, condition queries |
| Slack | Error notifications |

## Related

- Task Rules API: `/api/action-center/task-rules`
- Execute Rules API: `/api/action-center/execute-rules`
- Action Center: `/dashboard/action-center`

---

*Workflow created: 2026-01-25*
