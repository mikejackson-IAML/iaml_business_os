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

## MCP Servers

| Server | Status | Purpose | Used By | Utilization |
|--------|--------|---------|---------|-------------|
| SmartLead | 🟢 Active | Email outreach & sequences | Marketing, Sales | [High/Med/Low] |
| Supabase | 🟢 Active | Analytics, data storage | All coworkers | [High/Med/Low] |
| Heyreach | 🟢 Active | LinkedIn automation | Marketing | [High/Med/Low] |
| Google Analytics | 🟢 Active | Website traffic | Marketing, CIO | [High/Med/Low] |
| Lighthouse | 🟢 Active | Site performance | Site Health | [High/Med/Low] |
| Google Search Console | 🟢 Active | SEO data | Site Health | [High/Med/Low] |
| Airtable | 🟡 Planned | Program data | Programs | [Not yet] |
| GoHighLevel | 🟡 Planned | CRM, communications | Sales, Programs | [Not yet] |

### MCP Server Details

See `/capabilities/` folder for detailed capabilities of each server.

---

## External Platforms (Non-MCP)

| Platform | Purpose | Integration Status | Data Access |
|----------|---------|-------------------|-------------|
| GoHighLevel | CRM, automation | Manual / API | Pipeline, contacts |
| Airtable | Program database | Manual / API | Programs, registrations |
| QuickBooks | Accounting | Manual | Financials |
| Notion | Knowledge base | Manual | Documentation |
| Google Docs | Documents | Manual | Proposals, content |
| Google Calendar | Scheduling | Manual | Events, programs |

---

## Internal Skills Library

### Site Health Skills (`.claude/skills/site-health/`)

| Level | Skill | Purpose |
|-------|-------|---------|
| Specialist | technical-seo-audit.md | Crawl & indexation health |
| Specialist | performance-audit.md | Page speed analysis |
| Specialist | core-web-vitals-check.md | CWV compliance |
| Specialist | accessibility-audit.md | WCAG compliance |
| Specialist | security-review.md | Security posture |
| Specialist | search-analytics-review.md | Query performance |
| Specialist | ux-quality-check.md | User experience |
| Manager | seo-manager-daily-brief.md | SEO summary |
| Manager | performance-manager-daily-brief.md | Performance summary |
| Manager | digital-ops-daily-summary.md | Cross-functional view |
| Executive | cmo-weekly-dashboard.md | Marketing health |
| Executive | ceo-executive-summary.md | Business impact |

### Business OS Skills (`business-os/` - To be created)

| Category | Skills Needed | Status |
|----------|---------------|--------|
| Dashboards | Daily briefing, weekly review, monthly report | 🟡 Pending |
| Revenue | Pipeline review, proposal generator, forecast | 🟡 Pending |
| Programs | Delivery status, registration report | 🟡 Pending |
| Marketing | Campaign review, content planning | 🟡 Pending |

---

## Data Sources

| Source | Contains | Location | Updated |
|--------|----------|----------|---------|
| Pipeline data | Opportunities, deals | GoHighLevel / Supabase | Real-time |
| Program data | Catalog, registrations | Airtable | Real-time |
| Marketing metrics | Campaign performance | SmartLead, Heyreach | Real-time |
| Website analytics | Traffic, conversions | GA4, GSC | Real-time |
| Financial data | Revenue, expenses | QuickBooks | Weekly |
| Client data | Organizations, contacts | GoHighLevel | Real-time |

---

## Capability Matrix

Quick reference: What can each tool do?

| Capability | SmartLead | Heyreach | GoHighLevel | Supabase | Airtable |
|------------|-----------|----------|-------------|----------|----------|
| Email send | ✅ | ❌ | ✅ | ❌ | ❌ |
| Email sequences | ✅ | ❌ | ✅ | ❌ | ❌ |
| LinkedIn connect | ❌ | ✅ | ❌ | ❌ | ❌ |
| LinkedIn message | ❌ | ✅ | ❌ | ❌ | ❌ |
| CRM/Pipeline | ❌ | ❌ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ | ❌ |
| Automation | ✅ | ✅ | ✅ | ❌ | ✅ |
| Data storage | ❌ | ❌ | ✅ | ✅ | ✅ |
| Custom queries | ❌ | ❌ | ❌ | ✅ | ❌ |
| Reporting | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Untapped Capabilities

> Capabilities we have but aren't fully using yet.

| Tool | Untapped Capability | Potential Use Case | Priority |
|------|--------------------|--------------------|----------|
| [Tool] | [Capability] | [How we could use it] | 🔴/🟠/🟡 |
| [Tool] | [Capability] | [How we could use it] | 🔴/🟠/🟡 |

---

## Wishlist

> Tools or capabilities we don't have but might need.

| Need | Potential Solutions | Priority | Status |
|------|---------------------|----------|--------|
| [Need] | [Tools that could solve] | 🔴/🟠/🟡 | Researching |
| [Need] | [Tools that could solve] | 🔴/🟠/🟡 | Researching |

---

## Last Updated

**Date:** [YYYY-MM-DD]
**By:** [Who updated]
**Changes:** [What changed]

---

## Update Cadence

- **Weekly:** Check for new MCP server capabilities
- **Monthly:** Review utilization and untapped capabilities
- **Quarterly:** Strategic review of tool stack
