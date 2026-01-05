# Lead Intelligence Department

## Director Role

**Lead Intelligence Director** oversees all lead sourcing, data quality, capacity planning, and contact database management. This department **produces** the leads that Marketing and Sales **consume**. The Director answers "How many leads can we handle?", "Where should we source them?", and "What's our capacity?" at any time.

## Domain Scope

**Owns:**
- Lead sourcing from all platforms (LinkedIn, Apollo, Apify)
- Scraping operations and platform limit management
- Data enrichment and email validation
- Email sending capacity calculations
- Domain health and rotation strategy
- Contact database (central source of truth)
- Lead-to-campaign allocation recommendations

**Does Not Own:**
- Email campaign content and execution (→ Marketing)
- Sales conversations and closing (→ Sales)
- Content for outreach messages (→ Content/Marketing)
- Website lead capture forms (→ Digital)

## Sub-Departments

### 1. Lead Sourcing

**Focus:** Acquiring leads from multiple platforms while managing limits and costs

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| LinkedIn Scraper Manager | Monitor | PhantomBuster + Sales Navigator health, limits | Continuous |
| Apollo Manager | Monitor | Search jobs, credit usage, extraction status | Daily |
| Apify Manager | Monitor | Custom scraping jobs, results, errors | Per job |
| Source Balancer | Agent | Distribute sourcing to avoid limits/bans | Daily |

**Platforms:**

| Platform | Purpose | Limits to Track | Cost Model |
|----------|---------|-----------------|------------|
| PhantomBuster | LinkedIn automation | Daily actions, weekly limits | Subscription |
| Sales Navigator | LinkedIn targeting | Search limits, profile views | Subscription |
| Apollo | B2B contact data | Credits per search/export | Credits |
| Apify | Custom scraping | Compute units, run time | Usage-based |

**Key Metrics:**
- Leads sourced this week (by platform)
- Credit/limit usage per platform (% of available)
- Cost per lead by source
- Source health status (healthy/warning/restricted)
- Lead quality score by source (based on validation rates)

**Safety Thresholds:**

| Platform | Warning | Critical |
|----------|---------|----------|
| PhantomBuster Daily | 80% of limit | 95% of limit |
| PhantomBuster Weekly | 70% of limit | 90% of limit |
| Apollo Credits | 30% remaining | 10% remaining |
| Any Platform | Rate limit hit | Account restricted |

---

### 2. Data Quality

**Focus:** Ensuring lead data is accurate, enriched, and compliant

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Email Validator | Agent | Verify emails before campaign entry | On import |
| Enrichment Processor | Agent | Fill missing fields (company, title, phone) | On import |
| Deduplication Manager | Agent | Prevent duplicates across all sources | On import |
| Compliance Monitor | Monitor | Opt-outs, do-not-contact, legal compliance | Continuous |

**Data Pipeline:**
```
Raw Lead → Dedupe Check → Email Validation → Enrichment → Ready for Campaign
   ↓           ↓              ↓                ↓              ↓
 Import    Duplicate?      Valid?          Complete?       Assigned
           [reject]        [reject]        [flag/skip]
```

**Integrations:**
- Email verification service (ZeroBounce, NeverBounce, or similar)
- Enrichment (Apollo enrichment, Clearbit, or similar)
- Supabase (contact database)

**Key Metrics:**
- Email validation pass rate (target: >90%)
- Enrichment completion rate
- Duplicate detection rate
- Compliance violations (should be 0)
- Data freshness (avg age of contact records)

**Quality Standards:**

| Field | Required | Validation |
|-------|----------|------------|
| Email | Yes | Must pass verification |
| First Name | Yes | Non-empty |
| Last Name | Yes | Non-empty |
| Company | Preferred | Enrichment attempt |
| Title | Preferred | Enrichment attempt |
| Phone | Optional | Format validation if present |
| LinkedIn URL | Optional | URL validation if present |

---

### 3. Capacity Planning

**Focus:** Matching lead volume to email sending capacity

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Sending Capacity Calculator | Agent | Total emails possible across all platforms | Daily |
| Domain Capacity Tracker | Monitor | Per-domain limits, health, rotation status | Daily |
| Lead-to-Campaign Allocator | Hybrid | Match leads to campaigns based on capacity | On request |
| Throttle Monitor | Monitor | Alert when approaching limits anywhere | Continuous |

**Email Infrastructure:**

| Platform | Purpose | Capacity Factors |
|----------|---------|------------------|
| Smartlead | Cold/marketing campaigns | # domains × daily limit per domain |
| GHL | Past participant outreach | Account sending limits |
| SMTP (future) | Diversification | Server/IP limits |

**Domain Strategy:**

