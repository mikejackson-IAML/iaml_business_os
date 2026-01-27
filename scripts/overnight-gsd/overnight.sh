#!/bin/bash
#
# Overnight GSD - Autonomous overnight execution for GSD phases and n8n workflow testing
#
# Usage:
#   ./overnight.sh                        # Run with defaults from config.json
#   ./overnight.sh --phases 12,13         # Run specific phases
#   ./overnight.sh --project action-center # Run a subproject
#   ./overnight.sh --n8n-only             # Only test n8n workflows
#   ./overnight.sh --gsd-only             # Only run GSD phases
#   ./overnight.sh --dry-run              # Show what would run without executing
#
# Outputs:
#   .overnight/progress.log           # Iteration-by-iteration log
#   .overnight/morning-summary.md     # Human-readable summary
#   .overnight/cost-report.json       # Cost tracking
#   .overnight/blockers.md            # Issues requiring human attention

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
OUTPUT_DIR="$PROJECT_ROOT/.overnight"
PROMPTS_DIR="$SCRIPT_DIR/prompts"

# Default planning directory (can be overridden with --project)
PLANNING_DIR="$PROJECT_ROOT/.planning"
PROJECT_NAME="main"

# Source helper libraries
source "$SCRIPT_DIR/lib/slack.sh"
source "$SCRIPT_DIR/lib/cost.sh"
source "$SCRIPT_DIR/lib/parser.sh"
source "$SCRIPT_DIR/lib/summary.sh"

# ============================================
# Configuration
# ============================================

load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo "Error: Config file not found at $CONFIG_FILE"
        exit 1
    fi

    # Load config values
    SLACK_WEBHOOK=$(jq -r '.slack.webhook_url // ""' "$CONFIG_FILE")
    SLACK_CHANNEL=$(jq -r '.slack.channel // "#automation"' "$CONFIG_FILE")
    MAX_COST_USD=$(jq -r '.limits.max_cost_usd // 25' "$CONFIG_FILE")
    MAX_ITERATIONS=$(jq -r '.limits.max_iterations // 50' "$CONFIG_FILE")
    MAX_CONSECUTIVE_FAILURES=$(jq -r '.limits.max_consecutive_failures // 3' "$CONFIG_FILE")
    SLEEP_BETWEEN_ITERATIONS=$(jq -r '.timing.sleep_between_iterations_sec // 10' "$CONFIG_FILE")
    STOP_ON_BLOCKER=$(jq -r '.behavior.stop_on_blocker // true' "$CONFIG_FILE")
    STOP_ON_VERIFICATION_FAIL=$(jq -r '.behavior.stop_on_verification_fail // true' "$CONFIG_FILE")
    RUN_GSD=$(jq -r '.modes.run_gsd // true' "$CONFIG_FILE")
    RUN_N8N=$(jq -r '.modes.run_n8n // true' "$CONFIG_FILE")
    TARGET_PHASES=$(jq -r '.gsd.target_phases // []' "$CONFIG_FILE")
    N8N_MAX_WORKFLOWS=$(jq -r '.n8n.max_workflows_per_night // 10' "$CONFIG_FILE")
    MODEL=$(jq -r '.model // "sonnet"' "$CONFIG_FILE")
}

# ============================================
# Initialization
# ============================================

init_run() {
    # Create output directory
    mkdir -p "$OUTPUT_DIR/iterations"

    # Initialize run state
    RUN_ID=$(date +%Y%m%d_%H%M%S)
    START_TIME=$(date +%s)
    ITERATION=0
    TOTAL_COST=0
    CONSECUTIVE_FAILURES=0
    PLANS_COMPLETED=0
    PHASES_COMPLETED=0
    N8N_WORKFLOWS_TESTED=0
    BLOCKERS=()
    COMPLETED_ITEMS=()

    # Initialize log files
    echo "# Overnight GSD Run: $RUN_ID" > "$OUTPUT_DIR/progress.log"
    echo "Started: $(date)" >> "$OUTPUT_DIR/progress.log"
    echo "" >> "$OUTPUT_DIR/progress.log"

    echo "[]" > "$OUTPUT_DIR/cost-report.json"
    echo "" > "$OUTPUT_DIR/blockers.md"

    log "Overnight GSD initialized"
    log "Project: $PROJECT_NAME"
    log "Planning dir: $PLANNING_DIR"
    log "Config: max_cost=\$$MAX_COST_USD, max_iterations=$MAX_ITERATIONS, model=$MODEL"
}

