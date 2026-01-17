# Build Efficiency Guide: GSD + Ralph

> A practical guide to using Get Shit Done (GSD) and Ralph Loop for efficient development in the IAML Business OS codebase.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [GSD: Structured Planning](#gsd-structured-planning)
4. [Ralph: Autonomous Execution](#ralph-autonomous-execution)
5. [Combined Workflow](#combined-workflow)
6. [Integration with n8n-brain](#integration-with-n8n-brain)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### The Problem These Tools Solve

When working with AI assistants like Claude Code on complex projects, you face two challenges:

1. **Context Rot**: As conversations get longer, the AI's context window fills up, leading to quality degradation - forgotten requirements, inconsistent code, and repeated mistakes.

2. **Iteration Overhead**: Multi-step features require many back-and-forth exchanges, with you re-explaining context each time.

### The Solution

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **GSD** | Structured planning with fresh context per task | Planning phases, complex features, unclear requirements |
| **Ralph** | Autonomous execution loop | Well-defined tasks, batch work, worker deployment |

### How They Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR EFFICIENT WORKFLOW                       │
│                                                                  │
│   YOU                                                           │
│    │                                                            │
│    ▼                                                            │
│   GSD Planning                                                  │
│    │ • Define requirements                                      │
│    │ • Break into phases                                        │
│    │ • Create atomic tasks                                      │
│    │                                                            │
│    ▼                                                            │
│   Convert to PRD ────────────────────┐                         │
│    │                                  │                         │
│    │ Complex/Unclear?                 │ Simple/Well-defined?    │
│    ▼                                  ▼                         │
│   GSD Execute                      Ralph Loop                   │
│    │ • Fresh context per task       │ • Autonomous iterations   │
│    │ • Interactive verification     │ • Batch completion        │
│    │ • Human-in-loop               │ • Pattern storage          │
│    │                                  │                         │
│    └──────────────┬───────────────────┘                         │
│                   ▼                                             │
│              n8n-brain                                          │
│               • Patterns stored                                 │
│               • Confidence increases                            │
│               • Future tasks faster                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Option A: Use GSD for Interactive Development

```bash
# Start Claude Code
claude

# Then use GSD commands:
> /gsd:progress           # See current status
> /gsd:plan-phase 2       # Plan Phase 2 workers
> /gsd:execute-phase 2    # Execute with fresh context per task
```

### Option B: Use Ralph for Autonomous Batch Work

```bash
# Edit the PRD if needed
nano scripts/ralph/prd.json

# Run the loop (will continue until all stories complete)
./scripts/ralph/ralph.sh
```

### Option C: Quick Manual Session

If you don't need the full frameworks, simply reference the planning files:

```bash
# Start Claude Code with context
claude

# Then say:
> Read .planning/ROADMAP.md and help me build the next pending worker
```

---

## GSD: Structured Planning

### What GSD Provides

GSD (Get Shit Done) is a meta-prompting system that:
- Maintains structured documentation (PROJECT.md, REQUIREMENTS.md, etc.)
- Runs each task in fresh context (preventing degradation)
- Creates atomic git commits per task
- Tracks progress across sessions

### File Structure

```
.planning/
├── PROJECT.md       # Vision, goals, architecture (always in context)
├── REQUIREMENTS.md  # All features with status tracking
├── ROADMAP.md       # Phases and milestones
├── STATE.md         # Current decisions, blockers, session memory
├── PLAN.md          # Active tasks (created during planning)
└── research/        # Investigation notes (created as needed)
```

### Core Commands

| Command | What It Does |
|---------|--------------|
| `/gsd:progress` | Shows current phase, completed work, next steps |
| `/gsd:plan-phase [N]` | Creates atomic task plans for phase N |
| `/gsd:execute-phase [N]` | Runs plans with fresh context per task |
| `/gsd:pause-work` | Creates handoff notes for later resumption |
| `/gsd:resume-work` | Restores context from last session |

### GSD Workflow Example

**Planning Phase 2 Workers:**

```
You: /gsd:plan-phase 2

Claude: I'll analyze Phase 2 requirements and create atomic tasks.

[Reads ROADMAP.md, REQUIREMENTS.md]
[Creates PLAN.md with XML-structured tasks]

Created 3 task plans:
1. MKT-04: Campaign Analyst Worker
2. MKT-05: A/B Test Manager Worker
3. MKT-06: Content Performance Tracker Worker

Each task has:
- Target files
- Implementation steps
- Verification criteria
- Completion definition

Ready to execute? Use /gsd:execute-phase 2
```

**Executing:**

```
You: /gsd:execute-phase 2

Claude: Starting execution with fresh context per task...

[Task 1: Campaign Analyst Worker]
- Checking n8n-brain for similar patterns...
- Found: smartlead-activity-receiver (70% similar)
- Building workflow based on pattern...
- Storing new pattern...
- Committing: "feat: MKT-04 - Campaign Analyst Worker"
✓ Task 1 complete

[Task 2: A/B Test Manager Worker]
...
```

### Task XML Structure

GSD uses structured XML for unambiguous task definitions:

```xml
<task type="auto">
  <name>Campaign Analyst Worker</name>
  <files>n8n-workflows/marketing/campaign-analyst.json</files>
  <action>
    1. Query n8n-brain for similar patterns
    2. Create workflow with schedule trigger (daily 6 AM)
    3. Query campaign_funnel view
    4. Calculate engagement_rate, conversion_rate
    5. Compare to 7-day rolling average
    6. Store in campaign_metrics table
    7. Alert if variance > 10%
  </action>
  <verify>
    - Workflow JSON is valid
    - Uses correct Supabase credentials from n8n-brain
    - Pattern stored with services: ['supabase']
  </verify>
  <done>
    Workflow deployed, pattern stored, metrics table receiving data
  </done>
</task>
```

---

## Ralph: Autonomous Execution

### What Ralph Provides

Ralph is an autonomous loop that:
- Spawns fresh AI instances for each story
- Works through PRD items until complete
- Maintains learnings in progress.txt
- Commits after each successful implementation

### File Structure

```
scripts/ralph/
├── ralph.sh         # The loop script
├── prompt.md        # Instructions for each iteration
├── prd.json         # Your user stories
├── progress.txt     # Accumulated learnings
├── AGENTS.md        # Codebase patterns and gotchas
└── archive/         # Previous run logs
```

### PRD Structure

```json
{
  "project": "IAML Business OS - Phase 2 Workers",
  "branchName": "feature/phase-2-workers",
  "stories": [
    {
      "id": "MKT-04",
      "title": "Campaign Analyst Worker",
      "description": "Detailed description...",
      "priority": 1,
      "acceptance": [
        "Criterion 1",
        "Criterion 2"
      ],
      "passes": false
    }
  ]
}
```

### Running Ralph

```bash
# Navigate to project root
cd /home/user/iaml_business_os

# Run the loop
./scripts/ralph/ralph.sh

# Or with custom settings
MAX_ITERATIONS=20 SLEEP_BETWEEN=5 ./scripts/ralph/ralph.sh
```

### What Happens Each Iteration

1. **Story Selection**: Picks highest-priority incomplete story
2. **Context Loading**: Reads prd.json, progress.txt, AGENTS.md
3. **Implementation**: Builds the feature/worker
4. **Quality Checks**: Validates the work
5. **Commit**: If checks pass, commits with `feat: [ID] - [Title]`
6. **Status Update**: Sets `passes: true` in prd.json
7. **Learning**: Appends insights to progress.txt
8. **Loop**: Continues until all stories complete

### Progress Tracking

progress.txt accumulates learnings:

```markdown
## Codebase Patterns
- n8n-brain credentials: supabase → abc123
- Campaign tables use UUID primary keys
- Always include error handling nodes

---

## 2026-01-17 10:30 - MKT-04
- Implemented Campaign Analyst Worker
- Files: n8n-workflows/marketing/campaign-analyst.json
- Workflow ID: workflow_xyz
- **Learnings:**
  - campaign_funnel view includes all needed metrics
  - Use scheduleTrigger with cron: "0 6 * * *" for daily 6 AM
  - Pattern stored as "Campaign-Analyst-Worker"
---
```

---

## Combined Workflow

### When to Use Each Tool

| Scenario | Use |
|----------|-----|
| Unclear requirements | GSD (`/gsd:discuss-phase`) |
| Complex feature needing design | GSD (plan then execute) |
| Batch of similar, well-defined tasks | Ralph |
| Exploratory work | GSD with manual execution |
| 10+ similar workers to deploy | Ralph |

### Recommended Flow for Your Remaining Workers

**Phase 2 Workers (11 items):**

1. **Review the PRD**: Check `scripts/ralph/prd.json` - it's pre-populated with your Phase 2 workers

2. **Choose Your Approach**:

   **Option A: Ralph (Recommended for batch work)**
   ```bash
   ./scripts/ralph/ralph.sh
   # Let it run through all 11 workers autonomously
   ```

   **Option B: GSD (If you want more control)**
   ```
   /gsd:plan-phase 2
   # Review the plans
   /gsd:execute-phase 2
   # Verify each worker before moving on
   ```

3. **After Completion**:
   - Update `.planning/ROADMAP.md` to mark Phase 2 complete
   - Update `.planning/STATE.md` with decisions made
   - Review n8n-brain patterns stored

---

## Integration with n8n-brain

Both GSD and Ralph integrate with your existing n8n-brain learning layer.

### Before Building Any Workflow

```javascript
// 1. Check for similar patterns
find_similar_patterns({
  services: ["supabase", "ghl"],
  node_types: ["webhook", "postgres"]
})

// 2. Get credentials
get_credential({ service_name: "supabase" })

// 3. Calculate confidence
calculate_confidence({
  task_description: "Build campaign analyst",
  services: ["supabase"],
  node_types: ["scheduleTrigger", "postgres"]
})
```

### After Successful Build

```javascript
// Store the pattern for future reuse
store_pattern({
  name: "Campaign-Analyst-Worker",
  description: "Daily campaign metrics analysis",
  workflow_json: { ... },
  services: ["supabase"],
  node_types: ["scheduleTrigger", "postgres", "set", "if"]
})

// Record the outcome
record_action({
  task_description: "Built campaign analyst worker",
  services_involved: ["supabase"],
  outcome: "success"
})
```

### Confidence Levels

| Score | Behavior | Example |
|-------|----------|---------|
| 80-100 | Autonomous - just build it | Similar pattern exists, all credentials known |
| 40-79 | Build and verify | New variation of known pattern |
| 0-39 | Ask first | New services, no similar patterns |

---

## Best Practices

### 1. Keep Stories Small and Focused

**Good:**
```json
{
  "id": "MKT-04",
  "title": "Campaign Analyst Worker",
  "description": "Specific workflow that does one thing"
}
```

**Bad:**
```json
{
  "id": "MKT-ALL",
  "title": "Build all marketing automation",
  "description": "Everything related to marketing"
}
```

### 2. Write Clear Acceptance Criteria

```json
"acceptance": [
  "Workflow triggers daily at 6 AM",
  "Queries campaign_funnel view",
  "Calculates engagement_rate, conversion_rate",
  "Stores results in campaign_metrics table",
  "Pattern stored in n8n-brain"
]
```

### 3. Update AGENTS.md with Discoveries

When you learn something reusable, add it:

```markdown
## Gotchas Discovered
- Supabase RLS doesn't apply to service role
- GHL webhook needs X-API-Key header, not Bearer token
```

### 4. Review Progress Regularly

```bash
# Check progress
cat scripts/ralph/progress.txt

# Check remaining work
jq '.stories[] | select(.passes != true) | .title' scripts/ralph/prd.json
```

### 5. Commit the Tracking Files

Progress files are valuable - commit them:

```bash
git add scripts/ralph/progress.txt scripts/ralph/prd.json
git commit -m "chore: update ralph progress tracking"
```

---

## Troubleshooting

### Ralph Loop Stops Early

**Symptom**: Loop exits before completing all stories

**Causes & Fixes**:
1. **Quality check failed**: Check the logs, fix the issue, re-run
2. **Claude returned error**: Check for API issues
3. **prd.json invalid**: Validate JSON syntax

```bash
# Validate prd.json
jq . scripts/ralph/prd.json

# Check remaining stories
jq '[.stories[] | select(.passes != true)]' scripts/ralph/prd.json
```

### Context Seems Degraded

**Symptom**: Claude forgets earlier context, repeats mistakes

**Fix**: You're likely in a long session. Use GSD or Ralph to get fresh context:

```
/gsd:pause-work
# Start new session
/gsd:resume-work
```

### Patterns Not Being Found

**Symptom**: n8n-brain returns empty results

**Causes & Fixes**:
1. **Pattern not stored**: Store patterns after successful builds
2. **Service names don't match**: Use consistent naming (lowercase)
3. **Database connection issue**: Check Supabase credentials

```javascript
// List all stored patterns
list_patterns()

// Check specific service
find_similar_patterns({ services: ["supabase"] })
```

### Workflow Won't Deploy

**Symptom**: n8n rejects the workflow

**Common Issues**:
1. **Invalid JSON**: Validate with `jq`
2. **Missing credentials**: Check n8n-brain mappings
3. **Node type wrong**: Use full type like `n8n-nodes-base.postgres`

---

## File Reference

| File | Purpose | When Updated |
|------|---------|--------------|
| `.planning/PROJECT.md` | Vision & architecture | Rarely, major changes only |
| `.planning/REQUIREMENTS.md` | Feature tracking | After completing features |
| `.planning/ROADMAP.md` | Phase status | After completing phases |
| `.planning/STATE.md` | Session memory | Every session |
| `scripts/ralph/prd.json` | Current sprint stories | When stories complete |
| `scripts/ralph/progress.txt` | Learnings log | Every iteration |
| `scripts/ralph/AGENTS.md` | Codebase patterns | When discovering gotchas |

---

## Getting Help

1. **GSD Commands**: Type `/gsd:help` in Claude Code
2. **Ralph Issues**: Check `scripts/ralph/progress.txt` for recent logs
3. **n8n-brain**: Use `list_patterns()` and `list_credentials()` to see available data

---

## Summary

| Tool | Best For | Command |
|------|----------|---------|
| GSD | Planning, complex features, unclear requirements | `/gsd:plan-phase N` |
| Ralph | Batch work, well-defined tasks, autonomous execution | `./scripts/ralph/ralph.sh` |
| n8n-brain | Pattern reuse, credential management, confidence scoring | MCP tools |

Start with GSD for planning, use Ralph for batch execution, and let n8n-brain accumulate knowledge across both.
