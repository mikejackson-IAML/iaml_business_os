# Enrollment Alert

> **CEO Summary:** Monitors enrollment levels for upcoming programs and alerts when registration is too low. If a program is 30 days out with less than 60% seats filled, it triggers marketing escalation. Prevents surprise low-attendance programs.

## Purpose

Monitor enrollment levels for all upcoming programs against minimum capacity thresholds, flagging programs that are at risk of cancellation or need marketing support. This worker enables proactive intervention when enrollment is trending low.

## Type

Monitor (Automated)

## Trigger

- **Schedule:** Daily at 8:00 AM EST (`0 8 * * *`)
- **Manual:** On-demand via dashboard

---

## Inputs

### Data Sources

**Supabase:**
- `program_instances` — Program dates, capacity limits
- `programs` — Program type and minimum capacity
- `registrations` — Current enrollment counts
- `registration_history` — Historical enrollment trends

**Config:**
- Enrollment thresholds from `config.json`

---

## Enrollment Thresholds

| Days Until Program | Minimum Enrollment | Alert Level |
|-------------------|-------------------|-------------|
| T-60 | 25% of minimum | Info |
| T-45 | 40% of minimum | Warning |
| T-30 | 60% of minimum | Warning |
| T-14 | 80% of minimum | Critical |
| T-7 | 100% of minimum | Decision Point |

### Capacity by Program Type

| Type | Minimum | Target | Maximum |
|------|---------|--------|---------|
| Certificate | 15 | 25 | 35 |
| Single-Day | 12 | 20 | 30 |
| Workshop | 15 | 22 | 30 |
| Boot Camp | 18 | 28 | 40 |
| Summit | 20 | 35 | 50 |

---

## Process

### Step 1: Get Upcoming Programs with Enrollment

```sql
SELECT
  pi.id as instance_id,
  p.name as program_name,
  p.program_type,
  pi.start_date,
  DATEDIFF(pi.start_date, CURRENT_DATE) as days_until_start,
  pi.minimum_capacity,
  pi.target_capacity,
  pi.maximum_capacity,
  COUNT(r.id) as current_enrolled,
  pi.location
FROM program_instances pi
JOIN programs p ON pi.program_id = p.id
LEFT JOIN registrations r ON r.instance_id = pi.id
  AND r.status IN ('confirmed', 'pending')
WHERE pi.start_date >= CURRENT_DATE
  AND pi.start_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)
  AND pi.status = 'scheduled'
GROUP BY pi.id, p.name, p.program_type, pi.start_date,
         pi.minimum_capacity, pi.target_capacity, pi.maximum_capacity
ORDER BY pi.start_date;
```

### Step 2: Calculate Enrollment Metrics

```javascript
function calculateEnrollmentMetrics(instance) {
  const enrolled = instance.current_enrolled;
  const minimum = instance.minimum_capacity;
  const target = instance.target_capacity;
  const daysOut = instance.days_until_start;

  const metrics = {
    instance_id: instance.instance_id,
    program_name: instance.program_name,
    start_date: instance.start_date,
    days_until_start: daysOut,
    current_enrolled: enrolled,
    minimum_capacity: minimum,
    target_capacity: target,
    enrollment_pct: Math.round((enrolled / minimum) * 100),
    target_pct: Math.round((enrolled / target) * 100),
    seats_needed: Math.max(0, minimum - enrolled),
    at_risk: false,
    alert_level: 'none',
    required_pct: getRequiredPct(daysOut)
  };

  // Determine if at risk
  if (metrics.enrollment_pct < metrics.required_pct) {
    metrics.at_risk = true;
    metrics.alert_level = getAlertLevel(daysOut, metrics.enrollment_pct);
    metrics.gap_pct = metrics.required_pct - metrics.enrollment_pct;
  }

  return metrics;
}

function getRequiredPct(daysOut) {
  if (daysOut <= 7) return 100;
  if (daysOut <= 14) return 80;
  if (daysOut <= 30) return 60;
  if (daysOut <= 45) return 40;
  if (daysOut <= 60) return 25;
  return 0;
}

function getAlertLevel(daysOut, enrollmentPct) {
  if (daysOut <= 7 && enrollmentPct < 100) return 'decision';
  if (daysOut <= 14 && enrollmentPct < 80) return 'critical';
  if (daysOut <= 30 && enrollmentPct < 60) return 'warning';
  if (daysOut <= 45 && enrollmentPct < 40) return 'warning';
  if (daysOut <= 60 && enrollmentPct < 25) return 'info';
  return 'none';
}
```

