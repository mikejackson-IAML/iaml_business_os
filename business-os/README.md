# Business OS

> **CEO Summary:** Business OS automates IAML's marketing, lead intelligence, digital operations, and program management. It's organized into departments that mirror a real organization, each with automated workers that run 24/7 without human intervention.

---

## Quick Start: Where to Look

| If you want to... | Go to... |
|-------------------|----------|
| Understand what a department does | [Departments](#departments) |
| See what's running automatically | [Active Workflows](#active-workflows) |
| Learn how we execute a channel | [Knowledge Base](#knowledge-base) |
| Find technical architecture docs | [Architecture](#architecture) |

---

## Departments

Business OS is organized into four departments. Each has a Director role, automated Workers, and Claude Code Employees (interactive commands).

| Department | What It Does | Key Responsibility |
|------------|--------------|-------------------|
| [Marketing](departments/marketing/DEPARTMENT.md) | Email campaigns, LinkedIn automation, engagement tracking | Fill seats in programs through outreach |
| [Lead Intelligence](departments/lead-intelligence/DEPARTMENT.md) | Lead sourcing, data quality, sending capacity | Produce and validate leads for Marketing |
| [Digital](departments/digital/DEPARTMENT.md) | Website health, performance, deployments | Keep iaml.com fast, secure, and working |
| [Programs](departments/programs/DEPARTMENT.md) | Program planning, faculty, logistics | Deliver ~40 programs successfully |

### How They Work Together

```
Lead Intelligence ──produces leads──► Marketing ──fills seats──► Programs
       │                                  │                          │
       │                                  │                          │
       └──────────── Digital (website) supports all three ───────────┘
```

---

## Active Workflows

These n8n workflows run automatically to keep operations running smoothly. All workflows have detailed README documentation.

### Lead Intelligence Workflows

| Workflow | Schedule | What It Does |
|----------|----------|--------------|
| [Smartlead Inbox Sync](workflows/README-smartlead-inbox-sync.md) | Every 4 hours | Syncs email account health from Smartlead to dashboard |
| [Domain Health Sync](workflows/README-domain-health-sync.md) | Daily 6am | Checks domain reputation, blacklists, updates health scores |
| [Capacity Tracker](workflows/README-capacity-tracker.md) | Hourly | Calculates total email sending capacity, alerts at 90% |
| [Inbox Ramp-Up](workflows/README-smartlead-inbox-rampup.md) | Weekly Monday | Increases daily limits on new inboxes following ramp schedule |

### Digital Workflows

| Workflow | Schedule | What It Does |
|----------|----------|--------------|
| [Uptime Monitor](workflows/README.md) | Every 5 min | Checks if iaml.com is up, alerts via Slack/email if down |
| [SSL Certificate Monitor](workflows/README-ssl-certificate-monitor.md) | Daily | Checks SSL expiration, alerts 14 days before expiry |
| [Link Checker](workflows/README-link-checker.md) | Daily | Scans sitemap for broken links, reports any 404s |
| [Lighthouse Auditor](workflows/README-lighthouse-auditor.md) | Daily | Full Lighthouse audit (performance, accessibility, SEO) |
| [Page Speed Monitor](workflows/README-page-speed-monitor.md) | Every 4 hours | Quick load time check for key pages |
| [Sitemap Validator](workflows/README-sitemap-validator.md) | Daily | Validates sitemap.xml format and structure |
| [Meta Tag Auditor](workflows/README-meta-tag-auditor.md) | Weekly | Checks title/description tags on all pages |
| [Schema Validator](workflows/README-schema-validator.md) | Weekly | Validates JSON-LD structured data |
| [Indexability Checker](workflows/README-indexability-checker.md) | Daily | Checks robots.txt, noindex tags, canonicals |

### Programs Workflows

| Workflow | Schedule | What It Does |
|----------|----------|--------------|
| [Airtable Registrations Sync](workflows/README-airtable-registrations-sync.md) | Daily midnight + webhook | Syncs registrations from Airtable to Supabase and GHL |

### Operational Workflows

| Workflow | Schedule | What It Does |
|----------|----------|--------------|
| [Daily Accomplishment Email](workflows/README-daily-accomplishment-email.md) | Daily 6pm | Sends summary of Claude Code accomplishments (inactive) |
| [Knowledge Staleness Alerts](workflows/README-knowledge-staleness-alerts.md) | Weekly Monday | Flags knowledge base entries that need review (inactive) |

---

## Knowledge Base

Strategic and tactical knowledge that guides operations.

### Strategy

| Document | What's In It |
|----------|--------------|
| [ICP](knowledge/ICP.md) | Who we target: company sizes, titles, pain points |
| [Competitive Positioning](knowledge/COMPETITIVE_POSITIONING.md) | How we differentiate from competitors |
| [Voice & Messaging](knowledge/VOICE_AND_MESSAGING.md) | Brand voice, tone, messaging hierarchy |
| [Marketing Overview](knowledge/MARKETING_OVERVIEW.md) | Strategic marketing foundation |

### Channel Playbooks

Step-by-step execution guides for each marketing channel.

| Playbook | Channel |
|----------|---------|
| [Email Cold Outreach](knowledge/CHANNEL_PLAYBOOKS/EMAIL_COLD_OUTREACH.md) | Cold email sequences, domain rules |
| [Email Nurture Alumni](knowledge/CHANNEL_PLAYBOOKS/EMAIL_NURTURE_ALUMNI.md) | Alumni engagement, re-activation |
| [LinkedIn Organic](knowledge/CHANNEL_PLAYBOOKS/LINKEDIN_ORGANIC.md) | Organic LinkedIn content strategy |
| [LinkedIn Outreach](knowledge/CHANNEL_PLAYBOOKS/LINKEDIN_OUTREACH.md) | LinkedIn automation playbook |
| [Local Geo-Targeted](knowledge/CHANNEL_PLAYBOOKS/LOCAL_GEO_TARGETED.md) | Location-based campaigns |

---

## Architecture

Technical documentation for developers and advanced users.

| Document | What's In It |
|----------|--------------|
| [Campaign Tracking](docs/architecture/08-CAMPAIGN-TRACKING.md) | Multi-channel campaign schema, lifecycle tracking |
| [n8n-brain Schema](../supabase/migrations/20260111_create_n8n_brain_schema.sql) | Learning layer for n8n workflows |

---

## Key Integrations

| System | Purpose | Used By |
|--------|---------|---------|
| **n8n** | Workflow automation | All departments |
| **Supabase** | PostgreSQL database | All departments |
| **Smartlead** | Cold email sending | Lead Intelligence, Marketing |
| **GoHighLevel (GHL)** | CRM, past participant outreach | Marketing, Programs |
| **Airtable** | Program data, registrations | Programs |
| **HeyReach** | LinkedIn automation | Marketing |
| **Apollo** | B2B contact data | Lead Intelligence |
| **Vercel** | Website hosting | Digital |

---

## Claude Code Skills

Interactive commands available in Claude Code, organized by department.

### Marketing Skills
- `/cold-outreach-sequence` - Generate cold email sequences
- `/alumni-campaign` - Create alumni re-engagement campaigns
- `/ab-test-analysis` - Analyze A/B test results
- `/new-program` - Create new program pages
- `/seo-optimize` - Optimize page for SEO
- `/brand-upgrade` - Upgrade content to match brand voice

### Digital Skills
- `/deploy` - Production deployment
- `/preview` - Preview deployment
- `/smoke` - Run smoke tests
- `/speed-optimize` - Optimize page performance
- `/deep-plan-ui` - Plan complex frontend work

### Operations Skills
- `/done` - Log accomplishments
- `/knowledge` - Manage institutional knowledge
- `/goals` - View and manage goals

---

## Getting Started

### For a CEO/Manager
1. Start with this README to understand what exists
2. Click into any department to see workers and responsibilities
3. Review the active workflows to see what runs automatically
4. Check knowledge base for strategic documentation

### For a Developer
1. Review architecture docs for technical context
2. Check workflow READMEs for n8n patterns
3. See [CLAUDE.md](../CLAUDE.md) for project guidelines

---

## Status

| Department | Workers Active | Last Updated |
|------------|----------------|--------------|
| Marketing | Partial | Jan 2026 |
| Lead Intelligence | Active | Jan 2026 |
| Digital | Active | Jan 2026 |
| Programs | Planning | Jan 2026 |
