# Resource Inventory

> Master list of all tools, MCP servers, integrations, and capabilities available to the business.

---

## Purpose

This inventory helps the Chief Improvement Officer (and you) understand:
1. What tools and capabilities are available
2. How they're currently being used
3. Where there's untapped potential
4. What gaps might need new tools

---

## MCP Servers - Available

### Development & Core

| Server | Status | Purpose | Business Use | Config |
|--------|--------|---------|--------------|--------|
| **Supabase** | 🟢 Ready | Database & analytics | Central data warehouse, dashboards | HTTP MCP |
| **Airtable** | 🟢 Ready | Structured data | Program catalog, registrations | Stdio MCP |
| **Playwright** | 🟢 Ready | Browser automation | Web scraping, testing | Stdio MCP |
| **Context7** | 🟢 Ready | Library docs lookup | Development reference | Stdio MCP |

### Automation

| Server | Status | Purpose | Business Use | Config |
|--------|--------|---------|--------------|--------|
| **n8n** | 🟢 Ready | Workflow automation | Automate business processes | Stdio MCP |
| **n8n-docs** | 🟢 Ready | Node documentation | 543 nodes, 2,646 examples | Stdio MCP |

### Data & Research

| Server | Status | Purpose | Business Use | Config |
|--------|--------|---------|--------------|--------|
| **Apify** | 🟢 Ready | Web scraping actors | Lead research, competitor intel | Stdio MCP |
| **Exa** | 🟢 Ready | AI-powered web search | Market research, content ideas | Stdio MCP |

---

## MCP Servers - Needed (Gaps)

| Server | Purpose | Business Need | Priority | Status |
|--------|---------|---------------|----------|--------|
| SmartLead | Email sequences | Outbound email automation | 🔴 High | Research needed |
| Heyreach | LinkedIn automation | LinkedIn outreach | 🔴 High | Research needed |
| Google Analytics | Website traffic | Traffic analysis | 🟠 Medium | Research needed |
| GoHighLevel | CRM | Pipeline & client mgmt | 🟠 Medium | May not have MCP |

---

## MCP Server Business Applications

### For Revenue Operations

| Task | Primary MCP | Secondary | Notes |
|------|-------------|-----------|-------|
| Lead research | Apify, Exa | - | Scrape company info, find contacts |
| Pipeline tracking | Supabase | Airtable | Store & query opportunities |
| Proposal generation | - | Context7 | Use templates + data |
| Follow-up automation | n8n | - | Trigger sequences based on pipeline |

### For Program Operations

| Task | Primary MCP | Secondary | Notes |
|------|-------------|-----------|-------|
| Program catalog | Airtable | Supabase | Structured program data |
| Registration tracking | Airtable | Supabase | Participant data |
| Attendance analytics | Supabase | - | Query & analyze patterns |
| Certificate automation | n8n | - | Auto-generate on completion |

### For Marketing Operations

| Task | Primary MCP | Secondary | Notes |
|------|-------------|-----------|-------|
| Content research | Exa | Apify | Find trending topics |
| Competitor monitoring | Apify | Exa | Track competitor activity |
| Campaign analytics | Supabase | - | Centralize marketing data |
| Content scheduling | n8n | - | Automate posting workflows |

### For Site Health (Already Built)

| Task | Primary MCP | Secondary | Notes |
|------|-------------|-----------|-------|
| Performance audits | Lighthouse | - | Page speed, CWV |
| SEO monitoring | GSC | Lighthouse | Rankings, indexation |
| Accessibility | Lighthouse | - | WCAG compliance |

---

## Capability Matrix by MCP

### Supabase
```
✅ SQL database queries
✅ Real-time data subscriptions
✅ Data storage (structured)
✅ Custom analytics queries
✅ Row-level security
✅ Edge functions
❌ Built-in visualization (use Metabase)
```

**Best For:** Central data warehouse, complex queries, dashboards

### Airtable
```
✅ Structured records (like spreadsheet)
✅ Views and filters
✅ Linked records (relationships)
✅ Automations (built-in)
✅ Forms for data entry
❌ Complex SQL queries
❌ Large data volumes (performance)
```

**Best For:** Program catalog, registrations, structured data entry

### n8n
```
✅ Visual workflow builder
✅ 543+ node integrations
✅ Scheduled triggers
✅ Webhook triggers
✅ Conditional logic
✅ Error handling
✅ Self-hosted (data privacy)
```

**Best For:** Automating multi-step business processes

### Apify
```
✅ Pre-built web scrapers (actors)
✅ LinkedIn scrapers
✅ Google Maps scrapers
✅ E-commerce scrapers
✅ Social media scrapers
✅ Custom actor development
✅ Scheduled runs
```

**Best For:** Lead research, competitor intelligence, data collection

### Exa
```
✅ AI-powered semantic search
✅ Find similar content
✅ Content summarization
✅ Real-time web search
✅ Academic/research focus
```

**Best For:** Content research, finding relevant articles, market intelligence

### Playwright
```
✅ Browser automation
✅ Screenshot capture
✅ PDF generation
✅ Form filling
✅ Testing websites
✅ Cross-browser support
```

**Best For:** Web testing, automated data entry, screenshot reports

---

## External Platforms (Non-MCP)

| Platform | Purpose | Integration Method | Data Access |
|----------|---------|-------------------|-------------|
| GoHighLevel | CRM, automation | API / Manual | Pipeline, contacts |
| QuickBooks | Accounting | Manual | Financials |
| Notion | Knowledge base | Manual / API | Documentation |
| Google Docs | Documents | Manual | Proposals, content |
| Google Calendar | Scheduling | API | Events, programs |

