# Business OS Implementation Roadmap

> **Purpose:** Track implementation progress for all departments, workers, and employees in the Business OS.
>
> **Last Updated:** January 2026
>
> **Status Key:** `[ ]` Not Started | `[~]` In Progress | `[x]` Complete | `[-]` Blocked/Deferred

---

## Overview

| Department | Workers Planned | Workers Built | Employees Planned | Employees Built |
|------------|-----------------|---------------|-------------------|-----------------|
| Digital | 12 | 0 | 4 | 4 (skills exist) |
| Marketing | 8 | 0 | 3 | 2 (skills exist) |
| Lead Intelligence | 16 | 0 | 0 | 0 |
| Programs & Operations | 24 | 0 | 3 | 0 |
| **Total** | **60** | **0** | **10** | **6** |

---

## Phase 1: Foundation & Quick Wins

**Goal:** Core infrastructure + highest-value monitors operational

### Infrastructure
| Item | Status | Notes |
|------|--------|-------|
| Supabase core schema (departments, workers, metrics, alerts) | [ ] | See 07-IMPLEMENTATION.md |
| n8n-brain MCP server | [x] | Operational |
| Approval queue table | [ ] | |
| Activity log table | [ ] | |

### Digital Department - Website Monitors

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Uptime Monitor | Monitor | [ ] | Every 5 min | Simple HTTP ping, alert on failure |
| SSL Certificate Monitor | Monitor | [ ] | Daily | Check expiration, alert at 14 days |
| Form Submission Monitor | Monitor | [ ] | Hourly | Test registration form health |
| Link Checker | Monitor | [ ] | Daily | Crawl for 404s |

### Marketing Department - Email Monitors

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Deliverability Monitor | Monitor | [ ] | Daily | Check domain reputation, blacklists |
| List Health Monitor | Monitor | [ ] | Daily | Bounce rates, unsubscribes, hygiene |

### Lead Intelligence - Core Data Quality

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Email Validator | Agent | [ ] | On import | NeverBounce integration exists |
| Compliance Monitor | Monitor | [ ] | Continuous | Opt-outs, do-not-contact |

---

## Phase 2: Digital Department Complete

**Goal:** Full Digital Department functionality

### Performance Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Lighthouse Auditor | Monitor | [ ] | Daily | Core Web Vitals, scores |
| Page Speed Monitor | Monitor | [ ] | Every 4 hours | Load times across key pages |
| Image Optimization Checker | Monitor | [ ] | On deploy | Flag unoptimized images |
| Bundle Size Tracker | Monitor | [ ] | On deploy | JS/CSS size changes |

### SEO Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Sitemap Validator | Monitor | [ ] | Daily | Accuracy, new pages |
| Meta Tag Auditor | Monitor | [ ] | Weekly | Missing/duplicate meta tags |
| Schema Validator | Monitor | [ ] | Weekly | Structured data validity |
| Indexability Checker | Monitor | [ ] | Daily | Robots.txt, canonical issues |

### Digital Employees (Claude Skills)

| Employee | Status | Commands |
|----------|--------|----------|
| WebDev Specialist | [x] | `/new-program`, `/component-variants`, `/deep-plan-ui` |
| QA Specialist | [x] | `/smoke` (others planned) |
| DevOps Specialist | [x] | `/deploy`, `/preview`, `/speed-optimize` |
| Content Specialist | [x] | `/seo-optimize`, `/brand-upgrade`, `/brochure` |

---

## Phase 3: Marketing Department Complete

**Goal:** Full Marketing Department functionality + approval workflows

### Email Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| List Health Monitor | Monitor | [ ] | Daily | Bounces, unsubscribes, hygiene scores |
| Campaign Analyst | Monitor | [ ] | 48h post-send | Open rates, click rates, trends |
| Deliverability Monitor | Monitor | [ ] | Daily | Domain reputation, blacklists |
| A/B Test Manager | Hybrid | [ ] | On threshold | Test analysis, winner recommendations |

### SEO Sub-Department (Future)

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Rank Tracker | Monitor | [ ] | Daily | Keyword positions, SERP changes |
| Traffic Analyst | Monitor | [ ] | Weekly | Organic traffic trends |

### LinkedIn Sub-Department (Future)

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| PhantomBuster Monitor | Monitor | [ ] | Continuous | Campaign health, daily limits |
| Response Flagger | Monitor | [ ] | Real-time | Flag replies needing human response |

### Marketing Employees (Claude Skills)

