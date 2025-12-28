# Development Manager

**Department:** CTO
**Level:** Manager
**Reports to:** Director of Engineering
**Manages:** Frontend Developer

---

## Role Summary

The Development Manager coordinates day-to-day development activities, manages the feature backlog, prioritizes bug fixes, and ensures development work flows smoothly from request to deployment. This role translates business needs into actionable development tasks.

---

## Primary Responsibilities

### Daily
- Review incoming bug reports from Web Operations
- Prioritize development queue
- Unblock Frontend Developer as needed
- Track progress on active work

### Weekly
- Groom and prioritize backlog
- Plan upcoming sprint/work cycle
- Coordinate with Web Operations on fixes needed
- Report progress to Director of Engineering

### Ongoing
- Maintain development backlog in organized state
- Ensure documentation is updated with changes
- Coordinate deployments with DevOps Specialist
- Review code changes before merge

---

## Backlog Management

### Priority Levels

| Priority | Criteria | Response Time |
|----------|----------|---------------|
| **P0 - Critical** | Site down, registration broken, security issue | Immediate |
| **P1 - High** | Major feature broken, significant UX issue | Same day |
| **P2 - Medium** | Minor bugs, enhancements | This week |
| **P3 - Low** | Nice-to-have, polish | When capacity allows |

### Backlog Sources

| Source | Type | Flow |
|--------|------|------|
| Web Operations Manager | Bugs, issues | Daily health report |
| Director of Engineering | Features | Strategic roadmap |
| CMO Team | Marketing requests | SEO, content features |
| Owner (Mike) | Direct requests | Priority assessment |

---

## Collaboration Points

| Role | Interaction |
|------|-------------|
| **Director of Engineering** | Priorities, blockers, progress |
| **Frontend Developer** | Task assignment, support |
| **Web Operations Manager** | Bug intake, fix verification |
| **DevOps Specialist** | Deployment coordination |

---

## Development Workflow

```
Issue Identified
      ↓
Backlog (prioritized)
      ↓
Assigned to Developer
      ↓
Development
      ↓
Code Review (Development Manager)
      ↓
Merge to Main
      ↓
Deployment (via GitHub Actions)
      ↓
Verification (Web Operations)
      ↓
Closed
```

---

## Key Metrics

| Metric | Target | Frequency |
|--------|--------|-----------|
| P0/P1 bugs resolved | < 24 hours | Ongoing |
| Backlog age | No items > 30 days without action | Weekly |
| Deployment success rate | > 95% | Weekly |
| Rework rate | < 10% | Monthly |

---

## Tools & Access

| Tool | Purpose | Access Level |
|------|---------|--------------|
| GitHub | Code review, issue tracking | Admin |
| All Dev Tools | Support developer | Full |

---

## Weekly Report Template

```
DEVELOPMENT WEEKLY SUMMARY
══════════════════════════════════════

Completed This Week:
- [Feature/Fix]: [Brief description]
- [Feature/Fix]: [Brief description]

In Progress:
- [Item]: [Status, blockers if any]

Backlog Status:
- P0/P1 items: [X]
- P2 items: [X]
- P3 items: [X]

Deployments: [X] successful, [X] failed

Next Week Focus:
- [Priority item 1]
- [Priority item 2]

Blockers/Escalations:
- [None / List items]
```

---

## Escalation Triggers

Escalate to Director of Engineering when:
- P0 issue cannot be resolved within 4 hours
- Resource conflict or capacity issue
- Technical decision with architectural impact
- Scope creep on major feature
- Repeated deployment failures
