# Departments

> C-Suite aligned organizational structure with autonomous coworkers at every level.

---

## Organizational Hierarchy

```
                                    ┌─────────────────┐
                                    │      CEO        │
                                    │    (Owner)      │
                                    └────────┬────────┘
                                             │
        ┌────────────┬────────────┬──────────┼──────────┬────────────┬────────────┐
        │            │            │          │          │            │            │
   ┌────┴────┐ ┌─────┴────┐ ┌─────┴────┐ ┌───┴───┐ ┌────┴────┐ ┌─────┴────┐ ┌─────┴────┐
   │   CMO   │ │   CRO    │ │   COO    │ │  CFO  │ │   CTO   │ │   CPO    │ │   CIO    │
   │Marketing│ │  Sales   │ │Operations│ │Finance│ │  Tech   │ │Programs  │ │Improvement│
   └────┬────┘ └────┬─────┘ └────┬─────┘ └───┬───┘ └────┬────┘ └────┬─────┘ └────┬─────┘
        │           │            │           │          │           │            │
   Directors   Directors    Directors   Directors  Directors   Directors    Directors
        │           │            │           │          │           │            │
   Managers    Managers     Managers    Managers   Managers    Managers     Managers
        │           │            │           │          │           │            │
 Specialists Specialists  Specialists Specialists Specialists Specialists Specialists
```

---

## Departments Overview

| Department | Chief | Purpose | Key Functions |
|------------|-------|---------|---------------|
| [ceo/](./ceo/) | CEO (You) | Vision & Strategy | All department oversight, major decisions |
| [cmo/](./cmo/) | Chief Marketing Officer | Growth & Brand | Marketing, content, SEO, campaigns |
| [cro/](./cro/) | Chief Revenue Officer | Revenue Generation | Sales, partnerships, customer success |
| [coo/](./coo/) | Chief Operating Officer | Operations | Admin, processes, vendors, facilities |
| [cfo/](./cfo/) | Chief Financial Officer | Financial Health | Accounting, budgets, forecasting |
| [cto/](./cto/) | Chief Technology Officer | Technology | Engineering, security, infrastructure |
| [cpo/](./cpo/) | Chief Program Officer | Delivery | Training programs, curriculum, outcomes |
| [cio/](./cio/) | Chief Improvement Officer | Optimization | Process improvement, efficiency, automation |

---

## Department Structure Pattern

Each department follows this standard structure:

```
{department}/
├── _config/
│   ├── department-structure.md    # Org chart, reporting lines
│   ├── escalation-rules.md        # When to escalate issues
│   └── kpis.md                    # Department KPIs
│
├── chief/                         # C-Level (1 coworker)
│   ├── coworker.md               # Role definition
│   ├── dashboard.md              # Department-wide view
│   └── skills/                   # Executive-level skills
│
├── directors/                     # Director Level
│   └── {function}/
│       ├── coworker.md
│       ├── dashboard.md
│       └── skills/
│
├── managers/                      # Manager Level
│   └── {team}/
│       ├── coworker.md
│       ├── dashboard.md
│       └── skills/
│
└── specialists/                   # Specialist Level
    └── {role}/
        ├── coworker.md
        └── skills/
```

---

## Data Flow

Information flows **upward** through aggregation:

```
Specialists produce → Raw work, detailed findings, task execution
        ↓
Managers aggregate → Team health, prioritized issues, resource needs
        ↓
Directors strategize → Cross-team insights, strategic recommendations
        ↓
Chiefs decide → Department health, investment needs, escalations
        ↓
CEO oversees → Business impact, risk assessment, strategic direction
```

---

## Dashboard Views (for Frontend)

Each role sees only what's relevant:

| Role | Dashboard View | Data Sources |
|------|----------------|--------------|
| CEO | All departments | All chief dashboards |
| CMO | Marketing only | All marketing directors/managers |
| Director of SEO | SEO teams | SEO managers + specialists |
| SEO Manager | SEO specialists | Technical SEO, Content SEO, Analytics |
| Specialist | Own work + context | Own tasks + manager guidance |

---

## Quick Links

### By Department
- [CEO Dashboard](./ceo/chief/dashboard.md)
- [CMO Dashboard](./cmo/chief/dashboard.md)
- [CRO Dashboard](./cro/chief/dashboard.md)
- [COO Dashboard](./coo/chief/dashboard.md)
- [CFO Dashboard](./cfo/chief/dashboard.md)
- [CTO Dashboard](./cto/chief/dashboard.md)
- [CPO Dashboard](./cpo/chief/dashboard.md)
- [CIO Dashboard](./cio/chief/dashboard.md)

### By Function
- [All Coworkers Index](./coworker-index.md)
- [All Skills Index](./skills-index.md)
- [SOP: Creating New Workers](./sop/creating-workers.md)
- [SOP: Creating New Skills](./sop/creating-skills.md)
