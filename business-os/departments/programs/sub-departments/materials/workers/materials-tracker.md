# Materials Tracker

> **CEO Summary:** Tracks printed materials from faculty content submission through delivery to the venue. Ensures no program runs without materials by monitoring: content received → print order placed → shipped → delivered. Alerts when any step falls behind schedule.

## Purpose

Track the complete materials lifecycle for all upcoming programs—from faculty content submission through print ordering and delivery confirmation. This monitor ensures no program goes without materials by tracking every step and alerting when timelines slip.

## Type

Monitor (Automated)

## Trigger

- **Schedule:** Daily at 10:00 AM EST (`0 10 * * *`)
- **Manual:** On-demand via dashboard

---

## Inputs

### Data Sources

**Supabase:**
- `program_instances` — Program dates and details
- `materials_orders` — Print orders and status
- `materials_content` — Faculty content submissions
- `shipping_tracking` — Delivery tracking info

**Print Vendor API:**
- Order status updates
- Estimated completion dates

**Shipping APIs:**
- Tracking numbers
- Delivery confirmations

---

## Materials Status Model

```sql
CREATE TABLE materials_orders (
  id UUID PRIMARY KEY,
  instance_id UUID REFERENCES program_instances(id),
  status TEXT DEFAULT 'pending',  -- pending, content_received, ordered, printing, shipped, delivered
  content_due_date DATE,
  content_received_date DATE,
  order_submitted_date DATE,
  print_completed_date DATE,
  ship_date DATE,
  delivery_date DATE,
  delivery_confirmed BOOLEAN DEFAULT false,
  vendor_order_id TEXT,
  tracking_number TEXT,
  destination_type TEXT,  -- venue, coordinator, faculty
  destination_address JSONB,
  quantity INTEGER,
  rush_order BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Process

### Step 1: Get All Programs with Materials Status

```sql
SELECT
  pi.id as instance_id,
  p.name as program_name,
  pi.start_date,
  DATEDIFF(pi.start_date, CURRENT_DATE) as days_until_start,
  pi.format,
  mo.status as materials_status,
  mo.content_received_date,
  mo.order_submitted_date,
  mo.ship_date,
  mo.delivery_date,
  mo.delivery_confirmed,
  mo.tracking_number,
  mo.rush_order,
  v.name as venue_name,
  v.city
FROM program_instances pi
JOIN programs p ON pi.program_id = p.id
LEFT JOIN materials_orders mo ON mo.instance_id = pi.id
LEFT JOIN venues v ON pi.venue_id = v.id
WHERE pi.start_date >= CURRENT_DATE
  AND pi.start_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)
  AND pi.status = 'scheduled'
ORDER BY pi.start_date;
```

### Step 2: Calculate Expected vs. Actual Timeline

```javascript
function calculateMaterialsTimeline(program) {
  const daysOut = program.days_until_start;
  const timeline = {
    instance_id: program.instance_id,
    program_name: program.program_name,
    start_date: program.start_date,
    days_until_start: daysOut,
    current_status: program.materials_status || 'pending',

    // Expected milestones
    expected: {
      content_due: daysOut <= 30 ? 'due' : 'upcoming',
      order_due: daysOut <= 21 ? 'due' : 'upcoming',
      delivery_due: daysOut <= 7 ? 'due' : 'upcoming'
    },

    // Actual status
    actual: {
      content_received: !!program.content_received_date,
      order_submitted: !!program.order_submitted_date,
      shipped: !!program.ship_date,
      delivered: program.delivery_confirmed
    },

    // Issue detection
    issues: []
  };

  // Check for issues
  if (daysOut <= 30 && !timeline.actual.content_received) {
    timeline.issues.push({
      type: 'content_overdue',
      severity: daysOut <= 25 ? 'critical' : 'warning',
      message: 'Faculty content not received'
    });
  }

  if (daysOut <= 21 && !timeline.actual.order_submitted) {
    timeline.issues.push({
      type: 'order_overdue',
      severity: daysOut <= 14 ? 'critical' : 'warning',
      message: 'Print order not submitted'
    });
  }

  if (daysOut <= 7 && !timeline.actual.delivered) {
    timeline.issues.push({
      type: 'delivery_at_risk',
      severity: daysOut <= 3 ? 'critical' : 'warning',
      message: 'Materials not confirmed delivered'
    });
  }

  // Overall status
  timeline.overall_status = determineOverallStatus(timeline);

  return timeline;
}

