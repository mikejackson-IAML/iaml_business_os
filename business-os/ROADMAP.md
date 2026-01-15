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
| Digital | 28 | 26 | 4 | 4 (skills exist) |
| Marketing | 8 | 3 | 3 | 2 (skills exist) |
| Lead Intelligence | 16 | 8 | 0 | 0 |
| Programs & Operations | 24 | 17 | 3 | 0 |
| **Total** | **76** | **54** | **10** | **6** |

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
| Uptime Monitor | Monitor | [x] | Every 5 min | Live: `QBS1n2E0IFDyhR7y` |
| SSL Certificate Monitor | Monitor | [x] | Daily | Live: `rQPUHpLhXKVHi8NB` |
| Form Submission Monitor | Monitor | [ ] | Hourly | Test registration form health |
| Link Checker | Monitor | [x] | Daily | Live: `ly3hl4gPv0Y0Faes` |
| Security Headers Checker | Monitor | [x] | Daily | Live: `8T88WjyL0WOCYcZM` |
| Redirect Checker | Monitor | [x] | Daily | Live: `tmUy35RmDucs8pBp` |
| DNS Record Monitor | Monitor | [x] | Daily | Live: `4i92X3Rm27Z1WdTT` |
| Accessibility Checker | Monitor | [x] | Weekly | Live: `CLPZDdyckhcLWgN4` |
| Cookie Compliance Checker | Monitor | [x] | Weekly | Live: `9TpLXE5PwM5GkJyq` |
| Mixed Content Checker | Monitor | [x] | Weekly | Live: `TfdyBwoJJ05MOFDz` |
| 404 Error Monitor | Monitor | [x] | Every 12 hours | Live: `nbdnksFqyoQbvE23` |
| Favicon Checker | Monitor | [x] | Weekly | Live: `OEAWLUXCcU3lViqt` |
| HTML Lang Checker | Monitor | [x] | Weekly | Live: `92ur6UI4RpaPM262` |

### Marketing Department - Email Monitors

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Deliverability Monitor | Monitor | [x] | Daily | Live: `zi4x4uVYB3C0QBAz` |
| DKIM Checker | Monitor | [x] | Daily | Live: `FfKkT1SHgkZ2EjFD` |
| List Health Monitor | Monitor | [ ] | Daily | Bounce rates, unsubscribes, hygiene |

### Lead Intelligence - Core Data Quality

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Email Validator | Agent | [x] | On import | Live: `PAyKdjpKLHfH5L89` (webhook) |
| Compliance Monitor | Monitor | [x] | Every 6 hours | Live: `hLAa7p320qhRFQD2` |
| Deduplication Manager | Agent | [x] | Daily | Live: `HNZPMaeWce2qsICS` |
| Domain Capacity Tracker | Monitor | [x] | Every 12 hours | Live: `XGpk3RnAtgky0Svk` |

---

## Phase 2: Digital Department Complete

**Goal:** Full Digital Department functionality

### Performance Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Lighthouse Auditor | Monitor | [x] | Daily | Live: `RvHwQeupCo1e3N9c` |
| Page Speed Monitor | Monitor | [x] | Every 4 hours | Live: `H2H172J1WS9poTfl` |
| Core Web Vitals Monitor | Monitor | [x] | Every 6 hours | Live: `7tKjCpQEjJLHji1t` |
| Mobile Friendliness Checker | Monitor | [x] | Weekly | Live: `KK7RbZJ4SOz5brCj` |
| Compression Checker | Monitor | [x] | Weekly | Live: `XTMQb4VizrYtz3tn` |
| Image Optimization Checker | Monitor | [x] | Weekly | Live: `09f0Tp7T3c2uhplj` |
| TTFB Monitor | Monitor | [x] | Every 6 hours | Live: `eR0cVQUtFopWafzg` |
| Resource Hints Checker | Monitor | [x] | Weekly | Live: `DSSJIHWl7XeeCyAu` |
| Bundle Size Tracker | Monitor | [ ] | On deploy | JS/CSS size changes |

### SEO Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Sitemap Validator | Monitor | [x] | Daily | Live: `szLUgbSu4sY3VTkF` |
| Meta Tag Auditor | Monitor | [x] | Weekly | Live: `7dlwbR7yQGnTOYcn` |
| Schema Validator | Monitor | [x] | Weekly | Live: `AqUWODfMaJOhS6fb` |
| Indexability Checker | Monitor | [x] | Daily | Live: `bGgsBjTfjCV6mv72` |
| Social Tags Checker | Monitor | [x] | Weekly | Live: `eStzcArnHJIQamGN` |
| Robots.txt Monitor | Monitor | [x] | Weekly | Live: `dCkv7FsgxwKOXlc7` |

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
| Campaign Analyst | Monitor | [x] | Daily | Live: `7xEGFk7fgkp3egBj` |
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
| Sending Capacity Calculator | Agent | [x] | Daily | Live: `XQyMCuoLyimoIqkm` |
| Domain Capacity Tracker | Monitor | [ ] | Daily | Per-domain limits, health |
| Lead-to-Campaign Allocator | Hybrid | [ ] | On request | Match leads to campaigns |
| Throttle Monitor | Monitor | [x] | Every 4 hours | Live: `yvXiNBdM494tlSlL` |

