# Room Block Monitor

## Purpose

Track hotel room block pickup rates for all upcoming in-person programs, alerting when pickup falls below thresholds that risk attrition penalties. This monitor enables proactive management of room blocks—either through marketing pushes or strategic releases.

## Type

Monitor (Automated)

## Trigger

- **Schedule:** Daily at 8:00 AM EST (`0 8 * * *`)
- **Manual:** On-demand via dashboard

---

## Inputs

### Data Sources

**Supabase:**
- `room_blocks` — Block details, sizes, cutoff dates
- `program_instances` — Program dates, enrollment
- `venues` — Hotel information

**Google Sheets:**
- Hotel pickup reports (CSV exports from hotel systems)
- Manual tracking spreadsheets

---

## Room Block Data Model

```sql
CREATE TABLE room_blocks (
  id UUID PRIMARY KEY,
  instance_id UUID REFERENCES program_instances(id),
  venue_id UUID REFERENCES venues(id),
  hotel_name TEXT,
  block_code TEXT,
  block_size INTEGER,
  rooms_picked_up INTEGER DEFAULT 0,
  check_in_date DATE,
  check_out_date DATE,
  cutoff_date DATE,  -- Attrition deadline
  rate_per_night DECIMAL(10,2),
  attrition_penalty_pct INTEGER DEFAULT 80,  -- % pickup required
  contract_minimum INTEGER,
  status TEXT DEFAULT 'active',
  last_pickup_update TIMESTAMP,
  notes TEXT
);
```

---

## Process

### Step 1: Get Active Room Blocks

```sql
SELECT
  rb.id as block_id,
  rb.instance_id,
  pi.start_date as program_date,
  p.name as program_name,
  v.name as venue_name,
  v.city,
  rb.hotel_name,
  rb.block_code,
  rb.block_size,
  rb.rooms_picked_up,
  rb.cutoff_date,
  DATEDIFF(rb.cutoff_date, CURRENT_DATE) as days_to_cutoff,
  DATEDIFF(pi.start_date, CURRENT_DATE) as days_to_program,
  rb.rate_per_night,
  rb.attrition_penalty_pct,
  rb.contract_minimum,
  rb.last_pickup_update
FROM room_blocks rb
JOIN program_instances pi ON rb.instance_id = pi.id
JOIN programs p ON pi.program_id = p.id
JOIN venues v ON pi.venue_id = v.id
WHERE rb.status = 'active'
  AND pi.start_date >= CURRENT_DATE
  AND pi.format != 'virtual'
ORDER BY rb.cutoff_date;
```

### Step 2: Update Pickup Counts

```javascript
async function updatePickupCounts(roomBlocks) {
  for (const block of roomBlocks) {
    // Option 1: Pull from Google Sheets integration
    const sheetData = await getHotelReportFromSheets(block.hotel_name, block.block_code);
    if (sheetData) {
      await supabase
        .from('room_blocks')
        .update({
          rooms_picked_up: sheetData.roomsBooked,
          last_pickup_update: new Date()
        })
        .eq('id', block.block_id);
    }

    // Option 2: Pull from hotel API (if available)
    // Option 3: Manual update via dashboard
  }
}
```

### Step 3: Calculate Block Metrics

```javascript
function calculateBlockMetrics(block) {
  const pickupPct = Math.round((block.rooms_picked_up / block.block_size) * 100);
  const roomsRemaining = block.block_size - block.rooms_picked_up;
  const requiredForNoAttrition = Math.ceil(block.block_size * (block.attrition_penalty_pct / 100));
  const roomsNeeded = Math.max(0, requiredForNoAttrition - block.rooms_picked_up);

  // Calculate potential penalty
  let potentialPenalty = 0;
  if (pickupPct < block.attrition_penalty_pct) {
    const shortfall = requiredForNoAttrition - block.rooms_picked_up;
    const nightsInBlock = daysBetween(block.check_in_date, block.check_out_date);
    potentialPenalty = shortfall * nightsInBlock * block.rate_per_night;
  }

  // Determine status
  let status = 'healthy';
  let severity = 'none';

  if (block.days_to_cutoff <= 3) {
    if (pickupPct < 60) { status = 'critical'; severity = 'critical'; }
    else if (pickupPct < 75) { status = 'warning'; severity = 'warning'; }
  } else if (block.days_to_cutoff <= 7) {
    if (pickupPct < 50) { status = 'critical'; severity = 'critical'; }
    else if (pickupPct < 65) { status = 'warning'; severity = 'warning'; }
  } else if (block.days_to_cutoff <= 14) {
    if (pickupPct < 40) { status = 'warning'; severity = 'warning'; }
    else if (pickupPct < 55) { status = 'attention'; severity = 'info'; }
  }

  return {
    block_id: block.block_id,
    instance_id: block.instance_id,
    program_name: block.program_name,
    hotel_name: block.hotel_name,
    venue_city: block.city,
    block_size: block.block_size,
    rooms_picked_up: block.rooms_picked_up,
    rooms_remaining: roomsRemaining,
    pickup_pct: pickupPct,
    cutoff_date: block.cutoff_date,
    days_to_cutoff: block.days_to_cutoff,
    days_to_program: block.days_to_program,
    required_pickup_pct: block.attrition_penalty_pct,
    rooms_needed: roomsNeeded,
    potential_penalty: potentialPenalty,
    status,
    severity
  };
}
```