| Employee | Status | Commands |
|----------|--------|----------|
| Email Campaign Specialist | [x] | `/cold-outreach-sequence`, `/alumni-campaign`, `/ab-test-analysis` |
| Content Specialist | [~] | Partially migrated from Digital |
| LinkedIn Specialist | [ ] | Future |

---

## Phase 4: Lead Intelligence Department

**Goal:** Lead sourcing, capacity planning, and data quality

### Lead Sourcing Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| LinkedIn Scraper Manager | Monitor | [ ] | Continuous | PhantomBuster + Sales Navigator health |
| Apollo Manager | Monitor | [ ] | Daily | Search jobs, credit usage |
| Apify Manager | Monitor | [ ] | Per job | Custom scraping jobs, results |
| Source Balancer | Agent | [ ] | Daily | Distribute sourcing to avoid limits |

### Data Quality Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Email Validator | Agent | [ ] | On import | NeverBounce integration |
| Enrichment Processor | Agent | [ ] | On import | Fill missing fields |
| Deduplication Manager | Agent | [ ] | On import | Prevent duplicates |
| Compliance Monitor | Monitor | [ ] | Continuous | Opt-outs, legal compliance |

### Capacity Planning Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Sending Capacity Calculator | Agent | [ ] | Daily | Total emails possible |
| Domain Capacity Tracker | Monitor | [ ] | Daily | Per-domain limits, health |
| Lead-to-Campaign Allocator | Hybrid | [ ] | On request | Match leads to campaigns |
| Throttle Monitor | Monitor | [ ] | Continuous | Alert on approaching limits |

### Contact Database Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Database Manager | Monitor | [ ] | Continuous | Repository health, integrity |
| Segment Builder | Skill | [ ] | On-demand | Create targetable lists |
| Platform Sync Manager | Agent | [ ] | Hourly | Smartlead, GHL, Apollo sync |
| Lifecycle Manager | Agent | [ ] | Weekly | Contact status, archive stale |

---

## Phase 5: Programs & Operations Department

**Goal:** Program delivery operations and readiness tracking

### Program Planning Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Readiness Monitor | Monitor | [ ] | Continuous | 10-point checklist tracking |
| Schedule Optimizer | Hybrid | [ ] | On schedule change | Flag conflicts |
| Registration Page Monitor | Monitor | [ ] | Daily | Verify listings live |
| Enrollment Alert | Monitor | [ ] | Daily | Low enrollment warnings |

### Faculty Management Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Faculty Availability Tracker | Monitor | [ ] | Daily | Confirmations and gaps |
| Faculty Reminder Agent | Agent | [ ] | Scheduled | Logistics emails |
| Faculty Performance Monitor | Monitor | [ ] | Post-program | Ratings and feedback |
| Faculty Gap Alert | Monitor | [ ] | Daily | Unconfirmed within thresholds |

### Venue & Logistics Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Room Block Monitor | Monitor | [ ] | Daily | Pickup rates, attrition risk |
| Venue Contract Tracker | Monitor | [ ] | Weekly | Status, deposits, deadlines |
| AV Order Tracker | Monitor | [ ] | On order | Amazon orders, delivery |
| Catering Coordinator | Hybrid | [ ] | Scheduled | Confirm counts |

### Materials Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Materials Update Tracker | Monitor | [ ] | Weekly | Faculty submissions |
| Print Order Tracker | Monitor | [ ] | Daily | Print jobs, delivery |
| Shipping Monitor | Monitor | [ ] | Daily | Materials received |
| Inventory Manager | Monitor | [ ] | Weekly | Inventory levels |

### Certifications Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| SHRM Approval Tracker | Monitor | [ ] | Daily | Submissions, approvals |
| CLE Approval Monitor | Monitor | [ ] | Weekly | State-by-state CLE |
| HRCI Credit Manager | Monitor | [ ] | Weekly | HRCI status |
| Certificate Issuer | Agent | [ ] | Post-program | Issue to attendees |
| Renewal Alert Agent | Agent | [ ] | Daily | Approaching expiration |

### Participant Operations Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Registration Processor | Agent | [ ] | Real-time | Process incoming, send confirmations |
| Attendee Communicator | Agent | [ ] | Scheduled | Pre-program logistics |
| Attendance Tracker | Monitor | [ ] | During program | Check-ins, no-shows |
| Post-Program Agent | Agent | [ ] | Post-program | Surveys, certificate delivery |

### Programs Employees (Claude Skills)