### Integration Opportunities

| Platform | Can Connect Via | Use Case |
|----------|-----------------|----------|
| GoHighLevel | n8n (has GHL node) | Sync CRM data to Supabase |
| QuickBooks | n8n (has QB node) | Sync financial data |
| Google Calendar | n8n | Sync program schedules |
| Notion | n8n | Sync documentation |

---

## Data Flow Architecture

```
                    ┌─────────────────────────────────────────────────┐
                    │                 DATA SOURCES                     │
                    └─────────────────────────────────────────────────┘
                                          │
       ┌──────────────┬──────────────────┼──────────────────┬─────────────┐
       │              │                  │                  │             │
       ▼              ▼                  ▼                  ▼             ▼
┌──────────┐   ┌──────────┐      ┌──────────┐      ┌──────────┐   ┌──────────┐
│GoHighLevel│   │ Airtable │      │ SmartLead│      │ Heyreach │   │   Web    │
│   (CRM)  │   │(Programs)│      │ (Email)  │      │(LinkedIn)│   │(Scrapers)│
└────┬─────┘   └────┬─────┘      └────┬─────┘      └────┬─────┘   └────┬─────┘
     │              │                 │                  │              │
     └──────────────┴────────┬────────┴──────────────────┴──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │      n8n        │ ← Orchestration layer
                    │  (Automation)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Supabase     │ ← Central data warehouse
                    │   (Database)    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Dashboards    │ ← Reporting layer
                    │ (Metabase/Custom)│
                    └─────────────────┘
```

---

## Automation Opportunities (Using n8n)

### High Priority

| Workflow | Trigger | Actions | Impact |
|----------|---------|---------|--------|
| Daily briefing data pull | Scheduled (6 AM) | Pull from all sources → format → notify | Daily visibility |
| New lead notification | Webhook from GHL | Enrich with Apify → add to Supabase → Slack | Faster response |
| Program reminder sequence | 7/3/1 days before | Pull registrations → send reminders | Higher attendance |
| Post-program automation | Program end | Send survey → issue cert → update records | Consistent followup |

### Medium Priority

| Workflow | Trigger | Actions | Impact |
|----------|---------|---------|--------|
| Weekly marketing report | Scheduled (Monday) | Aggregate metrics → format → send | Marketing visibility |
| Competitor monitoring | Scheduled (weekly) | Apify scrape → analyze → alert | Market intelligence |
| Content idea generation | Scheduled (weekly) | Exa search → summarize → save | Content pipeline |

---

## Skills Library

### Site Health Skills (`.claude/skills/site-health/`)

| Level | Skill | Purpose | MCP Used |
|-------|-------|---------|----------|
| Specialist | technical-seo-audit.md | Crawl & indexation | GSC, Lighthouse |
| Specialist | performance-audit.md | Page speed | Lighthouse |
| Specialist | core-web-vitals-check.md | CWV compliance | GSC, Lighthouse |
| Specialist | accessibility-audit.md | WCAG | Lighthouse |
| Specialist | security-review.md | Security posture | Lighthouse |
| Specialist | search-analytics-review.md | Query performance | GSC |
| Specialist | ux-quality-check.md | User experience | Lighthouse |
| Manager | seo-manager-daily-brief.md | SEO summary | All |
| Manager | performance-manager-daily-brief.md | Performance summary | All |
| Manager | digital-ops-daily-summary.md | Cross-functional | All |
| Executive | cmo-weekly-dashboard.md | Marketing health | All |
| Executive | ceo-executive-summary.md | Business impact | All |

### Business OS Skills (`business-os/dashboards/`)

| Skill | Purpose | MCP Used | Status |
|-------|---------|----------|--------|
| morning-briefing.md | Daily business pulse | All | ✅ Created |
| weekly-review.md | Weekly comprehensive | All | 🟡 Pending |
| monthly-report.md | Monthly executive | All | 🟡 Pending |

---

## Untapped Capabilities

| MCP | Untapped Capability | Potential Use Case | Priority |
|-----|--------------------|--------------------|----------|
| Apify | LinkedIn Company Scraper | Enrich lead data automatically | 🔴 High |
| Apify | Google Maps Scraper | Find local HR consulting firms | 🟠 Medium |
| n8n | 543 node integrations | Automate any multi-step process | 🔴 High |
| Exa | Similar content finder | Find competing training content | 🟠 Medium |
| Playwright | PDF generation | Auto-generate program reports | 🟡 Low |

---

## Wishlist (Gaps to Fill)

| Need | Best Solution | Priority | Notes |
|------|---------------|----------|-------|
| Email outreach MCP | SmartLead MCP (if exists) | 🔴 High | Check if available |
| LinkedIn outreach MCP | Heyreach MCP (if exists) | 🔴 High | Check if available |
| Calendar integration | n8n + Google Calendar | 🟠 Medium | n8n has native node |
| CRM integration | n8n + GoHighLevel | 🔴 High | n8n has GHL node |

---

## Configuration Reference

Full MCP configuration available at: `/docs/mcp-servers-reference.md`

Quick setup:
1. Copy needed servers from reference
2. Add credentials from respective dashboards
3. Add to `.mcp.json` in project root
4. Restart Claude Code to activate

---

## Last Updated

**Date:** 2024-XX-XX
**By:** Business OS
**Changes:** Initial comprehensive inventory with actual MCP configs

---

## Update Cadence

- **Weekly:** Check for new MCP capabilities
- **Monthly:** Review utilization, update untapped section
- **Quarterly:** Strategic tool stack review
