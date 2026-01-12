# Platform Sync Manager

## Purpose
Keeps contact data synchronized across Smartlead, GoHighLevel, Apollo, and Supabase, ensuring consistency and preventing data drift between platforms.

## Type
Agent (Automated)

## Schedule
Hourly (`0 * * * *`)

---

## Inputs

- **Supabase** - Master contact database
- **Smartlead API** - Email campaign platform
- **GHL API** - CRM and marketing automation
- **Apollo API** - B2B data platform

---

## Platforms Synced

| Platform | Direction | Frequency | Data Synced |
|----------|-----------|-----------|-------------|
| Smartlead | Bidirectional | Hourly | Contacts, campaign status, bounces |
| GHL | Bidirectional | Hourly | Contacts, engagement, conversions |
| Apollo | Pull only | Daily | Enrichment updates |
| Supabase | Master | Real-time | All contact data |

---

## Sync Operations

### Supabase → Smartlead
- New validated leads for campaigns
- Updated contact information
- Suppression list additions

### Smartlead → Supabase
- Campaign activity (opens, clicks)
- Bounce notifications
- Reply detection
- Unsubscribe events

### Supabase → GHL
- Past participants
- Converted leads
- Updated contact info

### GHL → Supabase
- New registrations
- Engagement events
- Lifecycle updates

### Apollo → Supabase
- Enrichment data refreshes
- Company data updates

---

## Process

1. **Initialize Sync Cycle**
   - Get last sync timestamp per platform
   - Set sync window
   - Log sync start

2. **Pull Updates from Platforms**
   ```
   For each platform:
     Get records modified since last_sync
     Transform to common schema
     Queue for merge
   ```

3. **Merge Logic**
   - Compare timestamps
   - Prefer most recent update
   - Handle conflicts

4. **Push Updates to Platforms**
   ```
   For each platform:
     Get Supabase records modified since last_sync
     Filter relevant for platform
     Push updates
   ```

5. **Sync Verification**
   - Count records per platform
   - Identify discrepancies
   - Log sync results

6. **Handle Failures**
   - Retry failed syncs
   - Log errors
   - Alert on persistent failures

---

## Outputs

### To Dashboard
- Last sync time per platform
- Records synced
- Sync status (success/warning/error)
- Discrepancies

### To Supabase
Table: `sync_log`
| Column | Type | Description |
|--------|------|-------------|
| `sync_id` | uuid | Sync cycle ID |
| `sync_time` | timestamp | When sync ran |
| `platform` | text | Platform synced |
| `direction` | text | push/pull/both |
| `records_pulled` | integer | Records from platform |
| `records_pushed` | integer | Records to platform |
| `conflicts` | integer | Merge conflicts |
| `errors` | integer | Failed operations |
| `status` | text | success/partial/failed |
| `duration_ms` | integer | Sync duration |

Table: `sync_conflicts`
| Column | Type | Description |
|--------|------|-------------|
| `conflict_id` | uuid | Conflict ID |
| `sync_id` | uuid | Parent sync |
| `contact_id` | uuid | Affected contact |
| `platform` | text | Platform with conflict |
| `field` | text | Conflicting field |
| `supabase_value` | text | Our value |
| `platform_value` | text | Their value |
| `resolution` | text | How resolved |
| `resolved_at` | timestamp | When resolved |

Table: `sync_errors`
| Column | Type | Description |
|--------|------|-------------|
| `error_id` | uuid | Error ID |
| `sync_id` | uuid | Parent sync |
| `platform` | text | Platform with error |
| `operation` | text | What failed |
| `error_message` | text | Error details |
| `contact_id` | uuid | Affected contact |
| `retry_count` | integer | Retry attempts |
| `resolved` | boolean | Is it fixed |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Sync failed | Critical | Immediate alert |
| Discrepancy > 100 | Warning | Investigate |
| Conflicts > 10 | Warning | Manual review |
| 3+ consecutive failures | Critical | Escalate |
| Duration > 10 min | Warning | Performance check |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Sync Failures | 1 | 3 consecutive |
| Discrepancy | > 50 records | > 100 records |
| Conflicts per Sync | > 5 | > 20 |
| Sync Duration | > 5 min | > 15 min |

