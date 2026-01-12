# Apify Manager

## Purpose
Monitors custom Apify scraping jobs, tracks results, handles errors, and ensures efficient compute unit usage for specialized lead sourcing operations.

## Type
Monitor (Automated)

## Schedule
On job completion (webhook trigger) + Daily summary at 7 AM (`0 7 * * *`)

---

## Inputs

- **Apify API** - Actor runs, datasets, compute usage
- **Supabase** - Job history, lead import records

---

## Metrics Tracked

| Metric | Description | Target |
|--------|-------------|--------|
| Active Runs | Currently executing actors | Monitor |
| Compute Units Used | Monthly CU consumption | Within budget |
| Success Rate | Successful runs / total runs | > 95% |
| Leads Per Run | Avg leads extracted per job | Varies by actor |
| Cost Per Lead | CU cost / leads extracted | < $0.01 |

---

## Actors Monitored

| Actor | Purpose | Typical Output |
|-------|---------|----------------|
| LinkedIn Profile Scraper | Profile data extraction | 100-500 profiles |
| Company Website Scraper | Contact page data | 50-200 contacts |
| Event Attendee Scraper | Conference attendees | 200-1000 leads |
| Custom scrapers | Specialized sources | Varies |

---

## Process

### On Job Completion (Webhook)

1. **Receive Webhook**
   - Parse job completion payload
   - Extract run ID, actor ID, status

2. **Fetch Results**
   - Download dataset from Apify
   - Count records extracted
   - Calculate compute units used

3. **Evaluate Quality**
   - Check for errors in dataset
   - Validate data completeness
   - Calculate success metrics

4. **Process Leads**
   - Queue for email validation
   - Queue for enrichment
   - Store raw data in Supabase

5. **Update Dashboard**
   - Log job completion
   - Update running totals

### Daily Summary (6 AM)

1. **Aggregate Metrics**
   - Total runs in last 24h
   - Total leads extracted
   - Total compute units used
   - Error rate analysis

2. **Generate Report**
   - Per-actor breakdown
   - Cost efficiency analysis
   - Quality metrics

---

## Outputs

### To Dashboard
- Active runs count
- Leads extracted today
- Compute units remaining
- Last job status
- Error alerts

### To Supabase
Table: `apify_jobs`
| Column | Type | Description |
|--------|------|-------------|
| `run_id` | text | Apify run identifier |
| `actor_id` | text | Actor that was run |
| `status` | text | success/failed/running |
| `started_at` | timestamp | Job start time |
| `finished_at` | timestamp | Job end time |
| `compute_units` | decimal | CU consumed |
| `records_extracted` | integer | Leads extracted |
| `errors` | jsonb | Any errors encountered |
| `cost_per_lead` | decimal | CU / records |

Table: `apify_usage`
| Column | Type | Description |
|--------|------|-------------|
| `date` | date | Usage date |
| `total_runs` | integer | Jobs run that day |
| `total_compute_units` | decimal | CU consumed |
| `total_leads` | integer | Leads extracted |
| `success_rate` | decimal | Success percentage |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Job failed | Warning | Dashboard notification |
| 3+ consecutive failures | Critical | Email alert, pause actor |
| CU budget > 80% | Warning | Dashboard notification |
| CU budget > 95% | Critical | Email alert, pause jobs |
| Error rate > 10% | Warning | Review actor configuration |
| No results from run | Warning | Investigate source |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Monthly CU Usage | 80% budget | 95% budget |
| Job Error Rate | > 5% | > 15% |
| Consecutive Failures | 2 | 3 |
| Cost Per Lead | > $0.02 | > $0.05 |

---

## Integration Requirements

- **Apify API Token** (`APIFY_TOKEN`)
- **Supabase** (`SUPABASE_TOKEN`)
- Webhook endpoint for job notifications

---

## n8n Implementation Notes

### Webhook Flow
```
Trigger: Webhook (Apify job complete)
    |
    v
HTTP Request: Apify API - Get Run Details
    |
    v
HTTP Request: Apify API - Download Dataset
    |
    v
Function: Process and validate data
    |
    v
Supabase: Insert job record
    |
    v
IF: Job success?
    |
    +-- Yes --> Queue leads for processing
    |
    +-- No --> Log error, check consecutive failures
                |
                +-- >= 3 failures --> Alert + pause
```

### Daily Summary Flow
```
Trigger: Schedule (7 AM daily)
    |
    v
HTTP Request: Apify API - Get runs (last 24h)
    |
    v
Function: Aggregate metrics
    |
    v
Supabase: Insert daily summary
    |
    v
IF: Any issues?
    |
    +-- Yes --> Generate alert
    |
    +-- No --> Complete
```

---

## Error Handling

| Error Type | Cause | Resolution |
|------------|-------|------------|
| Timeout | Long-running job | Increase timeout, reduce batch |
| Rate Limited | Source blocking | Add delays, rotate proxies |
| Empty Results | Source changed | Update selectors |
| Authentication | Session expired | Refresh cookies/tokens |

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Webhook endpoint configured
- [ ] n8n workflows built
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
