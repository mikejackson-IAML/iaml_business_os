# SHRM Approval Tracker

> **CEO Summary:** Tracks SHRM (HR certification) approval status for all programs. Most attendees need SHRM credits for recertification, so missing or expired approvals hurt marketing. Monitors pending submissions, tracks renewals, and alerts before expirations.

## Purpose

Track SHRM (Society for Human Resource Management) approval status for all programs, monitoring pending submissions, tracking approvals, and alerting on expiring certifications. SHRM credits are critical for marketing—most HR professionals need PDCs for recertification.

## Type

Monitor (Automated)

## Trigger

- **Schedule:** Daily at 8:00 AM EST (`0 8 * * *`)
- **Manual:** On-demand via dashboard

---

## Inputs

### Data Sources

**Supabase:**
- `programs` — Program details
- `program_instances` — Scheduled instances
- `certification_approvals` — SHRM approval records
- `certification_submissions` — Pending submissions

**Manual Input:**
- SHRM portal status updates (manual entry from SHRM Learning System)

---

## SHRM Approval Data Model

```sql
CREATE TABLE certification_approvals (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),
  certification_type TEXT DEFAULT 'SHRM',  -- SHRM, HRCI, CLE
  activity_id TEXT,  -- SHRM Activity ID
  credit_hours DECIMAL(4,2),
  credit_type TEXT,  -- PDC (Professional Development Credit)
  approval_date DATE,
  expiration_date DATE,
  status TEXT DEFAULT 'pending',  -- pending, approved, expired, renewal_pending
  submission_date DATE,
  last_verified DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Process

### Step 1: Get All Programs with SHRM Status

```sql
SELECT
  p.id as program_id,
  p.name as program_name,
  p.program_type,
  ca.id as approval_id,
  ca.activity_id,
  ca.credit_hours,
  ca.approval_date,
  ca.expiration_date,
  DATEDIFF(ca.expiration_date, CURRENT_DATE) as days_until_expiration,
  ca.status,
  ca.submission_date,
  (
    SELECT MIN(pi.start_date)
    FROM program_instances pi
    WHERE pi.program_id = p.id
      AND pi.start_date >= CURRENT_DATE
      AND pi.status = 'scheduled'
  ) as next_instance_date
FROM programs p
LEFT JOIN certification_approvals ca ON ca.program_id = p.id
  AND ca.certification_type = 'SHRM'