# ============================================
# Logging
# ============================================

log() {
    local msg="[$(date '+%H:%M:%S')] $1"
    echo "$msg"
    echo "$msg" >> "$OUTPUT_DIR/progress.log"
}

log_iteration() {
    local iteration_file="$OUTPUT_DIR/iterations/${RUN_ID}_iter_${ITERATION}.log"
    echo "$1" >> "$iteration_file"
}

# ============================================
# GSD Execution
# ============================================

get_current_gsd_state() {
    # Extract current phase and plan from STATE.md and ROADMAP.md
    local state_file="$PLANNING_DIR/STATE.md"
    local roadmap_file="$PLANNING_DIR/ROADMAP.md"

    if [[ ! -f "$state_file" ]]; then
        echo "NO_STATE"
        return
    fi

    # Parse current phase from STATE.md
    local current_phase=$(grep -E "^## Current Phase" "$state_file" -A 5 | grep -oE "Phase [0-9]+" | head -1 | grep -oE "[0-9]+")

    if [[ -z "$current_phase" ]]; then
        # Try to get from ROADMAP.md - find first incomplete phase
        current_phase=$(grep -E "^\| [0-9]+ \|" "$roadmap_file" | grep -v "Complete" | head -1 | awk -F'|' '{print $2}' | tr -d ' ')
    fi

    # If still no phase found, look for incomplete plans
    if [[ -z "$current_phase" ]]; then
        # Find first phase directory with incomplete plans
        for phase_dir in "$PLANNING_DIR/phases/"*/; do
            if [[ -d "$phase_dir" ]]; then
                local phase_num=$(basename "$phase_dir" | grep -oE "^[0-9]+")
                # Check if any plan lacks a summary (incomplete)
                local has_incomplete=$(find "$phase_dir" -name "*-PLAN.md" | while read plan; do
                    local summary="${plan/-PLAN.md/-SUMMARY.md}"
                    if [[ ! -f "$summary" ]]; then
                        echo "yes"
                        break
                    fi
                done)
                if [[ "$has_incomplete" == "yes" ]]; then
                    current_phase="$phase_num"
                    break
                fi
            fi
        done
    fi

    echo "${current_phase:-UNKNOWN}"
}