---

## Conflict Resolution Rules

| Scenario | Resolution |
|----------|------------|
| Email change | Keep Supabase (master) |
| Name change | Keep most recent |
| Status change | Keep platform status |
| Bounce/unsub | Always accept platform |
| Enrichment data | Prefer Apollo data |
| Campaign data | Keep Smartlead data |

---

## Field Mapping

### Smartlead Mapping
| Supabase Field | Smartlead Field |
|----------------|-----------------|
| email | email |
| first_name | firstName |
| last_name | lastName |
| company | company |
| title | jobTitle |
| phone | phone |
| lifecycle_stage | customField1 |

### GHL Mapping
| Supabase Field | GHL Field |
|----------------|-----------|
| email | email |
| first_name | firstName |
| last_name | lastName |
| company | companyName |
| title | title |
| phone | phone |
| past_participant | tags |

---

## Integration Requirements

- **Supabase** (`SUPABASE_TOKEN`)
- **Smartlead API** (`SMARTLEAD_API_KEY`)
- **GHL API** (`GHL_PIT_TOKEN`)
- **Apollo API** (`APOLLO_API_KEY`)

---

## n8n Implementation Notes

```
Trigger: Schedule (hourly)
    |
    v
Supabase: Get last sync timestamps
    |
    +---> Smartlead Pull Flow
    |     |
    |     v
    |     HTTP: Get modified contacts
    |     |
    |     v
    |     Function: Transform to common schema
    |     |
    |     v
    |     Supabase: Merge records
    |
    +---> GHL Pull Flow
    |     |
    |     v
    |     (Similar to Smartlead)
    |
    +---> Apollo Pull Flow (if daily)
    |
    v
Supabase: Get records to push
    |
    +---> Smartlead Push Flow
    |     |
    |     v
    |     HTTP: Update contacts
    |
    +---> GHL Push Flow
    |
    v
Function: Verify sync counts
    |
    v
Supabase: Log sync results
    |
    v
IF: Any issues?
    |
    +-- Yes --> Alert + log errors
    |
    +-- No --> Complete
```

---

## Sync Dashboard

```
┌─────────────────────────────────────────────────────┐
│ PLATFORM SYNC STATUS                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│ LAST SYNC: 2 minutes ago                            │
│                                                      │
│ PLATFORM STATUS                                      │
│ ┌────────────┬──────────┬─────────┬───────────────┐ │
│ │ Platform   │ Last     │ Records │ Status        │ │
│ ├────────────┼──────────┼─────────┼───────────────┤ │
│ │ Smartlead  │ 10:02    │ 45/12   │ ✅ Synced     │ │
│ │ GHL        │ 10:02    │ 8/3     │ ✅ Synced     │ │
│ │ Apollo     │ 06:00    │ 120/0   │ ✅ Synced     │ │
│ └────────────┴──────────┴─────────┴───────────────┘ │
│                                                      │
│ RECORD COUNTS                                        │
│ Supabase:    24,532                                 │
│ Smartlead:   24,489 (43 pending sync)               │
│ GHL:         8,234 (in sync)                        │
│                                                      │
│ RECENT ACTIVITY                                      │
│ • 45 contacts pulled from Smartlead                 │
│ • 12 contacts pushed to Smartlead                   │
│ • 3 bounces received                                │
│ • 1 unsubscribe processed                           │
│                                                      │
│ ISSUES: None                                         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase sync tables created
- [ ] Smartlead integration built
- [ ] GHL integration built
- [ ] Apollo integration built
- [ ] Field mappings configured
- [ ] Conflict resolution logic
- [ ] n8n workflow built
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
