# Business OS Architecture

> **Purpose:** Reference for building the Business OS platform. Consult this when creating departments, workers, dashboards, or integrations.

## What Business OS Is

A self-improving business command center that:
- **Executes** — Workers perform tasks autonomously
- **Monitors** — Tracks metrics across all departments
- **Learns** — Adjusts based on outcomes and CEO feedback
- **Advises** — Surfaces insights and recommendations

## Core Terminology

| Term | Definition | Implementation |
|------|------------|----------------|
| **Department** | Domain with scope, tools, knowledge base | Folder + Supabase + skills |
| **Director** | AI agent that synthesizes, recommends, coordinates | Claude with department context |
| **Worker** | Focused executor for specific tasks | Skill (conversational) or n8n (autonomous) |
| **Board Meeting** | Strategic synthesis across all Directors | Claude with all department data |

### Worker Types

| Type | Use When | Implementation |
|------|----------|----------------|
| **Monitor** | Watch metrics, alert on conditions | n8n scheduled workflow |
| **Agent** | Autonomous task execution | n8n workflow + Claude API |
| **Skill** | Conversational, needs human input | Claude Skill |
| **Hybrid** | Autonomous with approval gates | n8n + approval queue |

## Departments

### Marketing
**Director Focus:** Campaigns, engagement, channel performance

| Sub-Department | Key Workers |
|----------------|-------------|
| Email | List Health Monitor, Campaign Analyst, Deliverability Monitor |
| SEO | Rank Tracker, Traffic Analyst, Technical SEO Monitor |
| Social | Content Creator (skill), Engagement Tracker |
| LinkedIn Automation | PhantomBuster Monitor, HeyReach Monitor, Response Flagger |
| Outreach | Past Participant Tracker, Re-engagement Campaigner |

**Integrations:** Smartlead, GHL, Zapmail, PhantomBuster, HeyReach, Google Analytics, Search Console

**Does NOT own:** Lead sourcing (→ Lead Intelligence), Website (→ Digital)

---

### Digital
**Director Focus:** Website health, QA, development, security

| Sub-Department | Key Workers |
|----------------|-------------|
| Site Performance | Uptime Monitor, Speed Tracker, Core Web Vitals |
| Database | Query Monitor, Backup Verifier, Usage Tracker |
| Security | Vulnerability Scanner, Certificate Monitor, Auth Monitor |
| Analytics | Traffic Analyst, Conversion Tracker, Behavior Analyst |
| Quality Assurance | Registration Tester (Playwright), Payment Verifier, Link Checker |
| Development | Deployment Monitor, Dependency Tracker, Bug Tracker |

**Critical:** Registration testing covers 20 paths (14 programs × formats) + Stripe + GHL verification

**Integrations:** Vercel, Supabase, Stripe, GHL API, Playwright MCP, Sentry

---

### Lead Intelligence
**Director Focus:** Lead sourcing, capacity planning, data quality

| Sub-Department | Key Workers |
|----------------|-------------|
| Lead Sourcing | LinkedIn Scraper Manager, Apollo Manager, Apify Manager, Source Balancer |
| Data Quality | Email Validator, Enrichment Processor, Deduplication Manager |
| Capacity Planning | Sending Capacity Calculator, Domain Capacity Tracker, Lead-to-Campaign Allocator |
| Contact Database | Database Manager, Segment Builder, Platform Sync Manager |

**Key Responsibility:** Produces leads that Marketing/Sales consume. Owns domain health and email capacity.

**Integrations:** PhantomBuster, Apollo, Apify, Sales Navigator, ZeroBounce/NeverBounce

**Domain Strategy:**
- Cold outreach → Warming/dedicated domains
- Past participants → Best-reputation domains
- Transactional → Protected domain (never marketing)

---

### To Be Built
- **Sales** — Pipeline, closing, relationships
- **Content** — Assets, creative, brand voice
- **Operations** — Processes, SOPs, fulfillment

## Decision Authority Levels

| Level | When | Example |
|-------|------|---------|
| **Autonomous** | Routine, low-risk | Monitoring, data sync |
| **Post-Hoc Review** | Medium-risk, reversible | A/B test execution |
| **Pre-Approval** | External-facing, high-risk | Email campaigns, social posts |
| **Immediate Escalation** | Critical | Site down, security breach |

## Approval Queue Pattern

```
Worker recommends → Queue item created → CEO reviews →
  ├── Approve → Execute → Log outcome
  ├── Modify → Execute modified → Log outcome + modification
  └── Reject → Archive → Log reasoning
```

All decisions logged to `decisions` table for learning loop.

## Dashboard Health Score

Each department calculates health from weighted metrics:

```javascript
health = Σ(metric_value × weight)
// Example: Marketing
// 0.25 × deliverability + 0.20 × list_health + 0.20 × campaign_performance + ...
```

