# List Health Monitor

## Purpose
Monitor email list health across Smartlead and GHL, tracking bounce rates, unsubscribe rates, and engagement scores to ensure list hygiene and deliverability.

## Type
Monitor (Automated)

## Trigger
- **Schedule:** Daily at 6:00 AM EST
- **Manual:** On-demand via dashboard

---

## Inputs

### Data Sources

**Smartlead MCP:**
- List size by segment
- Bounce counts (hard and soft)
- Unsubscribe counts
- Email engagement (opens in last 30 days)

**GoHighLevel MCP:**
- Contact count
- Recent bounces
- Opt-out list size

**Supabase:**
- Historical list health scores
- Baseline metrics for comparison

---

## Process

### Step 1: Collect Current Metrics

```
For each list/segment:
  - total_contacts
  - hard_bounces_30d
  - soft_bounces_30d
  - unsubscribes_30d
  - engaged_30d (opened or clicked)
  - new_contacts_30d
```

### Step 2: Calculate Health Scores

**Bounce Rate:**
```
bounce_rate = (hard_bounces + soft_bounces) / total_sent × 100
```

**Unsubscribe Rate:**
```
unsub_rate = unsubscribes / total_sent × 100
```

**Engagement Score:**
```
engagement = engaged_contacts / total_contacts × 100
```

**Overall List Health Score:**
```
health_score = 100 - (bounce_rate × 10) - (unsub_rate × 5) + (engagement × 0.5)
Capped at 0-100
```

### Step 3: Compare to Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Bounce Rate | <2% | 2-3% | >3% |
| Unsubscribe Rate | <0.5% | 0.5-1% | >1% |
| Engagement Score | >30% | 20-30% | <20% |
| List Growth | Positive | Flat | Declining >5% |

### Step 4: Identify Issues

Flag specific problems:
- Lists with high bounces (need cleaning)
- Segments with low engagement (need re-engagement or removal)
- Sudden spikes (investigate source)

### Step 5: Generate Recommendations

If issues found:
- "Remove [X] hard bounces from [List]"
- "Re-engage or sunset [X] inactive contacts"
- "Investigate recent import from [Date]"

---

## Outputs

### To Dashboard

```json
{
  "list_health_score": 87,
  "trend": "+2",
  "bounce_rate": 1.8,
  "unsub_rate": 0.3,
  "engagement_score": 34,
  "total_contacts": 12450,
  "status": "healthy"
}
```

### To Supabase

Store daily metrics in `marketing_list_health` table:
- date
- list_name
- total_contacts
- bounce_rate
- unsub_rate
- engagement_score
- health_score
- issues_flagged

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Bounce rate >3% | Warning | Dashboard notification |
| Bounce rate >5% | Critical | Email + Dashboard |
| Unsub rate >1% | Warning | Dashboard notification |
| Engagement <20% | Warning | Dashboard notification |
| List decline >10% weekly | Warning | Dashboard notification |

---

## Integration Requirements

### APIs Needed
- Smartlead API (list and campaign data)
- GoHighLevel API (contact data)
- Supabase (storage)

### Credentials
- `SMARTLEAD_API_KEY`
- `GHL_PIT_TOKEN`
- `SUPABASE_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
1. Trigger: Schedule (6 AM daily)
2. Node: Fetch Smartlead list data
3. Node: Fetch GHL contact data
4. Node: Calculate metrics (Code node)
5. Node: Compare to thresholds
6. Node: Store to Supabase
7. Node: Send alerts if needed

**Estimated Runtime:** 2-5 minutes

---

## Status
- [ ] Spec complete
- [ ] n8n workflow created
- [ ] Testing complete
- [ ] Production enabled
