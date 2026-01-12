# Lifecycle Manager

## Purpose
Tracks contact lifecycle stages, manages transitions, archives stale leads, and maintains a healthy contact database by enforcing retention policies.

## Type
Agent (Automated)

## Schedule
Weekly on Sunday at 3 AM (`0 3 * * 0`)

---

## Inputs

- **Supabase** - Contact database with activity history
- **Campaign data** - Engagement metrics
- **Platform Sync Manager** - Cross-platform status

---

## Lifecycle Stages

```
┌─────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐
│   New   │ → │ Validated │ → │ Enriched │ → │ Assigned │ → │Contacted│
└─────────┘   └───────────┘   └──────────┘   └──────────┘   └────┬────┘
                                                                  │
                                              ┌───────────────────┴───────┐
                                              ↓                           ↓
                                        ┌──────────┐              ┌───────────┐
                                        │ Engaged  │              │   Stale   │
                                        └────┬─────┘              └─────┬─────┘
                                             │                          │
                                             ↓                          ↓
                                      ┌────────────┐            ┌───────────┐
                                      │ Converted  │            │ Archived  │
                                      └────────────┘            └───────────┘
```

---

## Stage Definitions

| Stage | Definition | Entry Criteria |
|-------|------------|----------------|
| New | Just imported, unprocessed | Import complete |
| Validated | Email verified | Email validation pass |
| Enriched | Data completed | Enrichment complete |
| Assigned | Allocated to campaign | Campaign allocation |
| Contacted | First outreach sent | First email sent |
| Engaged | Showed interest | Open, click, or reply |
| Converted | Became customer | Registration or purchase |
| Stale | No engagement after outreach | 90+ days no activity |
| Archived | Removed from active pool | 180+ days stale OR request |

---

## Process

### Stage Transitions

1. **Identify Candidates**
   - Query contacts in each stage
   - Check transition criteria
   - Calculate days in stage

2. **Automatic Transitions**
   ```
   New → Validated: email_validated = true
   Validated → Enriched: enrichment_complete = true
   Assigned → Contacted: first_email_sent = true
   Contacted → Engaged: has_engagement = true
   Engaged → Converted: has_conversion = true
   Contacted → Stale: days_since_contact > 90 AND no_engagement
   Stale → Archived: days_stale > 90
   ```

3. **Update Records**
   - Set new lifecycle_stage
   - Log transition
   - Update timestamps

### Stale Detection

4. **Identify Stale Contacts**
   - Contacted > 90 days ago
   - No opens, clicks, or replies
   - No conversion events

5. **Stale Handling**
   - Move to Stale stage
   - Remove from active campaigns
   - Flag for re-engagement consideration

### Archive Processing

6. **Archive Candidates**
   - Stale > 90 days
   - Hard bounced
   - Explicit opt-out
   - Compliance requests

7. **Archive Actions**
   - Move to archived status
   - Remove from all platforms
   - Maintain record for compliance

### Cleanup

8. **Data Cleanup**
   - Remove orphan records
   - Fix inconsistent states
   - Update calculated fields

---

## Outputs

### To Dashboard
- Contacts by stage (chart)
- Stage transitions this week
- Stale contacts count
- Archived this week

### To Supabase
Table: `lifecycle_transitions`
| Column | Type | Description |
|--------|------|-------------|
| `transition_id` | uuid | Transition ID |
| `contact_id` | uuid | Contact |
| `from_stage` | text | Previous stage |
| `to_stage` | text | New stage |
| `transition_time` | timestamp | When changed |
| `trigger` | text | What caused change |
| `automated` | boolean | Auto or manual |

Table: `lifecycle_reports`
| Column | Type | Description |
|--------|------|-------------|
| `report_date` | date | Report date |
| `stage` | text | Lifecycle stage |
| `count` | integer | Contacts in stage |
| `entered_week` | integer | Entered this week |
| `exited_week` | integer | Exited this week |
| `avg_days_in_stage` | decimal | Average duration |