**Thresholds:** 🟢 ≥80 | 🟡 60-79 | 🔴 <60

## Board Meeting

**Entry Points:**
1. Dashboard "Board Meeting" button → Full cross-department briefing
2. Question-driven → Ask strategic question, relevant Directors respond

**Output:** Executive summary + department briefings + recommendations + risks + decisions needed

## Database Schema (Core Tables)

```sql
departments (id, name, slug, health_score, config)
workers (id, department_id, name, type, status, last_run, config)
metrics (id, department_id, metric_name, metric_value, recorded_at)
alerts (id, department_id, severity, title, resolved)
approval_queue (id, department_id, type, title, details, recommendation, status)
decisions (id, recommendation, ceo_action, ceo_reasoning, outcome)
activity_log (id, department_id, action, details, created_at)

-- Lead Intelligence specific
contacts (id, email, lifecycle_stage, email_validated, enrichment_data)
domains (id, domain, platform, status, daily_limit, health_score)
platform_limits (id, platform, credits_remaining, current_daily_usage)
```

## n8n Workflow Patterns

**Monitor:**
```
Schedule → Fetch Data → Evaluate Threshold → Log Metric → Create Alert (if needed)
```

**Agent with Approval:**
```
Trigger → Gather Context → Claude Decision → Check Threshold →
  ├── Auto-approve → Execute → Log
  └── Needs approval → Queue → Wait for CEO
```

## File Structure

```
project/
├── business-os/
│   ├── docs/architecture/      # Full documentation (8 files)
│   └── knowledge/              # ICP, voice, competitive intel, etc.
├── departments/
│   ├── marketing/
│   │   ├── DEPARTMENT.md       # Director knowledge base
│   │   ├── config.json         # Thresholds, settings
│   │   └── sub-departments/
│   │       └── email/
│   │           ├── SKILL.md
│   │           └── workers/
│   ├── digital/
│   └── lead-intelligence/
├── app/                        # Next.js dashboard (future)
├── supabase/migrations/
└── n8n/workflows/
```

## Creating a New Department

1. Copy `business-os/docs/architecture/01-DEPARTMENT-TEMPLATE.md`
2. Define: Director role, scope, sub-departments, workers
3. Set decision authority levels
4. Define health score components
5. Create folder structure
6. Build monitors first, then agents, then skills
7. Add to dashboard

## Key Principles

1. **Specialized Focus** — Each worker does one thing well
2. **Human Oversight** — CEO approves external actions
3. **Self-Improvement** — Every decision feeds learning loop
4. **Cross-Department Coordination** — Directors consult each other

## Quick Reference: Common Patterns

**Need leads for campaign:**
```
Marketing → requests from Lead Intelligence →
Lead Intel evaluates sources + capacity → recommends → CEO approves
```

**Campaign launch:**
```
Marketing Director recommends → approval queue →
CEO approves → n8n executes → outcome logged → learning updated
```

**Something breaks:**
```
Digital Monitor detects → alert created → CEO notified →
immediate escalation if critical
```

---

## Full Documentation

For complete specifications, see `business-os/docs/architecture/`:
- `00-OVERVIEW.md` — Vision, terminology, architecture
- `01-DEPARTMENT-TEMPLATE.md` — Template for new departments
- `02-MARKETING.md` — Full Marketing specification
- `03-DIGITAL.md` — Full Digital specification
- `04-LEAD-INTELLIGENCE.md` — Full Lead Intelligence specification
- `05-BOARD-MEETING.md` — Strategic synthesis layer
- `06-HUMAN-IN-LOOP.md` — Approval patterns, learning loop
- `07-IMPLEMENTATION.md` — Schema, n8n patterns, phased plan

## Knowledge Base

For business intelligence and strategy, see `business-os/knowledge/`:
- `ICP.md` — Ideal Customer Profiles, segments, triggers, ABM criteria
- `COMPETITIVE_POSITIONING.md` — Differentiators, competitor analysis, objection handling
- `MARKETING_OVERVIEW.md` — Strategy, initiatives, channels, email infrastructure, KPIs
- `VOICE_AND_MESSAGING.md` — Brand voice, messaging hierarchy, proof points, CTAs, phrase library
- `CHANNEL_PLAYBOOKS/` — Tactical execution guides:
  - `EMAIL_COLD_OUTREACH.md` — ABM sequences, general prospecting, credential-specific
  - `EMAIL_NURTURE_ALUMNI.md` — Alumni re-engagement, colleague referrals, engaged prospects
  - `LINKEDIN_ORGANIC.md` — Content pillars, posting cadence, engagement strategy
  - `LINKEDIN_OUTREACH.md` — Connection requests, DM sequences, response handling
  - `LOCAL_GEO_TARGETED.md` — City campaigns, timeline, templates, virtual cross-sell
