# Sending Capacity Calculator

## Purpose
Calculates total daily email sending capacity across all platforms and domains, providing real-time visibility into how many leads can be contacted and when capacity will be available.

## Type
Agent (Automated)

## Schedule
Daily at 6 AM (`0 6 * * *`) + On-demand recalculation

---

## Inputs

- **Domain Capacity Tracker** - Per-domain health and limits
- **Smartlead API** - Account limits, queue depth
- **GHL API** - Sending limits, account status
- **Supabase** - Historical capacity data

---

## Capacity Components

| Platform | Capacity Factors | Calculation |
|----------|------------------|-------------|
| Smartlead | Domains x Daily limit | Sum of all domain capacities |
| GHL | Account daily limit | Fixed per account |
| SMTP (future) | IP reputation x limit | Per-IP capacity |

---

## Process

1. **Gather Domain Status**
   - Query Domain Capacity Tracker for current health
   - Get per-domain daily limits
   - Apply health multipliers

2. **Calculate Smartlead Capacity**
   ```
   For each domain:
     effective_capacity = daily_limit * health_multiplier

   smartlead_total = sum(effective_capacity for all domains)
   ```

3. **Calculate GHL Capacity**
   - Get account sending limit
   - Check current queue depth
   - Calculate available capacity

4. **Calculate Total Capacity**
   ```
   total_daily_capacity = smartlead_total + ghl_capacity
   ```

5. **Analyze Queue**
   - Get leads awaiting send
   - Calculate days to clear queue
   - Identify capacity constraints

6. **Generate Projections**
   - Next 7 days capacity forecast
   - Impact of domain health changes
   - Capacity by use case

7. **Store and Report**
   - Write capacity metrics to Supabase
   - Update dashboard
   - Alert if capacity issues

---

## Outputs

### To Dashboard
- Total daily capacity (number)
- Current utilization %
- Available headroom
- Queue depth
- Days to clear queue
- Capacity trend (7-day)

### To Supabase
Table: `capacity_calculations`
| Column | Type | Description |
|--------|------|-------------|
| `calc_date` | date | Calculation date |
| `smartlead_capacity` | integer | Smartlead total |
| `ghl_capacity` | integer | GHL total |
| `total_capacity` | integer | Combined capacity |
| `current_queue` | integer | Leads awaiting send |
| `utilization_pct` | decimal | Usage percentage |
| `days_to_clear` | decimal | Queue clearance days |
| `domains_active` | integer | Healthy domains |
| `domains_warning` | integer | Warning status |
| `domains_resting` | integer | Resting domains |

Table: `capacity_by_domain`
| Column | Type | Description |
|--------|------|-------------|
| `calc_date` | date | Calculation date |
| `domain` | text | Domain name |
| `platform` | text | smartlead/ghl |
| `base_limit` | integer | Configured limit |
| `health_score` | integer | 0-100 |
| `health_multiplier` | decimal | 0.0-1.0 |
| `effective_capacity` | integer | Actual capacity |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Utilization > 85% | Warning | Consider capacity increase |
| Utilization > 95% | Critical | Pause new campaigns |
| Days to clear > 5 | Warning | Review queue priority |
| Total capacity < 1000 | Critical | Domain health issues |
| Capacity drop > 30% | Warning | Investigate domain health |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Utilization | > 85% | > 95% |
| Days to Clear Queue | > 3 days | > 7 days |
| Available Headroom | < 500 | < 200 |
| Active Domains | < 5 | < 3 |

---

## Health Multipliers

| Health Status | Score Range | Multiplier |
|---------------|-------------|------------|
| Healthy | 85-100 | 1.0 |
| Warning | 70-84 | 0.5 |
| Critical | 50-69 | 0.25 |
| Resting | 0-49 | 0.0 |

---

## Capacity Allocation Guidelines

| Use Case | Priority | Allocation |
|----------|----------|------------|
| ABM Campaigns | High | Up to 40% |
| General Cold | Medium | Up to 35% |
| Alumni/Nurture | Medium | Up to 20% |
| Buffer/Reserve | Required | 5% minimum |

---

## Integration Requirements

- **Smartlead API** (`SMARTLEAD_API_KEY`)
- **GHL API** (`GHL_PIT_TOKEN`)
- **Supabase** (`SUPABASE_TOKEN`)

---

## n8n Implementation Notes

```
Trigger: Schedule (6 AM daily) OR Manual
    |
    v
Supabase: Get domain health data
    |
    v
Function: Calculate per-domain effective capacity
    |
    v
HTTP Request: Smartlead - Get account limits
    |
    v
HTTP Request: GHL - Get account limits
    |
    v
Function: Sum all capacities
    |
    v
Supabase: Get current queue depth
    |
    v
Function: Calculate utilization and projections
    |
    v
Supabase: Store capacity calculations
    |
    v
IF: Capacity issues?
    |
    +-- Yes --> Generate alert
    |
    +-- No --> Complete
```

---

## Capacity Formulas

### Total Daily Capacity
```
Total = Σ(domain_limit × health_multiplier) for all domains
```

### Utilization
```
Utilization = (queue_depth / total_capacity) × 100
```

### Days to Clear
```
Days = queue_depth / total_capacity
```

### Effective Headroom
```
Headroom = total_capacity - (queue_depth / 1)
         = Total - Today's queue consumption
```

---

## Reporting Format

```
┌─────────────────────────────────────────────────────┐
│ CAPACITY REPORT - 2025-01-08                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ TOTAL DAILY CAPACITY: 2,400 emails                  │
│                                                      │
│ Platform Breakdown:                                  │
│   Smartlead: 2,100 (12 domains)                     │
│   GHL: 300 (account limit)                          │
│                                                      │
│ CURRENT UTILIZATION                                  │
│ ████████████████████░░░░░ 77%                       │
│                                                      │
│ Queue Depth: 1,850                                  │
│ Available Today: 550                                │
│ Days to Clear: 0.8                                  │
│                                                      │
│ DOMAIN STATUS                                        │
│ Active (healthy): 9                                 │
│ Warning: 2                                          │
│ Resting: 1                                          │
│                                                      │
│ RECOMMENDATIONS                                      │
│ ✅ Capacity healthy for current queue               │
│ ⚠️ 2 domains approaching warning threshold         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Platform API integrations
- [ ] n8n workflow built
- [ ] Dashboard widget created
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