### Step 3: Calculate Enrollment Velocity

```javascript
async function calculateVelocity(instanceId, daysLookback = 14) {
  // Get registration counts by week
  const history = await supabase
    .from('registrations')
    .select('created_at')
    .eq('instance_id', instanceId)
    .gte('created_at', new Date(Date.now() - daysLookback * 24 * 60 * 60 * 1000))
    .order('created_at');

  const weeklyRates = [];
  // Calculate weekly registration rate
  // ...

  return {
    registrations_last_7d: countLast7Days(history),
    registrations_last_14d: history.length,
    weekly_average: calculateWeeklyAvg(weeklyRates),
    trend: calculateTrend(weeklyRates), // 'increasing', 'stable', 'decreasing'
    projected_final: projectFinalEnrollment(history, instance)
  };
}
```

### Step 4: Generate Recommendations

```javascript
function generateRecommendations(instance, velocity) {
  const recommendations = [];

  if (instance.at_risk) {
    // Low enrollment recommendations
    if (instance.days_until_start <= 7) {
      recommendations.push({
        priority: 'critical',
        action: 'DECISION_REQUIRED',
        message: `Program at ${instance.enrollment_pct}% with only ${instance.days_until_start} days to go. Decision needed: proceed, postpone, or cancel.`
      });
    } else if (instance.days_until_start <= 14) {
      recommendations.push({
        priority: 'high',
        action: 'ESCALATE_MARKETING',
        message: `Request urgent marketing push. Need ${instance.seats_needed} more registrations.`
      });
    } else if (instance.days_until_start <= 30) {
      recommendations.push({
        priority: 'medium',
        action: 'COORDINATE_MARKETING',
        message: `Coordinate with Marketing for additional promotion.`
      });
    }

    // Velocity-based recommendations
    if (velocity.trend === 'decreasing') {
      recommendations.push({
        priority: 'medium',
        action: 'INVESTIGATE',
        message: `Registration velocity declining. Review pricing, messaging, or competition.`
      });
    }

    if (velocity.projected_final < instance.minimum_capacity) {
      recommendations.push({
        priority: 'high',
        action: 'INTERVENTION_NEEDED',
        message: `Projected final enrollment: ${velocity.projected_final}. Below minimum without intervention.`
      });
    }
  }

  return recommendations;
}
```

### Step 5: Aggregate and Store Results

```javascript
function aggregateEnrollmentMetrics(allInstances) {
  return {
    total_programs: allInstances.length,
    total_capacity: allInstances.reduce((sum, i) => sum + i.target_capacity, 0),
    total_enrolled: allInstances.reduce((sum, i) => sum + i.current_enrolled, 0),
    avg_enrollment_pct: Math.round(
      allInstances.reduce((sum, i) => sum + i.enrollment_pct, 0) / allInstances.length
    ),
    at_risk_count: allInstances.filter(i => i.at_risk).length,
    critical_count: allInstances.filter(i => i.alert_level === 'critical' || i.alert_level === 'decision').length,
    programs_at_risk: allInstances
      .filter(i => i.at_risk)
      .sort((a, b) => a.days_until_start - b.days_until_start)
  };
}
```

---

## Outputs

### To Dashboard