WHERE p.active = true
ORDER BY next_instance_date NULLS LAST;
```

### Step 2: Categorize Programs by SHRM Status

```javascript
function categorizeSHRMStatus(programs) {
  const categories = {
    approved_current: [],      // Valid approval, not expiring soon
    approved_expiring: [],     // Valid but expiring within 60 days
    expired: [],               // Approval expired
    pending_approval: [],      // Submitted, awaiting approval
    needs_submission: [],      // No approval, needs to be submitted
    renewal_pending: []        // Renewal submitted, awaiting
  };

  for (const program of programs) {
    if (!program.approval_id) {
      // No approval record exists
      if (program.next_instance_date) {
        categories.needs_submission.push(program);
      }
      continue;
    }

    switch (program.status) {
      case 'approved':
        if (program.days_until_expiration <= 0) {
          categories.expired.push(program);
        } else if (program.days_until_expiration <= 60) {
          categories.approved_expiring.push(program);
        } else {
          categories.approved_current.push(program);
        }
        break;

      case 'pending':
        categories.pending_approval.push(program);
        break;

      case 'renewal_pending':
        categories.renewal_pending.push(program);
        break;

      case 'expired':
        categories.expired.push(program);
        break;
    }
  }

  return categories;
}
```

### Step 3: Check for Upcoming Programs Without Approval

```javascript
function checkUpcomingProgramsAtRisk(programs) {
  const atRisk = [];

  for (const program of programs) {
    if (!program.next_instance_date) continue;

    const daysToProgram = daysBetween(new Date(), program.next_instance_date);
    const hasValidApproval = program.status === 'approved' && program.days_until_expiration > 0;

    if (!hasValidApproval) {
      const severity = daysToProgram <= 30 ? 'critical' : daysToProgram <= 45 ? 'warning' : 'info';

      atRisk.push({
        program_id: program.program_id,
        program_name: program.program_name,
        next_instance_date: program.next_instance_date,
        days_to_program: daysToProgram,
        approval_status: program.status || 'none',
        severity,
        issue: program.status === 'pending'
          ? 'Approval pending - may not arrive in time'
          : program.status === 'expired'
            ? 'SHRM approval expired - cannot market PDCs'
            : 'No SHRM approval on file'
      });
    }
  }

  return atRisk.sort((a, b) => a.days_to_program - b.days_to_program);
}
```

### Step 4: Identify Renewals Needed

```javascript
function identifyRenewalsNeeded(categories) {
  const renewalsNeeded = [];

  // Programs expiring within 60 days need renewal submissions
  for (const program of categories.approved_expiring) {
    if (program.days_until_expiration <= 60) {
      renewalsNeeded.push({
        program_id: program.program_id,
        program_name: program.program_name,
        activity_id: program.activity_id,
        expiration_date: program.expiration_date,
        days_until_expiration: program.days_until_expiration,
        urgency: program.days_until_expiration <= 30 ? 'high' : 'medium',
        action: 'Submit renewal to SHRM'
      });
    }
  }

  // Also flag expired that have upcoming instances
  for (const program of categories.expired) {
    if (program.next_instance_date) {
      renewalsNeeded.push({
        program_id: program.program_id,
        program_name: program.program_name,
        activity_id: program.activity_id,
        expiration_date: program.expiration_date,
        days_until_expiration: program.days_until_expiration,
        urgency: 'critical',
        action: 'Renewal overdue - submit immediately'
      });
    }
  }

  return renewalsNeeded.sort((a, b) => a.days_until_expiration - b.days_until_expiration);
}
```

### Step 5: Generate Recommendations

```javascript
function generateRecommendations(atRisk, renewalsNeeded, pendingApprovals) {
  const recommendations = [];

  // Critical: Programs within 30 days without approval
  for (const program of atRisk.filter(p => p.severity === 'critical')) {
    recommendations.push({
      priority: 'critical',
      type: 'approval_missing',
      program: program.program_name,
      action: `URGENT: ${program.program_name} in ${program.days_to_program} days without SHRM approval. ` +
        `Cannot market PDCs. Consider: 1) Rush SHRM submission, 2) Update marketing to remove SHRM credits.`
    });
  }

  // High: Renewals overdue or expiring soon
  for (const renewal of renewalsNeeded.filter(r => r.urgency === 'critical' || r.urgency === 'high')) {
    recommendations.push({
      priority: renewal.urgency === 'critical' ? 'critical' : 'high',
      type: 'renewal_needed',
      program: renewal.program_name,
      action: `Submit SHRM renewal for ${renewal.program_name}. ` +
        `${renewal.days_until_expiration <= 0 ? 'Already expired!' : `Expires in ${renewal.days_until_expiration} days.`}`
    });
  }

  // Medium: Pending approvals taking too long
  for (const pending of pendingApprovals) {
    const daysPending = daysSince(pending.submission_date);
    if (daysPending > 45) {
      recommendations.push({
        priority: 'medium',
        type: 'pending_follow_up',
        program: pending.program_name,
        action: `Follow up on SHRM submission for ${pending.program_name}. ` +
          `Submitted ${daysPending} days ago (typical turnaround: 30-45 days).`
      });
    }
  }

  return recommendations;
}
```

### Step 6: Aggregate and Store

```javascript
function aggregateSHRMMetrics(categories, atRisk, renewalsNeeded) {
  const totalPrograms = Object.values(categories).flat().length;

  return {
    summary: {
      total_programs_tracked: totalPrograms,
      approved_current: categories.approved_current.length,
      approved_expiring: categories.approved_expiring.length,
      pending_approval: categories.pending_approval.length,
      expired: categories.expired.length,
      needs_submission: categories.needs_submission.length,
      renewal_pending: categories.renewal_pending.length
    },
    compliance_rate: Math.round(
      ((categories.approved_current.length + categories.approved_expiring.length) / totalPrograms) * 100
    ),
    at_risk_count: atRisk.length,
    critical_count: atRisk.filter(p => p.severity === 'critical').length,
    renewals_needed: renewalsNeeded.length,
    at_risk_programs: atRisk,
    renewals_due: renewalsNeeded
  };
}
```

---

## Outputs

### To Dashboard

```json
{
  "shrm_summary": {
    "total_programs": 40,
    "approved_current": 35,
    "approved_expiring": 3,
    "pending_approval": 1,
    "expired": 0,
    "needs_submission": 1,
    "compliance_rate": 95
  },
  "at_risk_programs": [
    {
      "program_name": "Advanced ERISA",
      "next_instance_date": "2025-03-03",
      "days_to_program": 53,
      "approval_status": "pending",
      "severity": "info",
      "issue": "Approval pending - expected before program"
    }
  ],
  "renewals_needed": [
    {
      "program_name": "Certificate in Employee Relations Law",
      "expiration_date": "2025-02-15",
      "days_until_expiration": 37,
      "urgency": "medium"
    },
    {
      "program_name": "FMLA/ADA Compliance",
      "expiration_date": "2025-02-28",
      "days_until_expiration": 50,
      "urgency": "medium"
    }
  ],
  "upcoming_expirations": [
    { "program": "Employee Relations Law", "expires": "2025-02-15" },
    { "program": "FMLA/ADA Compliance", "expires": "2025-02-28" }
  ]
}
```

### To Supabase

Table: `shrm_status_snapshots`
| Column | Type | Description |
|--------|------|-------------|
| `snapshot_date` | date | Date of snapshot |
| `program_id` | uuid | Program ID |
| `status` | text | Current SHRM status |
| `days_until_expiration` | integer | Days to expiration |
| `has_upcoming_instance` | boolean | Instance scheduled |
| `at_risk` | boolean | At-risk flag |

Table: `certification_alerts`
| Column | Type | Description |
|--------|------|-------------|
| `created_at` | timestamp | Alert timestamp |
| `program_id` | uuid | Program ID |
| `alert_type` | text | expiring/expired/pending_long/missing |
| `severity` | text | critical/warning/info |
| `message` | text | Alert message |
| `action_needed` | text | Recommended action |
| `resolved` | boolean | Issue resolved |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Expiring within 30 days | Warning | Dashboard notification |
| Expired with upcoming program | Critical | Email + Dashboard |
| Pending >45 days | Warning | Follow-up reminder |
| Program <30 days out without approval | Critical | Immediate escalation |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Days until expiration | 60 days | 30 days |
| Days pending approval | 45 days | 60 days |
| Program days out without approval | 45 days | 30 days |

---

## Integration Requirements

### APIs Needed
- Supabase (certification data)

### Manual Integrations
- SHRM Learning System (manual status updates)

### Credentials
- `SUPABASE_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Schedule (8 AM daily)
    |
    v