### Step 4: Generate Recommendations

```javascript
function generateRecommendations(blockMetrics) {
  const recommendations = [];

  if (blockMetrics.status === 'critical') {
    if (blockMetrics.days_to_cutoff <= 3) {
      recommendations.push({
        priority: 'critical',
        action: 'IMMEDIATE_DECISION',
        message: `Cutoff in ${blockMetrics.days_to_cutoff} days. Pickup at ${blockMetrics.pickup_pct}%. ` +
          `Potential penalty: $${blockMetrics.potential_penalty.toLocaleString()}. ` +
          `Options: 1) Release ${blockMetrics.rooms_remaining - blockMetrics.rooms_needed} rooms, ` +
          `2) Accept penalty, 3) Last-minute push.`
      });
    } else {
      recommendations.push({
        priority: 'high',
        action: 'ESCALATE',
        message: `Block at ${blockMetrics.pickup_pct}% with ${blockMetrics.days_to_cutoff} days to cutoff. ` +
          `Need ${blockMetrics.rooms_needed} more room nights to avoid penalty.`
      });
    }
  } else if (blockMetrics.status === 'warning') {
    recommendations.push({
      priority: 'medium',
      action: 'MONITOR_CLOSELY',
      message: `Block trending below target. Consider: 1) Participant email reminder, ` +
        `2) Evaluate releasing some rooms, 3) Marketing push for program.`
    });
  }

  // Check if we should recommend releasing rooms
  if (blockMetrics.pickup_pct < 50 && blockMetrics.days_to_cutoff > 7) {
    const releaseCount = Math.floor(blockMetrics.rooms_remaining * 0.3);
    recommendations.push({
      priority: 'medium',
      action: 'CONSIDER_RELEASE',
      message: `Consider releasing ${releaseCount} rooms to reduce block size and attrition risk.`
    });
  }

  return recommendations;
}
```

### Step 5: Aggregate and Store

```javascript
function aggregateBlockMetrics(allBlocks) {
  const atRisk = allBlocks.filter(b => b.status === 'warning' || b.status === 'critical');
  const totalPotentialPenalty = atRisk.reduce((sum, b) => sum + b.potential_penalty, 0);

  return {
    total_blocks: allBlocks.length,
    healthy_count: allBlocks.filter(b => b.status === 'healthy').length,
    warning_count: allBlocks.filter(b => b.status === 'warning').length,
    critical_count: allBlocks.filter(b => b.status === 'critical').length,
    avg_pickup_pct: Math.round(
      allBlocks.reduce((sum, b) => sum + b.pickup_pct, 0) / allBlocks.length
    ),
    total_potential_penalty: totalPotentialPenalty,
    blocks_at_risk: atRisk.sort((a, b) => a.days_to_cutoff - b.days_to_cutoff),
    upcoming_cutoffs: allBlocks
      .filter(b => b.days_to_cutoff <= 14)
      .sort((a, b) => a.days_to_cutoff - b.days_to_cutoff)
  };
}
```

---

## Outputs

### To Dashboard

```json
{
  "room_block_summary": {
    "total_blocks": 52,
    "avg_pickup_pct": 67,
    "healthy_count": 42,
    "warning_count": 7,
    "critical_count": 3,
    "total_potential_penalty": 12450
  },
  "at_risk_blocks": [
    {
      "program_name": "Cert in Employee Relations Law",
      "hotel_name": "San Diego Marriott Marquis",
      "cutoff_date": "2025-01-17",
      "days_to_cutoff": 8,
      "block_size": 25,
      "rooms_picked_up": 12,
      "pickup_pct": 48,
      "potential_penalty": 5200,
      "status": "warning",
      "recommendations": ["Send participant reminder", "Consider releasing 5 rooms"]
    },
    {
      "program_name": "Strategic HR Leadership",
      "hotel_name": "Phoenix Hilton Resort",
      "cutoff_date": "2025-01-27",
      "days_to_cutoff": 18,
      "block_size": 20,
      "rooms_picked_up": 8,
      "pickup_pct": 40,
      "potential_penalty": 4800,
      "status": "warning",
      "recommendations": ["Monitor closely", "Coordinate with Marketing"]
    }
  ],
  "upcoming_cutoffs": [
    {
      "program_name": "Employee Relations Law",
      "hotel_name": "San Diego Marriott",
      "cutoff_date": "2025-01-17",
      "days_to_cutoff": 8
    }
  ]
}
```

