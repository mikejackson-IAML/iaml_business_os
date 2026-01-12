# Segment Builder

## Purpose
Creates targetable contact lists based on specified criteria, enabling precise audience segmentation for campaigns with validation and capacity confirmation.

## Type
Skill (On-demand, Interactive)

## Trigger
On-demand via request or command

---

## Inputs

- **Segment Request** - Criteria and requirements
- **Supabase** - Contact database
- **Sending Capacity Calculator** - Available capacity
- **Marketing requirements** - Campaign context

---

## Segment Criteria

| Category | Fields | Examples |
|----------|--------|----------|
| Demographics | title, seniority | HR Director, VP HR |
| Firmographics | company_size, industry | 500+ employees, Healthcare |
| Geography | state, region | California, Northeast |
| Behavior | lifecycle_stage, last_contact | Engaged, >30 days ago |
| Credentials | certifications | SHRM-CP, PHR |
| History | past_participant, programs | Attended ERL |

---

## Process

### Receive Request

1. **Parse Criteria**
   - Extract filter conditions
   - Validate field names
   - Check for conflicts

2. **Estimate Size**
   - Run count query
   - Report potential segment size
   - Flag if too large/small

### Build Segment

3. **Query Database**
   - Build dynamic SQL/filter
   - Apply all criteria
   - Sort by quality score

4. **Quality Check**
   - Verify all have validated emails
   - Check enrichment completeness
   - Flag low-quality leads

5. **Dedupe Against Active**
   - Check against active campaigns
   - Remove recently contacted
   - Respect contact frequency limits

6. **Capacity Validation**
   - Check if segment fits capacity
   - Calculate days to contact all
   - Recommend batch size if needed

### Deliver Segment

7. **Create Segment Record**
   - Save segment definition
   - Save member list
   - Track for refresh

8. **Export Options**
   - Direct to Smartlead
   - Direct to GHL
   - CSV download
   - Stay in database

---

## Outputs

### To Requester
- Segment size
- Quality breakdown
- Capacity impact
- Export options

### To Supabase
Table: `segments`
| Column | Type | Description |
|--------|------|-------------|
| `segment_id` | uuid | Segment ID |
| `name` | text | Segment name |
| `created_at` | timestamp | When created |
| `created_by` | text | Who requested |
| `criteria` | jsonb | Filter criteria |
| `size` | integer | Contact count |
| `campaign_id` | text | Associated campaign |
| `status` | text | active/archived |
| `last_refreshed` | timestamp | Last refresh |

Table: `segment_members`
| Column | Type | Description |
|--------|------|-------------|
| `segment_id` | uuid | Parent segment |
| `contact_id` | uuid | Contact ID |
| `added_at` | timestamp | When added |
| `quality_score` | integer | Lead quality |
| `exported` | boolean | Exported to platform |
| `contacted` | boolean | Has been contacted |

### Segment Report Format
```json
{
  "segment_id": "seg_abc123",
  "name": "California HR Directors Q1",
  "criteria": {
    "title": ["HR Director", "VP Human Resources"],
    "state": "California",
    "company_size": "500+",
    "lifecycle_stage": ["Validated", "Enriched"],
    "last_contact": ">30 days ago"
  },
  "results": {
    "total_matches": 842,
    "after_dedup": 798,
    "quality_breakdown": {
      "high": 450,
      "medium": 280,
      "low": 68
    },
    "completeness": {
      "email": "100%",
      "company": "95%",
      "title": "100%",
      "phone": "62%"
    }
  },
  "capacity_impact": {
    "daily_capacity": 2400,
    "days_to_contact": 1,
    "domains_recommended": ["domain1.com", "domain2.com"]
  },
  "recommendations": [
    "Segment fits within single-day capacity",
    "68 low-quality leads may bounce - consider excluding",
    "298 leads missing phone - enrichment recommended if needed"
  ]
}
```

---

## Common Segment Templates

### ABM Target List
```json
{
  "template": "abm_target",
  "criteria": {
    "title": ["HR Director", "VP HR", "CHRO", "Chief People Officer"],
    "company_size": "1000+",
    "industry": ["Healthcare", "Finance", "Technology"],
    "lifecycle_stage": ["Validated", "Enriched"]
  }
}
```

### Re-engagement Campaign
```json
{
  "template": "reengagement",
  "criteria": {
    "lifecycle_stage": "Stale",
    "last_contact": ">60 days ago",
    "previous_engagement": true
  }
}
```

### Geographic Focus
```json
{
  "template": "geographic",
  "criteria": {
    "state": ["California", "Texas", "New York"],
    "title_contains": "HR",
    "lifecycle_stage": ["Validated", "Enriched", "Assigned"]
  }
}
```

### Past Participant Alumni
```json
{
  "template": "alumni",
  "criteria": {
    "past_participant": true,
    "lifecycle_stage": "Converted",
    "last_program": ">6 months ago"
  }
}
```

---

## Quality Scoring

| Factor | Points | Description |
|--------|--------|-------------|
| Validated email | 30 | Email verified |
| Complete profile | 25 | All preferred fields |
| Recent update | 15 | Updated < 30 days |
| Engagement history | 15 | Previous interactions |
| Enrichment | 15 | Apollo/external data |

Score ranges:
- High: 80-100
- Medium: 50-79
- Low: <50

---

## Integration Requirements

- **Supabase** (`SUPABASE_TOKEN`)
- **Smartlead API** (`SMARTLEAD_API_KEY`) for export
- **GHL API** (`GHL_PIT_TOKEN`) for export

---

## n8n Implementation Notes

```
Trigger: Webhook (segment request) OR Manual
    |
    v
Function: Parse and validate criteria
    |
    v
Supabase: Run count estimate
    |
    v
IF: Size reasonable?
    |
    +-- Too large --> Return with refinement suggestions
    |
    +-- Too small --> Return with expansion suggestions
    |
    +-- OK --> Continue
    |
    v
Supabase: Build full segment query
    |
    v
Function: Apply quality scoring
    |
    v
Function: Dedupe against active campaigns
    |
    v
Supabase: Get current capacity
    |
    v
Function: Generate segment report
    |
    v
Supabase: Store segment definition
    |
    v
Return: Segment report to requester
```

---

## Refresh Logic

Segments can be refreshed to:
- Add new matching contacts
- Remove contacted/converted
- Update quality scores
- Reflect new enrichment data

Refresh options:
- Manual refresh
- Scheduled (daily/weekly)
- On campaign completion

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Query builder implemented
- [ ] Quality scoring algorithm
- [ ] Platform export integrations
- [ ] Template library created
- [ ] n8n workflow built
- [ ] Initial testing complete
- [ ] Production deployment
