-- Seed sample task rules for Action Center
-- Date: 2026-02-02

-- ============================================
-- RECURRING TASK RULES
-- ============================================
INSERT INTO action_center.task_rules (
  name, description, rule_type, is_enabled,
  schedule_type, schedule_config,
  task_template, dedupe_key_template, department
) VALUES
  -- Weekly Planning
  (
    'Weekly Planning Session',
    'Creates a weekly planning task every Sunday evening',
    'recurring',
    TRUE,
    'weekly',
    '{"day_of_week": 0, "hour": 19, "minute": 0}'::JSONB,
    '{"title": "Plan This Week''s Priorities", "description": "Review goals, schedule key tasks, identify blockers", "priority": "high", "task_type": "review"}'::JSONB,
    'weekly_planning:{{week_key}}',
    'Operations'
  ),
  -- Daily Standup Prep
  (
    'Daily Standup Prep',
    'Creates a morning task to prepare for standup',
    'recurring',
    TRUE,
    'daily',
    '{"hour": 8, "minute": 30, "weekdays_only": true}'::JSONB,
    '{"title": "Prepare for Daily Standup", "description": "Review yesterday''s progress, identify today''s focus, note any blockers", "priority": "normal", "task_type": "standard"}'::JSONB,
    'standup_prep:{{date}}',
    'Operations'
  ),
  -- Monthly Review
  (
    'Monthly Business Review',
    'Creates monthly review task on the first of each month',
    'recurring',
    TRUE,
    'monthly',
    '{"day_of_month": 1, "hour": 9, "minute": 0}'::JSONB,
    '{"title": "Monthly Business Review", "description": "Review KPIs, revenue, pipeline health, and team capacity", "priority": "high", "task_type": "review"}'::JSONB,
    'monthly_review:{{month_key}}',
    'Operations'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- CONDITION-BASED TASK RULES
-- ============================================
INSERT INTO action_center.task_rules (
  name, description, rule_type, is_enabled,
  condition_query,
  task_template, dedupe_key_template, department
) VALUES
  -- Overdue Invoices
  (
    'Overdue Invoice Follow-up',
    'Creates tasks for invoices overdue more than 7 days',
    'condition',
    FALSE,  -- Disabled until invoices table exists
    'SELECT id, invoice_number, customer_name, amount_due, days_overdue FROM invoices WHERE status = ''unpaid'' AND due_date < CURRENT_DATE - INTERVAL ''7 days''',
    '{"title": "Follow up on overdue invoice {{invoice_number}}", "description": "Customer: {{customer_name}}\nAmount: ${{amount_due}}\nDays overdue: {{days_overdue}}", "priority": "high", "task_type": "standard"}'::JSONB,
    'overdue_invoice:{{id}}',
    'Operations'
  ),
  -- Stale Leads
  (
    'Stale Lead Outreach',
    'Creates tasks for leads with no activity in 14+ days',
    'condition',
    FALSE,  -- Disabled until leads tracking exists
    'SELECT id, first_name, last_name, email, company, days_since_contact FROM leads WHERE last_contacted_at < CURRENT_DATE - INTERVAL ''14 days'' AND status = ''active''',
    '{"title": "Re-engage stale lead: {{first_name}} {{last_name}}", "description": "Company: {{company}}\nEmail: {{email}}\nDays since contact: {{days_since_contact}}", "priority": "normal", "task_type": "standard"}'::JSONB,
    'stale_lead:{{id}}',
    'Marketing'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE action_center.task_rules IS
  'Rules for automatic task creation - recurring schedules and condition-based triggers';
