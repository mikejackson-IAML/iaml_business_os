# Marketing Department

## Director Role

**Marketing Director** oversees all marketing channels, coordinates campaigns, tracks performance across email, SEO, social, and LinkedIn automation, and recommends strategic adjustments. The Director maintains awareness of campaign performance, list health, engagement trends, and can answer "How's marketing doing?" at any time.

## Domain Scope

**Owns:**
- Email campaigns and list management
- SEO strategy and monitoring
- Social media content and engagement
- LinkedIn automation oversight (PhantomBuster, HeyReach)
- Past participant outreach
- Marketing analytics and reporting

**Does Not Own:**
- Lead sourcing and scraping (→ Lead Intelligence)
- Website development and monitoring (→ Digital)
- Sales pipeline and closing (→ Sales)
- Content asset creation (→ Content)
- Email sending capacity and domain health (→ Lead Intelligence)

## Sub-Departments

### 1. Email

**Focus:** Campaign execution, list health, deliverability

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| List Health Monitor | Monitor | Bounces, unsubscribes, hygiene scores | Continuous |
| Campaign Analyst | Monitor | Open rates, click rates, trends | After each send |
| A/B Test Manager | Hybrid | Test design, winner identification, recommendations | Per campaign |
| Deliverability Monitor | Monitor | Domain reputation, inbox placement, blacklists | Daily |

**Integrations:**
- Smartlead (primary cold/marketing sending)
- GHL (past participant outreach)
- Zapmail (domain management)
- Future SMTP (diversification)

**Key Metrics:**
- List size and growth rate
- List health score (bounce rate, engagement)
- Average open rate (30-day rolling)
- Average click rate
- Deliverability rate by domain

**Note:** Email sending capacity and domain health strategy is owned by Lead Intelligence. Marketing consumes that capacity for campaigns.

---

### 2. SEO

**Focus:** Organic search visibility and traffic

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Rank Tracker | Monitor | Keyword positions, SERP changes | Daily |
| Traffic Analyst | Monitor | Organic traffic trends, landing pages | Weekly |
| Content Optimizer | Skill | Page improvement recommendations | On-demand |
| Technical SEO Monitor | Monitor | Crawl errors, indexing, site health | Daily |

**Integrations:**
- Google Search Console
- Google Analytics
- DataForSEO (or similar rank tracking)

**Key Metrics:**
- Organic traffic (monthly)
- Keyword rankings (target terms)
- Click-through rate from search
- Indexed pages count
- Core Web Vitals status (coordinated with Digital)

---

### 3. Social

**Focus:** Brand presence and engagement on social platforms

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Content Creator | Skill | Draft LinkedIn posts for approval | On-demand |
| Engagement Tracker | Monitor | Likes, comments, shares, follower growth | Daily |
| Best Time Analyzer | Agent | Determine optimal posting schedule | Weekly analysis |
| Viral Content Scout | Agent | Find trending content in HR/employment law space | Daily |

**Integrations:**
- LinkedIn (native posting)
- Apify (viral content discovery)
- Scheduling tool (Buffer, Hootsuite, or similar)

**Key Metrics:**
- Follower count and growth rate
- Engagement rate (interactions / impressions)
- Post reach
- Click-throughs to website
- Top performing content types

---

### 4. LinkedIn Automation

**Focus:** Automated outreach and network growth via PhantomBuster and HeyReach

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| PhantomBuster Monitor | Monitor | Campaign health, daily limits, errors | Continuous |
| HeyReach Monitor | Monitor | Sequence performance, response rates | Daily |
| Connection Tracker | Monitor | Acceptance rates, network growth | Daily |
| Response Flagger | Monitor | Flag replies needing human response | Real-time |

**Integrations:**
- PhantomBuster (automation platform)
- HeyReach (LinkedIn sequences)
- Sales Navigator (targeting)

**Key Metrics:**
- Connection requests sent / accepted (acceptance rate)
- Response rate to outreach
- Campaigns active / paused
- Daily limit usage (safety threshold)
- Network growth rate

**Human-in-the-Loop:**
- Response Flagger surfaces replies requiring human response
- Campaign strategy changes require approval
- New sequence templates require approval

---

### 5. Outreach

**Focus:** Past participant re-engagement campaigns

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Past Participant Tracker | Monitor | Identify eligible re-engagement contacts | Weekly |
| Re-engagement Campaigner | Hybrid | Design and execute re-engagement sequences | As needed |
| Segment Manager | Skill | Build and maintain audience segments | On-demand |

**Integrations:**
- GHL (primary sending for past participants)
- Supabase (contact database, registration history)

**Key Metrics:**
- Past participants in database (total)
- Days since last contact (by segment)
- Re-engagement rate
- Repeat registration rate

**Logic:**
- Past participants are "warm" audience—use best-reputation domains
- Track which seminars they attended for relevant follow-up
- Coordinate with Lead Intelligence on capacity

