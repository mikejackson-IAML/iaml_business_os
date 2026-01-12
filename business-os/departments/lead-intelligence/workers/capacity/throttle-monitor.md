# Throttle Monitor

## Purpose
Continuously monitors sending activity across all platforms and domains, alerting when approaching limits and automatically throttling to prevent deliverability damage.

## Type
Monitor (Automated, Continuous)

## Schedule
Every 30 minutes (`*/30 * * * *`)

---

## Inputs

- **Smartlead API** - Real-time sending stats
- **GHL API** - Sending activity
- **Domain Capacity Tracker** - Domain limits
- **Sending Capacity Calculator** - Total capacity

---

## Metrics Monitored

| Metric | Scope | Alert Threshold |
|--------|-------|-----------------|
| Daily sends | Per domain | 85% of limit |
| Hourly rate | Per domain | Unusual spike |
| Total capacity | All domains | 90% utilized |
| Bounce rate | Per domain | > 2% |
| Queue depth | Platform | Growing rapidly |

---

## Process

1. **Gather Current Activity**
   - Query Smartlead for sends in last hour/day
   - Query GHL for sends in last hour/day
   - Calculate real-time utilization

2. **Check Per-Domain Limits**
   ```
   For each domain:
     utilization = sends_today / daily_limit
     if utilization > 0.85: FLAG
     if utilization > 0.95: THROTTLE
   ```

3. **Check Overall Capacity**
   - Sum all domain utilizations
   - Compare to total daily capacity
   - Flag if approaching critical

4. **Detect Anomalies**
   - Compare to typical hourly patterns
   - Flag unusual spikes
   - Identify potential issues

5. **Apply Throttling**
   - If threshold exceeded: pause domain
   - Redistribute load to other domains
   - Log throttle action

6. **Alert and Report**
   - Update dashboard status
   - Send alerts as needed
   - Log all metrics

---

## Outputs

### To Dashboard
- Real-time utilization gauge
- Per-domain status grid
- Active throttles
- Time until limit reset
- Anomaly alerts

### To Supabase
Table: `throttle_checks`
| Column | Type | Description |
|--------|------|-------------|
| `check_time` | timestamp | When checked |
| `total_sends_today` | integer | All domains combined |
| `total_capacity` | integer | Max possible |
| `utilization_pct` | decimal | Usage percentage |
| `domains_throttled` | integer | Domains currently throttled |
| `anomalies_detected` | integer | Unusual patterns |
| `status` | text | normal/warning/critical |

Table: `domain_throttle_status`
| Column | Type | Description |
|--------|------|-------------|
| `domain` | text | Domain name |
| `check_time` | timestamp | When checked |
| `sends_today` | integer | Emails sent today |
| `daily_limit` | integer | Configured limit |
| `utilization_pct` | decimal | Usage percentage |
| `sends_last_hour` | integer | Hourly rate |
| `is_throttled` | boolean | Currently paused |
| `throttle_reason` | text | Why throttled |

Table: `throttle_actions`
| Column | Type | Description |
|--------|------|-------------|
| `action_id` | uuid | Action ID |
| `action_time` | timestamp | When taken |
| `domain` | text | Affected domain |
| `action_type` | text | throttle/unthrottle/redistribute |
| `reason` | text | Why action taken |
| `previous_state` | text | State before action |
| `new_state` | text | State after action |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Domain > 85% limit | Warning | Dashboard alert |
| Domain > 95% limit | Critical | Auto-throttle + email |
| Total > 90% capacity | Critical | Pause new campaigns |
| Hourly spike > 2x normal | Warning | Investigate |
| Bounce spike | Critical | Throttle domain |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Domain Utilization | 85% | 95% |
| Total Capacity | 80% | 90% |
| Hourly Rate | 150% of avg | 200% of avg |
| Bounce Rate (hourly) | 2% | 3% |

---

## Throttling Rules

### Automatic Throttle Triggers
1. Domain reaches 95% of daily limit
2. Bounce rate exceeds 3% in last hour
3. Spam complaint received
4. Platform rate limit hit

### Throttle Actions
1. **Pause domain** - Stop all sends from domain
2. **Reduce volume** - Cut limit by 50%
3. **Redistribute** - Move load to other domains
4. **Queue hold** - Delay sends until next day

### Unthrottle Conditions
1. 24 hours after daily limit (reset)
2. Bounce rate returns to normal
3. Manual override by Director
4. Platform rate limit lifted

---

## Anomaly Detection

### Normal Patterns
- Sends distributed throughout day
- Higher volume during business hours
- Consistent hourly rates
- Predictable weekly patterns

### Anomalies
- Sudden spike in sends
- All sends in short window
- Unusual bounce patterns
- Queue growing faster than capacity

### Response
1. Flag in dashboard
2. Alert Lead Intelligence Director
3. Investigate cause
4. Take corrective action if needed

---

## Integration Requirements

- **Smartlead API** (`SMARTLEAD_API_KEY`)
- **GHL API** (`GHL_PIT_TOKEN`)
- **Supabase** (`SUPABASE_TOKEN`)

---

## n8n Implementation Notes

```
Trigger: Schedule (every 30 minutes)
    |
    v
HTTP Request: Smartlead - Get sending stats
    |
    v
HTTP Request: GHL - Get sending stats
    |
    v
Supabase: Get domain limits
    |
    v
Function: Calculate utilizations
    |
    v
Loop: Check each domain
    |
    +-- > 95% --> Auto-throttle action
    |
    +-- > 85% --> Warning alert
    |
    +-- Normal --> Continue
    |
    v
End Loop
    |
    v
Function: Check for anomalies
    |
    v
Supabase: Store throttle check
    |
    v
IF: Any critical issues?
    |
    +-- Yes --> Send alerts + take action
    |
    +-- No --> Complete
```

---

## Dashboard Widget

```
┌─────────────────────────────────────────────────────┐
│ THROTTLE STATUS                      Updated: 2:30p │
├─────────────────────────────────────────────────────┤
│                                                      │
│ OVERALL UTILIZATION                                  │
│ ████████████████░░░░░░░░ 72%                        │
│ 1,728 / 2,400 capacity used                         │
│                                                      │
│ PER-DOMAIN STATUS                                    │
│                                                      │
│ domain1.com  ████████░░ 78%   🟢 Normal            │
│ domain2.com  ██████████ 95%   🔴 THROTTLED         │
│ domain3.com  ███████░░░ 68%   🟢 Normal            │
│ domain4.com  ██████░░░░ 55%   🟢 Normal            │
│ domain5.com  ████░░░░░░ 42%   🟢 Normal            │
│                                                      │
│ ACTIVE THROTTLES: 1                                  │
│ domain2.com: Reached 95% limit at 2:15p             │
│              Unthrottles: Tomorrow 12:00a           │
│                                                      │
│ TIME UNTIL LIMIT RESET: 9h 30m                      │
│                                                      │
│ ⚠️ No anomalies detected                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Platform API integrations
- [ ] n8n workflow built
- [ ] Auto-throttle logic implemented
- [ ] Anomaly detection configured
- [ ] Dashboard widget created
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
