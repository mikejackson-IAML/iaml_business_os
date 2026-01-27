# UPDATE: CLE Approval Monitor - Table Created, Query Fix Needed

**Date:** 2026-01-27
**Workflow ID:** 8TBH2O0GuYghWTaZ
**Status:** NEEDS_REVIEW
**Session:** session-k7x2

---

## What Was Done

### 1. Created Missing Table

Migration `20260134_create_program_cle_approvals.sql` was created and applied:

```sql
CREATE TABLE program_cle_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  state_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'not_required', 'pending', 'submitted', 'approved', 'denied', 'expired'
  )),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  credits_requested NUMERIC(4,2),
  credits_approved NUMERIC(4,2),
  approval_number TEXT,
  notes TEXT,
  denial_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, state)
);
```

**Table verified working** - Insert/select/delete all functional.

### 2. Discovered Additional Issue

The workflow's SQL query references a column that doesn't exist:
- **Query uses:** `programs.planned_start_date`
- **Column exists in:** `program_instances.start_date`

---

## Remaining Fix Required

Open the workflow in n8n: https://n8n.realtyamp.ai/workflow/8TBH2O0GuYghWTaZ

Update the **"Get CLE Status"** Postgres node query to:

```sql
SELECT
  p.name as program_name,
  pi.start_date as planned_start_date,
  (pi.start_date - CURRENT_DATE) as days_until,
  c.state,
  c.status,
  c.submitted_at,
  c.approved_at,
  c.credits_approved
FROM programs p
JOIN program_instances pi ON pi.program_name = p.name
LEFT JOIN program_cle_approvals c ON c.program_id = p.id
WHERE pi.start_date > CURRENT_DATE
  AND pi.start_date < CURRENT_DATE + INTERVAL '90 days'
ORDER BY pi.start_date, c.state;
```

**Key changes:**
1. Added `JOIN program_instances pi ON pi.program_name = p.name`
2. Changed `p.planned_start_date` to `pi.start_date`
3. Updated WHERE clause to use `pi.start_date`
4. Updated ORDER BY to use `pi.start_date`

---

## After Fix

Once the query is updated in n8n:
1. Run the workflow manually to test
2. If successful, mark as verified:
   ```sql
   SELECT n8n_brain.mark_workflow_tested(
     '8TBH2O0GuYghWTaZ',
     'verified',
     'manual',
     'Table created, query fixed to use program_instances'
   );
   ```

---

## Files Created

- Migration: `supabase/migrations/20260134_create_program_cle_approvals.sql`
- This escalation: `.planning/workflow-tests/escalations/2026-01-27/8TBH2O0GuYghWTaZ-update.md`
