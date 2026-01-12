# LinkedIn Scraper Manager

## Purpose
Monitors PhantomBuster and Sales Navigator health, usage limits, and operational status to prevent account restrictions and optimize lead sourcing.

## Type
Monitor (Automated)

## Schedule
Every 15 minutes (`*/15 * * * *`)

---

## Inputs

- **PhantomBuster API** - Agent status, execution history, limits
- **Sales Navigator** - Search limits, profile view counts
- **Supabase** - Historical usage data, trend analysis

---

## Platforms Monitored

| Platform | Metrics Tracked | Limits |
|----------|-----------------|--------|
| PhantomBuster | Daily actions, weekly actions, agent status | Daily: 100-150 actions, Weekly: 500-700 |
| Sales Navigator | Profile views, searches, connection requests | Profile views: 100/day, Searches: 25/day |

---

## Process

1. **Fetch PhantomBuster Status**
   - Query API for all active agents
   - Get execution count for current day/week
   - Check agent health and error rates

2. **Fetch Sales Navigator Metrics**
   - Track profile views used today
   - Track searches performed
   - Monitor connection request status

3. **Calculate Usage Percentages**
   - Daily usage % = (actions_today / daily_limit) * 100
   - Weekly usage % = (actions_this_week / weekly_limit) * 100

4. **Evaluate Thresholds**
   - Compare against warning (80%/70%) and critical (95%/90%) limits
   - Flag any rate limit hits or errors

5. **Store Results**
   - Write current status to Supabase
   - Update dashboard metrics

6. **Generate Alerts**
   - Trigger alerts if thresholds exceeded
   - Notify if accounts show restriction signs

---

## Outputs

### To Dashboard
- Current daily usage percentage
- Current weekly usage percentage
- Platform status (healthy/warning/critical)
- Last successful scrape timestamp
- Active agent count

### To Supabase
Table: `linkedin_scraper_status`
| Column | Type | Description |
|--------|------|-------------|
| `check_time` | timestamp | When check was performed |
| `phantombuster_daily_usage` | decimal | Daily usage percentage |
| `phantombuster_weekly_usage` | decimal | Weekly usage percentage |
| `salesnav_profile_views` | integer | Profile views used today |
| `salesnav_searches` | integer | Searches performed today |
| `status` | text | healthy/warning/critical |
| `active_agents` | integer | Number of active PB agents |
| `errors` | jsonb | Any errors encountered |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Daily usage > 80% | Warning | Dashboard notification |
| Daily usage > 95% | Critical | Email alert, pause consideration |
| Weekly usage > 70% | Warning | Dashboard notification |
| Weekly usage > 90% | Critical | Email alert, reduce volume |
| Rate limit hit | Critical | Immediate email, pause all agents |
| Account restricted | Critical | Immediate escalation to CEO |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| PhantomBuster Daily | 80% of limit | 95% of limit |
| PhantomBuster Weekly | 70% of limit | 90% of limit |
| Profile Views Daily | 80/100 | 95/100 |
| Error Rate | > 5% | > 15% |

---

## Integration Requirements

- **PhantomBuster API Key** (`PHANTOMBUSTER_API_KEY`)
- **Supabase** (`SUPABASE_TOKEN`)
- LinkedIn credentials configured in PhantomBuster

---

## n8n Implementation Notes

```
Trigger: Schedule (every 15 minutes)
    |
    v
HTTP Request: PhantomBuster API
    |
    v
Function: Calculate usage percentages
    |
    v
IF: Check thresholds
    |
    +-- Warning --> Supabase Insert + Dashboard Update
    |
    +-- Critical --> Supabase Insert + Email Alert + Slack
    |
    +-- Healthy --> Supabase Insert
```

---

## Recovery Actions

When limits are approached:
1. **80% Daily** - Log warning, consider reducing volume
2. **90% Daily** - Pause non-essential agents
3. **95% Daily** - Pause all agents, wait for reset
4. **Rate Limit** - Immediate pause, investigate, wait 24h minimum

---

## Status

- [x] Worker specification complete
- [ ] Supabase table created
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