run_gsd_iteration() {
    local phase=$1
    local iteration_file="$OUTPUT_DIR/iterations/${RUN_ID}_iter_${ITERATION}.log"

    log "GSD Iteration $ITERATION: Executing Phase $phase"

    # Build context prompt
    local context=$(cat "$PROMPTS_DIR/gsd-context.md")
    context="${context//\{PHASE\}/$phase}"

    # Inject STATE.md summary (last 50 lines of decisions)
    local state_summary=""
    if [[ -f "$PLANNING_DIR/STATE.md" ]]; then
        state_summary=$(tail -100 "$PLANNING_DIR/STATE.md" | head -50)
    fi
    context="${context//\{STATE_SUMMARY\}/$state_summary}"

    # Inject project context
    local project_context=""
    if [[ "$PROJECT_NAME" != "main" ]]; then
        project_context="This is the **$PROJECT_NAME** subproject located at .planning/projects/$PROJECT_NAME/"
    fi
    context="${context//\{PROJECT_CONTEXT\}/$project_context}"

    # Run Claude with fresh context
    local start_time=$(date +%s)
    local output

    output=$(cd "$PROJECT_ROOT" && claude --print --model "$MODEL" \
        --prompt "$context

Now execute: /gsd:execute-phase $phase --continue

Remember to output status markers:
- PLAN_COMPLETE: {plan_id} when a plan finishes
- PHASE_COMPLETE: {phase} when all plans in phase done
- BLOCKER: {description} if you hit something requiring human input
- VERIFICATION_FAILED: {details} if verification doesn't pass" 2>&1) || true

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Log full output
    echo "$output" > "$iteration_file"

    # Estimate cost for this iteration
    local estimated_cost=$(estimate_iteration_cost "$output" "$MODEL")
    TOTAL_COST=$(echo "$TOTAL_COST + $estimated_cost" | bc)

    log "  Duration: ${duration}s, Estimated cost: \$${estimated_cost}, Total: \$${TOTAL_COST}"

    # Update cost report
    update_cost_report "$ITERATION" "$estimated_cost" "$duration" "gsd" "$phase"

    # Parse output for status
    local status=$(parse_gsd_output "$output")

    case "$status" in
        PLAN_COMPLETE:*)
            local plan_id="${status#PLAN_COMPLETE:}"
            log "  Plan completed: $plan_id"
            COMPLETED_ITEMS+=("GSD Plan: $plan_id")
            PLANS_COMPLETED=$((PLANS_COMPLETED + 1))
            CONSECUTIVE_FAILURES=0
            return 0
            ;;
        PHASE_COMPLETE:*)
            local completed_phase="${status#PHASE_COMPLETE:}"
            log "  Phase $completed_phase completed!"
            COMPLETED_ITEMS+=("GSD Phase $completed_phase")
            PHASES_COMPLETED=$((PHASES_COMPLETED + 1))
            CONSECUTIVE_FAILURES=0
            return 1  # Signal to move to next phase
            ;;
        BLOCKER:*)
            local blocker="${status#BLOCKER:}"
            log "  BLOCKER: $blocker"
            BLOCKERS+=("GSD Phase $phase: $blocker")
            echo "## GSD Phase $phase Blocker" >> "$OUTPUT_DIR/blockers.md"
            echo "" >> "$OUTPUT_DIR/blockers.md"
            echo "$blocker" >> "$OUTPUT_DIR/blockers.md"
            echo "" >> "$OUTPUT_DIR/blockers.md"
            if [[ "$STOP_ON_BLOCKER" == "true" ]]; then
                return 2  # Signal to stop
            fi
            return 0
            ;;
        VERIFICATION_FAILED:*)
            local details="${status#VERIFICATION_FAILED:}"
            log "  VERIFICATION FAILED: $details"
            BLOCKERS+=("Verification failed in Phase $phase: $details")
            CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
            if [[ "$STOP_ON_VERIFICATION_FAIL" == "true" ]]; then
                return 2
            fi
            return 0
            ;;
        ERROR:*)
            local error="${status#ERROR:}"
            log "  ERROR: $error"
            CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
            return 0
            ;;
        *)
            log "  Status unclear, continuing..."
            return 0
            ;;
    esac
}

run_gsd_phases() {
    log "=== Starting GSD Phase Execution ==="

    # Get target phases
    local phases=()
    if [[ -n "$CLI_PHASES" ]]; then
        IFS=',' read -ra phases <<< "$CLI_PHASES"
    elif [[ "$TARGET_PHASES" != "[]" ]]; then
        phases=($(echo "$TARGET_PHASES" | jq -r '.[]'))
    else
        # Auto-detect current phase
        local current=$(get_current_gsd_state)
        if [[ "$current" != "NO_STATE" && "$current" != "UNKNOWN" ]]; then
            phases=("$current")
        else
            log "No GSD phases configured or detected"
            return
        fi
    fi

    log "Target phases: ${phases[*]}"

    local phase_idx=0
    while [[ $phase_idx -lt ${#phases[@]} ]]; do
        local current_phase=${phases[$phase_idx]}

        # Check limits before each iteration
        if ! check_limits; then
            log "Limits reached, stopping GSD execution"
            return
        fi

        ITERATION=$((ITERATION + 1))
        run_gsd_iteration "$current_phase"
        local result=$?

        case $result in
            0) # Continue with same phase
                sleep "$SLEEP_BETWEEN_ITERATIONS"
                ;;
            1) # Phase complete, move to next
                phase_idx=$((phase_idx + 1))
                sleep "$SLEEP_BETWEEN_ITERATIONS"
                ;;
            2) # Stop requested
                log "Stop requested, ending GSD execution"
                return
                ;;
        esac

        # Check consecutive failures
        if [[ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]]; then
            log "Too many consecutive failures ($CONSECUTIVE_FAILURES), stopping"
            BLOCKERS+=("Stopped after $MAX_CONSECUTIVE_FAILURES consecutive failures")
            return
        fi
    done

    log "=== GSD Phase Execution Complete ==="
}

