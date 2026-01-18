# Attendance Tracker

> **CEO Summary:** Tracks who actually shows up during programs. Monitors check-ins, identifies no-shows for outreach, and flags attendance anomalies (like only 60% showing up on Day 1). Also determines certificate eligibility based on attendance percentage.

## Purpose

Track participant check-ins during programs, monitor attendance patterns, and flag no-shows for follow-up. This monitor provides real-time visibility into who's attending and identifies participants who may need outreach.

## Type

Monitor (Automated + Manual Input)

## Trigger

- **Program Days:** Active monitoring during scheduled programs
- **Schedule:** Hourly during program hours (8 AM - 5 PM local)
- **Manual:** Check-in updates via coordinator app/dashboard

---

## Inputs

### Data Sources

**Supabase:**
- `program_instances` — Programs currently running
- `registrations` — All registered participants
- `attendance` — Check-in records

**Manual Input:**
- Coordinator check-in app
- Sign-in sheet data entry

---

## Attendance Data Model

```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  registration_id UUID REFERENCES registrations(id),
  instance_id UUID REFERENCES program_instances(id),
  program_day INTEGER,  -- Day 1, Day 2, etc.
  checked_in BOOLEAN DEFAULT false,
  check_in_time TIMESTAMP,
  check_in_method TEXT,  -- app, manual, sign_in_sheet
  checked_out BOOLEAN DEFAULT false,
  check_out_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Process

### Step 1: Identify Programs in Progress

```sql
SELECT
  pi.id as instance_id,
  p.name as program_name,
  pi.start_date,
  pi.end_date,
  DATEDIFF(CURRENT_DATE, pi.start_date) + 1 as program_day,
  pi.format,
  v.name as venue_name,
  v.city,
  v.timezone
FROM program_instances pi
JOIN programs p ON pi.program_id = p.id
LEFT JOIN venues v ON pi.venue_id = v.id
WHERE pi.start_date <= CURRENT_DATE
  AND pi.end_date >= CURRENT_DATE
  AND pi.status = 'scheduled';
```

### Step 2: Get Registered Participants

```sql
SELECT
  r.id as registration_id,
  r.instance_id,
  r.first_name,
  r.last_name,
  r.email,
  r.phone,
  r.status as registration_status,
  a.checked_in,
  a.check_in_time,
  a.program_day
FROM registrations r
LEFT JOIN attendance a ON a.registration_id = r.id
  AND a.program_day = :current_program_day
WHERE r.instance_id = :instance_id
  AND r.status IN ('confirmed', 'pending')
