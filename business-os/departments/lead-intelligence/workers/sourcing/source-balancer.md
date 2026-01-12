# Source Balancer

## Purpose
Intelligently distributes lead sourcing across platforms (PhantomBuster, Apollo, Apify) to avoid rate limits, optimize costs, and maintain platform health while meeting lead volume targets.

## Type
Agent (Automated with decision-making)

## Schedule
Daily at 7 AM (`0 7 * * *`)

---

## Inputs

- **LinkedIn Scraper Manager** - PhantomBuster/Sales Navigator status
- **Apollo Manager** - Credit balance and usage
- **Apify Manager** - Compute unit availability
- **Marketing requests** - Lead volume requirements
- **Supabase** - Historical source quality data

---

## Decision Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Platform Health | 0.30 | Current limit usage and status |
| Cost Efficiency | 0.25 | Cost per lead by source |
| Lead Quality | 0.25 | Historical validation rates |
| Capacity Available | 0.20 | Remaining limits/credits |

---

## Source Evaluation Matrix

| Source | Best For | Typical Cost | Quality Score |
|--------|----------|--------------|---------------|
| Apollo | HR titles, enrichment | $0.50-1.00/lead | 92% |
| PhantomBuster | LinkedIn profiles | $0.10-0.20/lead | 88% |
| Sales Navigator | Targeted searches | Subscription | 90% |
| Apify | Custom/niche sources | $0.01-0.05/lead | 85% |

---

## Process

1. **Gather Current Status**
   - Read platform health from monitors
   - Get remaining capacity per platform
   - Calculate available budget

2. **Analyze Pending Requests**
   - Check campaign lead requirements
   - Identify target segments
   - Calculate total leads needed

3. **Score Each Source**
   ```
   Source Score = (health_score * 0.30) +
                  (cost_efficiency * 0.25) +
                  (quality_score * 0.25) +
                  (capacity_pct * 0.20)
   ```

4. **Create Allocation Plan**
   - Assign leads to sources based on scores
   - Respect platform limits
   - Optimize for quality within budget

5. **Generate Recommendations**
   - Specific pull quantities per source
   - Timing recommendations
   - Risk warnings

6. **Store and Notify**
   - Save plan to Supabase
   - Update dashboard
   - Notify if manual approval needed

---

## Outputs

### To Dashboard
- Today's recommended source allocation
- Platform health summary
- Cost projection
- Risk indicators

### To Supabase
Table: `source_allocation_plans`
| Column | Type | Description |
|--------|------|-------------|
| `plan_date` | date | Date of plan |
| `total_leads_needed` | integer | Total requirement |
| `apollo_allocation` | integer | Leads from Apollo |
| `phantombuster_allocation` | integer | Leads from PB |
| `apify_allocation` | integer | Leads from Apify |
| `estimated_cost` | decimal | Projected total cost |
| `risk_level` | text | low/medium/high |
| `recommendations` | jsonb | Detailed recommendations |
| `approval_required` | boolean | Needs manual approval |

### Recommendations Format
```json
{
  "primary_source": "apollo",
  "allocations": [
    {"source": "apollo", "quantity": 500, "priority": "high"},
    {"source": "phantombuster", "quantity": 200, "priority": "medium"},
    {"source": "apify", "quantity": 100, "priority": "low"}
  ],
  "timing": {
    "apollo": "immediate",
    "phantombuster": "spread over 2 days",
    "apify": "after primary sources"
  },
  "warnings": [
    "PhantomBuster at 70% weekly limit - reduce volume",
    "Apollo credits will last ~10 days at this rate"
  ],
  "cost_breakdown": {
    "apollo": 250.00,
    "phantombuster": 0,
    "apify": 5.00,
    "total": 255.00
  }
}
```

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Cannot meet lead target | Critical | Escalate with options |
| All sources at warning | Warning | Reduce volume, notify |
| Cost exceeds budget | Warning | Recommend alternatives |
| Single source dependency | Warning | Diversify sources |

---

## Allocation Rules

### Priority Rules
1. **Never exceed** platform critical thresholds
2. **Prefer** sources with highest quality scores
3. **Distribute** to avoid single-source dependency
4. **Reserve** 20% capacity buffer on all platforms

### Cost Rules
1. Use free/subscription sources first (Sales Navigator, PhantomBuster base)
2. Use credit-based sources for high-value targets
3. Batch requests to optimize Apollo credits

### Quality Rules
1. Match source to segment (Apollo for HR titles, PB for LinkedIn profiles)
2. Avoid sources with <85% validation rate for critical campaigns
3. Test new sources with small batches first

---

## Integration Requirements

- **Supabase** (`SUPABASE_TOKEN`) - Read platform status, write plans
- Read access to all platform monitor tables

---

## n8n Implementation Notes

```
Trigger: Schedule (7 AM daily)
    |
    v
Supabase: Read platform status (all sources)
    |
    v
Supabase: Read pending lead requests
    |
    v
Function: Calculate source scores
    |
    v
Function: Generate allocation plan
    |
    v
IF: Large request (>1000 leads)?
    |
    +-- Yes --> Store plan + Request approval
    |
    +-- No --> Store plan + Auto-approve
    |
    v
Dashboard: Update source allocation widget
```

---

## Manual Override

The Source Balancer recommendations can be overridden by:
1. Marketing Director for campaign-specific needs
2. CEO for budget considerations
3. Lead Intelligence Director for platform concerns

Overrides are logged for learning purposes.

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Scoring algorithm implemented
- [ ] n8n workflow built
- [ ] Dashboard widget created
- [ ] Initial testing complete
- [ ] Production deployment