| Employee | Status | Commands |
|----------|--------|----------|
| Program Coordinator | [ ] | `/readiness-check`, `/program-status`, `/faculty-brief` |
| Certification Specialist | [ ] | `/submit-shrm`, `/cle-status`, `/cert-renewal` |
| Participant Services | [ ] | `/registration-report`, `/attendee-comms`, `/certificate-batch` |

---

## Phase 6: Strategic Layer & Learning

**Goal:** Board Meeting synthesis, Director agents, learning loop

### Director Agents

| Director | Status | Notes |
|----------|--------|-------|
| Marketing Director | [ ] | Claude agent with marketing context |
| Digital Director | [ ] | Claude agent with digital context |
| Lead Intelligence Director | [ ] | Claude agent with lead intel context |
| Programs Director | [ ] | Claude agent with programs context |

### Board Meeting

| Component | Status | Notes |
|-----------|--------|-------|
| Cross-department data access | [ ] | |
| Synthesis prompt | [ ] | |
| Strategic briefing generation | [ ] | |

### Learning Loop

| Component | Status | Notes |
|-----------|--------|-------|
| Decision tracking | [ ] | |
| Outcome recording | [ ] | |
| Confidence calibration | [ ] | |
| Feedback integration | [ ] | |

### Approval System

| Component | Status | Notes |
|-----------|--------|-------|
| Approval queue UI | [ ] | Dashboard or conversational |
| Workflow routing | [ ] | |
| Execution triggers | [ ] | |

---

## Phase 7: Future Departments

### Sales Department (Planned)

| Component | Status | Notes |
|-----------|--------|-------|
| Department specification | [ ] | |
| Pipeline tracking | [ ] | |
| Opportunity management | [ ] | |

### Content Department (Planned)

| Component | Status | Notes |
|-----------|--------|-------|
| Department specification | [ ] | |
| Asset management | [ ] | |
| Creative workflows | [ ] | |

### Operations Department (Planned)

| Component | Status | Notes |
|-----------|--------|-------|
| Department specification | [ ] | |
| SOP management | [ ] | |
| Process automation | [ ] | |

---

## Implementation Priority Matrix

### Highest Priority (Build First)
These provide immediate value with straightforward implementation:

1. **Uptime Monitor** - Simple, high-value, foundational
2. **Email Validator** - NeverBounce integration exists
3. **Deliverability Monitor** - Critical for email operations
4. **SSL Certificate Monitor** - Simple but important
5. **Form Submission Monitor** - Protects revenue

### High Priority (Build Next)
Important for operations but more complex:

6. **List Health Monitor** - Daily email hygiene
7. **Link Checker** - Daily site maintenance
8. **Lighthouse Auditor** - Performance tracking
9. **Domain Capacity Tracker** - Email infrastructure health
10. **Compliance Monitor** - Legal protection

### Medium Priority (Phase 3-4)
Full department functionality:

- All remaining Marketing workers
- All remaining Lead Intelligence workers
- Campaign Analyst, A/B Test Manager
- Platform sync managers

### Lower Priority (Phase 5+)
Programs & Operations, Strategic layer:

- All Programs workers (36 total)
- Director agents
- Board Meeting
- Learning loop

---

## Worker Complexity Reference

| Complexity | Characteristics | Examples |
|------------|-----------------|----------|
| **Simple** | Single API call, threshold check, alert | Uptime Monitor, SSL Monitor |
| **Medium** | Multiple data sources, logic branching | List Health Monitor, Lighthouse Auditor |
| **Complex** | Claude integration, approval workflows | A/B Test Manager, Lead-to-Campaign Allocator |
| **Advanced** | Multi-step orchestration, learning | Director agents, Board Meeting |

---

## Quick Reference: Worker Counts by Department

| Department | Sub-Department | Worker Count |
|------------|----------------|--------------|
| **Digital** | Website | 4 |
| | Performance | 4 |
| | SEO | 4 |
| | **Subtotal** | **12** |
| **Marketing** | Email | 4 |
| | SEO | 2 |
| | LinkedIn | 2 |
| | **Subtotal** | **8** |
| **Lead Intelligence** | Lead Sourcing | 4 |
| | Data Quality | 4 |
| | Capacity Planning | 4 |
| | Contact Database | 4 |
| | **Subtotal** | **16** |
| **Programs** | Program Planning | 4 |
| | Faculty Management | 4 |
| | Venue & Logistics | 4 |
| | Materials | 4 |
| | Certifications | 5 |
| | Participant Operations | 4 |
| | **Subtotal** | **25** |
| **Grand Total** | | **61** |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-13 | Initial roadmap created from department specs |
