# Enrichment Processor

## Purpose
Fills missing lead data fields (company, title, phone, LinkedIn URL) using Apollo enrichment to improve targeting and personalization capabilities.

## Type
Agent (Automated on trigger)

## Trigger
On lead import, after email validation passes

---

## Inputs

- **Email Validator** - Validated leads ready for enrichment
- **Apollo API** - Contact and company enrichment
- **Supabase** - Contact database, existing data

---

## Fields Enriched

| Field | Priority | Source | Success Rate |
|-------|----------|--------|--------------|
| Company Name | Required | Apollo | 95% |
| Job Title | Required | Apollo | 90% |
| Company Size | Preferred | Apollo | 85% |
| Industry | Preferred | Apollo | 88% |
| Phone | Optional | Apollo | 60% |
| LinkedIn URL | Optional | Apollo | 75% |
| Company Website | Optional | Apollo | 92% |
| Location | Preferred | Apollo | 90% |

---

## Process

1. **Receive Validated Leads**
   - Get batch from email validator
   - Identify missing fields per lead
   - Prioritize by field importance

2. **Check Existing Data**
   - Query Supabase for any existing enrichment
   - Skip leads already enriched within 90 days
   - Merge with existing data

3. **Enrich via Apollo**
   - Send emails to Apollo People Enrichment API
   - Batch requests (up to 100 per call)
   - Track credit usage

4. **Process Results**
   - Map Apollo fields to our schema
   - Calculate enrichment success rate
   - Flag incomplete records

5. **Company Enrichment (Optional)**
   - If company data incomplete, enrich company separately
   - Get additional firmographic data
   - Additional credit cost

6. **Store Results**
   - Update contact records in Supabase
   - Log enrichment batch results
   - Update dashboard metrics

7. **Queue Next Steps**
   - Fully enriched -> Ready for campaigns
   - Partially enriched -> Flag for review
   - Failed enrichment -> Log, use as-is

---

## Outputs

### To Dashboard
- Enrichment rate (current batch and rolling)
- Leads enriched today
- Apollo credits used
- Field completion rates

### To Supabase
Table: `contacts` (updated fields)
| Column | Type | Description |
|--------|------|-------------|
| `company` | text | Company name |
| `title` | text | Job title |
| `phone` | text | Phone number |
| `linkedin_url` | text | LinkedIn profile |
| `company_size` | text | Employee range |
| `industry` | text | Industry category |
| `enriched_at` | timestamp | Last enrichment |
| `enrichment_source` | text | apollo |

Table: `enrichment_batches`
| Column | Type | Description |
|--------|------|-------------|
| `batch_id` | uuid | Batch identifier |
| `processed_at` | timestamp | When processed |
| `total_leads` | integer | Leads in batch |
| `enriched_count` | integer | Successfully enriched |
| `partial_count` | integer | Partially enriched |
| `failed_count` | integer | Failed enrichment |
| `enrichment_rate` | decimal | Success percentage |
| `credits_used` | integer | Apollo credits consumed |
| `cost_per_lead` | decimal | Credits / enriched |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Enrichment rate < 80% | Warning | Review source quality |
| Enrichment rate < 60% | Critical | Investigate data issues |
| Credits consumed > daily budget | Warning | Throttle enrichment |
| API errors > 5% | Warning | Check Apollo status |
| Cost per lead > 2 credits | Warning | Optimize batching |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Enrichment Rate | < 85% | < 70% |
| Title Match Rate | < 85% | < 70% |
| Company Match Rate | < 90% | < 80% |
| Cost Per Lead | > 1.5 credits | > 2.5 credits |

---

## Enrichment Quality Standards

### Minimum Viable Lead
- Email (verified)
- First Name
- Last Name
- Company Name
- Job Title

### Target Lead
- All minimum fields +
- Company Size
- Industry
- LinkedIn URL
- Location

### Premium Lead
- All target fields +
- Phone Number
- Company Website
- Seniority Level

---

## Integration Requirements

- **Apollo API Key** (`APOLLO_API_KEY`)
- **Supabase** (`SUPABASE_TOKEN`)

---

## n8n Implementation Notes

```
Trigger: From Email Validator (valid leads)
    |
    v
Supabase: Check existing enrichment data
    |
    v
Function: Identify leads needing enrichment
    |
    v
HTTP Request: Apollo People Enrichment API
    |
    v
Function: Map and merge results
    |
    v
IF: Company data needed?
    |
    +-- Yes --> HTTP Request: Apollo Company Enrichment
    |
    +-- No --> Continue
    |
    v
Supabase: Update contact records
    |
    v
Supabase: Log enrichment batch
    |
    v
IF: Enrichment rate < threshold?
    |
    +-- Yes --> Alert
    |
    +-- No --> Complete
```

---

## Cost Optimization

- Cache enrichment results for 90 days
- Batch requests to maximize API efficiency
- Skip recently enriched contacts
- Use selective field enrichment when possible
- Prioritize high-value leads for full enrichment

---

## Data Mapping

| Apollo Field | Our Field | Notes |
|--------------|-----------|-------|
| `name` | `first_name`, `last_name` | Split on space |
| `title` | `title` | Direct map |
| `organization.name` | `company` | Direct map |
| `phone_numbers[0]` | `phone` | First number |
| `linkedin_url` | `linkedin_url` | Direct map |
| `organization.industry` | `industry` | Direct map |
| `organization.estimated_num_employees` | `company_size` | Map to range |

---

## Status

- [x] Worker specification complete
- [ ] Supabase schema updated
- [ ] Apollo enrichment integration configured
- [ ] n8n workflow built
- [ ] Field mapping implemented
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