# ============================================
# n8n Workflow Testing
# ============================================

get_workflows_needing_testing() {
    # Query Supabase for workflows needing attention
    # This uses the n8n-brain schema
    cd "$PROJECT_ROOT"

    local output
    output=$(claude --print --model haiku \
        --prompt "Query the n8n_brain.workflows_needing_attention view to get up to $N8N_MAX_WORKFLOWS workflows that need testing. Return ONLY a JSON array of objects with workflow_id and workflow_name fields. No explanation, just the JSON array." 2>&1) || true

    # Extract JSON array from output
    echo "$output" | grep -oE '\[.*\]' | head -1 || echo "[]"
}

run_n8n_iteration() {
    local workflow_id=$1
    local workflow_name=$2
    local iteration_file="$OUTPUT_DIR/iterations/${RUN_ID}_iter_${ITERATION}.log"

    log "n8n Iteration $ITERATION: Testing workflow '$workflow_name' ($workflow_id)"

    # Build context prompt
    local context=$(cat "$PROMPTS_DIR/n8n-context.md")
    context="${context//\{WORKFLOW_ID\}/$workflow_id}"
    context="${context//\{WORKFLOW_NAME\}/$workflow_name}"

    # Run Claude with fresh context
    local start_time=$(date +%s)
    local output

    output=$(cd "$PROJECT_ROOT" && claude --print --model "$MODEL" \
        --prompt "$context

Test the workflow '$workflow_name' (ID: $workflow_id).

Use the n8n-brain MCP tools:
1. First check for similar patterns with find_similar_patterns
2. Get credentials needed with get_credential
3. If you encounter errors, use lookup_error_fix
4. After successful test, use update_pattern_success if a pattern was used
5. Store any new error->fix mappings with store_error_fix

Output status markers:
- WORKFLOW_TESTED: {workflow_id} - Test passed
- WORKFLOW_FIXED: {workflow_id} - Found and fixed an issue
- BLOCKER: {description} - Need human help
- TEST_FAILED: {details} - Test failed, couldn't auto-fix" 2>&1) || true

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Log full output
    echo "$output" > "$iteration_file"

    # Estimate cost
    local estimated_cost=$(estimate_iteration_cost "$output" "$MODEL")
    TOTAL_COST=$(echo "$TOTAL_COST + $estimated_cost" | bc)

    log "  Duration: ${duration}s, Estimated cost: \$${estimated_cost}, Total: \$${TOTAL_COST}"

    # Update cost report
    update_cost_report "$ITERATION" "$estimated_cost" "$duration" "n8n" "$workflow_id"

    # Parse output for status
    local status=$(parse_n8n_output "$output")

    case "$status" in
        WORKFLOW_TESTED:*|WORKFLOW_FIXED:*)
            local wf_id="${status#*:}"
            log "  Workflow tested successfully: $wf_id"
            COMPLETED_ITEMS+=("n8n Workflow: $workflow_name")
            N8N_WORKFLOWS_TESTED=$((N8N_WORKFLOWS_TESTED + 1))
            CONSECUTIVE_FAILURES=0
            return 0
            ;;
        BLOCKER:*)
            local blocker="${status#BLOCKER:}"
            log "  BLOCKER: $blocker"
            BLOCKERS+=("n8n $workflow_name: $blocker")
            echo "## n8n Workflow: $workflow_name" >> "$OUTPUT_DIR/blockers.md"
            echo "" >> "$OUTPUT_DIR/blockers.md"
            echo "$blocker" >> "$OUTPUT_DIR/blockers.md"
            echo "" >> "$OUTPUT_DIR/blockers.md"
            if [[ "$STOP_ON_BLOCKER" == "true" ]]; then
                return 2
            fi
            CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
            return 0
            ;;
        TEST_FAILED:*)
            local details="${status#TEST_FAILED:}"
            log "  TEST FAILED: $details"
            CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
            return 0
            ;;
        *)
            log "  Status unclear, marking as attempted"
            return 0
            ;;
    esac
}

