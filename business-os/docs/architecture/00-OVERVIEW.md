# Business OS Architecture Reference

> **Purpose:** This is the canonical reference for building, extending, and maintaining the Business OS platform. Use this document when creating new departments, workers, or integrations.

> **Last Updated:** December 2025

---

## Document Structure

This architecture reference is split into multiple files for manageability:

| Document | Contents |
|----------|----------|
| **00-OVERVIEW.md** (this file) | Vision, terminology, architecture overview |
| **01-DEPARTMENT-TEMPLATE.md** | Template for creating new departments |
| **02-MARKETING.md** | Marketing Department full specification |
| **03-DIGITAL.md** | Digital Department full specification |
| **04-LEAD-INTELLIGENCE.md** | Lead Intelligence Department full specification |
| **05-BOARD-MEETING.md** | Strategic synthesis layer |
| **06-HUMAN-IN-LOOP.md** | Approval patterns and feedback loops |
| **07-IMPLEMENTATION.md** | File structure, schema, integration guide |

---

## Vision & Core Principles

### What Business OS Is

A **self-improving business intelligence system** that:

1. **Executes** — Workers perform tasks autonomously following standardized processes
2. **Monitors** — Tracks performance metrics across all departments in real-time
3. **Learns** — Adjusts approaches based on outcomes and feedback
4. **Advises** — Surfaces insights and recommendations to the CEO
5. **Adapts** — Gets better over time at serving how the specific business operates

### Core Principles

**Specialized Focus**
Each Director and Worker focuses on one domain. A focused agent with deep context outperforms a generalist. This enables better prompting, clearer accountability, and more efficient context usage.

**Human Oversight**
The CEO remains in control. The system executes, monitors, and recommends—but humans approve external actions, review strategic decisions, and can course-correct at any time.

**Self-Improvement**
Every interaction is a learning opportunity. Approvals, rejections, and corrections feed back into the system to improve future decisions.

**Multi-Tenant Ready**
The architecture separates the framework (structure, logic, UI) from configuration (specific processes, voice, data). This enables deployment across multiple businesses.

---

## Terminology

| Term | Definition | Implementation |
|------|------------|----------------|
| **Business OS** | The orchestration layer coordinating all departments, routing work, and maintaining system-wide state | Next.js + Supabase + n8n |
| **Department** | A domain with defined scope, specific tools/data access, and its own knowledge base | Folder structure + Supabase schema + skills |
| **Director** | An AI agent that maintains awareness of its domain, synthesizes information, makes recommendations, and coordinates workers | Claude with department-specific skills + context |
| **Sub-Department** | A specialized area within a department with focused workers | Subfolder + dedicated workers |
| **Worker** | A focused executor handling specific task types | Skill (conversational) or n8n workflow (autonomous) |
| **Playbook** | Reusable knowledge and workflows for specific task types | Skill with references and assets |
| **Board Meeting** | Strategic synthesis layer pulling insights from all Directors | Claude with access to all department data |
| **Command** | Simple, single-action operations using existing capabilities | Direct tool calls |

### Worker Types

