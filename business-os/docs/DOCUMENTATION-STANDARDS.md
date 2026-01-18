# Documentation Standards

> **CEO Summary:** This document defines the mandatory documentation requirements for all Business OS components, ensuring every piece of the system is understandable at a glance.

---

## Why Documentation Matters

The Business OS is designed to be understood by a CEO, not just engineers. Every component must explain itself in plain English. If the CEO can't understand what something does from the first line, the documentation has failed.

---

## CEO Summary Format

### The Rule

Every document MUST start with a CEO Summary immediately after the title:

```markdown
# Component Name

> **CEO Summary:** [One sentence in plain English explaining what this does and why it matters]
```

### Good Examples

```markdown
# Domain Health Sync

> **CEO Summary:** Monitors email-sending domain reputation daily and alerts you before deliverability problems tank your campaigns.
```

```markdown
# Registration Processor

> **CEO Summary:** Automatically syncs new program registrations from Airtable to GHL so sales can follow up within minutes.
```

```markdown
# Faculty Reminder Agent

> **CEO Summary:** Sends automated reminder emails to faculty 7 days before their scheduled programs so they have time to prepare.
```

### Bad Examples

```markdown
# Domain Health Sync

> **CEO Summary:** This workflow uses the ZapMail API to fetch DNS and DMARC metrics and stores them in Supabase.
```
*Problem: Technical jargon, doesn't explain why it matters*

```markdown
# Registration Processor

> **CEO Summary:** Processes registrations.
```
*Problem: Too vague, doesn't explain the value*

```markdown
# Faculty Reminder Agent

> **CEO Summary:** Sends emails.
```
*Problem: Doesn't explain what emails, to whom, or why*

---

## Required Documentation by Component Type

### n8n Workflows

**Create:** `business-os/workflows/README-[workflow-name].md`

**Update:** Add entry to `business-os/workflows/README.md`

**Template:**

```markdown
# [Workflow Name]

> **CEO Summary:** [One sentence]

## What It Does

[2-3 sentences explaining the workflow in plain English]

## Trigger

- **Type:** [Schedule / Webhook / Manual]
- **Schedule:** [e.g., "Daily at 6 AM CT" or "Every 5 minutes"]

## Data Flow

1. [Step 1 in plain English]
2. [Step 2]
3. [Step 3]

## Integrations

| Service | Purpose |
|---------|---------|
| [Service] | [What we use it for] |

## Alerts

- [What conditions trigger alerts]
- [Where alerts are sent]

## Related

- [Link to related docs]
```

---

### Workers

**Location:** Worker spec file within sub-department folder

**Template:**

```markdown
# [Worker Name]

> **CEO Summary:** [One sentence]

## Purpose

[What this worker does and why it matters]

## Type

[Monitor / Agent / Skill / Hybrid]

## Trigger

- **Schedule:** [When it runs]
- **Event:** [What triggers it]

## What It Monitors / Does

[Clear explanation of the worker's job]

## Alerts

| Condition | Action |
|-----------|--------|
| [When this happens] | [This alert fires] |

## Success Criteria

[How we know it's working]
```

---

### Employees (ROLE.md)

**Location:** `business-os/departments/[dept]/employees/[role]/ROLE.md`

**Template:**

```markdown
# [Role Name]

> **CEO Summary:** [One sentence explaining what this role handles]

## Responsibilities

- [Primary responsibility 1]
- [Primary responsibility 2]
- [Primary responsibility 3]

## Tools & Access

| Tool | Purpose |
|------|---------|
| [Tool] | [What they use it for] |

## Key Metrics

- [What they're measured on]

## Escalation Path

- [When and how they escalate issues]
```

---

### Departments (DEPARTMENT.md)

**Location:** `business-os/departments/[dept]/DEPARTMENT.md`

**Template:**

```markdown
# [Department Name] Department

> **CEO Summary:** [One sentence explaining what this department owns and why it matters]

## Director Role

[What this Director oversees]

## Domain Scope

**Owns:**
- [Responsibility 1]
- [Responsibility 2]

**Does Not Own:**
- [Explicit boundary 1]
- [Explicit boundary 2]

## Sub-Departments

| Sub-Department | Focus |
|----------------|-------|
| [Name] | [What it handles] |

## Key Metrics

- [Primary metric 1]
- [Primary metric 2]
```

---

## Documentation Checklist

Before marking any component as "done":

- [ ] **CEO Summary exists** at the top of the document
- [ ] **Plain English** - No unexplained jargon
- [ ] **Why it matters** - Not just what it does
- [ ] **Central README updated** (for workflows: `business-os/workflows/README.md`)
- [ ] **Related docs linked** where appropriate

---

## Auditing Documentation

Run `/docs-audit` to find:
- Workflows missing README files
- Workers/employees/departments missing CEO summaries
- Workflows not listed in the central README

The audit command will report gaps and offer to generate missing documentation.

---

## Enforcement

1. **CLAUDE.md requires it** - Claude sees these requirements in every session
2. **Templates include it** - Pre-filled format reduces friction
3. **Audit catches gaps** - `/docs-audit` finds missing docs

There are no exceptions. Every component gets documented.