run_n8n_testing() {
    log "=== Starting n8n Workflow Testing ==="

    # Get workflows that need testing
    log "Querying workflows needing attention..."
    local workflows_json=$(get_workflows_needing_testing)

    if [[ "$workflows_json" == "[]" || -z "$workflows_json" ]]; then
        log "No workflows need testing"
        return
    fi

    local workflow_count=$(echo "$workflows_json" | jq 'length')
    log "Found $workflow_count workflows to test"

    local idx=0
    while [[ $idx -lt $workflow_count ]]; do
        # Check limits before each iteration
        if ! check_limits; then
            log "Limits reached, stopping n8n testing"
            return
        fi

        local workflow_id=$(echo "$workflows_json" | jq -r ".[$idx].workflow_id")
        local workflow_name=$(echo "$workflows_json" | jq -r ".[$idx].workflow_name")

        ITERATION=$((ITERATION + 1))
        run_n8n_iteration "$workflow_id" "$workflow_name"
        local result=$?

        if [[ $result -eq 2 ]]; then
            log "Stop requested, ending n8n testing"
            return
        fi

        idx=$((idx + 1))

        # Check consecutive failures
        if [[ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]]; then
            log "Too many consecutive failures ($CONSECUTIVE_FAILURES), stopping"
            BLOCKERS+=("Stopped after $MAX_CONSECUTIVE_FAILURES consecutive failures in n8n testing")
            return
        fi

        sleep "$SLEEP_BETWEEN_ITERATIONS"
    done

    log "=== n8n Workflow Testing Complete ==="
}

# ============================================
# Limit Checking
# ============================================

check_limits() {
    # Check cost limit
    if (( $(echo "$TOTAL_COST >= $MAX_COST_USD" | bc -l) )); then
        log "Cost limit reached: \$${TOTAL_COST} >= \$${MAX_COST_USD}"
        BLOCKERS+=("Cost limit reached: \$${TOTAL_COST}")
        return 1
    fi

    # Check iteration limit
    if [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
        log "Iteration limit reached: $ITERATION >= $MAX_ITERATIONS"
        BLOCKERS+=("Iteration limit reached: $ITERATION")
        return 1
    fi

    return 0
}

# ============================================
# Main Execution
# ============================================

parse_args() {
    CLI_PHASES=""
    CLI_PROJECT=""
    DRY_RUN=false
    GSD_ONLY=false
    N8N_ONLY=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --phases)
                CLI_PHASES="$2"
                shift 2
                ;;
            --project)
                CLI_PROJECT="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --gsd-only)
                GSD_ONLY=true
                shift
                ;;
            --n8n-only)
                N8N_ONLY=true
                shift
                ;;
            --help|-h)
                echo "Overnight GSD - Autonomous overnight execution"
                echo ""
                echo "Usage: ./overnight.sh [options]"
                echo ""
                echo "Options:"
                echo "  --phases 12,13         Run specific GSD phases"
                echo "  --project <name>       Run a subproject (e.g., 'action-center')"
                echo "  --gsd-only             Only run GSD phases (no n8n testing)"
                echo "  --n8n-only             Only run n8n workflow testing"
                echo "  --dry-run              Show what would run without executing"
                echo "  --help                 Show this help"
                echo ""
                echo "Examples:"
                echo "  ./overnight.sh --phases 12,13"
                echo "  ./overnight.sh --project action-center --phases 3,4"
                echo "  ./overnight.sh --n8n-only"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Apply CLI overrides
    if [[ "$GSD_ONLY" == "true" ]]; then
        RUN_N8N=false
    fi
    if [[ "$N8N_ONLY" == "true" ]]; then
        RUN_GSD=false
    fi

    # Set project path
    if [[ -n "$CLI_PROJECT" ]]; then
        PLANNING_DIR="$PROJECT_ROOT/.planning/projects/$CLI_PROJECT"
        PROJECT_NAME="$CLI_PROJECT"
        if [[ ! -d "$PLANNING_DIR" ]]; then
            echo "Error: Project '$CLI_PROJECT' not found at $PLANNING_DIR"
            echo ""
            echo "Available projects:"
            ls -1 "$PROJECT_ROOT/.planning/projects/" 2>/dev/null || echo "  (none)"
            exit 1
        fi
    fi
}