function determineOverallStatus(timeline) {
  if (timeline.issues.some(i => i.severity === 'critical')) return 'critical';
  if (timeline.issues.some(i => i.severity === 'warning')) return 'warning';
  if (timeline.actual.delivered) return 'complete';
  if (timeline.actual.shipped) return 'shipped';
  if (timeline.actual.order_submitted) return 'printing';
  if (timeline.actual.content_received) return 'ready_to_order';
  return 'pending';
}
```

### Step 3: Update Status from External Sources

```javascript
async function updateExternalStatus(orders) {
  for (const order of orders) {
    // Check print vendor status
    if (order.vendor_order_id) {
      const vendorStatus = await printVendor.getOrderStatus(order.vendor_order_id);
      if (vendorStatus.completed && !order.print_completed_date) {
        await updatePrintCompleted(order.id, vendorStatus.completed_date);
      }
    }

    // Check shipping status
    if (order.tracking_number && !order.delivery_confirmed) {
      const shipStatus = await checkShippingStatus(order.tracking_number);
      if (shipStatus.delivered) {
        await updateDeliveryConfirmed(order.id, shipStatus.delivery_date);
      }
    }
  }
}
```

### Step 4: Generate Recommendations

```javascript
function generateRecommendations(timeline) {
  const recommendations = [];

  for (const issue of timeline.issues) {
    switch (issue.type) {
      case 'content_overdue':
        recommendations.push({
          priority: issue.severity,
          action: 'FOLLOW_UP_FACULTY',
          message: `Contact faculty for materials. ${timeline.days_until_start} days to program.`
        });
        break;

      case 'order_overdue':
        if (timeline.days_until_start <= 14) {
          recommendations.push({
            priority: 'critical',
            action: 'RUSH_ORDER_NEEDED',
            message: `Must submit rush order immediately. Will need expedited shipping.`
          });
        } else {
          recommendations.push({
            priority: 'high',
            action: 'SUBMIT_ORDER',
            message: `Submit print order today to meet timeline.`
          });
        }
        break;

      case 'delivery_at_risk':
        if (timeline.days_until_start <= 3) {
          recommendations.push({
            priority: 'critical',
            action: 'EMERGENCY_BACKUP',
            message: `Prepare backup plan: overnight shipping or local printing.`
          });
        } else {
          recommendations.push({
            priority: 'high',
            action: 'TRACK_SHIPMENT',
            message: `Verify shipment tracking and confirm delivery.`
          });
        }
        break;
    }
  }

  return recommendations;
}
```

### Step 5: Aggregate Metrics

```javascript
function aggregateMaterialsMetrics(allTimelines) {
  return {
    total_programs: allTimelines.length,
    status_breakdown: {
      complete: allTimelines.filter(t => t.overall_status === 'complete').length,
      shipped: allTimelines.filter(t => t.overall_status === 'shipped').length,
      printing: allTimelines.filter(t => t.overall_status === 'printing').length,
      ready_to_order: allTimelines.filter(t => t.overall_status === 'ready_to_order').length,
      pending: allTimelines.filter(t => t.overall_status === 'pending').length,
      warning: allTimelines.filter(t => t.overall_status === 'warning').length,
      critical: allTimelines.filter(t => t.overall_status === 'critical').length
    },
    on_track_pct: Math.round(
      (allTimelines.filter(t => !t.issues.length).length / allTimelines.length) * 100
    ),
    issues: allTimelines
      .filter(t => t.issues.length > 0)
      .sort((a, b) => a.days_until_start - b.days_until_start)
  };
}
```

---

## Outputs

### To Dashboard

```json
{
  "materials_summary": {
    "total_programs": 70,
    "on_track_pct": 89,
    "status_breakdown": {
      "complete": 25,
      "shipped": 8,
      "printing": 12,
      "ready_to_order": 15,
      "pending": 7,
      "warning": 2,
      "critical": 1
    }
  },
  "at_risk_programs": [
    {
      "program_name": "Strategic HR Leadership",
      "start_date": "2025-02-10",
      "days_until_start": 32,
      "status": "warning",
      "issues": ["Faculty content not received"],
      "recommendations": ["Contact faculty immediately"]
    },
    {
      "program_name": "Advanced ERISA",
      "start_date": "2025-03-03",
      "days_until_start": 53,
      "status": "pending",
      "issues": [],
      "note": "On track"
    }
  ],
  "upcoming_deadlines": [
    { "program": "FMLA/ADA", "deadline": "Content due", "date": "2025-01-10" },
    { "program": "Employee Relations", "deadline": "Ship date", "date": "2025-01-17" }
  ]
}
```

### To Supabase

Table: `materials_status_snapshots`
| Column | Type | Description |
|--------|------|-------------|
| `snapshot_date` | date | Date of snapshot |
| `instance_id` | uuid | Program instance ID |
| `status` | text | Current status |
| `content_received` | boolean | Faculty content in |
| `order_submitted` | boolean | Print order placed |
| `shipped` | boolean | Materials shipped |
| `delivered` | boolean | Delivery confirmed |
| `issues` | jsonb | Current issues |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Content not received at T-25 | Warning | Dashboard notification |
| Order not submitted at T-14 | Critical | Email + Dashboard |
| Not delivered at T-5 | Critical | Immediate escalation |
| Tracking shows delay | Warning | Dashboard notification |

---

## Thresholds

| Milestone | Warning | Critical |
|-----------|---------|----------|
| Content from faculty | T-25 | T-21 |
| Print order submitted | T-14 | T-10 |
| Materials shipped | T-10 | T-7 |
| Delivery confirmed | T-5 | T-3 |

---

## Integration Requirements

### APIs Needed
- Supabase (materials data)
- Print vendor API (order status)
- FedEx/UPS API (shipping tracking)

### Credentials
- `SUPABASE_TOKEN`
- `PRINT_VENDOR_API_KEY`
- `FEDEX_API_KEY` or `UPS_API_KEY`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Schedule (10 AM daily)
    |
    v
Supabase: Get all programs with materials status
    |
    v
Loop: For each program
    |
    +-- Calculate timeline
    |
    +-- IF: Has vendor order --> Check print vendor status
    |
    +-- IF: Has tracking --> Check shipping status
    |
    +-- Generate recommendations
    |
    v
Supabase: Update statuses from external sources
    |
    v
Supabase: Store snapshots
    |
    v
Function: Aggregate metrics
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

**Estimated Runtime:** 5-10 minutes

---

## Status

- [x] Worker specification complete
- [ ] Print vendor integration built
- [ ] Shipping API integration built
- [ ] Supabase tables created
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
