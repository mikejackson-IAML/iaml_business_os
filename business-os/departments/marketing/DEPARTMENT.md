# Marketing Department

> **CEO Summary:** Marketing owns all outreach to fill seats in programs—email campaigns, LinkedIn automation, and engagement tracking. They consume leads produced by Lead Intelligence and coordinate with Programs on enrollment goals. Key metrics: open rates, reply rates, and registrations driven by campaigns.

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

---

## Employees (Claude Code)

Interactive roles you can invoke via commands.

| Employee | Role | Commands |
|----------|------|----------|
| Email Campaign Specialist | Execute email campaigns following playbooks | `/cold-outreach-sequence`, `/alumni-campaign`, `/ab-test-analysis` |
| Content Specialist | Create and optimize program pages | `/new-program`, `/seo-optimize`, `/brand-upgrade` (future migration) |
| LinkedIn Specialist | Manage LinkedIn content and automation | (future) |

---

## Workers (Automated)

Background monitors and agents that run via n8n.

### Email Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| List Health Monitor | Monitor | Bounces, unsubscribes, hygiene scores | Daily |
| Campaign Analyst | Monitor | Open rates, click rates, trends | 48h post-send |
| Deliverability Monitor | Monitor | Domain reputation, blacklists | Daily |
| A/B Test Manager | Hybrid | Test analysis, winner recommendations | On threshold |

### SEO Sub-Department (Future)

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Rank Tracker | Monitor | Keyword positions, SERP changes | Daily |
| Traffic Analyst | Monitor | Organic traffic trends | Weekly |

### LinkedIn Sub-Department (Future)

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| PhantomBuster Monitor | Monitor | Campaign health, daily limits | Continuous |
| Response Flagger | Monitor | Flag replies needing human response | Real-time |

---

## Key Integrations

| Tool | Purpose | Data Flow |
|------|---------|-----------|
| Smartlead | Cold email sending, campaigns | Out (sends), In (metrics) |
| GoHighLevel | Past participant outreach, CRM | Out (sends), In (contacts) |
| Supabase | Contact database, analytics | In/Out |
| Airtable | Program data, registrations | In |
| PhantomBuster | LinkedIn automation | In (metrics) |
| HeyReach | LinkedIn sequences | In (metrics) |

---

## Decision Authority

### Autonomous (No Approval Needed)
- Routine campaign monitoring and reporting
- A/B test execution (within pre-approved parameters)
- List hygiene operations (removing bounces, unsubscribes)
- SEO monitoring and reporting

### Recommend + Approve
- New email campaign launches
- Major list changes (imports >500, exports, segment changes)
- Domain rotation strategy changes
- New LinkedIn outreach sequences
- Re-engagement campaign launches

### Escalate Immediately
- Deliverability crisis (domain blacklisted, major reputation drop)
- Unusual bounce spike (>5% increase from baseline)
- Automation errors affecting live campaigns
- Compliance concerns (spam complaints, unsubscribe issues)
- LinkedIn account restrictions or bans

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

What Marketing Department should get better at over time:

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

---

## Knowledge Base References

The Marketing Department draws on these knowledge resources:

- `business-os/knowledge/CHANNEL_PLAYBOOKS/EMAIL_COLD_OUTREACH.md` — Cold email templates, sequences, domain rules
- `business-os/knowledge/CHANNEL_PLAYBOOKS/EMAIL_NURTURE_ALUMNI.md` — Alumni engagement, nurture sequences
- `business-os/knowledge/CHANNEL_PLAYBOOKS/LINKEDIN_ORGANIC.md` — LinkedIn content strategy
- `business-os/knowledge/CHANNEL_PLAYBOOKS/LINKEDIN_OUTREACH.md` — LinkedIn automation playbook
- `business-os/knowledge/CHANNEL_PLAYBOOKS/LOCAL_GEO_TARGETED.md` — Geo-targeted campaign playbook
- `business-os/knowledge/VOICE_AND_MESSAGING.md` — Brand voice, messaging hierarchy
- `business-os/knowledge/ICP.md` — Ideal customer profiles, segmentation
- `business-os/knowledge/COMPETITIVE_POSITIONING.md` — Competitive landscape
- `business-os/knowledge/MARKETING_OVERVIEW.md` — Strategic marketing foundation
