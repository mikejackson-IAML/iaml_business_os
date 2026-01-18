# Department Template

> **CEO Summary:** This template defines the standard structure for creating new Business OS departments, ensuring consistency and completeness.

Copy everything below into your new department's DEPARTMENT.md file:

```markdown
# [Department Name] Department

> **CEO Summary:** [One sentence explaining what this department owns and why it matters to the business]

## Director Role

[One paragraph describing what this Director oversees and their primary responsibilities. What does this Director "know" and what questions can they answer?]

## Domain Scope

**Owns:**
- [What this department is responsible for]
- [Be specific]
- [Include all sub-areas]

**Does Not Own:**
- [Explicit boundaries—what belongs to other departments]
- [This prevents overlap and confusion]

## Sub-Departments

| Sub-Department | Focus | Key Metrics |
|----------------|-------|-------------|
| [Name] | [What this sub-dept handles] | [How we measure success] |
| [Name] | [Focus area] | [Key metrics] |

## Key Integrations

| Tool | Purpose | Data Flow |
|------|---------|-----------|
| [Tool name] | [Why we use it] | In / Out / Both |
| [Tool name] | [Purpose] | [Direction] |

## Decision Authority

### Autonomous (No Approval Needed)
- [Routine operations the Director handles independently]
- [Low-risk, reversible actions]
- [Standard monitoring and alerting]

### Recommend + Approve
- [Decisions that need CEO sign-off]
- [External-facing actions]
- [Budget or resource allocation]

### Escalate Immediately
- [Critical failures]
- [Security concerns]
- [Anything blocking business operations]

## Dashboard Metrics

**Health Score Components:**
- [Metric 1]: [Weight as decimal, e.g., 0.25]
- [Metric 2]: [Weight]
- [Metric 3]: [Weight]
- Total: 1.0

**Key Stats to Display:**
- [Primary metric with trend]
- [Secondary metrics]
- [Status indicators]

**Alerts to Surface:**
- [What conditions trigger alerts]
- [Severity levels]

## Learning Objectives

What this department should get better at over time:
- [Pattern to recognize]
- [Decision to optimize]
- [Threshold to calibrate]
```

---

## Worker Definition Template

For each worker in a sub-department, create a worker definition file:

```markdown
# [Worker Name]

> **CEO Summary:** [One sentence explaining what this worker does and why it matters]

## Purpose
[One sentence: what does this worker do?]

## Type
[Monitor / Agent / Skill / Hybrid]

## Trigger
- **Schedule:** [e.g., "Every 5 minutes", "Daily at 6 AM"]
- **Event:** [e.g., "On new lead import", "On deployment"]
- **Manual:** [e.g., "On-demand via dashboard"]

## Inputs
- [Data source 1]
- [Data source 2]

## Process
1. [Step 1]
2. [Step 2]
3. [Decision point if applicable]
4. [Output step]

## Outputs
- **To Dashboard:** [What metrics/status to display]
- **To Supabase:** [What data to store]
- **Alerts:** [Conditions that trigger alerts]

## Thresholds
| Condition | Level | Action |
|-----------|-------|--------|
| [Metric] > [value] | Warning | [What happens] |
| [Metric] > [value] | Critical | [What happens] |

## Integration Requirements
- [API access needed]
- [Credentials required]
```

---

## config.json Template

```json
{
  "department": "[department-name]",
  "version": "1.0.0",
  "director": {
    "name": "[Department] Director",
    "model": "claude-sonnet-4-20250514",
    "context_includes": [
      "DEPARTMENT.md",
      "sub-departments/*/SKILL.md"
    ]
  },
  "health_score": {
    "weights": {
      "[metric_1]": 0.25,
      "[metric_2]": 0.25,
      "[metric_3]": 0.25,
      "[metric_4]": 0.25
    },
    "thresholds": {
      "healthy": 80,
      "warning": 60,
      "critical": 40
    }
  },
  "alerts": {
    "channels": ["dashboard", "email"],
    "escalation_delay_minutes": 30
  },
  "integrations": {
    "[tool_name]": {
      "enabled": true,
      "sync_frequency": "hourly",
      "credentials_key": "[ENV_VAR_NAME]"
    }
  }
}
```

---

## Dashboard View Template (ceo-view.json)

```json
{
  "department": "[department-name]",
  "layout": {
    "sections": [
      {
        "id": "health",
        "title": "Department Health",
        "type": "health-score",
        "position": "top"
      },
      {
        "id": "key-metrics",
        "title": "Key Metrics",
        "type": "metrics-grid",
        "metrics": [
          {
            "id": "[metric_id]",
            "label": "[Display Name]",
            "source": "supabase",
            "query": "[table].[column]",
            "format": "number|percent|currency",
            "trend": true
          }
        ]
      },
      {
        "id": "alerts",
        "title": "Needs Attention",
        "type": "alert-list",
        "max_items": 5
      },
      {
        "id": "activity",
        "title": "Recent Activity",
        "type": "activity-feed",
        "max_items": 10
      }
    ]
  }
}
```

---

## Checklist: Building a New Department

### Phase 1: Definition
- [ ] Copy this template
- [ ] Define Director role and scope
- [ ] List all sub-departments
- [ ] Identify integrations needed
- [ ] Define decision authority levels
- [ ] Determine health score components

### Phase 2: Structure
- [ ] Create folder structure
- [ ] Write DEPARTMENT.md with CEO Summary at top
- [ ] Create config.json
- [ ] Define dashboard view

### Phase 3: Workers
- [ ] List all workers per sub-department
- [ ] Create worker definition files with CEO Summary at top
- [ ] Build Monitor workers first (visibility)
- [ ] Build Agent workers second (automation)
- [ ] Build Skill workers last (conversational)

### Phase 4: Integration
- [ ] Set up API connections
- [ ] Configure credentials in environment
- [ ] Build n8n workflows with README documentation
- [ ] Update `business-os/workflows/README.md` with new workflows
- [ ] Test data flow

### Phase 5: Dashboard
- [ ] Add department to main dashboard
- [ ] Configure health score calculation
- [ ] Set up alerts
- [ ] Test CEO view

### Phase 6: Learning
- [ ] Define what success looks like
- [ ] Set up outcome tracking
- [ ] Configure feedback capture
- [ ] Document learning objectives

### Phase 7: Documentation Verification
- [ ] Run `/docs-audit` to verify all documentation is complete
- [ ] All CEO Summaries are in plain English (no jargon)
- [ ] Central README files updated
- [ ] Related docs cross-linked

---

## Questions to Answer Before Building

1. **What does this department own?** (Be specific about boundaries)
2. **What external tools does it need?** (APIs, credentials)
3. **What decisions can it make alone?** (Autonomy level)
4. **What should the CEO see?** (Dashboard metrics)
5. **How do we know it's working?** (Success criteria)
6. **What should it learn over time?** (Improvement areas)
