# Domain Capacity Tracker

## Purpose
Monitors health, reputation, and sending limits for each email domain, managing domain rotation to maintain high deliverability and protect domain reputation.

## Type
Monitor (Automated)

## Schedule
Every 4 hours (`0 */4 * * *`)

---

## Inputs

- **Smartlead API** - Domain stats, bounce rates, spam reports
- **GHL API** - Domain performance metrics
- **Email provider APIs** - DNS records, blacklist status
- **Supabase** - Historical domain health data

---

## Domains Tracked

| Category | Count | Daily Limit | Purpose |
|----------|-------|-------------|---------|
| Primary | 1 | 0 | Transactional only (protected) |
| Established | 5-7 | 200-400 | Main marketing sends |
| Warming | 2-4 | 20-50 | Building reputation |
| Resting | 1-3 | 0 | Recovery period |

---

## Health Metrics Per Domain

| Metric | Description | Weight |
|--------|-------------|--------|
| Bounce Rate | Hard + soft bounces / sends | 0.30 |
| Spam Rate | Spam complaints / sends | 0.25 |
| Open Rate | Opens / delivered | 0.20 |
| Blacklist Status | Listed on major blacklists | 0.15 |
| Age/Reputation | Domain age and history | 0.10 |

---

## Process

1. **Fetch Domain Stats**
   - Query Smartlead for each domain
   - Get bounce, open, spam rates
   - Pull recent sending volume

2. **Check Blacklists**
   - Query major blacklist APIs
   - Check Spamhaus, Barracuda, etc.
   - Flag any listings

3. **Calculate Health Score**
   ```
   health_score = 100 - (bounce_penalty + spam_penalty +
                         blacklist_penalty - open_bonus)
   ```

4. **Determine Status**
   - Score 85-100: Healthy (full capacity)
   - Score 70-84: Warning (reduce capacity)
   - Score 50-69: Critical (minimal sends)
   - Score <50: Rest (no sends)

5. **Apply Rotation Logic**
   - Domains hitting warning -> reduce volume
   - Domains in rest period -> track recovery
   - Warming domains -> gradual increase

6. **Store and Alert**
   - Update domain records
   - Update capacity calculations
   - Alert on status changes

---

## Outputs

### To Dashboard
- Domain health grid
- Domains by status count
- Average health score
- Domains needing attention
- Rotation recommendations

### To Supabase
Table: `domain_health`
| Column | Type | Description |
|--------|------|-------------|
| `domain` | text | Domain name |
| `check_time` | timestamp | When checked |
| `bounce_rate` | decimal | Current bounce % |
| `spam_rate` | decimal | Spam complaint % |
| `open_rate` | decimal | Open rate % |
| `sends_24h` | integer | Emails sent in 24h |
| `health_score` | integer | 0-100 score |
| `status` | text | healthy/warning/critical/resting |
| `daily_limit` | integer | Current sending limit |
| `blacklisted` | boolean | On any blacklist |
| `blacklist_details` | jsonb | Which lists if any |

Table: `domain_rotation_log`
| Column | Type | Description |
|--------|------|-------------|
| `domain` | text | Domain name |
| `action` | text | rest_started/rest_ended/limit_changed |
| `action_time` | timestamp | When action occurred |
| `previous_status` | text | Status before change |
| `new_status` | text | Status after change |
| `reason` | text | Why action taken |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Bounce rate > 2% | Warning | Reduce volume 50% |
| Bounce rate > 5% | Critical | Rest domain immediately |
| Spam complaints > 0 | Warning | Investigate |
| Spam complaints > 2 | Critical | Rest domain |
| Blacklisted | Critical | Immediate escalation |
| Health score drop > 20pts | Warning | Review sending patterns |

---

## Thresholds

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Bounce Rate | <2% | 2-5% | >5% |
| Spam Complaints | 0 | 1-2 | >2 |
| Open Rate | >25% | 15-25% | <15% |
| Health Score | 85-100 | 70-84 | <70 |

---

## Health Score Calculation

```
Base Score: 100

Penalties:
- Bounce Rate: (bounce_rate - 1%) × 10 (if > 1%)
- Spam Rate: spam_count × 15
- Blacklist: 30 per major list
- Low Opens: (25% - open_rate) × 0.5 (if < 25%)

Bonuses:
- High Opens: (open_rate - 30%) × 0.3 (if > 30%)
- Clean History: +5 if no issues in 30 days
- Domain Age: +5 if > 6 months

Final = max(0, min(100, Base - Penalties + Bonuses))
```

---

## Rotation Rules

### When to Rest
1. Bounce rate exceeds 5%
2. Spam complaints exceed 2
3. Added to major blacklist
4. Health score drops below 50

### Rest Period
- Minimum: 7 days
- Standard: 14 days
- Extended: 30 days (if blacklisted)

### Recovery Protocol
1. Monitor for blacklist removal
2. Start with 10% of previous volume
3. Increase 20% every 3 days if healthy
4. Return to full capacity after 2 weeks

### Warming Protocol
1. Start at 20 emails/day
2. Increase 20% every 3 days
3. Target: 100 emails/day by week 2
4. Target: 200+ emails/day by week 4
5. Move to "Established" when stable at target

---

## Integration Requirements

- **Smartlead API** (`SMARTLEAD_API_KEY`)
- **GHL API** (`GHL_PIT_TOKEN`)
- **Blacklist check APIs** (MXToolbox, etc.)
- **Supabase** (`SUPABASE_TOKEN`)

---

## n8n Implementation Notes

```
Trigger: Schedule (every 4 hours)
    |
    v
Loop: For each domain
    |
    v
HTTP Request: Get domain stats from Smartlead/GHL
    |
    v
HTTP Request: Check blacklists
    |
    v
Function: Calculate health score
    |
    v
IF: Status changed?
    |
    +-- Yes --> Log rotation action
    |
    +-- No --> Continue
    |
    v
End Loop
    |
    v
Supabase: Bulk update domain health
    |
    v
IF: Any critical domains?
    |
    +-- Yes --> Alert + update capacity
    |
    +-- No --> Complete
```

---

## Domain Health Dashboard

```
┌─────────────────────────────────────────────────────┐
│ DOMAIN HEALTH STATUS                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ESTABLISHED DOMAINS                                  │
│ ┌────────────────┬────────┬────────┬──────────────┐ │
│ │ Domain         │ Score  │ Sends  │ Status       │ │
│ ├────────────────┼────────┼────────┼──────────────┤ │
│ │ domain1.com    │ 95 🟢  │ 287    │ Healthy      │ │
│ │ domain2.com    │ 88 🟢  │ 312    │ Healthy      │ │
│ │ domain3.com    │ 91 🟢  │ 245    │ Healthy      │ │
│ │ domain4.com    │ 72 🟡  │ 150    │ Warning      │ │
│ │ domain5.com    │ 65 🟠  │ 50     │ Critical     │ │
│ └────────────────┴────────┴────────┴──────────────┘ │
│                                                      │
│ WARMING DOMAINS                                      │
│ domain6.com: Day 12 of warming (45/day) 🟢          │
│ domain7.com: Day 5 of warming (30/day) 🟢           │
│                                                      │
│ RESTING DOMAINS                                      │
│ domain8.com: Day 8 of 14 rest period                │
│                                                      │
│ RECOMMENDATIONS                                      │
│ ⚠️ domain4.com: Reduce volume, investigate bounces │
│ 🔴 domain5.com: Rest immediately, high bounce rate │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Platform API integrations
- [ ] Blacklist check integration
- [ ] n8n workflow built
- [ ] Health score algorithm implemented
- [ ] Dashboard widget created
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
