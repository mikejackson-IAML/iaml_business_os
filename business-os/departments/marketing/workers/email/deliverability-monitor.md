# Deliverability Monitor

## Purpose
Monitor email domain reputation, inbox placement, and blacklist status across all sending domains to prevent deliverability crises.

## Type
Monitor (Automated)

## Trigger
- **Schedule:** Daily at 7:00 AM EST
- **Manual:** On-demand via dashboard
- **Event:** Immediately on bounce spike detection

---

## Inputs

### Data Sources

**Zapmail MCP:**
- Domain list and status
- Warmup progress
- Recent sending volume

**Smartlead MCP:**
- Domain performance metrics
- Bounce rates by domain
- Inbox placement estimates

**External Checks (API or scraping):**
- Blacklist status (MXToolbox, Spamhaus, etc.)
- Domain reputation scores

**Business OS Knowledge:**
- `EMAIL_COLD_OUTREACH.md` — Domain usage rules and limits

---

## Process

### Step 1: Enumerate All Sending Domains

Categories:
- **Google Workspace domains** (30 domains) — General cold outreach
- **Microsoft 365 domains** (30 domains) — Credential-specific, alumni
- **IAML-branded domains** — Transactional, high-reputation

### Step 2: Check Each Domain

For each domain, collect:
```
{
  domain: string,
  category: "google" | "microsoft" | "iaml",
  status: "active" | "warming" | "resting" | "blocked",
  daily_sends_avg: number,
  bounce_rate_7d: number,
  open_rate_7d: number,
  spam_complaints_7d: number,
  blacklist_status: boolean,
  reputation_score: number (0-100),
  warmup_day: number (if warming)
}
```

### Step 3: Assess Domain Health

**Health Scoring:**
```
domain_health = 100
- (bounce_rate × 20)           # Penalize bounces heavily
- (spam_complaints × 50)       # Penalize complaints very heavily
- (10 if blacklisted else 0)   # Heavy penalty for blacklist
+ (open_rate × 0.5)            # Small bonus for good engagement
```

**Status Determination:**

| Health Score | Status | Action |
|--------------|--------|--------|
| 80-100 | Healthy | Continue normal sending |
| 60-79 | Warning | Reduce volume, monitor closely |
| 40-59 | At Risk | Pause non-essential sends |
| <40 | Critical | Stop sending, investigate |

### Step 4: Check Sending Limits

Compare actual sends to recommended limits from playbook:

| Domain Status | Daily Limit | Flag If Above |
|---------------|-------------|---------------|
| New/establishing | 20-25 | 30 |
| Established | 30-50 | 60 |
| High-performing | 50-75 | 90 |

### Step 5: Blacklist Check

Check major blacklists:
- Spamhaus
- Barracuda
- SORBS
- Spamcop
- CBL

Flag immediately if listed on any.

### Step 6: Generate Recommendations

Based on findings:
- "Domain X approaching daily limit — reduce volume or rotate"
- "Domain Y bounce rate elevated — pause and investigate list quality"
- "Domain Z listed on Spamhaus — immediate action required"
- "Consider resting Domain W — reputation dropping"

---

## Outputs

### To Dashboard

**Summary:**
```json
{
  "total_domains": 60,
  "healthy": 52,
  "warning": 6,
  "at_risk": 2,
  "critical": 0,
  "blacklisted": 0,
  "overall_status": "good"
}
```

**Domain List:**
```json
{
  "domains": [
    {
      "domain": "example1.com",
      "status": "healthy",
      "health_score": 92,
      "daily_sends": 45,
      "limit": 50
    },
    ...
  ]
}
```

### To Supabase

Store in `marketing_domain_health` table:
- date
- domain
- category
- status
- health_score
- bounce_rate
- spam_complaints
- daily_sends
- blacklist_status
- recommendations

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Domain blacklisted | Critical | Email + SMS + Dashboard |
| Health score <40 | Critical | Email + Dashboard |
| Health score 40-60 | Warning | Dashboard notification |
| Bounce rate >5% on domain | Warning | Dashboard notification |
| Spam complaint on any domain | Warning | Dashboard notification |
| Domain over daily limit | Info | Dashboard notification |

---

## Integration Requirements

### APIs Needed
- Zapmail API (domain management)
- Smartlead API (domain performance)
- Blacklist check APIs (MXToolbox or similar)
- Supabase

### Credentials
- `ZAPMAIL_API_KEY`
- `SMARTLEAD_API_KEY`
- `SUPABASE_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
1. Trigger: Schedule (7 AM daily)
2. Node: Fetch domain list from Zapmail
3. Node: Fetch domain performance from Smartlead
4. Node: Check blacklists (parallel HTTP requests)
5. Node: Calculate health scores (Code node)
6. Node: Determine status and recommendations
7. Node: Store to Supabase
8. Node: Send alerts if critical

**Estimated Runtime:** 5-10 minutes (blacklist checks can be slow)

---

## Emergency Response

If critical issue detected:

1. **Immediate:** Send alert to Marketing Director
2. **Automatic:** Pause any active campaigns using affected domain
3. **Document:** Log incident in Supabase
4. **Escalate:** If multiple domains affected, escalate to CEO

---

## Status
- [ ] Spec complete
- [ ] n8n workflow created
- [ ] Testing complete
- [ ] Production enabled
