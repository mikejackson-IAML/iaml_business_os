# Faculty Availability Tracker

> **CEO Summary:** Tracks which faculty members are assigned and confirmed for upcoming programs. Identifies gaps where programs don't have instructors and flags unconfirmed faculty assignments. Answers: "Do all programs have confirmed faculty?"

## Purpose

Monitor faculty confirmations across all upcoming programs, identifying gaps where programs don't have confirmed instructors and tracking the overall faculty fill rate. This enables proactive intervention before faculty gaps become critical.

## Type

Monitor (Automated)

## Trigger

- **Schedule:** Daily at 7:00 AM EST (`0 7 * * *`)
- **Manual:** On-demand via dashboard

---

## Inputs

### Data Sources

**Supabase:**
- `program_instances` — Upcoming programs with dates
- `programs` — Program details including faculty requirements
- `faculty_assignments` — Current faculty assignments
- `faculty` — Faculty profiles and availability
- `faculty_availability` — Blocked dates, preferences

---

## Process

### Step 1: Get All Upcoming Programs with Faculty Requirements

```sql
SELECT
  pi.id as instance_id,
  p.id as program_id,
  p.name as program_name,
  p.program_type,
  p.faculty_slots_required,
  pi.start_date,
  pi.end_date,
  DATEDIFF(pi.start_date, CURRENT_DATE) as days_until_start,
  pi.format,
  pi.location
FROM program_instances pi
JOIN programs p ON pi.program_id = p.id
WHERE pi.start_date >= CURRENT_DATE
  AND pi.start_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)
  AND pi.status = 'scheduled'
ORDER BY pi.start_date;
```

### Step 2: Get Faculty Assignments for Each Program

```sql
SELECT
  fa.id as assignment_id,
  fa.instance_id,
  fa.faculty_id,
  f.first_name,
  f.last_name,
  f.email,
  fa.role,
  fa.session_ids,
  fa.confirmed,
  fa.confirmed_date,
  fa.created_at as assigned_date
FROM faculty_assignments fa
JOIN faculty f ON fa.faculty_id = f.id
WHERE fa.instance_id IN (/* upcoming instance IDs */)
  AND fa.status = 'active'
ORDER BY fa.instance_id, fa.role;
```

### Step 3: Calculate Faculty Status per Program

```javascript
function calculateFacultyStatus(instance, assignments) {
  const required = instance.faculty_slots_required;
  const assigned = assignments.length;
  const confirmed = assignments.filter(a => a.confirmed).length;
  const unconfirmed = assigned - confirmed;
  const gaps = Math.max(0, required - assigned);

  return {
    instance_id: instance.instance_id,
    program_name: instance.program_name,
    start_date: instance.start_date,
    days_until_start: instance.days_until_start,
    faculty_required: required,
    faculty_assigned: assigned,
    faculty_confirmed: confirmed,
    faculty_unconfirmed: unconfirmed,
    faculty_gaps: gaps,
    fill_rate: Math.round((assigned / required) * 100),
    confirmation_rate: assigned > 0 ? Math.round((confirmed / assigned) * 100) : 0,
    status: determineFacultyStatus(instance.days_until_start, gaps, unconfirmed),
    assignments: assignments.map(a => ({
      faculty_id: a.faculty_id,
      name: `${a.first_name} ${a.last_name}`,
      role: a.role,
      confirmed: a.confirmed,
      days_since_assigned: daysSince(a.assigned_date)
    }))
  };
}

function determineFacultyStatus(daysOut, gaps, unconfirmed) {
  // Critical: Gap exists or unconfirmed with < 30 days
  if (gaps > 0 && daysOut <= 30) return 'critical';
  if (unconfirmed > 0 && daysOut <= 14) return 'critical';

  // Warning: Gap exists or unconfirmed with < 60 days
  if (gaps > 0 && daysOut <= 60) return 'warning';
  if (unconfirmed > 0 && daysOut <= 30) return 'warning';

  // Needs attention: Any gaps or unconfirmed
  if (gaps > 0 || unconfirmed > 0) return 'attention';

  return 'good';
}
```

### Step 4: Identify Specific Gaps and Issues

