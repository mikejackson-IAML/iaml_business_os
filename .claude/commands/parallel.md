---
name: parallel
description: Show status table of all GSD projects and ready-to-run commands
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

<objective>
Quick terminal access to all GSD project statuses and ready-to-run commands.

| Command | Purpose |
|---------|---------|
| `/parallel` | Show status table + next commands to run |
| `/parallel status` | Just the status table |
| `/parallel commands` | Show all ready-to-run commands to copy |
</objective>

<process>

## Step 1: Detect Projects

Find all GSD projects by scanning for STATE.md files:

```bash
find . -name "STATE.md" -path "*/.planning/*" 2>/dev/null | grep -v node_modules
```

Also check for the root project:
```bash
test -f .planning/STATE.md && echo ".planning/STATE.md"
```

Extract project directories from paths:
- `.planning/STATE.md` → root project
- `.planning/projects/*/STATE.md` → sub-projects

## Step 2: Load Each Project

For each project found, read:
1. `STATE.md` for current status
2. `ROADMAP.md` for phase info
3. `PROJECT.md` for project name

Extract:
- **Project key**: folder name or "root"
- **Project name**: from PROJECT.md title
- **Current phase**: from STATE.md
- **Total phases**: from ROADMAP.md
- **Status**: derive from STATE.md content

## Step 3: Derive Status

Parse STATE.md to determine status:

| STATE.md Content | Status |
|-----------------|--------|
| Contains "blocked" or "BLOCKED" | `Blocked` |
| Contains "needs input" or "decision" | `Needs Input` |
| Contains "executing" or "in progress" | `Executing` |
| Contains "Phase X complete" and more phases remain | `Ready` |
| All phases complete | `Complete` |
| Default | `Idle` |

## Step 4: Generate Commands

For each project, generate the appropriate command:

| Status | Command |
|--------|---------|
| Ready | `/gsd:execute-phase N --project [key]` |
| Idle (with planned phase) | `/gsd:execute-phase N --project [key]` |
| Idle (needs planning) | `/gsd:plan-phase N --project [key]` |
| Needs Input | `/gsd:discuss-phase N --project [key]` |
| Blocked | Show blocker info, no command |
| Executing | `(running)` |
| Complete | `(done)` |

## Step 5: Display Output

### Default (`/parallel`) - Status + Commands

```
DEVELOPMENT PROJECTS
┌────────────────┬───────────┬─────────────┬────────────────────────────────────────┐
│ Project        │ Phase     │ Status      │ Command                                │
├────────────────┼───────────┼─────────────┼────────────────────────────────────────┤
│ action-center  │ 5/12      │ Ready       │ /gsd:execute-phase 5 --project ac      │
│ ios-app        │ 12/13     │ Executing   │ (running)                              │
│ web-intel      │ 3/8       │ Needs Input │ /gsd:discuss-phase 3 --project wi      │
└────────────────┴───────────┴─────────────┴────────────────────────────────────────┘

Ready to launch: 1 project
```

### Status Only (`/parallel status`)

Same table without the Command column.

### Commands Only (`/parallel commands`)

```
READY TO RUN

# action-center (Phase 5/12)
/gsd:execute-phase 5 --project action-center

# web-intel (Phase 3/8) - needs discussion first
/gsd:discuss-phase 3 --project web-intel

───────────────────────────────────────────────────────
Copy and paste into the appropriate project terminal.
```

## Step 6: Handle Args

Parse argument from skill invocation:
- No arg or `""` → show full table with commands
- `status` → show table without commands
- `commands` → show just the ready commands

</process>

<output>
A formatted table showing all GSD projects with their status and suggested commands.

Projects are sorted by priority:
1. Needs Input (requires attention)
2. Blocked (requires attention)
3. Ready (can be launched)
4. Executing (in progress)
5. Complete (done)
</output>

<no_projects>
If no projects found:

```
No GSD projects found.

Run /gsd:new-project to create your first project.
```
</no_projects>

<examples>

**Example output with 3 projects:**

```
DEVELOPMENT PROJECTS
┌────────────────┬───────────┬─────────────┬────────────────────────────────────────┐
│ Project        │ Phase     │ Status      │ Command                                │
├────────────────┼───────────┼─────────────┼────────────────────────────────────────┤
│ action-center  │ 5/12      │ Ready       │ /gsd:execute-phase 5 --project ac      │
│ ios-app        │ 12/13     │ Executing   │ (running)                              │
│ dev-dashboard  │ 1/7       │ Ready       │ /gsd:execute-phase 1 --project dd      │
└────────────────┴───────────┴─────────────┴────────────────────────────────────────┘

Ready to launch: 2 projects
```

**Example with commands only:**

```
READY TO RUN

# action-center (Phase 5/12)
cd ~/Projects/action-center
/gsd:execute-phase 5

# dev-dashboard (Phase 1/7)
cd ~/Projects/dev-dashboard
/gsd:execute-phase 1

───────────────────────────────────────────────────────
Copy and paste into the appropriate project terminal.
```

</examples>
