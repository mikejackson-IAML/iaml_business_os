# Compliance Monitor

## Purpose
Ensures all lead handling and outreach activities comply with email regulations (CAN-SPAM, GDPR), manages opt-outs, and maintains do-not-contact lists to protect the organization from legal and reputation risks.

## Type
Monitor (Automated, Continuous)

## Schedule
Hourly check (`0 * * * *`) + Real-time opt-out processing

---

## Inputs

- **Email platforms** - Smartlead, GHL unsubscribe events
- **Supabase** - Contact database, opt-out records
- **Import pipeline** - New leads for compliance check
- **Bounce reports** - Hard bounces from campaigns

---

## Compliance Areas

| Area | Regulation | Requirements |
|------|------------|--------------|
| Opt-out Processing | CAN-SPAM | Honor within 10 days (we do instantly) |
| Unsubscribe Link | CAN-SPAM | Required in all commercial emails |
| Sender Identification | CAN-SPAM | Valid physical address required |
| Data Protection | GDPR | Consent tracking, right to erasure |
| Do-Not-Contact | Industry | Respect legal/HR-specific restrictions |

---

## Process

### Hourly Compliance Check

1. **Sync Opt-outs**
   - Pull new unsubscribes from Smartlead
   - Pull new unsubscribes from GHL
   - Aggregate into master do-not-contact list

2. **Process Bounces**
   - Identify hard bounces
   - Mark contacts as invalid
   - Remove from active campaigns

3. **Audit Active Campaigns**
   - Check for contacts on do-not-contact list
   - Flag any compliance violations
   - Generate removal requests

4. **Verify Data Handling**
   - Check for GDPR erasure requests
   - Verify consent records
   - Audit data retention

5. **Generate Reports**
   - Compliance status summary
   - Violations if any
   - Actions taken

### Real-time Opt-out Processing

1. **Receive Webhook**
   - Unsubscribe event from platform
   - Parse contact email

2. **Immediate Actions**
   - Add to do-not-contact list
   - Remove from all active campaigns
   - Flag in all platforms

3. **Notify Systems**
   - Update Smartlead suppression list
   - Update GHL suppression list
   - Log action

---

## Outputs

### To Dashboard
- Compliance status (green/yellow/red)
- Opt-outs this week
- Active suppression list size
- Violations (should be 0)

### To Supabase
Table: `do_not_contact`
| Column | Type | Description |
|--------|------|-------------|
| `email` | text | Suppressed email |
| `reason` | text | unsubscribe/bounce/legal/manual |
| `source` | text | Which platform reported |
| `added_at` | timestamp | When added to list |
| `original_campaign` | text | Campaign if applicable |

Table: `compliance_log`
| Column | Type | Description |
|--------|------|-------------|
| `log_id` | uuid | Log entry ID |
| `check_time` | timestamp | When check ran |
| `opt_outs_processed` | integer | New opt-outs |
| `bounces_processed` | integer | New bounces |
| `violations_found` | integer | Should be 0 |
| `campaigns_audited` | integer | Campaigns checked |
| `status` | text | compliant/violation |

Table: `compliance_violations`
| Column | Type | Description |
|--------|------|-------------|
| `violation_id` | uuid | Violation ID |
| `detected_at` | timestamp | When found |
| `type` | text | Type of violation |
| `contact_email` | text | Affected contact |
| `campaign_id` | text | Campaign involved |
| `severity` | text | low/medium/high |
| `resolved` | boolean | Is it fixed |
| `resolution` | text | How resolved |

### Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| Any compliance violation | Critical | Immediate escalation |
| Opt-out not processed < 1hr | Critical | Manual intervention |
| Do-not-contact in campaign | Critical | Pause campaign |
| Hard bounce rate > 3% | Warning | Review list quality |
| Suppression list sync fail | Critical | Manual sync required |

---

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Opt-out Processing Time | > 30 min | > 1 hour |
| Hard Bounce Rate | > 2% | > 5% |
| Suppression Sync Delay | > 1 hour | > 4 hours |
| Violations | 1 | Any |

---

## Do-Not-Contact Categories

| Category | Description | Source |
|----------|-------------|--------|
| Unsubscribed | User requested removal | Platform webhook |
| Hard Bounce | Email doesn't exist | Bounce report |
| Spam Complaint | Marked as spam | Platform report |
| Legal Request | GDPR erasure, legal letter | Manual entry |
| Competitor | Competitor employee | Manual entry |
| Internal | IAML employee | Manual entry |
| Duplicate | Merged/removed duplicate | Dedup process |

---

## Integration Requirements

- **Smartlead API** (`SMARTLEAD_API_KEY`) - Suppression sync
- **GHL API** (`GHL_PIT_TOKEN`) - Contact status sync
- **Supabase** (`SUPABASE_TOKEN`) - Database operations
- Webhook endpoints for real-time opt-outs

---

## n8n Implementation Notes

### Hourly Check Flow
```
Trigger: Schedule (hourly)
    |
    v
HTTP Request: Smartlead - Get unsubscribes
    |
    v
HTTP Request: GHL - Get unsubscribes
    |
    v
Function: Merge and dedupe opt-outs
    |
    v
Supabase: Add to do_not_contact
    |
    v
Supabase: Remove from active campaigns
    |
    v
HTTP Request: Sync suppression to platforms
    |
    v
Supabase: Log compliance check
    |
    v
IF: Any violations?
    |
    +-- Yes --> CRITICAL ALERT + Escalate
    |
    +-- No --> Complete
```

### Real-time Opt-out Flow
```
Trigger: Webhook (unsubscribe event)
    |
    v
Function: Parse email and source
    |
    v
Supabase: Add to do_not_contact
    |
    v
HTTP Request: Sync to all platforms
    |
    v
Supabase: Log action
```

---

## Compliance Checklist

### Every Email Must Have
- [ ] Valid sender name and email
- [ ] Physical mailing address
- [ ] Unsubscribe link (working)
- [ ] Clear identification as commercial

### Every Import Must Check
- [ ] Against do-not-contact list
- [ ] Against known competitors
- [ ] Against previous hard bounces
- [ ] GDPR consent if EU contact

---

## Escalation Protocol

If a compliance violation is detected:

1. **Immediate** - Pause affected campaign
2. **Within 5 min** - Email alert to Lead Intelligence Director
3. **Within 15 min** - Slack notification to CEO
4. **Document** - Full details in violation log
5. **Resolve** - Take corrective action
6. **Review** - Post-mortem within 24 hours

---

## Status

- [x] Worker specification complete
- [ ] Supabase tables created
- [ ] Platform webhook integrations
- [ ] n8n workflows built
- [ ] Suppression sync configured
- [ ] Alert channels configured
- [ ] Escalation protocol tested
- [ ] Production deployment
