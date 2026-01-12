# Apollo Manager

## Purpose
Monitors Apollo.io credit usage, search job status, and extraction health to ensure efficient B2B data sourcing and prevent credit exhaustion.

## Type
Monitor (Automated)

## Schedule
Daily at 6 AM (`0 6 * * *`)

---

## Inputs

- **Apollo API** - Credit balance, search history, enrichment status
- **Supabase** - Historical credit usage, cost per lead trends

---

## Metrics Tracked

| Metric | Description | Target |
|--------|-------------|--------|
| Credit Balance | Remaining credits in account | > 30% of monthly |
| Credits Used Today | Credits consumed in last 24h | Within daily budget |
| Credits Used This Month | Total monthly consumption | Within monthly budget |
| Cost Per Lead | Avg credits per usable lead | < 2 credits |
| Extraction Success Rate | Valid leads / total extracted | > 92% |

---

## Process

1. **Fetch Apollo Account Status**
   - Query API for current credit balance
   - Get credit usage history for day/week/month
   - Check enrichment queue status

2. **Calculate Metrics**
   - Credits remaining percentage
   - Daily burn rate
   - Projected days until exhaustion
   - Cost per lead (credits / valid leads)

3. **Analyze Quality**
   - Review recent extraction results
   - Calculate validation pass rate
   - Identify low-quality search patterns

4. **Generate Projections**
   - Days until credit exhaustion at current rate
   - Recommended daily budget to last until reset

5. **Store and Alert**
   - Write metrics to Supabase
   - Trigger alerts if thresholds crossed

---

## Outputs

### To Dashboard
- Current credit balance (number and %)
- Credits used today/this week
- Projected exhaustion date
- Quality score (validation rate)
- Last extraction status

### To Supabase
Table: `apollo_status`
| Column | Type | Description |
|--------|------|-------------|
| `check_date` | date | Date of check |
| `credits_remaining` | integer | Current credit balance |
| `credits_remaining_pct` | decimal | Percentage remaining |
| `credits_used_today` | integer | Credits used in last 24h |
| `credits_used_month` | integer | Credits used this month |
| `cost_per_lead` | decimal | Avg credits per valid lead |
| `extraction_success_rate` | decimal | Valid leads percentage |
| `projected_exhaustion` | date | When credits will run out |
| `status` | text | healthy/warning/critical |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Credits < 30% remaining | Warning | Dashboard notification |
| Credits < 10% remaining | Critical | Email alert, prioritize high-value only |
| Exhaustion < 7 days | Warning | Email alert, reduce usage |
| Exhaustion < 3 days | Critical | Escalate, request budget |
| Extraction rate < 85% | Warning | Review search criteria |
| Cost per lead > 3 | Warning | Optimize search patterns |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Credits Remaining | 30% | 10% |
| Days to Exhaustion | 7 days | 3 days |
| Cost Per Lead | > 2.5 credits | > 4 credits |
| Extraction Rate | < 90% | < 80% |

---

## Credit Budget Guidelines

| Use Case | Priority | Credit Allocation |
|----------|----------|-------------------|
| ABM Target Lists | High | Up to 40% of monthly |
| General Prospecting | Medium | Up to 35% of monthly |
| Enrichment Only | Low | Up to 15% of monthly |
| Research/Testing | Low | Up to 10% of monthly |

---

## Integration Requirements

- **Apollo API Key** (`APOLLO_API_KEY`)
- **Supabase** (`SUPABASE_TOKEN`)

---

## n8n Implementation Notes

```
Trigger: Schedule (daily 6 AM)
    |
    v
HTTP Request: Apollo API - Get Account
    |
    v
HTTP Request: Apollo API - Get Usage Stats
    |
    v
Function: Calculate metrics and projections
    |
    v
Supabase: Insert status record
    |
    v
IF: Check thresholds
    |
    +-- Critical --> Email + Slack alert
    |
    +-- Warning --> Dashboard notification
    |
    +-- Healthy --> Complete
```

---

## Optimization Recommendations

When credits are low:
1. **Prioritize** - Focus on highest-value segments only
2. **Batch** - Combine similar searches to reduce overhead
3. **Cache** - Check existing database before new searches
4. **Quality** - Tighten search criteria to improve hit rate

---

## Status

- [x] Worker specification complete
- [ ] Supabase table created
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
