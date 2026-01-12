# Readiness Monitor

## Purpose

Track all upcoming program instances against the 10-point readiness checklist, calculating readiness scores and surfacing programs that need attention. This is the CORE monitor for the Programs department—it provides real-time visibility into delivery readiness.

## Type

Monitor (Automated)

## Trigger

- **Schedule:** Every 2 hours (`0 */2 * * *`)
- **Manual:** On-demand via dashboard

---

## Inputs

### Data Sources

**Supabase:**
- `program_instances` — All upcoming program instances with dates, locations
- `readiness_checklist` — Status of each checklist item per instance
- `faculty_assignments` — Faculty confirmation status
- `venue_contracts` — Venue confirmation status
- `materials_orders` — Materials ordering and delivery status
- `certification_approvals` — SHRM/CLE approval status
- `registrations` — Enrollment counts

**Airtable (legacy):**
- Program sessions data (during migration)

---

## Readiness Checklist Items

| # | Item | Field | Source |
|---|------|-------|--------|
| 1 | Faculty Confirmed | `faculty_confirmed` | faculty_assignments |
| 2 | Faculty Brief Sent | `faculty_brief_sent` | communications_log |
| 3 | Venue Confirmed | `venue_confirmed` | venue_contracts |
| 4 | Materials Ordered | `materials_ordered` | materials_orders |
| 5 | Materials Received | `materials_received` | materials_orders |
| 6 | SHRM Approved | `shrm_approved` | certification_approvals |
| 7 | AV Ordered | `av_ordered` | equipment_orders |
| 8 | Catering Confirmed | `catering_confirmed` | venue_logistics |
| 9 | Room Block Active | `room_block_active` | room_blocks |
| 10 | Registration Page Live | `reg_page_live` | website_pages |

---

## Process

### Step 1: Gather Program Instances

```sql
SELECT
  pi.*,
  p.name as program_name,
  p.program_type,
  v.name as venue_name,
  v.city,
  DATEDIFF(pi.start_date, CURRENT_DATE) as days_until_start
FROM program_instances pi
JOIN programs p ON pi.program_id = p.id
LEFT JOIN venues v ON pi.venue_id = v.id
WHERE pi.start_date >= CURRENT_DATE
  AND pi.start_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)
  AND pi.status = 'scheduled'
ORDER BY pi.start_date;
```

### Step 2: Gather Checklist Status for Each Instance

For each program instance, query the status of all 10 checklist items:

```javascript
async function getChecklistStatus(instanceId) {
  const checklist = {
    faculty_confirmed: await checkFacultyConfirmed(instanceId),
    faculty_brief_sent: await checkFacultyBriefSent(instanceId),
    venue_confirmed: await checkVenueConfirmed(instanceId),
    materials_ordered: await checkMaterialsOrdered(instanceId),
    materials_received: await checkMaterialsReceived(instanceId),
    shrm_approved: await checkSHRMApproved(instanceId),
    av_ordered: await checkAVOrdered(instanceId),
    catering_confirmed: await checkCateringConfirmed(instanceId),
    room_block_active: await checkRoomBlockActive(instanceId),
    reg_page_live: await checkRegPageLive(instanceId)
  };
  return checklist;
}
```

### Step 3: Calculate Readiness Score

```javascript
function calculateReadinessScore(checklist, programType) {
  let totalPoints = 0;
  let earnedPoints = 0;

  const items = [
    { key: 'faculty_confirmed', points: 10 },
    { key: 'faculty_brief_sent', points: 10 },
    { key: 'venue_confirmed', points: 10 },
    { key: 'materials_ordered', points: 10 },
    { key: 'materials_received', points: 10 },
    { key: 'shrm_approved', points: 10 },
    { key: 'av_ordered', points: 10 },
    { key: 'catering_confirmed', points: 10 },
    { key: 'room_block_active', points: 10, virtual_exempt: true },
    { key: 'reg_page_live', points: 10 }
  ];

  for (const item of items) {
    // Skip room block for virtual programs
    if (item.virtual_exempt && programType === 'virtual') continue;

    totalPoints += item.points;
    if (checklist[item.key]) {
      earnedPoints += item.points;
    }
  }

  return Math.round((earnedPoints / totalPoints) * 100);
}
```

