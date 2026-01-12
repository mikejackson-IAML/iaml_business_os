# Lead-to-Campaign Allocator

## Purpose
Matches leads to campaigns based on available sending capacity, campaign priority, audience fit, and domain strategy to optimize deliverability and campaign performance.

## Type
Hybrid (Automated recommendation + Manual approval for large allocations)

## Trigger
On request from Marketing + Daily optimization at 8 AM

---

## Inputs

- **Sending Capacity Calculator** - Available capacity
- **Domain Capacity Tracker** - Domain health and limits
- **Marketing requests** - Campaign requirements
- **Supabase** - Lead database, campaign history

---

## Allocation Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Capacity Available | 0.30 | Can we send this volume? |
| Domain Match | 0.25 | Right domain for audience |
| Campaign Priority | 0.25 | Business importance |
| Lead Quality | 0.20 | Validation/enrichment score |

---

## Domain Matching Rules

| Audience Type | Recommended Domains | Reason |
|---------------|---------------------|--------|
| New cold prospects | General marketing domains | Protect reputation |
| SHRM credential holders | SHRM-referenced domains | Relevance |
| HRCI credential holders | HRCI-referenced domains | Relevance |
| Colleague referrals | invitationtohrtraining.com | Personal feel |
| Past participants | IAML-branded domains | Relationship |
| Alumni nurture | Best-reputation domains | Protect warm audience |

---

## Process

### On Campaign Request

1. **Parse Request**
   - Campaign ID and priority
   - Target audience/segment
   - Desired send volume
   - Requested timeline

2. **Check Capacity**
   - Get current available capacity
   - Calculate days needed at current volume
   - Identify any constraints

3. **Match Domains**
   - Determine audience type
   - Select appropriate domain pool
   - Check domain health in pool

4. **Calculate Allocation**
   - Leads per domain per day
   - Respect individual domain limits
   - Apply health multipliers

5. **Generate Recommendation**
   - Specific domain assignments
   - Daily send schedule
   - Risk assessment

6. **Approval Workflow**
   - Small (<500): Auto-approve
   - Medium (500-1000): Director approval
   - Large (>1000): CEO approval

### Daily Optimization

1. **Review Active Campaigns**
   - Check allocation vs actual sends
   - Identify underperforming domains
   - Reallocate as needed

2. **Balance Load**
   - Distribute evenly across healthy domains
   - Rest domains showing fatigue
   - Prioritize high-priority campaigns

---

## Outputs

### To Dashboard
- Active allocations
- Capacity vs demand
- Domain utilization
- Pending approvals

### To Supabase
Table: `campaign_allocations`
| Column | Type | Description |
|--------|------|-------------|
| `allocation_id` | uuid | Allocation ID |
| `campaign_id` | text | Campaign identifier |
| `created_at` | timestamp | When created |
| `total_leads` | integer | Total to send |
| `daily_volume` | integer | Per-day sends |
| `start_date` | date | Campaign start |
| `end_date` | date | Projected end |
| `priority` | text | high/medium/low |
| `status` | text | pending/approved/active/complete |
| `approved_by` | text | Who approved |

Table: `domain_assignments`
| Column | Type | Description |
|--------|------|-------------|
| `allocation_id` | uuid | Parent allocation |
| `domain` | text | Assigned domain |
| `daily_limit` | integer | Sends per day for this domain |
| `leads_assigned` | integer | Total leads for domain |
| `audience_type` | text | Audience category |

Table: `allocation_recommendations`
| Column | Type | Description |
|--------|------|-------------|
| `recommendation_id` | uuid | Recommendation ID |
| `campaign_id` | text | Campaign |
| `created_at` | timestamp | When generated |
| `recommendation` | jsonb | Full recommendation |
| `risk_level` | text | low/medium/high |
| `approval_required` | boolean | Needs approval |
| `status` | text | pending/approved/rejected |

### Recommendation Format
```json
{
  "campaign_id": "campaign_abc123",
  "campaign_name": "California HR Directors Q1",
  "request": {
    "total_leads": 800,
    "audience": "HR Directors, California",
    "priority": "high"
  },
  "allocation": {
    "domains": [
      {
        "domain": "domain1.com",
        "daily_limit": 150,
        "leads_assigned": 300,
        "health_score": 92
      },
      {
        "domain": "domain2.com",
        "daily_limit": 150,
        "leads_assigned": 300,
        "health_score": 88
      },
      {
        "domain": "domain3.com",
        "daily_limit": 100,
        "leads_assigned": 200,
        "health_score": 85
      }
    ],
    "daily_total": 400,
    "days_to_complete": 2,
    "start_date": "2025-01-09",
    "end_date": "2025-01-10"
  },
  "risk_assessment": {
    "level": "low",
    "factors": [
      "All domains healthy",
      "Within capacity limits",
      "Audience matches domain strategy"
    ]
  },
  "alternatives": [
    {
      "option": "Extended timeline",
      "details": "Use 2 domains, 4 days",
      "benefit": "Lower volume per domain"
    }
  ]
}
```

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Cannot fulfill request | Critical | Escalate with options |
| Domain mismatch | Warning | Recommend alternative |
| High-risk allocation | Warning | Require additional approval |
| Competing campaigns | Warning | Prioritization needed |

---

## Allocation Algorithm

```
1. Get total leads requested (L)
2. Get available daily capacity (C)
3. Get healthy domains for audience (D)

4. Calculate base allocation:
   days_needed = ceil(L / C)
   per_domain = L / len(D)

5. Apply domain limits:
   For each domain d in D:
     d.allocation = min(per_domain, d.daily_limit * days_needed)

6. Validate total:
   If sum(allocations) < L:
     Extend timeline OR add more domains

7. Apply priority rules:
   If campaign.priority == "high":
     Reserve 20% buffer capacity
     Use best-health domains first
```

---

## Approval Thresholds

| Volume | Approval Level | Timeline |
|--------|----------------|----------|
| <500 leads | Auto-approve | Immediate |
| 500-1000 leads | Lead Intelligence Director | 2 hours |
| 1000-2500 leads | CEO | 4 hours |
| >2500 leads | CEO + Review meeting | 24 hours |

---

## Integration Requirements

- **Supabase** (`SUPABASE_TOKEN`)
- Read access to capacity and domain health data
- Approval workflow system (n8n or similar)

---

## n8n Implementation Notes

### Request Flow
```
Trigger: Webhook (new allocation request)
    |
    v
Supabase: Get capacity and domain health
    |
    v
Function: Match audience to domains
    |
    v
Function: Calculate allocation
    |
    v
Function: Generate recommendation
    |
    v
Supabase: Store recommendation
    |
    v
IF: Requires approval?
    |
    +-- Yes --> Send approval request
    |
    +-- No --> Auto-approve, create allocation
```

### Daily Optimization Flow
```
Trigger: Schedule (8 AM)
    |
    v
Supabase: Get active allocations
    |
    v
Loop: For each allocation
    |
    v
Function: Check actual vs planned
    |
    v
IF: Rebalance needed?
    |
    +-- Yes --> Generate new distribution
    |
    +-- No --> Continue
    |
    v
End Loop
    |
    v
Supabase: Update allocations
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Allocation algorithm implemented
- [ ] Approval workflow configured
- [ ] n8n workflows built
- [ ] Dashboard widget created
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
