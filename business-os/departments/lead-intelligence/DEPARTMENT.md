# Lead Intelligence Department

> **CEO Summary:** Lead Intelligence produces the leads that Marketing consumes. They handle lead sourcing, email validation, domain health, and sending capacity. Think of them as the "supply chain" for outreach—they answer "How many leads can we handle?" and "Are our domains healthy enough to send?"

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
- Email campaign content and execution (-> Marketing)
- Sales conversations and closing (-> Sales)
- Content for outreach messages (-> Content/Marketing)
- Website lead capture forms (-> Digital)

---

## Workers (Automated)

Background monitors and agents that run via n8n or scheduled tasks.

### Lead Sourcing Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| LinkedIn Scraper Manager | Monitor | PhantomBuster + Sales Navigator health, limits | Continuous |
| Apollo Manager | Monitor | Search jobs, credit usage, extraction status | Daily |
| Apify Manager | Monitor | Custom scraping jobs, results, errors | Per job |
| Source Balancer | Agent | Distribute sourcing to avoid limits/bans | Daily |

### Data Quality Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Email Validator | Agent | Verify emails before campaign entry | On import |
| Enrichment Processor | Agent | Fill missing fields (company, title, phone) | On import |
| Deduplication Manager | Agent | Prevent duplicates across all sources | On import |
| Compliance Monitor | Monitor | Opt-outs, do-not-contact, legal compliance | Continuous |

### Capacity Planning Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Sending Capacity Calculator | Agent | Total emails possible across all platforms | Daily |
| Domain Capacity Tracker | Monitor | Per-domain limits, health, rotation status | Daily |
| Lead-to-Campaign Allocator | Hybrid | Match leads to campaigns based on capacity | On request |
| Throttle Monitor | Monitor | Alert when approaching limits anywhere | Continuous |

### Contact Database Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Database Manager | Monitor | Central repository health, integrity | Continuous |
| Segment Builder | Skill | Create targetable lists based on criteria | On-demand |
| Platform Sync Manager | Agent | Keep Smartlead, GHL, Apollo in sync | Hourly |
| Lifecycle Manager | Agent | Track contact status, archive stale leads | Weekly |

---

## Key Integrations

| Tool | Purpose | Data Flow |
|------|---------|-----------|
| PhantomBuster | LinkedIn automation, scraping | In (leads) |
| Sales Navigator | LinkedIn targeting, search | In (targeting) |
| Apollo | B2B contact data, enrichment | In/Out |
| Apify | Custom scraping jobs | In (leads) |
| Smartlead | Email campaign platform sync | Out (contacts) |
| GoHighLevel | Past participant sync | In/Out |
| NeverBounce | Email verification | Out (verify) |
| Supabase | Contact database | In/Out |

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

1. **Source Quality Patterns** - Learn which sources produce highest-quality leads for specific segments
2. **Optimal Volume** - Understand ideal lead volume per campaign type
3. **Domain Rotation** - Learn optimal domain rest/rotation patterns for deliverability
4. **Credit Efficiency** - Identify most cost-effective sourcing strategies
5. **Capacity Forecasting** - Predict capacity needs based on campaign calendar
6. **Validation Predictors** - Identify source characteristics that predict validation rates

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

## Platform Details

### Lead Sourcing Platforms

| Platform | Purpose | Limits to Track | Cost Model |
|----------|---------|-----------------|------------|
| PhantomBuster | LinkedIn automation | Daily actions, weekly limits | Subscription |
| Sales Navigator | LinkedIn targeting | Search limits, profile views | Subscription |
| Apollo | B2B contact data | Credits per search/export | Credits |
| Apify | Custom scraping | Compute units, run time | Usage-based |

### Safety Thresholds

| Platform | Warning | Critical |
|----------|---------|----------|
| PhantomBuster Daily | 80% of limit | 95% of limit |
| PhantomBuster Weekly | 70% of limit | 90% of limit |
| Apollo Credits | 30% remaining | 10% remaining |
| Any Platform | Rate limit hit | Account restricted |

---

## Data Pipeline

```
Raw Lead -> Dedupe Check -> Email Validation -> Enrichment -> Ready for Campaign
   |           |              |                |              |
 Import    Duplicate?      Valid?          Complete?       Assigned
           [reject]        [reject]        [flag/skip]
```

### Quality Standards

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

## Capacity Planning

### Email Infrastructure

| Platform | Purpose | Capacity Factors |
|----------|---------|------------------|
| Smartlead | Cold/marketing campaigns | # domains x daily limit per domain |
| GHL | Past participant outreach | Account sending limits |
| SMTP (future) | Diversification | Server/IP limits |

### Domain Strategy

| Use Case | Domain Type | Notes |
|----------|-------------|-------|
| Cold outreach | Warming or dedicated cold | Never use primary domain |
| Past participants (GHL) | Best-reputation domains | Warm audience = protect reputation |
| Transactional | Protected domain | Never use for marketing |
| Rotation | Distribute volume | Rest domains showing fatigue |

### Capacity Calculation

```
Total Daily Capacity = Sum(domain_daily_limit x domain_health_multiplier)

Where:
- domain_daily_limit = configured max sends per day
- domain_health_multiplier = 1.0 (healthy), 0.5 (warning), 0 (resting)
```

---

## Contact Lifecycle

```
+-------+   +-----------+   +----------+   +----------+   +---------+
|  New  | > | Validated | > | Enriched | > | Assigned | > |Contacted|
+-------+   +-----------+   +----------+   +----------+   +----+----+
                                                              |
                                              +---------------+-------+
                                              v                       v
                                        +----------+          +-----------+
                                        | Engaged  |          |   Stale   |
                                        +----+-----+          +-----+-----+
                                             |                      |
                                             v                      v
                                      +------------+          +-----------+
                                      | Converted  |          | Archived  |
                                      +------------+          +-----------+
```

---

## Domain Management

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

1. **Rest Trigger:** Domain hits warning on any signal -> reduce volume 50%
2. **Rest Period:** 7-14 days at zero or minimal volume
3. **Recovery:** Gradual increase (50% -> 75% -> 100% over 2 weeks)
4. **Warming New:** Start at 20/day, increase 20% every 3 days if healthy