| Type | When to Use | Implementation |
|------|-------------|----------------|
| **Skill-Worker** | Task requires conversation, iteration, or human input during execution | Claude Skill |
| **Agent-Worker** | Task runs autonomously on schedule or trigger | n8n workflow calling Claude API |
| **Monitor-Worker** | Continuously watches metrics and alerts on conditions | n8n workflow + Supabase + alerting |
| **Hybrid-Worker** | Autonomous execution with human approval gates | n8n workflow with approval nodes |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BUSINESS OS                                 │
│                    (Next.js + Supabase + n8n)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Board     │  │  Dashboard  │  │  Alerting   │  │   Learning  │    │
│  │  Meeting    │  │   (CEO)     │  │   System    │  │    Loop     │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
│         └────────────────┴────────────────┴────────────────┘            │
│                                   │                                      │
│                          ┌───────┴───────┐                              │
│                          │  Orchestrator  │                              │
│                          │    (n8n)       │                              │
│                          └───────┬───────┘                              │
│                                  │                                       │
│    ┌─────────────────────────────┼─────────────────────────────┐        │
│    │                             │                             │        │
│    ▼                             ▼                             ▼        │
│ ┌──────────┐              ┌──────────┐              ┌──────────┐       │
│ │Marketing │              │ Digital  │              │  Lead    │       │
│ │Department│              │Department│              │  Intel   │       │
│ └────┬─────┘              └────┬─────┘              └────┬─────┘       │
│      │                         │                         │             │
│      ▼                         ▼                         ▼             │
│ ┌─────────┐              ┌─────────┐              ┌─────────┐         │
│ │Director │              │Director │              │Director │         │
│ └────┬────┘              └────┬────┘              └────┬────┘         │
│      │                        │                        │              │
│ ┌────┴────┐             ┌────┴────┐             ┌────┴────┐          │
│ │Sub-Depts│             │Sub-Depts│             │Sub-Depts│          │
│ │─────────│             │─────────│             │─────────│          │
│ │• Email  │             │• Perform│             │• Sourcing│         │
│ │• SEO    │             │• Database│            │• Quality │         │
│ │• Social │             │• Security│            │• Capacity│         │
│ │• etc.   │             │• etc.   │             │• etc.   │          │
│ └─────────┘             └─────────┘             └─────────┘          │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
External Tools              Business OS                    CEO Interface
─────────────────          ─────────────                   ─────────────

Smartlead      ──┐
GHL            ──┼──→  Lead Intelligence  ──→  Supabase  ──→  Dashboard
Apollo         ──┤         Director           (state)
PhantomBuster  ──┘              │                              │
                                ▼                              │
                          Marketing    ◄───────────────────────┘
                          Director         (approvals)
                               │
                               ▼
                         Email Campaigns
                         Social Posts
                         etc.
```

---

## Departments Summary

### Currently Defined

| Department | Director Focus | Sub-Departments |
|------------|----------------|-----------------|
| **Marketing** | Campaigns, engagement, channel performance | Email, SEO, Social, LinkedIn Automation, Outreach, Digital Ads (future) |
| **Digital** | Website health, development, QA | Site Performance, Database, Security, Analytics, Quality Assurance, Development |
| **Lead Intelligence** | Lead sourcing, capacity, data quality | Lead Sourcing, Data Quality, Capacity Planning, Contact Database |

### To Be Built

| Department | Likely Focus | See Template |
|------------|--------------|--------------|
| **Sales** | Pipeline, closing, relationships | 01-DEPARTMENT-TEMPLATE.md |
| **Content** | Assets, creative, brand voice | 01-DEPARTMENT-TEMPLATE.md |
| **Operations** | Processes, SOPs, fulfillment | 01-DEPARTMENT-TEMPLATE.md |

---

## Quick Reference: Adding a New Department

1. Copy `01-DEPARTMENT-TEMPLATE.md` to `XX-[DEPARTMENT-NAME].md`
2. Fill in all sections following the template
3. Create folder structure per `07-IMPLEMENTATION.md`
4. Add to dashboard
5. Configure integrations
6. Build workers (start with monitors, then agents)
7. Test and iterate

---

## Quick Reference: Decision Authority Levels

| Level | When Used | Example |
|-------|-----------|---------|
| **Autonomous** | Routine, low-risk | Monitoring, data sync |
| **Post-Hoc Review** | Medium-risk, reversible | A/B test execution |
| **Pre-Approval** | High-risk, external-facing | Email campaigns, social posts |
| **Immediate Escalation** | Critical issues | Site down, security breach |

---

## Next Steps

See individual department files for full specifications:
- `02-MARKETING.md` — Complete Marketing Department
- `03-DIGITAL.md` — Complete Digital Department
- `04-LEAD-INTELLIGENCE.md` — Complete Lead Intelligence Department