### Contact Database Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Database Manager | Monitor | [x] | Daily | Live: `YLyx0mAJMqCZYTQ5` |
| Segment Builder | Skill | [ ] | On-demand | Create targetable lists |
| Platform Sync Manager | Agent | [ ] | Hourly | Smartlead, GHL, Apollo sync |
| Lifecycle Manager | Agent | [x] | Weekly | Live: `6PdgkfipCXPU0FHL` |

---

## Phase 5: Programs & Operations Department

**Goal:** Program delivery operations and readiness tracking

### Program Planning Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Readiness Monitor | Monitor | [x] | Daily | Live: `yzoRPODKRQLMRxVQ` |
| Schedule Optimizer | Hybrid | [x] | Daily | Live: `Ew97MGec45jBDdVq` |
| Registration Page Monitor | Monitor | [x] | Every 12 hours | Live: `VbSCZR47nzwYUYns` |
| Enrollment Alert | Monitor | [x] | Daily | Live: `AzelTCjRxj8fGi2d` |

### Faculty Management Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Faculty Availability Tracker | Monitor | [x] | Daily | Live: `GOiy6L7XYjevYDSA` |
| Faculty Reminder Agent | Agent | [ ] | Scheduled | Logistics emails |
| Faculty Performance Monitor | Monitor | [x] | Weekly | Live: `dyLqARBmoR2mu4j2` |
| Faculty Gap Alert | Monitor | [x] | Daily | Live: `c4xNLJMC29NkFk06` |

### Venue & Logistics Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Room Block Monitor | Monitor | [x] | Daily | Live: `ABCZiTL4CyT6eOAl` |
| Venue Contract Tracker | Monitor | [x] | Weekly | Live: `jPJOgSCLM0Ek2FqJ` |
| AV Order Tracker | Monitor | [ ] | On order | Amazon orders, delivery |
| Catering Coordinator | Hybrid | [ ] | Scheduled | Confirm counts |

### Materials Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Materials Update Tracker | Monitor | [x] | Weekly | Live: `wfHOiNogPvtXFcFr` |
| Print Order Tracker | Monitor | [x] | Daily | Live: `oX9qhNoaCMytu91H` |
| Shipping Monitor | Monitor | [x] | Daily | Live: `UKhLyZQsrkqTwZ0F` |
| Inventory Manager | Monitor | [x] | Weekly | Live: `0A8OBSOYaqSCJUPm` |

### Certifications Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| SHRM Approval Tracker | Monitor | [x] | Daily | Live: `jYEMvgcCR1HXSgyS` |
| CLE Approval Monitor | Monitor | [x] | Weekly | Live: `8TBH2O0GuYghWTaZ` |
| HRCI Credit Manager | Monitor | [x] | Weekly | Live: `jScGnXfHlSTVlER4` |
| Certificate Issuer | Agent | [ ] | Post-program | Issue to attendees |
| Renewal Alert Agent | Agent | [ ] | Daily | Approaching expiration |

### Participant Operations Sub-Department

| Worker | Type | Status | Frequency | Implementation Notes |
|--------|------|--------|-----------|---------------------|
| Registration Processor | Agent | [ ] | Real-time | Process incoming, send confirmations |
| Attendee Communicator | Agent | [ ] | Scheduled | Pre-program logistics |
| Attendance Tracker | Monitor | [x] | Every 6 hours | Live: `d9mvXgCOZ3IlvNML` |
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
| 2026-01-15 | Programs sprint part 2: HRCI Credit Manager, Print Order, Inventory, Faculty Gap, Faculty Performance monitors |
| 2026-01-15 | Programs sprint: Faculty Availability, Room Block, Venue Contract, Materials, Shipping, SHRM, CLE, Attendance monitors |
| 2026-01-15 | Quick wins: Sending Capacity Calculator, Registration Page Monitor, Schedule Optimizer |
| 2026-01-14 | Final sprint: Image Optimization, Mixed Content, 404 Error monitors |
| 2026-01-14 | Quick wins sprint continued: Core Web Vitals, Mobile Friendliness, Compression, Cookie Compliance, Robots.txt |
| 2026-01-14 | Quick wins sprint: Security Headers, Redirect, DNS, Social Tags, Accessibility checkers |
| 2026-01-14 | Deliverability Monitor + DKIM Checker completed (Marketing) |
| 2026-01-14 | SEO monitors completed (Sitemap, Meta Tags, Schema, Indexability) |
| 2026-01-14 | Lighthouse Auditor + Page Speed Monitor completed |
| 2026-01-14 | Link Checker workflow completed |
| 2026-01-14 | SSL Certificate Monitor workflow completed |
| 2026-01-13 | Uptime Monitor workflow completed (first Phase 1 worker) |
| 2026-01-13 | Initial roadmap created from department specs |