| Use Case | Domain Type | Notes |
|----------|-------------|-------|
| Cold outreach | Warming or dedicated cold | Never use primary domain |
| Past participants (GHL) | Best-reputation domains | Warm audience = protect reputation |
| Transactional | Protected domain | Never use for marketing |
| Rotation | Distribute volume | Rest domains showing fatigue |

**Capacity Calculation:**
```
Total Daily Capacity = Σ (domain_daily_limit × domain_health_multiplier)

Where:
- domain_daily_limit = configured max sends per day
- domain_health_multiplier = 1.0 (healthy), 0.5 (warning), 0 (resting)
```

**Key Metrics:**
- Total daily sending capacity
- Current queue depth (leads awaiting send)
- Capacity utilization %
- Domain health scores (per domain)
- Domains by status (active/warming/resting)

---

### 4. Contact Database

**Focus:** Central source of truth for all contacts across platforms

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Database Manager | Monitor | Central repository health, integrity | Continuous |
| Segment Builder | Skill | Create targetable lists based on criteria | On-demand |
| Platform Sync Manager | Agent | Keep Smartlead, GHL, Apollo in sync | Hourly |
| Lifecycle Manager | Agent | Track contact status, archive stale leads | Weekly |

**Contact Lifecycle:**
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

**Integrations:**
- Supabase (primary database)
- Smartlead (sync contacts and campaign data)
- GHL (sync past participants)
- Apollo (sync enrichment data)

**Key Metrics:**
- Total contacts in database
- Contacts by lifecycle stage
- Sync status across platforms (last sync, errors)
- Data freshness (% updated in last 30/60/90 days)
- Segment sizes (for campaign planning)

---

## Decision Authority

### Autonomous (No Approval Needed)
- Routine lead importing and validation
- Standard enrichment operations
- Sync operations between platforms
- Capacity calculations and reporting
- Domain health monitoring
- Duplicate rejection

### Recommend + Approve
- Large lead pulls (>1,000 contacts)
- New source strategies or platforms
- Domain rotation changes
- Capacity allocation between competing campaigns
- Budget for credits (Apollo purchases, etc.)
- New domain purchases or warming

### Escalate Immediately
- Platform ban or account restriction
- Unusual credit consumption (>2x normal)
- Compliance violation detected
- Sync failures affecting live campaigns
- Capacity crisis (cannot fulfill campaign needs)
- Domain blacklisted

---

## Recommendation Framework

When Marketing or Sales requests leads, the Director follows this process:

### 1. Analyze the Request
```
Request: "Need leads for California HR Directors campaign"

Analysis:
- Target: HR Directors
- Location: California
- Industry: Any (or specific?)
- Volume: [to be determined]
- Timeline: [to be determined]
```

### 2. Evaluate Sources
```
Source Evaluation:

Apollo:
- Coverage: Strong for HR titles ✓
- Credits available: 1,200
- Historical quality: 92% validation rate
- Recommendation: Primary source

LinkedIn (PhantomBuster):
- Coverage: Excellent for CA targeting ✓
- Current usage: 80% of weekly limit
- Historical quality: 88% validation rate
- Recommendation: Supplement only (limit concerns)

Apify:
- Coverage: Would need custom job
- Cost: Estimate $X
- Recommendation: Not needed for this request
```

### 3. Calculate Capacity
```
Capacity Analysis:

Email Sending:
- Total daily capacity: 2,400 emails
- Currently queued: 1,850 emails
- Available: 550 emails/day

For 500 new leads:
- Time to send: ~1 day (within capacity)
- Recommended domains: [domain1, domain2, domain3]
- Domain health: All green
```

