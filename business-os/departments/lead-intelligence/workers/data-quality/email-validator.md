# Email Validator

## Purpose
Verifies email addresses for all imported leads before they enter campaigns, ensuring high deliverability and protecting domain reputation.

## Type
Agent (Automated on trigger)

## Trigger
On lead import (webhook from import pipeline)

---

## Inputs

- **Import Pipeline** - Raw lead data with email addresses
- **NeverBounce API** - Email verification service
- **Supabase** - Contact database, validation history

---

## Validation Statuses

| Status | Description | Action |
|--------|-------------|--------|
| Valid | Email exists and accepts mail | Approve for campaigns |
| Invalid | Email does not exist | Reject |
| Disposable | Temporary email service | Reject |
| Catch-all | Domain accepts all emails | Flag, manual review |
| Unknown | Could not determine | Queue for retry |
| Risky | Likely to bounce | Flag, low-priority only |

---

## Process

1. **Receive Lead Batch**
   - Parse incoming lead data
   - Extract email addresses
   - Check for obvious formatting issues

2. **Pre-filter**
   - Remove obviously invalid formats
   - Check against known disposable domains
   - Deduplicate within batch

3. **Check Cache**
   - Query Supabase for recently verified emails
   - Skip re-verification if verified within 30 days
   - Use cached result if available

4. **Batch Verify**
   - Send emails to NeverBounce in batches of 100
   - Rate limit to stay within API limits
   - Handle API errors gracefully

5. **Process Results**
   - Categorize each email by status
   - Calculate batch validation rate
   - Update lead records

6. **Store Results**
   - Update contact records in Supabase
   - Log validation batch results
   - Update dashboard metrics

7. **Queue Next Steps**
   - Valid leads -> Enrichment Processor
   - Invalid leads -> Rejection log
   - Catch-all -> Manual review queue

---

## Outputs

### To Dashboard
- Validation rate (current batch and rolling)
- Leads validated today
- Queue depth
- Error rate

### To Supabase
Table: `email_validations`
| Column | Type | Description |
|--------|------|-------------|
| `email` | text | Email address |
| `validation_status` | text | valid/invalid/catchall/etc |
| `validated_at` | timestamp | When verified |
| `provider` | text | neverbounce |
| `score` | decimal | Confidence score |
| `reason` | text | Rejection reason if invalid |

Table: `validation_batches`
| Column | Type | Description |
|--------|------|-------------|
| `batch_id` | uuid | Batch identifier |
| `processed_at` | timestamp | When processed |
| `total_emails` | integer | Emails in batch |
| `valid_count` | integer | Approved emails |
| `invalid_count` | integer | Rejected emails |
| `catchall_count` | integer | Catch-all emails |
| `validation_rate` | decimal | Valid / Total |
| `source` | text | Where leads came from |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Validation rate < 85% | Warning | Review source quality |
| Validation rate < 70% | Critical | Pause source, investigate |
| API errors > 5% | Warning | Check NeverBounce status |
| Queue depth > 1000 | Warning | Scale up processing |
| Batch timeout | Critical | Alert, retry batch |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Validation Rate | < 90% | < 80% |
| API Error Rate | > 3% | > 10% |
| Queue Depth | > 500 | > 1000 |
| Processing Time | > 5 min/100 | > 10 min/100 |

---

## Validation Rules

### Automatic Rejection
- Invalid email format
- Known disposable domain (mailinator, tempmail, etc.)
- Role-based emails (info@, sales@, contact@)
- Previous hard bounce

### Automatic Approval
- Valid status from NeverBounce
- Previously verified within 30 days
- Transactional email history (registered, purchased)

### Manual Review Required
- Catch-all domains
- Risky status with high-value target
- First contact at new domain

---

## Integration Requirements

- **NeverBounce API Key** (`NEVERBOUNCE_API_KEY`)
- **Supabase** (`SUPABASE_TOKEN`)
- Webhook endpoint for import triggers

---

## n8n Implementation Notes

```
Trigger: Webhook (lead import)
    |
    v
Function: Extract and pre-filter emails
    |
    v
Supabase: Check cache for recent validations
    |
    v
HTTP Request: NeverBounce batch verify
    |
    v
Function: Process and categorize results
    |
    v
Supabase: Update contact records
    |
    v
Supabase: Log batch results
    |
    v
IF: Validation rate < threshold?
    |
    +-- Yes --> Alert + log source issue
    |
    +-- No --> Queue valid leads for enrichment
```

---

## Cost Optimization

- Cache results for 30 days
- Batch requests to reduce API calls
- Pre-filter obvious invalids before API
- Use NeverBounce bulk API for large batches

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] NeverBounce integration configured
- [ ] n8n workflow built
- [ ] Cache logic implemented
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
