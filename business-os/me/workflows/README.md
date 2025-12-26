# Personal Workflows

> Documented processes for recurring tasks and projects.

---

## What Are Workflows?

Workflows are step-by-step processes for tasks you do repeatedly. Unlike skills (which are AI-assisted interactions), workflows can be:
- Fully manual processes
- Automated via n8n
- Hybrid (some manual, some automated)

---

## Structure

```
workflows/
├── README.md                    # This file
├── content-creation.md          # How I create content
├── client-onboarding.md         # Personal steps for new clients
├── program-delivery.md          # My prep and delivery process
├── email-processing.md          # How I handle email
└── automations/                 # n8n workflow documentation
    └── README.md
```

---

## Workflow Template

```markdown
# [Workflow Name]

**Purpose:** [What this workflow accomplishes]
**Trigger:** [What initiates this workflow]
**Frequency:** [How often]
**Time Required:** [Estimate]
**Automation Level:** [Manual / Partial / Full]

---

## Overview

[Brief description of the workflow end-to-end]

## Prerequisites

- [ ] [What needs to be in place]
- [ ] [Tools needed]
- [ ] [Access required]

## Steps

### Phase 1: [Name]

1. **[Step Name]**
   - Action: [What to do]
   - Tool: [Tool used]
   - Output: [What this produces]
   - Notes: [Any tips]

2. **[Step Name]**
   - Action: [What to do]
   - Tool: [Tool used]
   - Output: [What this produces]

### Phase 2: [Name]

[Continue with steps...]

## Automation Opportunities

| Step | Current State | Could Automate With | Priority |
|------|---------------|---------------------|----------|
| [Step] | Manual | [Tool/MCP] | [H/M/L] |

## Quality Checks

- [ ] [Checkpoint 1]
- [ ] [Checkpoint 2]

## Common Issues

| Issue | Solution |
|-------|----------|
| [Problem] | [Fix] |

## Metrics

- Time to complete: [Target]
- Success criteria: [How to know it worked]

## Version History

| Date | Change | Reason |
|------|--------|--------|
| [Date] | Created | Initial version |
```

---

## My Core Workflows

### Content Creation
How I go from idea to published content

### Client Onboarding
My personal touchpoints in the client journey

### Program Delivery
Prep, delivery, and follow-up for programs

### Email Processing
How I maintain inbox sanity

### Weekly Planning
My personal planning ritual

### Monthly Review
End of month reflection and planning

---

## Automation Ideas

Things to potentially automate with n8n:

| Workflow | Automation Idea | Effort | Impact |
|----------|-----------------|--------|--------|
| [Workflow] | [Idea] | [H/M/L] | [H/M/L] |

---

## Tips for Good Workflows

1. **Document what you actually do**, not what you think you should do
2. **Start simple** - don't over-engineer
3. **Include the why** - helps with future optimization
4. **Note friction points** - where things slow down
5. **Update regularly** - workflows evolve
6. **Time yourself** - know your baselines

---

*A good workflow is invisible. It just works.*