### 4. Make Recommendation
```
┌─────────────────────────────────────────────────────────────────┐
│ RECOMMENDATION: California HR Directors Campaign                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ SOURCE STRATEGY                                                  │
│ Primary: Apollo (500 leads)                                     │
│ Reason: Strong HR coverage, credits available, high quality     │
│                                                                  │
│ Credit Impact: 500 of 1,200 remaining (resets in 12 days)       │
│                                                                  │
│ CAPACITY                                                         │
│ Can accommodate: Yes                                             │
│ Send timeline: 1 day                                            │
│ Domains: domain1.com, domain2.com, domain3.com                  │
│                                                                  │
│ QUALITY PROJECTION                                               │
│ Expected validation rate: 92%                                   │
│ Expected usable leads: ~460                                     │
│                                                                  │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐                          │
│ │ APPROVE │  │ MODIFY  │  │ REJECT  │                          │
│ └─────────┘  └─────────┘  └─────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dashboard View (CEO)

```
┌─────────────────────────────────────────────────────────────────┐
│ LEAD INTELLIGENCE                            Health: 91/100 🟢  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CAPACITY STATUS                                                  │
│ ───────────────────────────────────────────────────────────────  │
│ Daily Email Capacity: 2,400                                     │
│ Currently Queued: 1,850                                         │
│ Available Headroom: 550                                         │
│ ████████████████████░░░░░ 77% utilized                          │
│                                                                  │
│ LEAD PIPELINE                                                    │
│ ───────────────────────────────────────────────────────────────  │
│ This Week:                                                       │
│   LinkedIn (PhantomBuster): 340 leads                           │
│   Apollo: 520 leads                                              │
│   Apify: 180 leads                                               │
│   ─────────────────────────                                      │
│   Total New: 1,040    Validated: 94%    Enriched: 88%          │
│                                                                  │
│ Unassigned Leads: 860                                           │
│                                                                  │
│ PLATFORM STATUS                                                  │
│ ───────────────────────────────────────────────────────────────  │
│ PhantomBuster: ⚠️ 80% daily limit                                │
│ Apollo: ⚠️ 1,200 credits remaining (resets in 12 days)           │
│ Sales Navigator: ✅ Healthy                                      │
│ Apify: ✅ 2 jobs running                                         │
│                                                                  │
│ DOMAIN HEALTH                                                    │
│ ───────────────────────────────────────────────────────────────  │
│ Active Domains: 12    Warming: 3    Resting: 2                  │
│ Avg Health Score: 87/100                                        │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ domain1.com: 95 🟢  domain2.com: 88 🟢  domain3.com: 91 🟢  │ │
│ │ domain4.com: 72 🟡  domain5.com: 65 🟡  [+12 more]          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ RECOMMENDATIONS                                                  │
│ ───────────────────────────────────────────────────────────────  │
│ 💡 Slow LinkedIn scraping—approaching weekly safety limit       │
│ 💡 Apollo credits low—prioritize highest-value searches         │
│ 💡 Consider activating 2 rested domains for next campaign       │
│                                                                  │
│ DATA QUALITY                                                     │
│ ───────────────────────────────────────────────────────────────  │
│ Validation Rate: 94%    Enrichment: 88%    Duplicates: 3%      │
│ Compliance: ✅ No violations                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Health Score Components

| Component | Weight | Measurement |
|-----------|--------|-------------|
| Platform Health | 0.25 | All scraping platforms operational, within limits |
| Capacity Available | 0.25 | % of sending capacity not at critical threshold |
| Data Quality | 0.20 | Validation + enrichment rates |
| Domain Health | 0.20 | Avg domain health score |
| No Critical Blockers | 0.10 | Binary: 100 if no critical alerts, 0 if any |

---

## Learning Objectives

What Lead Intelligence Director should get better at over time:

1. **Source Quality Patterns** — Learn which sources produce highest-quality leads for specific segments
2. **Optimal Volume** — Understand ideal lead volume per campaign type
3. **Domain Rotation** — Learn optimal domain rest/rotation patterns for deliverability
4. **Credit Efficiency** — Identify most cost-effective sourcing strategies
5. **Capacity Forecasting** — Predict capacity needs based on campaign calendar
6. **Validation Predictors** — Identify source characteristics that predict validation rates

---

## Cross-Department Coordination

| Scenario | Coordinates With | How |
|----------|------------------|-----|
| Campaign needs leads | Marketing | Receive request, provide recommendation |
| Capacity constraints | Marketing | Alert about limits, adjust campaign timing |
| Lead quality issues | Marketing | Feedback loop on bounces, engagement |
| New campaign planned | Marketing | Pre-allocate capacity |
| Domain reputation issues | Marketing | Coordinate on send volume reduction |
| Sales needs leads | Sales | Same recommendation process |
| Contact data updates | Digital | Ensure registration data flows to database |

---

## Domain Management Strategy

### Domain Categories

| Category | Count | Purpose | Daily Limit | Notes |
|----------|-------|---------|-------------|-------|
| Primary | 1 | Transactional only | N/A | Never use for marketing |
| Established | 5-7 | Main marketing sends | 200-400/domain | Best reputation |
| Warming | 2-4 | Building reputation | 20-50/domain | Gradually increase |
| Resting | 1-3 | Recovery | 0 | Rotate back when healthy |

### Health Indicators

| Signal | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Bounce Rate | <2% | 2-5% | >5% |
| Spam Complaints | 0 | 1-2 | >2 |
| Blacklist Status | Clear | Monitor listed | Major list |
| Open Rate | >25% | 15-25% | <15% |

### Rotation Rules

1. **Rest Trigger:** Domain hits warning on any signal → reduce volume 50%
2. **Rest Period:** 7-14 days at zero or minimal volume
3. **Recovery:** Gradual increase (50% → 75% → 100% over 2 weeks)
4. **Warming New:** Start at 20/day, increase 20% every 3 days if healthy