### Step 4: Identify Items Behind Schedule

Compare checklist status against target timing:

```javascript
function identifyLateItems(checklist, daysUntilStart) {
  const lateItems = [];
  const targets = {
    faculty_confirmed: 60,
    faculty_brief_sent: 14,
    venue_confirmed: 90,
    materials_ordered: 21,
    materials_received: 7,
    shrm_approved: 30,
    av_ordered: 14,
    catering_confirmed: 7,
    room_block_active: 45,
    reg_page_live: 60
  };

  for (const [item, targetDays] of Object.entries(targets)) {
    if (!checklist[item] && daysUntilStart <= targetDays) {
      lateItems.push({
        item,
        target_days: targetDays,
        days_late: targetDays - daysUntilStart,
        severity: getSeverity(targetDays, daysUntilStart)
      });
    }
  }

  return lateItems;
}

function getSeverity(targetDays, daysUntilStart) {
  const daysLate = targetDays - daysUntilStart;
  if (daysLate > targetDays * 0.5) return 'critical';
  if (daysLate > targetDays * 0.25) return 'warning';
  return 'info';
}
```

### Step 5: Aggregate Department Metrics

```javascript
function aggregateDepartmentMetrics(allInstances) {
  const metrics = {
    total_programs: allInstances.length,
    ready_count: 0,      // readiness >= 80%
    warning_count: 0,    // readiness 60-79%
    critical_count: 0,   // readiness < 60%
    avg_readiness: 0,
    checklist_completion: {}
  };

  // Initialize checklist completion tracking
  const checklistItems = [
    'faculty_confirmed', 'faculty_brief_sent', 'venue_confirmed',
    'materials_ordered', 'materials_received', 'shrm_approved',
    'av_ordered', 'catering_confirmed', 'room_block_active', 'reg_page_live'
  ];

  for (const item of checklistItems) {
    metrics.checklist_completion[item] = { complete: 0, total: 0 };
  }

  // Calculate metrics
  let totalReadiness = 0;
  for (const instance of allInstances) {
    totalReadiness += instance.readiness_score;

    if (instance.readiness_score >= 80) metrics.ready_count++;
    else if (instance.readiness_score >= 60) metrics.warning_count++;
    else metrics.critical_count++;

    // Track checklist completion
    for (const item of checklistItems) {
      if (instance.checklist[item] !== undefined) {
        metrics.checklist_completion[item].total++;
        if (instance.checklist[item]) {
          metrics.checklist_completion[item].complete++;
        }
      }
    }
  }

  metrics.avg_readiness = Math.round(totalReadiness / allInstances.length);

  return metrics;
}
```

### Step 6: Store Results and Generate Alerts

Store the updated readiness data and trigger alerts for issues.

---

## Outputs

### To Dashboard

```json
{
  "department_readiness": {
    "total_programs": 70,
    "ready_count": 58,
    "warning_count": 9,
    "critical_count": 3,
    "avg_readiness": 84,
    "trend": "+2"
  },
  "checklist_breakdown": {
    "faculty_confirmed": { "complete": 68, "total": 70, "pct": 97 },
    "venue_confirmed": { "complete": 70, "total": 70, "pct": 100 },
    "materials_ordered": { "complete": 62, "total": 70, "pct": 89 },
    "materials_received": { "complete": 58, "total": 70, "pct": 83 },
    "shrm_approved": { "complete": 67, "total": 70, "pct": 96 },
    "av_ordered": { "complete": 55, "total": 70, "pct": 79 },
    "catering_confirmed": { "complete": 64, "total": 70, "pct": 91 },
    "room_block_active": { "complete": 45, "total": 52, "pct": 87 },
    "reg_page_live": { "complete": 70, "total": 70, "pct": 100 },
    "faculty_brief_sent": { "complete": 52, "total": 70, "pct": 74 }
  },
  "at_risk_programs": [
    {
      "instance_id": "pi_123",
      "program_name": "Labor Relations Summit",
      "start_date": "2025-02-24",
      "days_until": 45,
      "readiness_score": 60,
      "late_items": ["materials_ordered", "av_ordered"],
      "enrollment_pct": 33
    }
  ]
}
```

