# GSD-Supabase Integration

Integration hooks for updating project status in Supabase and sending macOS notifications.

## Helper Script

Location: `scripts/gsd-supabase.sh`

## Commands

### Register Project

Called after `/gsd:new-project` creates roadmap:

```bash
./scripts/gsd-supabase.sh register "<project_key>" "<project_name>" "<project_path>"
```

Example:
```bash
./scripts/gsd-supabase.sh register "action-center" "Action Center" ".planning/projects/action-center"
```

### Update Status

Called when phase execution state changes:

```bash
./scripts/gsd-supabase.sh status "<project_key>" "<status>" "[description]"
```

Status values: `idle`, `executing`, `needs_input`, `blocked`, `complete`

Examples:
```bash
# Phase starting
./scripts/gsd-supabase.sh status "action-center" "executing" "Phase 5 executing"

# Phase complete
./scripts/gsd-supabase.sh status "action-center" "idle" "Phase 5 complete"

# Blocked
./scripts/gsd-supabase.sh status "action-center" "blocked" "Missing credential"
```

### Update Phase Progress

Called when phase changes:

```bash
./scripts/gsd-supabase.sh phase "<project_key>" <current_phase> <total_phases>
```

Example:
```bash
./scripts/gsd-supabase.sh phase "action-center" 5 12
```

### Add Decision

Called when checkpoint needs user input:

```bash
./scripts/gsd-supabase.sh decision "<project_key>" "<type>" "<question>"
```

Decision types: `checkpoint`, `blocker`, `clarification`, `architecture`

Example:
```bash
./scripts/gsd-supabase.sh decision "action-center" "checkpoint" "Should modal use slide-in or overlay animation?"
```

### Resolve Decisions

Called when user answers pending decisions:

```bash
./scripts/gsd-supabase.sh resolve-decisions "<project_key>"
```

### Send Notification

Called on phase complete or blocker:

```bash
./scripts/gsd-supabase.sh notify "<title>" "<message>" "[sound]"
```

Sound values (optional): `Ping`, `Basso`, `Glass`, `Hero`, `Pop`

Examples:
```bash
# Phase complete (no sound)
./scripts/gsd-supabase.sh notify "action-center" "Phase 5 complete. Ready for Phase 6."

# Needs input (Ping sound)
./scripts/gsd-supabase.sh notify "action-center" "Decision needed: API contract" "Ping"

# Blocked (Basso sound for attention)
./scripts/gsd-supabase.sh notify "action-center" "Blocked: Missing credential" "Basso"
```

## Integration Points

### new-project.md

After roadmap is created and committed (Phase 10), register the project:

```bash
# Extract project info
PROJECT_KEY=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
PROJECT_NAME=$(grep -m1 "^# " .planning/PROJECT.md | sed 's/^# //')
PROJECT_PATH=".planning"

# If sub-project, adjust path
if [ -f ".planning/projects/${PROJECT_KEY}/PROJECT.md" ]; then
  PROJECT_PATH=".planning/projects/${PROJECT_KEY}"
fi

# Register in Supabase
./scripts/gsd-supabase.sh register "$PROJECT_KEY" "$PROJECT_NAME" "$PROJECT_PATH"
```

### execute-phase.md

**On phase start (after validate_phase step):**
```bash
./scripts/gsd-supabase.sh status "$PROJECT_KEY" "executing" "Executing Phase $PHASE_NUM"
./scripts/gsd-supabase.sh phase "$PROJECT_KEY" $PHASE_NUM $TOTAL_PHASES
```

**On checkpoint (in checkpoint_handling):**
```bash
./scripts/gsd-supabase.sh decision "$PROJECT_KEY" "checkpoint" "$CHECKPOINT_QUESTION"
./scripts/gsd-supabase.sh status "$PROJECT_KEY" "needs_input" "Checkpoint in Phase $PHASE_NUM"
./scripts/gsd-supabase.sh notify "$PROJECT_KEY" "Decision needed: $CHECKPOINT_TITLE" "Ping"
```

**On phase complete (after verification passes):**
```bash
./scripts/gsd-supabase.sh status "$PROJECT_KEY" "idle" "Phase $PHASE_NUM complete"
./scripts/gsd-supabase.sh notify "$PROJECT_KEY" "Phase $PHASE_NUM complete. Ready for Phase $((PHASE_NUM+1))."
```

**On blocker:**
```bash
./scripts/gsd-supabase.sh status "$PROJECT_KEY" "blocked" "$BLOCKER_REASON"
./scripts/gsd-supabase.sh notify "$PROJECT_KEY" "Blocked: $BLOCKER_REASON" "Basso"
```

## Extracting Project Key

The `--project` flag or auto-detection:

```bash
# From --project flag
PROJECT_KEY=$(echo "$ARGUMENTS" | grep -oE '\-\-project[[:space:]]+[a-z0-9-]+' | cut -d' ' -f2)

# Auto-detect from directory
if [ -z "$PROJECT_KEY" ]; then
  if [ -f ".planning/PROJECT.md" ] && [ ! -d ".planning/projects" ]; then
    # Root project
    PROJECT_KEY=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  else
    # Look for active sub-project from STATE.md
    PROJECT_KEY=$(grep -l "executing\|in progress" .planning/projects/*/STATE.md 2>/dev/null | head -1 | xargs dirname | xargs basename)
  fi
fi
```

## Silent Failures

The helper script is designed to fail silently if:
- Supabase environment variables not set
- Network issues
- Project doesn't exist in database

This ensures GSD continues working even without dashboard integration.