ORDER BY r.last_name, r.first_name;
```

### Step 3: Calculate Attendance Metrics

```javascript
function calculateAttendanceMetrics(registrations, programDay) {
  const metrics = {
    instance_id: registrations[0]?.instance_id,
    program_day: programDay,
    total_registered: registrations.length,
    checked_in: 0,
    not_checked_in: 0,
    no_shows: [],
    late_arrivals: [],
    check_in_rate: 0
  };

  const sessionStartTime = getSessionStartTime(programDay);  // e.g., 8:30 AM

  for (const reg of registrations) {
    if (reg.checked_in) {
      metrics.checked_in++;

      // Check if late arrival (>30 min after start)
      if (reg.check_in_time) {
        const minutesLate = minutesBetween(sessionStartTime, reg.check_in_time);
        if (minutesLate > 30) {
          metrics.late_arrivals.push({
            name: `${reg.first_name} ${reg.last_name}`,
            minutes_late: minutesLate,
            check_in_time: reg.check_in_time
          });
        }
      }
    } else {
      metrics.not_checked_in++;
      metrics.no_shows.push({
        registration_id: reg.registration_id,
        name: `${reg.first_name} ${reg.last_name}`,
        email: reg.email,
        phone: reg.phone
      });
    }
  }

  metrics.check_in_rate = Math.round((metrics.checked_in / metrics.total_registered) * 100);

  return metrics;
}
```

### Step 4: Detect Attendance Anomalies

```javascript
function detectAnomalies(metrics, previousDayMetrics) {
  const anomalies = [];

  // High no-show rate
  if (metrics.check_in_rate < 70) {
    anomalies.push({
      type: 'high_no_show',
      severity: metrics.check_in_rate < 50 ? 'critical' : 'warning',
      message: `Only ${metrics.check_in_rate}% checked in (${metrics.checked_in}/${metrics.total_registered})`
    });
  }

  // Significant drop from previous day
  if (previousDayMetrics && metrics.checked_in < previousDayMetrics.checked_in * 0.8) {
    anomalies.push({
      type: 'attendance_drop',
      severity: 'warning',
      message: `Attendance dropped from ${previousDayMetrics.checked_in} to ${metrics.checked_in}`
    });
  }

  // Many late arrivals
  if (metrics.late_arrivals.length > metrics.total_registered * 0.2) {
    anomalies.push({
      type: 'many_late_arrivals',
      severity: 'info',
      message: `${metrics.late_arrivals.length} late arrivals (>30 min)`
    });
  }

  return anomalies;
}
```

### Step 5: Generate No-Show Follow-up Actions

```javascript
async function generateNoShowActions(noShows, programDetails) {
  const actions = [];

  for (const noShow of noShows) {
    // For Day 1 no-shows, try to reach them
    if (programDetails.program_day === 1) {
      actions.push({
        type: 'outreach',
        priority: 'high',
        registration_id: noShow.registration_id,
        participant: noShow.name,
        contact: noShow.phone || noShow.email,
        action: 'Call or email to check if they are attending',
        message: `${noShow.name} hasn't checked in for Day 1. Possible travel delay?`
      });
    }

    // For subsequent days, different approach
    else {
      actions.push({
        type: 'record',
        priority: 'medium',
        registration_id: noShow.registration_id,
        participant: noShow.name,
        action: 'Record no-show, check with coordinator',
        message: `${noShow.name} no-show on Day ${programDetails.program_day}`
      });
    }
  }

  return actions;
}
```

### Step 6: Store and Report

```javascript
async function storeAttendanceSnapshot(metrics, anomalies) {
  await supabase
    .from('attendance_snapshots')
    .insert({
      instance_id: metrics.instance_id,
      program_day: metrics.program_day,
      snapshot_time: new Date(),
      total_registered: metrics.total_registered,
      checked_in: metrics.checked_in,
      no_shows: metrics.not_checked_in,
      check_in_rate: metrics.check_in_rate,
      late_arrivals_count: metrics.late_arrivals.length,
      anomalies: anomalies
    });
}
```

---

## Outputs

### To Dashboard (Real-Time During Programs)

```json
{
  "active_programs": [
    {
      "program_name": "Certificate in Employee Relations Law",
      "program_day": 2,
      "venue": "San Diego Marriott",
      "attendance": {
        "registered": 18,
        "checked_in": 16,
        "no_shows": 2,
        "check_in_rate": 89
      },
      "no_shows": [
        { "name": "Jane Doe", "contacted": false },
        { "name": "Bob Johnson", "contacted": true, "note": "Called - stuck in traffic" }
      ],
      "status": "normal"
    }
  ],
  "alerts": [
    {
      "program": "FMLA/ADA Compliance",
      "type": "high_no_show",
      "message": "Only 60% checked in on Day 1"
    }
  ]
}
```

### To Supabase

Table: `attendance_snapshots`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Snapshot ID |
| `instance_id` | uuid | Program instance |
| `program_day` | integer | Day of program |
| `snapshot_time` | timestamp | When taken |
| `total_registered` | integer | Expected attendees |
| `checked_in` | integer | Actually present |
| `no_shows` | integer | Not checked in |
| `check_in_rate` | decimal | Attendance % |
| `late_arrivals_count` | integer | Late arrivals |
| `anomalies` | jsonb | Detected issues |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Check-in rate <70% | Warning | Dashboard notification |
| Check-in rate <50% | Critical | Email + Dashboard |
| Attendance drop >20% day-over-day | Warning | Dashboard notification |
| Day 1 no-show | Info | Queue for outreach |

---

## Check-In Methods

### 1. Coordinator App
- Real-time check-in via mobile app
- Scan badge or select from list
- Notes field for issues

### 2. Sign-In Sheet
- Paper sign-in at registration desk
- Data entry post-session
- Backup method

### 3. Automated (Future)
- Badge scanning integration
- RFID or QR code check-in

---

## Integration Requirements

### APIs Needed
- Supabase (attendance data)

### Credentials
- `SUPABASE_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Schedule (hourly during program hours)
    |
    v
Supabase: Get programs currently in progress
    |
    v
IF: No active programs --> Exit
    |
    v
Loop: For each active program
    |
    +-- Supabase: Get registrations and attendance
    |
    +-- Function: Calculate attendance metrics
    |
    +-- Function: Detect anomalies
    |
    +-- IF: Day 1 no-shows --> Generate outreach actions
    |
    +-- Supabase: Store snapshot
    |
    v
IF: Any critical anomalies?
    |
    +-- Yes --> Send alerts
    |
    +-- No --> Update dashboard
    |
    v
Complete
```

**Estimated Runtime:** 1-3 minutes per program

---

## Post-Program Actions

After program ends:
1. Finalize attendance records
2. Calculate final attendance rate
3. Generate no-show report
4. Trigger certificate eligibility check
5. Update participant records

### Certificate Eligibility

```javascript
function calculateCertificateEligibility(attendanceRecords, totalDays) {
  const daysAttended = attendanceRecords.filter(r => r.checked_in).length;
  const attendanceRate = daysAttended / totalDays;

  return {
    eligible: attendanceRate >= 0.8,  // 80% attendance required
    days_attended: daysAttended,
    total_days: totalDays,
    attendance_rate: Math.round(attendanceRate * 100)
  };
}
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Coordinator app interface defined
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