### To Supabase

Table: `room_block_snapshots`
| Column | Type | Description |
|--------|------|-------------|
| `snapshot_date` | date | Date of snapshot |
| `block_id` | uuid | Room block ID |
| `rooms_picked_up` | integer | Current pickup |
| `pickup_pct` | decimal | Pickup percentage |
| `days_to_cutoff` | integer | Days until cutoff |
| `potential_penalty` | decimal | Estimated penalty |
| `status` | text | healthy/attention/warning/critical |

Table: `room_block_alerts`
| Column | Type | Description |
|--------|------|-------------|
| `created_at` | timestamp | Alert timestamp |
| `block_id` | uuid | Room block ID |
| `alert_type` | text | attrition_risk/cutoff_approaching |
| `severity` | text | critical/warning/info |
| `message` | text | Alert message |
| `recommendations` | jsonb | Recommended actions |
| `acknowledged` | boolean | Has been seen |
| `action_taken` | text | What was done |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Pickup <40% at T-14 to cutoff | Warning | Dashboard notification |
| Pickup <50% at T-7 to cutoff | Warning | Dashboard + Email |
| Pickup <60% at T-3 to cutoff | Critical | Email + Immediate escalation |
| Cutoff tomorrow with <75% | Critical | Decision required today |

---

## Thresholds

| Days to Cutoff | Warning | Critical |
|----------------|---------|----------|
| 14+ days | <40% | <25% |
| 7-13 days | <50% | <40% |
| 3-6 days | <65% | <50% |
| 1-2 days | <75% | <60% |

---

## Integration Requirements

### APIs Needed
- Supabase (room block data)
- Google Sheets API (hotel reports)

### Credentials
- `SUPABASE_TOKEN`
- `GOOGLE_APPLICATION_CREDENTIALS`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Schedule (8 AM daily)
    |
    v
Supabase: Get all active room blocks
    |
    v
Google Sheets: Pull latest hotel reports
    |
    v
Loop: For each block
    |
    +-- Update pickup counts
    |
    +-- Calculate metrics
    |
    +-- Generate recommendations
    |
    v
Supabase: Store snapshots
    |
    v
Function: Aggregate metrics
    |
    v
IF: Any critical blocks?
    |
    +-- Yes -->
    |      +-- Send email alert
    |      +-- Create alert record
    |
    +-- No --> Log status
    |
    v
Update dashboard
```

**Estimated Runtime:** 3-8 minutes

---

## Reporting Format

```
┌─────────────────────────────────────────────────────────────┐
│ ROOM BLOCK REPORT - 2025-01-09                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ SUMMARY                                                      │
│ Active Blocks: 52        Avg Pickup: 67%                    │
│ Healthy: 42  Warning: 7  Critical: 3                        │
│ Potential Penalty Exposure: $12,450                         │
│                                                              │
│ 🚨 CRITICAL ATTENTION                                       │
│ ───────────────────────────────────────────────────────────│
│ San Diego Marriott (Emp Relations, Jan 27)                  │
│   Cutoff: Jan 17 (8 days)                                   │
│   Pickup: 12/25 (48%)                                       │
│   Potential Penalty: $5,200                                 │
│   ACTION: Send reminder or release 5 rooms                  │
│                                                              │
│ ⚠️ WARNING BLOCKS                                           │
│ ───────────────────────────────────────────────────────────│
│ Phoenix Hilton (Strategic HR, Feb 10)                       │
│   Cutoff: Jan 27 (18 days)                                  │
│   Pickup: 8/20 (40%)                                        │
│   Potential Penalty: $4,800                                 │
│                                                              │
│ Orlando Marriott (Labor Relations, Feb 24)                  │
│   Cutoff: Feb 10 (32 days)                                  │
│   Pickup: 4/18 (22%)                                        │
│   Note: Still early, monitor weekly                         │
│                                                              │
│ UPCOMING CUTOFFS (Next 14 Days)                             │
│ ───────────────────────────────────────────────────────────│
│ Jan 17 - San Diego Marriott (Emp Relations)                 │
│ Jan 20 - Chicago Hilton (FMLA/ADA)                         │
│ Jan 27 - Phoenix Hilton (Strategic HR)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Google Sheets integration built
- [ ] Supabase tables created
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