Table: `archive_log`
| Column | Type | Description |
|--------|------|-------------|
| `archive_id` | uuid | Archive ID |
| `contact_id` | uuid | Contact |
| `archived_at` | timestamp | When archived |
| `reason` | text | Why archived |
| `previous_stage` | text | Stage before archive |
| `can_restore` | boolean | Restorable |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Stale rate > 30% | Warning | Review campaign effectiveness |
| Archive rate > 10%/week | Warning | Investigate data quality |
| Stuck in stage > 30 days | Warning | Check pipeline flow |
| Conversion drop > 20% | Critical | Review campaign performance |

---

## Thresholds

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Stale Rate | < 20% | 20-30% | > 30% |
| Weekly Archive | < 5% | 5-10% | > 10% |
| Avg Days Stale→Archive | 90 | 60 | 30 |
| Pipeline Velocity | < 14 days | 14-30 days | > 30 days |

---

## Retention Policies

| Category | Retention | Action After |
|----------|-----------|--------------|
| Active contacts | Indefinite | N/A |
| Stale contacts | 90 days | Archive |
| Archived contacts | 2 years | Delete |
| Hard bounces | 30 days active | Archive |
| Opt-outs | Forever | Do-not-contact |

---

## Re-engagement Triggers

Before archiving stale contacts, consider:
1. High-value title/company → Re-engagement campaign
2. Previous engagement → Nurture sequence
3. Industry match → Educational content
4. Recently enriched → Fresh outreach

---

## Integration Requirements

- **Supabase** (`SUPABASE_TOKEN`)
- Write access to contact lifecycle fields
- Access to campaign engagement data

---

## n8n Implementation Notes

```
Trigger: Schedule (Sunday 3 AM)
    |
    v
Supabase: Get all contacts with lifecycle data
    |
    v
Function: Calculate days in current stage
    |
    v
Loop: Process each stage
    |
    +---> New → Validated (if validated)
    |
    +---> Validated → Enriched (if enriched)
    |
    +---> Contacted → Engaged (if engagement)
    |
    +---> Contacted → Stale (if 90+ days, no engagement)
    |
    +---> Engaged → Converted (if conversion)
    |
    +---> Stale → Archive (if 90+ days stale)
    |
    v
Supabase: Batch update lifecycle stages
    |
    v
Supabase: Log all transitions
    |
    v
Function: Generate weekly report
    |
    v
Supabase: Store lifecycle report
    |
    v
IF: Any concerning trends?
    |
    +-- Yes --> Alert + recommendations
    |
    +-- No --> Complete
```

---

## Dashboard Widget

```
┌─────────────────────────────────────────────────────┐
│ CONTACT LIFECYCLE                                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ FUNNEL OVERVIEW                                      │
│                                                      │
│ New          ██░░░░░░░░░░░░░░░░░░  2,100            │
│ Validated    ████░░░░░░░░░░░░░░░░  4,200            │
│ Enriched     ███████░░░░░░░░░░░░░  6,800            │
│ Assigned     ██████░░░░░░░░░░░░░░  5,400            │
│ Contacted    ████░░░░░░░░░░░░░░░░  3,800            │
│ Engaged      ██░░░░░░░░░░░░░░░░░░  1,500            │
│ Converted    █░░░░░░░░░░░░░░░░░░░  732              │
│                                                      │
│ THIS WEEK'S TRANSITIONS                              │
│ New → Validated:     340                            │
│ Validated → Enriched: 280                           │
│ Contacted → Engaged:  45                            │
│ Engaged → Converted:  12                            │
│ Contacted → Stale:    89                            │
│ Stale → Archived:     34                            │
│                                                      │
│ HEALTH METRICS                                       │
│ Stale Rate:      18% 🟢                             │
│ Conversion Rate: 19% 🟢                             │
│ Pipeline Velocity: 12 days 🟢                       │
│                                                      │
│ ACTIONS                                              │
│ • 89 new stale contacts - consider re-engagement    │
│ • 34 contacts archived this week                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase lifecycle tables created
- [ ] Transition logic implemented
- [ ] Archive process built
- [ ] Re-engagement rules configured
- [ ] n8n workflow built
- [ ] Dashboard widget created
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