---

### 6. Digital Ads (Future)

*Placeholder for paid advertising when ready to implement*

**Prerequisites (before activating):**
- [ ] Conversion tracking implemented on website (→ Digital)
- [ ] Landing pages optimized for paid traffic (→ Digital)
- [ ] Budget approved and allocated
- [ ] Attribution model defined (first-touch, last-touch, multi-touch)
- [ ] Target CAC established based on LTV analysis
- [ ] Retargeting pixel installed

**Likely scope:**
- Google Ads (search, display)
- LinkedIn Ads (sponsored content, InMail)
- Meta Ads (if applicable for HR audience)

**To be defined:**
- Budget management and pacing
- Campaign performance tracking
- Creative testing framework
- Audience targeting and exclusions
- Bid strategy optimization

---

## Decision Authority

### Autonomous (No Approval Needed)
- Routine campaign monitoring and reporting
- A/B test execution (within pre-approved parameters)
- Social post scheduling (pre-approved content only)
- List hygiene operations (removing bounces, unsubscribes)
- LinkedIn automation monitoring and limit management
- SEO monitoring and reporting

### Recommend + Approve
- New email campaign launches
- Social post content (drafts go to approval queue)
- Major list changes (imports >500, exports, segment changes)
- Budget allocation changes
- Domain rotation strategy changes
- New LinkedIn outreach sequences
- Re-engagement campaign launches

### Escalate Immediately
- Deliverability crisis (domain blacklisted, major reputation drop)
- Unusual bounce spike (>5% increase from baseline)
- Automation errors affecting live campaigns
- Compliance concerns (spam complaints, unsubscribe issues)
- LinkedIn account restrictions or bans
- Any potential legal/PR issue

---

## Dashboard View (CEO)

```
┌─────────────────────────────────────────────────────────────────┐
│ MARKETING                                    Health: 87/100 🟢  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ KEY METRICS                                                      │
│ ───────────────────────────────────────────────────────────────  │
│ Email List: 12,450 (↑ 3%)     Open Rate: 34%      CTR: 4.2%    │
│ LinkedIn: 2,340 followers     Organic Traffic: 4,200/mo        │
│                                                                  │
│ ACTIVE CAMPAIGNS                                                 │
│ ───────────────────────────────────────────────────────────────  │
│ • Employment Law Update Series    42% open    ✅ Performing     │
│ • CA HR Director Outreach         28% open    ⚠️ Below target  │
│ • Past Participant Re-engage      51% open    ✅ Strong         │
│                                                                  │
│ NEEDS ATTENTION                                                  │
│ ───────────────────────────────────────────────────────────────  │
│ ⚠️ Email bounce rate increased 2% this week                     │
│ 📝 3 social posts awaiting approval                              │
│ 💡 Recommendation: Past participant segment idle 60 days        │
│                                                                  │
│ LINKEDIN AUTOMATION                                              │
│ ───────────────────────────────────────────────────────────────  │
│ Connections this month: 847    Response rate: 12%               │
│ PhantomBuster: 80% daily limit    HeyReach: 3 sequences active  │
│                                                                  │
│ SEO SNAPSHOT                                                     │
│ ───────────────────────────────────────────────────────────────  │
│ Organic Traffic: 4,200 (↓ 5%)    Top keyword: #4 (was #3)      │
│ 💡 "California employment law training" dropped—investigate     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Health Score Components

| Component | Weight | Measurement |
|-----------|--------|-------------|
| Email Deliverability | 0.25 | Avg inbox placement rate across domains |
| List Health | 0.20 | Inverse of bounce rate + engagement score |
| Campaign Performance | 0.20 | Open rate vs. target (34% baseline) |
| Automation Status | 0.15 | % of automations running without error |
| Social Engagement | 0.10 | Engagement rate trend |
| No Critical Blockers | 0.10 | Binary: 100 if no critical alerts, 0 if any |

---

## Learning Objectives

What Marketing Director should get better at over time:

1. **Campaign Timing** — Learn which days/times produce best open rates for this audience
2. **Subject Line Patterns** — Identify what subject line styles resonate with HR professionals
3. **Segment Performance** — Understand which segments respond to which message types
4. **LinkedIn Message Effectiveness** — Learn which outreach templates get best response rates
5. **Re-engagement Triggers** — Identify optimal timing for past participant follow-up
6. **Content Topics** — Track which SEO/social topics drive most engagement

---

## Cross-Department Coordination

| Scenario | Coordinates With | How |
|----------|------------------|-----|
| Need leads for campaign | Lead Intelligence | Request via capacity allocation |
| Email sending capacity | Lead Intelligence | They own domain strategy and limits |
| Website content updates | Digital | Request changes, monitor impact |
| New content assets needed | Content | Request via content queue |
| Lead became customer | Sales | Handoff and attribution tracking |