```json
{
  "enrollment_summary": {
    "total_programs": 70,
    "total_enrolled": 782,
    "total_capacity": 1240,
    "avg_enrollment_pct": 63,
    "at_risk_count": 5,
    "critical_count": 2
  },
  "at_risk_programs": [
    {
      "instance_id": "pi_456",
      "program_name": "Labor Relations Summit",
      "start_date": "2025-02-24",
      "days_until_start": 45,
      "current_enrolled": 6,
      "minimum_capacity": 18,
      "enrollment_pct": 33,
      "required_pct": 40,
      "alert_level": "warning",
      "velocity_trend": "stable",
      "recommendations": ["COORDINATE_MARKETING"]
    },
    {
      "instance_id": "pi_789",
      "program_name": "Strategic HR Leadership",
      "start_date": "2025-02-10",
      "days_until_start": 32,
      "current_enrolled": 8,
      "minimum_capacity": 20,
      "enrollment_pct": 40,
      "required_pct": 60,
      "alert_level": "warning",
      "velocity_trend": "decreasing",
      "recommendations": ["ESCALATE_MARKETING", "INVESTIGATE"]
    }
  ],
  "weekly_trend": {
    "this_week": 45,
    "last_week": 38,
    "change_pct": 18
  }
}
```

### To Supabase

Table: `enrollment_snapshots`
| Column | Type | Description |
|--------|------|-------------|
| `snapshot_date` | date | Date of snapshot |
| `instance_id` | uuid | Program instance ID |
| `enrolled` | integer | Current enrollment |
| `minimum` | integer | Minimum capacity |
| `enrollment_pct` | decimal | Enrollment percentage |
| `alert_level` | text | none/info/warning/critical/decision |
| `velocity_7d` | integer | Registrations last 7 days |
| `velocity_trend` | text | increasing/stable/decreasing |

Table: `enrollment_alerts`
| Column | Type | Description |
|--------|------|-------------|
| `created_at` | timestamp | Alert timestamp |
| `instance_id` | uuid | Program instance ID |
| `alert_level` | text | Alert severity |
| `message` | text | Alert message |
| `recommendations` | jsonb | Recommended actions |
| `acknowledged` | boolean | Has been seen |
| `resolved` | boolean | Issue resolved |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| <25% enrolled at T-60 | Info | Log only |
| <40% enrolled at T-45 | Warning | Dashboard notification |
| <60% enrolled at T-30 | Warning | Dashboard + coordinate with Marketing |
| <80% enrolled at T-14 | Critical | Email + Dashboard + escalate |
| <100% enrolled at T-7 | Decision | Immediate escalation, decision required |
| Enrollment velocity decreasing | Warning | Dashboard notification |

---

## Thresholds

| Days Out | Expected Min % | Warning | Critical |
|----------|---------------|---------|----------|
| T-60 | 25% | <25% | <10% |
| T-45 | 40% | <40% | <25% |
| T-30 | 60% | <60% | <40% |
| T-14 | 80% | <80% | <60% |
| T-7 | 100% | <100% | <80% |

---

## Integration Requirements

### APIs Needed
- Supabase (program instances, registrations)

### Credentials
- `SUPABASE_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Schedule (8 AM daily)
    |
    v
Supabase: Get upcoming programs with enrollment
    |
    v
Loop: For each program instance
    |
    +-- Function: Calculate enrollment metrics
    |
    +-- Supabase: Get registration history
    |
    +-- Function: Calculate velocity
    |
    +-- Function: Generate recommendations
    |
    v
Function: Aggregate metrics
    |
    v
Supabase: Store enrollment snapshots
    |
    v
IF: Any critical or decision alerts?
    |
    +-- Yes -->
    |      +-- Send email alert
    |      +-- Create alert record
    |      +-- Notify Marketing (if needed)
    |
    +-- No --> Log warning alerts
    |
    v
Complete
```

**Estimated Runtime:** 2-5 minutes

---

## Cross-Department Handoffs

When programs are flagged:

| Alert Level | Action | Handoff To |
|-------------|--------|------------|
| Warning (T-45 to T-30) | Request campaign coordination | Marketing |
| Warning (T-30 to T-14) | Request additional promotion | Marketing |
| Critical (T-14) | Urgent marketing request | Marketing + CEO |
| Decision (T-7) | Decision memo to CEO | CEO |

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] Marketing handoff workflow
- [ ] Initial testing complete
- [ ] Production deployment