### To Supabase

Table: `readiness_snapshots`
| Column | Type | Description |
|--------|------|-------------|
| `snapshot_time` | timestamp | When snapshot was taken |
| `instance_id` | uuid | Program instance ID |
| `readiness_score` | integer | 0-100 score |
| `checklist_json` | jsonb | Full checklist status |
| `late_items` | jsonb | Items behind schedule |
| `days_until_start` | integer | Days to program |

Table: `department_health_log`
| Column | Type | Description |
|--------|------|-------------|
| `log_time` | timestamp | When logged |
| `department` | text | 'programs' |
| `metric` | text | 'readiness' |
| `value` | decimal | Avg readiness score |
| `details` | jsonb | Breakdown data |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Any program readiness <60% | Warning | Dashboard notification |
| Any program readiness <40% with <30 days | Critical | Email + Dashboard |
| Checklist item <70% complete | Warning | Dashboard notification |
| Faculty not confirmed at T-45 | Warning | Alert Faculty Management |
| Materials not ordered at T-14 | Critical | Email + Dashboard |
| SHRM not approved at T-21 | Critical | Escalate to Director |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Program Readiness | <80% | <60% |
| Checklist Item Completion | <85% | <70% |
| Days Until Start (for critical items) | 14 days | 7 days |

---

## Integration Requirements

### APIs Needed
- Supabase (program data, readiness tracking)
- Vercel API (website deployment status)
- Airtable (legacy data during migration)

### Credentials
- `SUPABASE_TOKEN`
- `VERCEL_TOKEN`
- `AIRTABLE_API_KEY`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Schedule (every 2 hours)
    |
    v
Supabase: Get all upcoming program instances (90 days)
    |
    v
Loop: For each instance
    |
    +-- Supabase: Get checklist item statuses
    |
    +-- Function: Calculate readiness score
    |
    +-- Function: Identify late items
    |
    v
Function: Aggregate department metrics
    |
    v
Supabase: Store readiness snapshots
    |
    v
IF: Any critical alerts?
    |
    +-- Yes --> Send alerts (email, dashboard)
    |
    +-- No --> Complete
    |
    v
Supabase: Update department health log
```

**Estimated Runtime:** 3-8 minutes depending on program count

---

## Reporting Format

```
┌─────────────────────────────────────────────────────────────┐
│ READINESS REPORT - 2025-01-09 08:00                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ DEPARTMENT SUMMARY                                           │
│ Total Programs (90-day): 70                                 │
│ Average Readiness: 84%                                      │
│                                                              │
│ STATUS BREAKDOWN                                             │
│ ✅ Ready (≥80%):      58 programs                           │
│ ⚠️ Warning (60-79%):   9 programs                           │
│ 🚨 Critical (<60%):    3 programs                           │
│                                                              │
│ CHECKLIST COMPLETION                                         │
│ Faculty Confirmed:     68/70 (97%) ████████████████████░    │
│ Venue Confirmed:       70/70 (100%) █████████████████████   │
│ Materials Ordered:     62/70 (89%) ██████████████████░░░    │
│ SHRM Approved:         67/70 (96%) ████████████████████░    │
│ AV Ordered:            55/70 (79%) ████████████████░░░░░    │
│                                                              │
│ CRITICAL ATTENTION NEEDED                                    │
│ 1. Labor Relations Summit (Feb 24)                          │
│    - Readiness: 60%                                         │
│    - Missing: Materials, AV                                 │
│    - Enrollment: 33%                                        │
│                                                              │
│ 2. Strategic HR Leadership (Feb 10)                         │
│    - Readiness: 75%                                         │
│    - Missing: Faculty brief, AV                             │
│    - Enrollment: 40%                                        │
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