main() {
    echo "======================================"
    echo "  Overnight GSD - Starting"
    echo "======================================"
    echo ""

    # Load configuration
    load_config

    # Parse command line arguments
    parse_args "$@"

    # Dry run mode
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "DRY RUN MODE - No execution will occur"
        echo ""
        echo "Configuration:"
        echo "  Project: $PROJECT_NAME"
        echo "  Planning dir: $PLANNING_DIR"
        echo "  Max cost: \$$MAX_COST_USD"
        echo "  Max iterations: $MAX_ITERATIONS"
        echo "  Model: $MODEL"
        echo "  Run GSD: $RUN_GSD"
        echo "  Run n8n: $RUN_N8N"
        if [[ -n "$CLI_PHASES" ]]; then
            echo "  Target phases: $CLI_PHASES"
        else
            local detected=$(get_current_gsd_state)
            echo "  Target phases: auto-detect (current: $detected)"
        fi
        echo ""
        echo "Would execute overnight run with above settings."
        exit 0
    fi

    # Initialize run
    init_run

    # Send start notification
    send_slack_notification "start" "Overnight GSD run started" \
        "Project: $PROJECT_NAME\nRun ID: $RUN_ID\nMax cost: \$$MAX_COST_USD\nGSD: $RUN_GSD\nn8n: $RUN_N8N"

    # Run GSD phases
    if [[ "$RUN_GSD" == "true" ]]; then
        run_gsd_phases
    fi

    # Run n8n testing
    if [[ "$RUN_N8N" == "true" ]]; then
        run_n8n_testing
    fi

    # Generate morning summary
    generate_morning_summary

    # Calculate run duration
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))

    # Send completion notification
    local status_emoji="✅"
    local status_text="completed successfully"
    if [[ ${#BLOCKERS[@]} -gt 0 ]]; then
        status_emoji="⚠️"
        status_text="stopped with blockers"
    fi

    send_slack_notification "complete" "$status_emoji Overnight GSD $status_text" \
        "Duration: ${hours}h ${minutes}m
Cost: \$${TOTAL_COST}
Iterations: $ITERATION
Plans completed: $PLANS_COMPLETED
Phases completed: $PHASES_COMPLETED
n8n workflows tested: $N8N_WORKFLOWS_TESTED
Blockers: ${#BLOCKERS[@]}

See .overnight/morning-summary.md for details"

    log ""
    log "======================================"
    log "  Overnight GSD - Complete"
    log "======================================"
    log "Duration: ${hours}h ${minutes}m"
    log "Total cost: \$${TOTAL_COST}"
    log "Iterations: $ITERATION"
    log "Plans completed: $PLANS_COMPLETED"
    log "Phases completed: $PHASES_COMPLETED"
    log "n8n workflows tested: $N8N_WORKFLOWS_TESTED"
    log "Blockers: ${#BLOCKERS[@]}"
    log ""
    log "See $OUTPUT_DIR/morning-summary.md for full summary"
}

main "$@"
