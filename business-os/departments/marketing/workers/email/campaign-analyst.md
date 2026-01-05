# Campaign Analyst

## Purpose
Analyze email campaign performance after each send, comparing results to playbook benchmarks and tracking trends over time.

## Type
Monitor (Automated)

## Trigger
- **Event:** 48 hours after campaign send completes
- **Manual:** On-demand via dashboard

---

## Inputs

### Data Sources

**Smartlead MCP:**
- Campaign metrics (sends, opens, clicks, replies, bounces)
- Per-email breakdown for sequences
- Send timestamps

**GoHighLevel MCP:**
- Campaign metrics for past participant emails
- Engagement events

**Business OS Knowledge:**
- `EMAIL_COLD_OUTREACH.md` — Benchmark metrics
- `EMAIL_NURTURE_ALUMNI.md` — Alumni benchmarks

---

## Process

### Step 1: Identify Completed Campaigns

Check for campaigns that:
- Completed sending 48+ hours ago
- Have not yet been analyzed
- Have minimum sample size (50+ sends)

### Step 2: Collect Metrics

For each campaign:
```
{
  campaign_id: string,
  campaign_name: string,
  type: "cold_abm" | "cold_general" | "alumni" | "nurture",
  sent: number,
  delivered: number,
  opens: number,
  unique_opens: number,
  clicks: number,
  replies: number,
  bounces: number,
  unsubscribes: number,
  send_date: datetime
}
```

### Step 3: Calculate Performance Metrics

```
open_rate = unique_opens / delivered × 100
click_rate = clicks / delivered × 100
click_to_open = clicks / unique_opens × 100
reply_rate = replies / delivered × 100
bounce_rate = bounces / sent × 100
unsub_rate = unsubscribes / delivered × 100
```

### Step 4: Compare to Benchmarks

**Cold Outreach Benchmarks (from playbook):**

| Metric | Below Average | Good | Great |
|--------|---------------|------|-------|
| Open Rate | <15% | 25% | 35%+ |
| Click Rate | <1% | 3% | 5%+ |
| Reply Rate | <0.5% | 2% | 5%+ |
| Bounce Rate | >3% | <2% | <1% |

**Alumni Benchmarks:**

| Metric | Below Average | Good | Great |
|--------|---------------|------|-------|
| Open Rate | <25% | 35% | 50%+ |
| Click Rate | <3% | 5% | 10%+ |

### Step 5: Generate Performance Assessment

Rate each metric:
- **Excellent** — Exceeds "Great" benchmark
- **Good** — Meets "Good" benchmark
- **Needs Attention** — Below "Good" benchmark
- **Investigate** — Below "Below Average"

### Step 6: Identify Patterns

Compare to:
- Previous campaigns of same type
- Same audience segment
- Same subject line patterns
- Same send time

### Step 7: Generate Insights

If performance anomaly detected:
- "Open rate 15% higher than segment average — subject line pattern worth replicating"
- "Click rate below benchmark — review CTA placement"
- "Bounce rate elevated — check list source"

---

## Outputs

### To Dashboard

```json
{
  "campaign_name": "Q1 ABM Sequence",
  "status": "performing",
  "open_rate": 34,
  "open_rate_status": "good",
  "click_rate": 4.2,
  "click_rate_status": "good",
  "reply_rate": 3.1,
  "reply_rate_status": "good",
  "vs_benchmark": "+12%",
  "insights": ["Subject line outperformed average"]
}
```

### To Supabase

Store in `marketing_campaign_performance` table:
- campaign_id
- campaign_name
- campaign_type
- sent_date
- analyzed_date
- sent, delivered, opens, clicks, replies, bounces
- open_rate, click_rate, reply_rate, bounce_rate
- performance_rating
- insights (JSON array)
- benchmark_comparison

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Bounce rate >5% | Critical | Email + Dashboard |
| Open rate <15% | Warning | Dashboard notification |
| Reply rate >5% | Info | Dashboard highlight (success) |
| Unusual pattern detected | Info | Dashboard insight |

---

## Integration Requirements

### APIs Needed
- Smartlead API
- GoHighLevel API
- Supabase

### Credentials
- `SMARTLEAD_API_KEY`
- `GHL_PIT_TOKEN`
- `SUPABASE_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
1. Trigger: Schedule (check every 6 hours) or Webhook (campaign complete)
2. Node: Query campaigns completed 48h ago
3. Node: Fetch metrics from Smartlead/GHL
4. Node: Calculate rates (Code node)
5. Node: Load benchmarks
6. Node: Compare and assess
7. Node: Generate insights
8. Node: Store to Supabase
9. Node: Send alerts if needed

**Estimated Runtime:** 1-3 minutes per campaign

---

## Status
- [ ] Spec complete
- [ ] n8n workflow created
- [ ] Testing complete
- [ ] Production enabled