Supabase: Get all programs with SHRM status
    |
    v
Function: Categorize by status
    |
    v
Function: Check upcoming programs at risk
    |
    v
Function: Identify renewals needed
    |
    v
Function: Generate recommendations
    |
    v
Supabase: Store snapshots
    |
    v
IF: Any critical issues?
    |
    +-- Yes --> Send alerts
    |
    +-- No --> Update dashboard
    |
    v
Complete
```

**Estimated Runtime:** 2-4 minutes

---

## Reporting Format

```
┌─────────────────────────────────────────────────────────────┐
│ SHRM APPROVAL TRACKER - 2025-01-09                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ SUMMARY                                                      │
│ Total Programs: 40      Compliance Rate: 95%                │
│                                                              │
│ STATUS BREAKDOWN                                             │
│ ✅ Approved (current):    35                                │
│ ⚠️ Expiring soon (<60d):   3                                │
│ ⏳ Pending approval:        1                                │
│ ❌ Expired:                 0                                │
│ 📝 Needs submission:        1                                │
│                                                              │
│ 🔔 RENEWALS NEEDED                                          │
│ ───────────────────────────────────────────────────────────│
│ 1. Certificate in Employee Relations Law                    │
│    Expires: Feb 15, 2025 (37 days)                         │
│    Activity ID: 25-ABCDE                                   │
│    Action: Submit renewal by Jan 20                        │
│                                                              │
│ 2. FMLA/ADA Compliance                                      │
│    Expires: Feb 28, 2025 (50 days)                         │
│    Activity ID: 25-FGHIJ                                   │
│    Action: Submit renewal by Feb 1                         │
│                                                              │
│ ⚠️ PROGRAMS AT RISK                                         │
│ ───────────────────────────────────────────────────────────│
│ Advanced ERISA (Mar 3) - Pending approval                  │
│   Submitted: Dec 15 | Expected: Jan 15-30                  │
│   Status: On track, monitor weekly                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] SHRM portal manual process documented
- [ ] Initial testing complete
- [ ] Production deployment