```javascript
function identifyFacultyIssues(programsWithStatus) {
  const issues = [];

  for (const program of programsWithStatus) {
    // Gap issues
    if (program.faculty_gaps > 0) {
      issues.push({
        type: 'faculty_gap',
        instance_id: program.instance_id,
        program_name: program.program_name,
        start_date: program.start_date,
        days_until_start: program.days_until_start,
        severity: program.days_until_start <= 30 ? 'critical' : 'warning',
        message: `${program.faculty_gaps} faculty slot(s) unfilled`,
        action_needed: 'Assign faculty immediately'
      });
    }

    // Unconfirmed issues
    const unconfirmedFaculty = program.assignments.filter(a => !a.confirmed);
    if (unconfirmedFaculty.length > 0) {
      for (const faculty of unconfirmedFaculty) {
        const severity = getSeverity(program.days_until_start, faculty.days_since_assigned);
        issues.push({
          type: 'unconfirmed_faculty',
          instance_id: program.instance_id,
          program_name: program.program_name,
          start_date: program.start_date,
          days_until_start: program.days_until_start,
          faculty_name: faculty.name,
          faculty_id: faculty.faculty_id,
          days_since_assigned: faculty.days_since_assigned,
          severity,
          message: `${faculty.name} not confirmed (assigned ${faculty.days_since_assigned} days ago)`,
          action_needed: severity === 'critical'
            ? 'Contact faculty immediately or find replacement'
            : 'Send confirmation reminder'
        });
      }
    }
  }

  return issues.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity] || a.days_until_start - b.days_until_start;
  });
}

function getSeverity(daysUntilProgram, daysSinceAssigned) {
  if (daysUntilProgram <= 14) return 'critical';
  if (daysUntilProgram <= 30 && daysSinceAssigned >= 14) return 'critical';
  if (daysUntilProgram <= 45 && daysSinceAssigned >= 21) return 'warning';
  return 'info';
}
```

### Step 5: Aggregate Department Metrics

```javascript
function aggregateFacultyMetrics(programsWithStatus) {
  const metrics = {
    total_programs: programsWithStatus.length,
    total_slots_required: 0,
    total_assigned: 0,
    total_confirmed: 0,
    programs_fully_staffed: 0,
    programs_with_gaps: 0,
    programs_with_unconfirmed: 0,
    critical_issues: 0,
    warning_issues: 0
  };

  for (const program of programsWithStatus) {
    metrics.total_slots_required += program.faculty_required;
    metrics.total_assigned += program.faculty_assigned;
    metrics.total_confirmed += program.faculty_confirmed;

    if (program.faculty_gaps === 0 && program.faculty_unconfirmed === 0) {
      metrics.programs_fully_staffed++;
    }
    if (program.faculty_gaps > 0) {
      metrics.programs_with_gaps++;
    }
    if (program.faculty_unconfirmed > 0) {
      metrics.programs_with_unconfirmed++;
    }
    if (program.status === 'critical') metrics.critical_issues++;
    if (program.status === 'warning') metrics.warning_issues++;
  }

  metrics.overall_fill_rate = Math.round((metrics.total_assigned / metrics.total_slots_required) * 100);
  metrics.overall_confirmation_rate = Math.round((metrics.total_confirmed / metrics.total_assigned) * 100);

  return metrics;
}
```

---

## Outputs

### To Dashboard

```json
{
  "faculty_summary": {
    "total_programs": 70,
    "overall_fill_rate": 97,
    "overall_confirmation_rate": 95,
    "programs_fully_staffed": 62,
    "programs_with_gaps": 3,
    "programs_with_unconfirmed": 5,
    "critical_issues": 2,
    "warning_issues": 4
  },
  "faculty_gaps": [
    {
      "program_name": "Strategic HR Leadership",
      "start_date": "2025-02-10",
      "days_until_start": 32,
      "slots_needed": 1,
      "severity": "warning",
      "message": "Need 1 faculty for Day 3"
    },
    {
      "program_name": "Benefits Law Boot Camp",
      "start_date": "2025-02-17",
      "days_until_start": 39,
      "slots_needed": 1,
      "severity": "warning",
      "message": "Need 1 faculty for Day 2"
    }
  ],
  "unconfirmed_faculty": [
    {
      "faculty_name": "Sarah Johnson",
      "program_name": "FMLA/ADA Compliance",
      "start_date": "2025-02-03",
      "days_until_start": 25,
      "days_since_assigned": 18,
      "severity": "warning"
    }
  ]
}
```

