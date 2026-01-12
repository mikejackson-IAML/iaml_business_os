# Deduplication Manager

## Purpose
Prevents duplicate contacts from entering the database by checking new leads against existing records across all sources, maintaining a clean and accurate contact database.

## Type
Agent (Automated on trigger)

## Trigger
On lead import, before email validation

---

## Inputs

- **Import Pipeline** - Raw lead data
- **Supabase** - Existing contact database
- **Platform imports** - Smartlead, GHL, Apollo sync data

---

## Matching Strategy

| Match Type | Fields | Confidence | Action |
|------------|--------|------------|--------|
| Exact Email | email | 100% | Reject duplicate |
| Fuzzy Name + Company | first_name, last_name, company | 85%+ | Flag for review |
| Same Company Domain | email domain + company | 75%+ | Flag for review |
| Phone Match | phone (normalized) | 90% | Merge records |
| LinkedIn Match | linkedin_url | 100% | Merge records |

---

## Process

1. **Receive Lead Batch**
   - Parse incoming lead data
   - Normalize fields (lowercase, trim, standardize)
   - Prepare for matching

2. **Exact Match Check**
   - Query Supabase for exact email matches
   - Mark exact duplicates for rejection
   - Log duplicate source

3. **Fuzzy Match Check**
   - For non-email matches, run fuzzy matching
   - Calculate similarity scores
   - Flag potential duplicates above threshold

4. **Cross-Platform Check**
   - Check if lead exists in Smartlead
   - Check if lead exists in GHL
   - Identify platform-specific IDs

5. **Decision Logic**
   - Exact match -> Reject (update last_seen timestamp)
   - High-confidence fuzzy -> Flag for review
   - Low-confidence fuzzy -> Allow with warning
   - No match -> Approve for import

6. **Handle Merges**
   - When merge identified, combine records
   - Keep most complete data
   - Preserve all source information

7. **Store Results**
   - Log deduplication results
   - Update contact records
   - Track duplicate rates by source

---

## Outputs

### To Dashboard
- Duplicate rate (by source)
- Leads processed today
- Records merged
- Flagged for review

### To Supabase
Table: `deduplication_log`
| Column | Type | Description |
|--------|------|-------------|
| `log_id` | uuid | Log entry ID |
| `processed_at` | timestamp | When processed |
| `incoming_email` | text | Email being checked |
| `match_type` | text | exact/fuzzy/none |
| `matched_contact_id` | uuid | Existing contact if match |
| `confidence_score` | decimal | Match confidence |
| `action_taken` | text | reject/merge/flag/approve |
| `source` | text | Import source |

Table: `duplicate_reviews`
| Column | Type | Description |
|--------|------|-------------|
| `review_id` | uuid | Review ID |
| `incoming_lead` | jsonb | New lead data |
| `existing_contact` | jsonb | Matched contact |
| `match_reason` | text | Why flagged |
| `confidence` | decimal | Match score |
| `status` | text | pending/merged/separate |
| `reviewed_by` | text | Who resolved |
| `reviewed_at` | timestamp | When resolved |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Duplicate rate > 20% | Warning | Review source quality |
| Duplicate rate > 40% | Critical | Pause source, investigate |
| Review queue > 50 | Warning | Process pending reviews |
| Merge conflicts | Warning | Manual resolution needed |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Duplicate Rate | > 15% | > 30% |
| Fuzzy Match Queue | > 25 items | > 50 items |
| Unresolved Reviews | > 3 days old | > 7 days old |

---

## Matching Rules

### Email Normalization
```
1. Lowercase
2. Trim whitespace
3. Remove dots from Gmail (j.doe@gmail.com -> jdoe@gmail.com)
4. Handle plus addressing (john+test@email.com -> john@email.com)
```

### Name Normalization
```
1. Lowercase
2. Remove titles (Dr., Mr., Mrs., etc.)
3. Handle nicknames (Mike -> Michael, Bob -> Robert)
4. Remove middle names/initials
```

### Company Normalization
```
1. Lowercase
2. Remove Inc., LLC, Corp., Ltd., etc.
3. Expand abbreviations (Intl -> International)
4. Remove punctuation
```

---

## Fuzzy Matching Algorithm

Using Levenshtein distance with thresholds:

| Field | Algorithm | Threshold |
|-------|-----------|-----------|
| Name | Levenshtein | 85% similarity |
| Company | Levenshtein + Token Sort | 80% similarity |
| Domain | Exact after normalization | 100% |

Combined score: `(name_score * 0.4) + (company_score * 0.6)`

---

## Integration Requirements

- **Supabase** (`SUPABASE_TOKEN`)
- Read access to Smartlead and GHL contact lists
- Fuzzy matching library (fuzzywuzzy or similar)

---

## n8n Implementation Notes

```
Trigger: From Import Pipeline (new leads)
    |
    v
Function: Normalize all fields
    |
    v
Supabase: Check exact email matches
    |
    v
IF: Exact match found?
    |
    +-- Yes --> Log duplicate, reject, update last_seen
    |
    +-- No --> Continue to fuzzy matching
    |
    v
Function: Calculate fuzzy match scores
    |
    v
IF: High confidence match (>85%)?
    |
    +-- Yes --> Add to review queue
    |
    +-- No --> Approve for next step
    |
    v
Supabase: Log deduplication result
    |
    v
Queue: Send approved leads to Email Validator
```

---

## Merge Logic

When merging duplicate records:

| Field | Rule |
|-------|------|
| email | Keep oldest (original) |
| first_name, last_name | Keep most complete |
| company, title | Keep most recent |
| phone | Keep verified if available |
| source | Combine all sources |
| created_at | Keep oldest |
| updated_at | Set to now |

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Matching algorithms implemented
- [ ] n8n workflow built
- [ ] Review queue UI created
- [ ] Alert channels configured
- [ ] Initial testing complete
- [ ] Production deployment
