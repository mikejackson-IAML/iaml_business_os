# Complete Build Efficiency Guide for IAML Business OS

> This document captures the full analysis and setup of GSD (Get Shit Done) and Ralph Loop for efficient AI-assisted development in the IAML Business OS codebase.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Your Current Codebase Analysis](#your-current-codebase-analysis)
3. [The Problem These Tools Solve](#the-problem-these-tools-solve)
4. [GSD (Get Shit Done) Explained](#gsd-get-shit-done-explained)
5. [Ralph Loop Explained](#ralph-loop-explained)
6. [How They Work Together](#how-they-work-together)
7. [Integration with n8n-brain](#integration-with-n8n-brain)
8. [Files Added to Your Repo](#files-added-to-your-repo)
9. [Quick Start Guide](#quick-start-guide)
10. [Detailed Usage Instructions](#detailed-usage-instructions)
11. [Your Remaining Work (Pre-Populated)](#your-remaining-work-pre-populated)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)

---

## Executive Summary

### What We Did

1. **Analyzed your codebase** - Mapped your entire IAML Business OS architecture
2. **Researched two efficiency tools** - GSD and Ralph from GitHub
3. **Customized both for your project** - Pre-populated with your specific workers and patterns
4. **Created comprehensive documentation** - This guide and supporting files

### Key Takeaways

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **GSD** | Structured planning with fresh context per task | Complex features, unclear requirements, interactive development |
| **Ralph** | Autonomous execution loop | Batch work, well-defined tasks, deploying multiple workers |
| **n8n-brain** | Learning layer (you already have this) | Pattern storage, credential management, confidence scoring |

### The Power Combo

```
GSD Planning → Ralph Execution → n8n-brain Learning
     ↓              ↓                   ↓
  Structure    Automation          Accumulation
```

---

## Your Current Codebase Analysis

### Project Overview

IAML Business OS is a sophisticated business automation platform for an HR training company integrating:

| System | Purpose | Status |
|--------|---------|--------|
| **Website** | Vanilla HTML/CSS/JS on Vercel | 18+ programs live |
| **Dashboard** | Next.js admin panel | In development |
| **n8n** | Workflow automation | 54/76 workers deployed |
| **Supabase** | PostgreSQL database | Campaign tracking operational |
| **GHL** | CRM and email sequences | Integrated |
| **n8n-brain** | Learning layer for workflows | Operational |

### Architecture Summary

```
/home/user/iaml_business_os/
├── website/                    # Public-facing HR training website
├── dashboard/                  # Next.js admin dashboard
├── business-os/                # Automation orchestration & docs
├── mcp-servers/                # Custom MCP servers (n8n-brain, neverbounce)
├── n8n-workflows/              # n8n automation JSON files
├── supabase/                   # Database migrations & config
├── scripts/                    # Utility scripts
├── .github/workflows/          # CI/CD automation
├── .claude/                    # Claude Code configuration
├── .planning/                  # NEW: GSD planning files
├── docs/                       # NEW: This documentation
└── .mcp.json                   # 40+ integrated MCP servers
```

### Current n8n Worker Status

| Department | Built | Remaining | Completion |
|------------|-------|-----------|------------|
| Digital | 26 | 2 | 93% |
| Marketing | 3 | 5 | 38% |
| Lead Intelligence | 8 | 8 | 50% |
| Programs & Operations | 17 | 8 | 68% |
| **Total** | **54** | **22** | **71%** |

### Existing Efficiency Patterns You Have

1. **n8n-brain MCP server** - Stores patterns, credentials, error fixes
2. **Daily Airtable cache sync** - GitHub Actions automation
3. **QA automation** - `/smoke`, `/fullqa`, `/lighthouse-local` commands
4. **Zero-build static site** - Instant deployments
5. **Campaign tracking schema** - Multi-channel attribution

### What's Missing (Why You Need GSD + Ralph)

1. **Context management** - Long sessions lead to degradation
2. **Structured planning** - Ad-hoc feature requests lose requirements
3. **Batch execution** - Building 22 workers one-by-one is slow
4. **Session continuity** - Losing context between sessions

---

## The Problem These Tools Solve

### Problem 1: Context Rot

As conversations get longer, Claude's 200k token context window fills up:

```
Session Start: High quality, remembers everything
     ↓
30 minutes: Good quality, occasional gaps
     ↓
60 minutes: Forgetting earlier requirements
     ↓
90 minutes: Repeating mistakes, inconsistent code
```

**GSD Solution**: Fresh 200k context per task
**Ralph Solution**: Fresh AI instance per iteration

### Problem 2: Iteration Overhead

Building 22 workers requires:
- Explaining context each time
- Re-describing patterns
- Manual progress tracking
- Risk of missing requirements

**GSD Solution**: Structured files (PROJECT.md, REQUIREMENTS.md) persist across sessions
**Ralph Solution**: Autonomous loop with progress.txt accumulating learnings

### Problem 3: Unclear Task Boundaries

"Build the A/B Test Manager" is vague. What files? What verification? When is it done?

**GSD Solution**: XML-structured tasks with explicit targets, actions, and verification:

```xml
<task type="auto">
  <name>A/B Test Manager Worker</name>
  <files>n8n-workflows/marketing/ab-test-manager.json</files>
  <action>
    1. Query message_variants table for active tests
    2. Calculate statistical significance
    3. Auto-pause losing variants when p < 0.05
    4. Alert via Slack on significance reached
  </action>
  <verify>
    - Workflow JSON valid
    - Uses n8n-brain credentials
    - Pattern stored after deployment
  </verify>
  <done>Deployed, pattern stored, first test monitored</done>
</task>
```

---

## GSD (Get Shit Done) Explained

### What It Is

GSD is a meta-prompting and context engineering system for Claude Code that:
- Maintains structured documentation files
- Runs each task in fresh context (preventing degradation)
- Creates atomic git commits per task
- Tracks progress across sessions

### Source Repository

https://github.com/glittercowboy/get-shit-done

### Core Concepts

#### 1. Spec Files (Persistent Context)

| File | Purpose | When Updated |
|------|---------|--------------|
| `PROJECT.md` | Vision, goals, architecture | Rarely |
| `REQUIREMENTS.md` | All features with status | After completing features |
| `ROADMAP.md` | Phases and milestones | After completing phases |
| `STATE.md` | Decisions, blockers, session memory | Every session |
| `PLAN.md` | Active tasks (created during planning) | During plan-phase |

#### 2. Phases (Chunked Work)

Work is organized into phases:
```
Phase 1: Foundation (Complete)
Phase 2: Marketing & Lead Intelligence (Current)
Phase 3: Operations Workers
Phase 4: Advanced Analytics
Phase 5: Integration Polish
```

#### 3. Atomic Tasks (Fresh Context)

Each task runs in isolation:
- Gets full 200k token context
- No pollution from previous tasks
- Creates single git commit
- Can be reverted independently

### GSD Commands

#### Workflow Commands

| Command | What It Does |
|---------|--------------|
| `/gsd:progress` | Shows current phase, completed work, next steps |
| `/gsd:plan-phase [N]` | Creates atomic task plans for phase N |
| `/gsd:execute-phase [N]` | Runs plans with fresh context per task |
| `/gsd:complete-milestone` | Marks milestone done, updates roadmap |

#### Session Commands

| Command | What It Does |
|---------|--------------|
| `/gsd:pause-work` | Creates handoff notes for resumption |
| `/gsd:resume-work` | Restores context from last session |

#### Phase Management

| Command | What It Does |
|---------|--------------|
| `/gsd:discuss-phase [N]` | Clarify requirements before planning |
| `/gsd:add-phase` | Append new phase to roadmap |
| `/gsd:insert-phase [N]` | Insert urgent work at position |
| `/gsd:remove-phase [N]` | Remove future phase |

#### Utilities

| Command | What It Does |
|---------|--------------|
| `/gsd:map-codebase` | Analyze existing code (for brownfield projects) |
| `/gsd:add-todo` | Capture ideas for later |
| `/gsd:verify-work [N]` | Manual acceptance testing |
| `/gsd:help` | Command reference |

### GSD Workflow Example

```
You: /gsd:plan-phase 2

Claude: I'll analyze Phase 2 requirements...
[Reads ROADMAP.md, REQUIREMENTS.md]
[Investigates implementation approaches]
[Creates PLAN.md with 3 atomic tasks]

Created 3 task plans:
1. MKT-04: Campaign Analyst Worker
2. MKT-05: A/B Test Manager Worker
3. MKT-06: Content Performance Tracker

Ready to execute? Use /gsd:execute-phase 2

---

You: /gsd:execute-phase 2

Claude: Starting execution with fresh context per task...

[Task 1/3: Campaign Analyst Worker]
- Spawning subagent with fresh 200k context...
- Checking n8n-brain for patterns...
- Building workflow...
- Validating...
- Committing: "feat: MKT-04 - Campaign Analyst Worker"
✓ Complete

[Task 2/3: A/B Test Manager Worker]
...continues...
```

---

## Ralph Loop Explained

### What It Is

Ralph is an autonomous AI agent loop that:
- Works through a PRD (Product Requirements Document) of user stories
- Spawns fresh AI instances for each story
- Continues until all stories complete or max iterations reached
- Accumulates learnings in progress.txt

### Source Repository

https://github.com/snarktank/ralph

### Core Concepts

#### 1. PRD (prd.json)

Your work defined as user stories:

```json
{
  "project": "IAML Business OS - Phase 2 Workers",
  "branchName": "feature/phase-2-workers",
  "stories": [
    {
      "id": "MKT-04",
      "title": "Campaign Analyst Worker",
      "description": "n8n workflow analyzing campaign_funnel view daily",
      "priority": 1,
      "acceptance": [
        "Triggers daily at 6 AM",
        "Queries campaign_funnel view",
        "Stores metrics in campaign_metrics table",
        "Pattern stored in n8n-brain"
      ],
      "passes": false
    }
  ]
}
```

#### 2. The Loop

```
┌─────────────────────────────────────────────────────────┐
│                     RALPH LOOP                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Parse prd.json → Find incomplete story              │
│  2. Spawn fresh AI instance                             │
│  3. Load: prd.json + progress.txt + AGENTS.md           │
│  4. Implement the story                                 │
│  5. Run quality checks                                  │
│  6. If pass:                                            │
│     - Commit with "feat: [ID] - [Title]"                │
│     - Set passes: true in prd.json                      │
│     - Append learnings to progress.txt                  │
│  7. If fail:                                            │
│     - Log issue to progress.txt                         │
│     - Try again next iteration                          │
│  8. Loop until all complete or max iterations           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 3. AGENTS.md (Codebase Knowledge)

Instructions for autonomous agents:
- Credential mappings
- Naming conventions
- Common patterns
- Gotchas and pitfalls

#### 4. progress.txt (Learning Accumulation)

Grows with each iteration:

```markdown
## 2026-01-17 10:30 - MKT-04
- Implemented Campaign Analyst Worker
- Files: n8n-workflows/marketing/campaign-analyst.json
- **Learnings:**
  - campaign_funnel view includes all needed metrics
  - Use scheduleTrigger with cron: "0 6 * * *"
  - Pattern stored as "Campaign-Analyst-Worker"
---

## 2026-01-17 10:45 - MKT-05
- Implemented A/B Test Manager Worker
- **Learnings:**
  - Statistical significance needs p < 0.05
  - Added proportions_ztest function
---
```

### Running Ralph

```bash
# Basic run
./scripts/ralph/ralph.sh

# With custom settings
MAX_ITERATIONS=30 SLEEP_BETWEEN=5 ./scripts/ralph/ralph.sh
```

### Ralph vs GSD: When to Use Each

| Scenario | Use |
|----------|-----|
| Unclear requirements, need discussion | GSD |
| Complex feature needing design | GSD |
| Want to review each task before continuing | GSD |
| Batch of 5+ similar, well-defined tasks | Ralph |
| Deploying multiple workers overnight | Ralph |
| Exploratory/research work | GSD |

---

## How They Work Together

### The Combined Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                YOUR OPTIMAL BUILD WORKFLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   YOU                                                           │
│    │                                                            │
│    │ "I need to build the remaining 22 workers"                 │
│    ▼                                                            │
│   ┌────────────────────────────────────────┐                   │
│   │ GSD PLANNING PHASE                      │                   │
│   │                                         │                   │
│   │ /gsd:plan-phase 2                       │                   │
│   │                                         │                   │
│   │ • Reviews REQUIREMENTS.md               │                   │
│   │ • Breaks Phase 2 into atomic tasks      │                   │
│   │ • Creates XML-structured PLAN.md        │                   │
│   │ • You review and approve                │                   │
│   └──────────────────┬─────────────────────┘                   │
│                      │                                          │
│                      ▼                                          │
│   ┌────────────────────────────────────────┐                   │
│   │ DECISION POINT                          │                   │
│   │                                         │                   │
│   │ Tasks clear and well-defined?           │                   │
│   │                                         │                   │
│   │ YES → Convert to prd.json → Run Ralph   │                   │
│   │ NO  → Use GSD execute for control       │                   │
│   └──────────────────┬─────────────────────┘                   │
│                      │                                          │
│          ┌───────────┴───────────┐                             │
│          │                       │                              │
│          ▼                       ▼                              │
│   ┌──────────────┐       ┌──────────────┐                      │
│   │ GSD EXECUTE  │       │ RALPH LOOP   │                      │
│   │              │       │              │                      │
│   │ Interactive  │       │ Autonomous   │                      │
│   │ Fresh ctx/   │       │ Fresh AI/    │                      │
│   │ task         │       │ story        │                      │
│   │ Human review │       │ Batch exec   │                      │
│   └──────┬───────┘       └──────┬───────┘                      │
│          │                       │                              │
│          └───────────┬───────────┘                             │
│                      │                                          │
│                      ▼                                          │
│   ┌────────────────────────────────────────┐                   │
│   │ n8n-brain LEARNING                      │                   │
│   │                                         │                   │
│   │ • Patterns stored automatically         │                   │
│   │ • Confidence scores updated             │                   │
│   │ • Error fixes recorded                  │                   │
│   │ • Future tasks execute faster           │                   │
│   └──────────────────┬─────────────────────┘                   │
│                      │                                          │
│                      ▼                                          │
│   ┌────────────────────────────────────────┐                   │
│   │ UPDATE STATE                            │                   │
│   │                                         │                   │
│   │ • STATE.md updated with decisions       │                   │
│   │ • ROADMAP.md phase marked complete      │                   │
│   │ • REQUIREMENTS.md statuses updated      │                   │
│   │ • Ready for next phase                  │                   │
│   └────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Practical Example: Building Phase 2

**Step 1: Review the plan (GSD)**
```
/gsd:progress
```

**Step 2: Plan the phase (GSD)**
```
/gsd:plan-phase 2
```
Review the generated PLAN.md

**Step 3: Execute (Choose your method)**

Option A - Interactive (GSD):
```
/gsd:execute-phase 2
```

Option B - Autonomous (Ralph):
```bash
./scripts/ralph/ralph.sh
```

**Step 4: Update status**
```
/gsd:complete-milestone
```

---

## Integration with n8n-brain

Your existing n8n-brain MCP server integrates seamlessly with both tools.

### Available n8n-brain Tools

| Category | Tools |
|----------|-------|
| **Patterns** | `store_pattern`, `find_similar_patterns`, `get_pattern`, `update_pattern_success`, `list_patterns` |
| **Errors** | `store_error_fix`, `lookup_error_fix`, `report_fix_result` |
| **Credentials** | `register_credential`, `get_credential`, `list_credentials` |
| **Confidence** | `calculate_confidence`, `record_action` |
| **Preferences** | `set_preference`, `get_preference`, `getAllPreferences` |

### Before Building Any Workflow

```javascript
// 1. Check for similar patterns
find_similar_patterns({
  services: ["supabase", "ghl"],
  node_types: ["webhook", "postgres"]
})

// 2. Get credential IDs
get_credential({ service_name: "supabase" })
get_credential({ service_name: "ghl" })

// 3. Calculate confidence
calculate_confidence({
  task_description: "Build campaign analyst worker",
  services: ["supabase"],
  node_types: ["scheduleTrigger", "postgres"]
})
```

### After Successful Build

```javascript
// 1. Store the pattern
store_pattern({
  name: "Campaign-Analyst-Worker",
  description: "Daily campaign metrics analysis",
  workflow_json: { /* full workflow */ },
  services: ["supabase"],
  node_types: ["scheduleTrigger", "postgres", "set", "if"]
})

// 2. Record successful outcome
record_action({
  task_description: "Built campaign analyst worker",
  services_involved: ["supabase"],
  outcome: "success",
  outcome_notes: "Deployed as workflow ID xyz"
})
```

### Confidence Scoring

| Score | Behavior | Meaning |
|-------|----------|---------|
| 80-100 | **Autonomous** | Similar pattern exists, credentials known, high success rate |
| 40-79 | **Do & Verify** | New variation, some unknowns, verify before activating |
| 0-39 | **Ask First** | No similar patterns, new services, need clarification |

### How n8n-brain Accelerates Future Work

```
First Campaign Worker:
  Confidence: 35 (no patterns)
  Action: Ask first, build carefully
  Time: 30 minutes

Second Campaign Worker:
  Confidence: 65 (pattern found)
  Action: Build and verify
  Time: 15 minutes

Fifth Campaign Worker:
  Confidence: 90 (multiple patterns, high success)
  Action: Autonomous
  Time: 5 minutes
```

---

## Files Added to Your Repo

### GSD Planning Files (`.planning/`)

#### `.planning/PROJECT.md`
```markdown
# IAML Business OS

High-level vision, architecture, and goals.
- Platform overview
- Tech stack summary
- Key integrations
- Design principles
```

#### `.planning/REQUIREMENTS.md`
```markdown
# Requirements

All 76 workers tracked with status:
- [x] DIG-01: Uptime Monitor (Complete)
- [x] DIG-02: SSL Monitor (Complete)
- [ ] MKT-04: Campaign Analyst (Pending)
...etc
```

#### `.planning/ROADMAP.md`
```markdown
# Roadmap

Phase 1: Foundation ✅ Complete
Phase 2: Marketing & Lead Intelligence 🔄 Current
Phase 3: Operations Workers
Phase 4: Advanced Analytics
Phase 5: Integration Polish
```

#### `.planning/STATE.md`
```markdown
# Current State

- Active work
- Recent decisions
- Blockers
- Questions to resolve
- Session memory
- Handoff notes
```

### Ralph Files (`scripts/ralph/`)

#### `scripts/ralph/ralph.sh`
Executable loop script that:
- Reads prd.json
- Spawns Claude for each story
- Commits on success
- Updates progress.txt

#### `scripts/ralph/prompt.md`
Instructions for each iteration:
- How to read the PRD
- Quality check requirements
- Commit message format
- When to mark complete

#### `scripts/ralph/prd.json`
**Pre-populated with your 11 Phase 2 workers!**

#### `scripts/ralph/progress.txt`
Empty file ready to accumulate learnings.

#### `scripts/ralph/AGENTS.md`
Codebase patterns for autonomous agents:
- Credential mappings
- Naming conventions
- Supabase patterns
- n8n-brain integration
- Common gotchas

#### `scripts/ralph/prd.example.json`
Template for creating new PRDs.

### Documentation (`docs/`)

#### `docs/BUILD-EFFICIENCY-GUIDE.md`
Concise usage guide.

#### `docs/BUILD-EFFICIENCY-COMPLETE-GUIDE.md`
This comprehensive document.

---

## Quick Start Guide

### Option 1: GSD Interactive Mode

Best for: Unclear requirements, complex features, want control

```bash
# Start Claude Code
claude

# Check current status
> /gsd:progress

# Plan the next phase
> /gsd:plan-phase 2

# Review the generated PLAN.md, then execute
> /gsd:execute-phase 2

# When done, mark complete
> /gsd:complete-milestone
```

### Option 2: Ralph Autonomous Mode

Best for: Batch work, well-defined tasks, overnight runs

```bash
# Review/edit the PRD if needed
nano scripts/ralph/prd.json

# Run the loop
./scripts/ralph/ralph.sh

# Monitor progress
tail -f scripts/ralph/progress.txt
```

### Option 3: Manual with Planning Files

Best for: Quick tasks, exploring

```bash
claude

# Reference the planning files
> Read .planning/ROADMAP.md and help me build the next pending worker
```

### Option 4: Hybrid Approach (Recommended)

```bash
claude

# Use GSD to plan
> /gsd:plan-phase 2

# Review PLAN.md, then convert clear tasks to Ralph
> Help me convert PLAN.md tasks to prd.json format

# Run Ralph for batch execution
./scripts/ralph/ralph.sh

# Use GSD to update state
> /gsd:complete-milestone
```

---

## Detailed Usage Instructions

### Starting a New Session

```bash
claude

# First, check where you left off
> /gsd:resume-work

# Or manually
> Read .planning/STATE.md and tell me where we are
```

### Planning a Phase

```
> /gsd:plan-phase 2

Claude will:
1. Read ROADMAP.md to understand Phase 2 scope
2. Read REQUIREMENTS.md for detailed requirements
3. Check n8n-brain for existing patterns
4. Create PLAN.md with atomic tasks
5. Present summary for your approval
```

### Executing with GSD

```
> /gsd:execute-phase 2

Claude will:
1. Read PLAN.md
2. For each task:
   - Spawn fresh subagent (200k context)
   - Implement the task
   - Verify against criteria
   - Create atomic commit
3. Update STATE.md
4. Report completion
```

### Executing with Ralph

```bash
# Edit prd.json if needed (already pre-populated)
nano scripts/ralph/prd.json

# Run the loop
./scripts/ralph/ralph.sh

# The loop will:
# 1. Find first incomplete story
# 2. Spawn Claude with prompt.md + AGENTS.md
# 3. Implement the story
# 4. Run quality checks
# 5. If pass: commit, mark complete, log learnings
# 6. If fail: log issue, try next iteration
# 7. Repeat until all done
```

### Ending a Session

```
> /gsd:pause-work

Claude will:
1. Update STATE.md with current status
2. Note any blockers or decisions
3. Create handoff notes for next session
```

### Checking Progress

```bash
# GSD way
> /gsd:progress

# Ralph way
cat scripts/ralph/progress.txt
jq '[.stories[] | select(.passes == true)] | length' scripts/ralph/prd.json

# Manual way
> Read .planning/ROADMAP.md and summarize completion status
```

---

## Your Remaining Work (Pre-Populated)

### Phase 2: Marketing & Lead Intelligence (11 workers)

The `scripts/ralph/prd.json` is pre-populated with:

| ID | Worker | Priority | Description |
|----|--------|----------|-------------|
| DIG-27 | Content Freshness Monitor | 1 | Flags stale program content |
| DIG-28 | Broken Resource Monitor | 2 | Detects broken downloads/links |
| MKT-04 | Campaign Analyst | 3 | Daily campaign_funnel analysis |
| MKT-05 | A/B Test Manager | 4 | Auto-pause losing variants |
| MKT-06 | Content Performance Tracker | 5 | Content engagement metrics |
| LEAD-09 | Lead Scoring Engine | 6 | Multi-factor lead scoring |
| LEAD-10 | Engagement Decay Monitor | 7 | Detect engagement drop-off |
| LEAD-11 | Re-engagement Trigger | 8 | Trigger re-engagement workflows |
| OPS-18 | Invoice Generator | 9 | Automated invoice creation |
| OPS-19 | Payment Reminder | 10 | Payment due reminders |
| OPS-20 | Group Discount Manager | 11 | Group registration discounts |

### Remaining Phases (in ROADMAP.md)

**Phase 3: Operations Workers**
- Certificate generators
- Attendance tracking
- Feedback collection
- Reporting automation

**Phase 4: Advanced Analytics**
- Predictive enrollment
- Revenue forecasting
- Churn prediction
- ROI calculations

**Phase 5: Integration Polish**
- Error handling improvements
- Monitoring dashboards
- Documentation
- Performance optimization

---

## Best Practices

### 1. Keep Stories Small and Focused

**Good:**
```json
{
  "id": "MKT-04",
  "title": "Campaign Analyst Worker",
  "description": "Single workflow doing one thing well"
}
```

**Bad:**
```json
{
  "id": "MKT-ALL",
  "title": "All Marketing Automation",
  "description": "Everything marketing-related"
}
```

### 2. Write Clear Acceptance Criteria

```json
"acceptance": [
  "Workflow triggers daily at 6 AM UTC",
  "Queries campaign_funnel view successfully",
  "Calculates engagement_rate and conversion_rate",
  "Stores results in campaign_metrics table",
  "Pattern stored in n8n-brain with services: ['supabase']"
]
```

### 3. Update AGENTS.md with Discoveries

When you learn something reusable:

```markdown
## Gotchas Discovered

- Supabase RLS doesn't apply to service role key
- GHL webhook needs X-API-Key header, not Bearer token
- n8n webhook URLs need /webhook/ prefix in production
```

### 4. Commit Progress Files

```bash
git add scripts/ralph/progress.txt scripts/ralph/prd.json .planning/STATE.md
git commit -m "chore: update progress tracking"
```

### 5. Review Progress Regularly

```bash
# Check what's done
jq '[.stories[] | select(.passes == true) | .title]' scripts/ralph/prd.json

# Check what's remaining
jq '[.stories[] | select(.passes != true) | .title]' scripts/ralph/prd.json

# Read learnings
cat scripts/ralph/progress.txt
```

### 6. Use n8n-brain Before Building

Always check for existing patterns:

```javascript
// Before building any workflow
find_similar_patterns({
  services: ["supabase"],
  node_types: ["scheduleTrigger", "postgres"]
})
```

### 7. Store Patterns After Success

```javascript
// After every successful deployment
store_pattern({
  name: "Worker-Name",
  description: "What it does",
  workflow_json: { /* full JSON */ },
  services: ["supabase", "ghl"],
  node_types: ["trigger", "postgres", "httpRequest"]
})
```

---

## Troubleshooting

### GSD Commands Not Working

**Symptom**: `/gsd:plan-phase` not recognized

**Fix**: GSD commands are part of the prompt pattern, not Claude Code commands. Just type them and Claude will respond. If issues persist, manually reference the files:

```
> Read .planning/ROADMAP.md and create a plan for Phase 2
```

### Ralph Loop Exits Early

**Symptom**: Loop stops before all stories complete

**Causes**:
1. Story failed quality checks - check progress.txt
2. Max iterations reached - increase MAX_ITERATIONS
3. prd.json syntax error - validate with `jq`

**Debug**:
```bash
# Validate JSON
jq . scripts/ralph/prd.json

# Check remaining stories
jq '[.stories[] | select(.passes != true)]' scripts/ralph/prd.json

# Check last progress entry
tail -50 scripts/ralph/progress.txt
```

### Context Seems Degraded

**Symptom**: Claude forgetting requirements, inconsistent output

**Fix**: You're in a long session. Use fresh context:

```
> /gsd:pause-work
# Exit and restart Claude
> /gsd:resume-work
```

### n8n-brain Returns Empty

**Symptom**: `find_similar_patterns` returns nothing

**Causes**:
1. No patterns stored yet - build first workflow manually
2. Service names don't match - use lowercase consistently
3. Database connection issue - check Supabase credentials

**Debug**:
```javascript
// List all patterns
list_patterns()

// List all credentials
list_credentials()
```

### Workflow Won't Deploy to n8n

**Symptom**: n8n rejects the workflow JSON

**Common Issues**:
1. Invalid JSON - validate with `jq`
2. Missing credentials - check n8n-brain mappings
3. Wrong node type - use full type like `n8n-nodes-base.postgres`
4. Version mismatch - check n8n version compatibility

---

## Summary

### What You Now Have

| Component | Purpose | Location |
|-----------|---------|----------|
| GSD Planning | Structured requirements and tracking | `.planning/` |
| Ralph Loop | Autonomous batch execution | `scripts/ralph/` |
| Pre-populated PRD | 11 Phase 2 workers ready to build | `scripts/ralph/prd.json` |
| AGENTS.md | Codebase patterns for AI | `scripts/ralph/AGENTS.md` |
| This Guide | Complete reference | `docs/BUILD-EFFICIENCY-COMPLETE-GUIDE.md` |

### Quick Reference

| Task | Command/Action |
|------|----------------|
| Check status | `/gsd:progress` |
| Plan work | `/gsd:plan-phase N` |
| Execute interactively | `/gsd:execute-phase N` |
| Execute autonomously | `./scripts/ralph/ralph.sh` |
| Pause session | `/gsd:pause-work` |
| Resume session | `/gsd:resume-work` |
| Check remaining | `jq '.stories[] | select(.passes != true)' prd.json` |

### The Efficiency Formula

```
Structured Planning (GSD)
    +
Autonomous Execution (Ralph)
    +
Learning Accumulation (n8n-brain)
    =
Exponentially Faster Development
```

Each worker you build:
1. Stores a pattern (n8n-brain)
2. Records learnings (progress.txt)
3. Increases future confidence
4. Makes the next worker faster

By the time you finish Phase 2, Phase 3 will build significantly faster because n8n-brain will have patterns for most scenarios.

---

## Next Steps

1. **Review this document** - Understand the tools and workflow
2. **Check `.planning/ROADMAP.md`** - See the full plan
3. **Review `scripts/ralph/prd.json`** - See your Phase 2 workers
4. **Choose your approach**:
   - GSD for interactive control
   - Ralph for autonomous batch work
5. **Start building!**

---

*Document created: 2026-01-17*
*Last updated: 2026-01-17*