### To Supabase

Table: `faculty_status_snapshots`
| Column | Type | Description |
|--------|------|-------------|
| `snapshot_date` | date | Date of snapshot |
| `instance_id` | uuid | Program instance ID |
| `faculty_required` | integer | Slots needed |
| `faculty_assigned` | integer | Slots filled |
| `faculty_confirmed` | integer | Confirmed count |
| `fill_rate` | decimal | Assignment rate |
| `confirmation_rate` | decimal | Confirmation rate |
| `status` | text | good/attention/warning/critical |

Table: `faculty_issues`
| Column | Type | Description |
|--------|------|-------------|
| `created_at` | timestamp | When identified |
| `instance_id` | uuid | Program instance ID |
| `faculty_id` | uuid | Faculty ID (if applicable) |
| `issue_type` | text | gap/unconfirmed |
| `severity` | text | critical/warning/info |
| `message` | text | Description |
| `resolved` | boolean | Issue resolved |
| `resolved_at` | timestamp | When resolved |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Any gap at T-30 | Warning | Dashboard notification |
| Any gap at T-14 | Critical | Email + Dashboard |
| Unconfirmed at T-14 | Critical | Email + Dashboard |
| Fill rate <90% | Warning | Dashboard notification |
| Confirmation rate <80% | Warning | Dashboard notification |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Days to confirm (from assignment) | 14 days | 21 days |
| Days out with gap | 45 days | 30 days |
| Days out with unconfirmed | 30 days | 14 days |
| Fill rate | <95% | <90% |
| Confirmation rate | <90% | <80% |

---

## Integration Requirements

### APIs Needed
- Supabase (faculty data, assignments, programs)

### Credentials
- `SUPABASE_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Schedule (7 AM daily)
    |
    v
Supabase: Get upcoming programs (90 days)
    |
    v
Supabase: Get all faculty assignments
    |
    v
Function: Calculate status for each program
    |
    v
Function: Identify gaps and issues
    |
    v
Function: Aggregate department metrics
    |
    v
Supabase: Store snapshots and issues
    |
    v
IF: Any critical issues?
    |
    +-- Yes --> Send alerts
    |
    +-- No --> Complete
    |
    v
Update dashboard
```

**Estimated Runtime:** 2-5 minutes

---

## Reporting Format

```
┌─────────────────────────────────────────────────────────────┐
│ FACULTY STATUS REPORT - 2025-01-09                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ OVERALL STATUS                                               │
│ Fill Rate: 97%        Confirmation Rate: 95%                │
│ Programs: 70          Fully Staffed: 62                     │
│                                                              │
│ ⚠️ FACULTY GAPS (3 programs)                                │
│ ───────────────────────────────────────────────────────────│
│ Strategic HR Leadership (Feb 10) - 1 slot open - Day 3     │
│ Benefits Law Boot Camp (Feb 17) - 1 slot open - Day 2      │
│ Advanced ERISA (Mar 3) - 1 slot open - Day 1               │
│                                                              │
│ ⚠️ UNCONFIRMED FACULTY (5 assignments)                      │
│ ───────────────────────────────────────────────────────────│
│ Sarah Johnson - FMLA/ADA (Feb 3) - 18 days pending         │
│ Michael Brown - Strategic HR (Feb 10) - 12 days pending    │
│ Jennifer Lee - Benefits Law (Feb 17) - 8 days pending      │
│ Robert Chen - Employee Relations (Jan 27) - 5 days pending │
│ Lisa Martinez - Labor Relations (Feb 24) - 3 days pending  │
│                                                              │
│ ACTION NEEDED                                                │
│ 1. Fill Strategic HR Day 3 slot by Jan 20                  │
│2. Follow up with Sarah Johnson (FMLA/ADA)                 │
│ 3. Follow up with Michael Brown (Strategic HR)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
