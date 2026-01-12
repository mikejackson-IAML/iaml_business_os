# Database Manager

## Purpose
Monitors the central contact database for health, integrity, and consistency, ensuring data quality standards are maintained and identifying issues before they impact campaigns.

## Type
Monitor (Automated)

## Schedule
Every 6 hours (`0 */6 * * *`)

---

## Inputs

- **Supabase** - Contact database tables
- **Platform Sync Manager** - Sync status
- **Data quality workers** - Validation and enrichment stats

---

## Database Health Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Total Contacts | Active records in database | Growing |
| Data Completeness | Contacts with all key fields | > 85% |
| Freshness | Updated in last 30 days | > 60% |
| Validation Status | Verified email addresses | > 90% |
| Sync Status | In sync across platforms | 100% |
| Duplicates | Potential duplicate rate | < 2% |

---

## Process

1. **Database Statistics**
   - Count total contacts
   - Count by lifecycle stage
   - Calculate growth rate

2. **Data Completeness Audit**
   - Check required fields (email, name)
   - Check preferred fields (company, title)
   - Calculate completion percentages

3. **Data Freshness Check**
   - Count updated in last 30/60/90 days
   - Identify stale records
   - Calculate freshness percentage

4. **Validation Audit**
   - Count validated vs unvalidated
   - Identify expired validations
   - Calculate validation coverage

5. **Sync Status Check**
   - Compare counts with Smartlead
   - Compare counts with GHL
   - Identify sync discrepancies

6. **Duplicate Scan**
   - Run fuzzy matching on recent imports
   - Estimate duplicate rate
   - Flag potential issues

7. **Store and Report**
   - Log all metrics to Supabase
   - Update dashboard
   - Alert on issues

---

## Outputs

### To Dashboard
- Total contacts count
- Data health score
- Freshness gauge
- Sync status
- Issues requiring attention

### To Supabase
Table: `database_health_checks`
| Column | Type | Description |
|--------|------|-------------|
| `check_time` | timestamp | When checked |
| `total_contacts` | integer | Total active records |
| `contacts_by_stage` | jsonb | Count per lifecycle stage |
| `completeness_pct` | decimal | Data completeness |
| `freshness_30d_pct` | decimal | Updated in 30 days |
| `freshness_60d_pct` | decimal | Updated in 60 days |
| `validation_pct` | decimal | Validated emails |
| `sync_status` | text | synced/out_of_sync |
| `duplicate_estimate` | decimal | Estimated duplicate % |
| `health_score` | integer | 0-100 score |
| `issues` | jsonb | Problems found |

Table: `database_issues`
| Column | Type | Description |
|--------|------|-------------|
| `issue_id` | uuid | Issue ID |
| `detected_at` | timestamp | When found |
| `issue_type` | text | Type of issue |
| `severity` | text | low/medium/high |
| `affected_count` | integer | Records affected |
| `description` | text | Issue details |
| `resolved` | boolean | Is it fixed |
| `resolved_at` | timestamp | When fixed |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Data completeness < 80% | Warning | Review import quality |
| Data completeness < 70% | Critical | Enrichment needed |
| Freshness < 50% | Warning | Run lifecycle cleanup |
| Validation < 85% | Warning | Re-validate old records |
| Sync out of sync > 100 | Warning | Investigate sync |
| Duplicates > 5% | Critical | Run deduplication |

---

## Thresholds

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Completeness | > 85% | 75-85% | < 75% |
| Freshness (30d) | > 60% | 40-60% | < 40% |
| Validation | > 90% | 80-90% | < 80% |
| Duplicates | < 2% | 2-5% | > 5% |

---

## Data Health Score Calculation

```
Health Score = (
  completeness_score × 0.25 +
  freshness_score × 0.25 +
  validation_score × 0.25 +
  sync_score × 0.15 +
  duplicate_score × 0.10
)

Where each component is 0-100 based on thresholds
```

---

## Required Fields Check

| Field | Required | Completeness Target |
|-------|----------|---------------------|
| email | Yes | 100% |
| first_name | Yes | 100% |
| last_name | Yes | 100% |
| company | Preferred | 90% |
| title | Preferred | 85% |
| lifecycle_stage | Yes | 100% |
| validation_status | Yes | 100% |
| source | Yes | 100% |

---

## Integration Requirements

- **Supabase** (`SUPABASE_TOKEN`)
- Read access to all contact-related tables
- Comparison access to Smartlead and GHL contact lists

---

## n8n Implementation Notes

```
Trigger: Schedule (every 6 hours)
    |
    v
Supabase: Get contact counts and statistics
    |
    v
Function: Calculate completeness percentages
    |
    v
Function: Calculate freshness percentages
    |
    v
Supabase: Get validation statistics
    |
    v
HTTP Request: Compare with Smartlead count
    |
    v
HTTP Request: Compare with GHL count
    |
    v
Function: Run duplicate estimate
    |
    v
Function: Calculate health score
    |
    v
Supabase: Store health check
    |
    v
IF: Any issues?
    |
    +-- Critical --> Alert + create issue
    |
    +-- Warning --> Dashboard notification
    |
    +-- Healthy --> Complete
```

---

## Dashboard Widget

```
┌─────────────────────────────────────────────────────┐
│ DATABASE HEALTH                     Score: 87/100   │
├─────────────────────────────────────────────────────┤
│                                                      │
│ TOTAL CONTACTS: 24,532                              │
│                                                      │
│ BY LIFECYCLE STAGE                                   │
│ New          ████░░░░░░ 2,100 (9%)                 │
│ Validated    ██████░░░░ 4,200 (17%)                │
│ Enriched     ████████░░ 6,800 (28%)                │
│ Assigned     ███████░░░ 5,400 (22%)                │
│ Contacted    █████░░░░░ 3,800 (15%)                │
│ Engaged      ███░░░░░░░ 1,500 (6%)                 │
│ Converted    █░░░░░░░░░ 732 (3%)                   │
│                                                      │
│ DATA QUALITY                                         │
│ Completeness:  ████████░░ 87%  🟢                  │
│ Freshness:     ███████░░░ 68%  🟢                  │
│ Validation:    █████████░ 92%  🟢                  │
│                                                      │
│ SYNC STATUS                                          │
│ Smartlead: ✅ In sync (24,489 / 24,532)            │
│ GHL:       ✅ In sync (8,234 / 8,234)              │
│                                                      │
│ ISSUES                                               │
│ ⚠️ 340 records need re-validation (>90 days old)   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Status

- [x] Worker specification complete
- [ ] Supabase health check tables created
- [ ] Statistics queries implemented
- [ ] n8n workflow built
- [ ] Health score calculation
- [ ] Dashboard widget created
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
