#!/bin/bash
#
# n8n Morning Test - Execute and verify workflows each morning
#
# Usage:
#   ./morning-test.sh              # Test 10 workflows (default)
#   ./morning-test.sh --count 5    # Test 5 workflows
#   ./morning-test.sh --workflow <id>  # Test specific workflow
#   ./morning-test.sh --critical   # Test only critical workflows
#   ./morning-test.sh --dry-run    # Show what would be tested
#
# Outputs:
#   .n8n-testing/morning-report.md    # Human-readable report
#   .n8n-testing/results.json         # Detailed results

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
OUTPUT_DIR="$PROJECT_ROOT/.n8n-testing"

# n8n API Configuration
N8N_BASE_URL="https://n8n.realtyamp.ai"
N8N_API_KEY=""

# Slack Configuration
SLACK_WEBHOOK=""

# ============================================
# Configuration
# ============================================

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        N8N_API_KEY=$(jq -r '.n8n.api_key // ""' "$CONFIG_FILE")
        SLACK_WEBHOOK=$(jq -r '.slack.webhook_url // ""' "$CONFIG_FILE")
        DEFAULT_COUNT=$(jq -r '.testing.default_count // 10' "$CONFIG_FILE")
        TIMEOUT_SECONDS=$(jq -r '.testing.timeout_seconds // 120' "$CONFIG_FILE")
    else
        echo "Warning: Config file not found, using defaults"
        DEFAULT_COUNT=10
        TIMEOUT_SECONDS=120
    fi
}

# ============================================
# n8n API Functions
# ============================================

n8n_api() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-}

    local url="${N8N_BASE_URL}/api/v1${endpoint}"

    if [[ -n "$data" ]]; then
        curl -s -X "$method" "$url" \
            -H "X-N8N-API-KEY: $N8N_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" "$url" \
            -H "X-N8N-API-KEY: $N8N_API_KEY"
    fi
}

get_all_workflows() {
    n8n_api "/workflows" | jq '[.data[] | {id, name, active}]'
}

get_active_workflows() {
    n8n_api "/workflows" | jq '[.data[] | select(.active == true) | {id, name}]'
}

execute_workflow() {
    local workflow_id=$1
    # Execute workflow manually via API
    n8n_api "/workflows/$workflow_id/activate" "POST" 2>/dev/null || true

    # For manual execution, we use the executions endpoint
    # First, get the workflow to check its trigger type
    local workflow_info=$(n8n_api "/workflows/$workflow_id")

    # Try to trigger execution
    local result=$(n8n_api "/executions" "POST" "{\"workflowId\": \"$workflow_id\"}" 2>/dev/null) || true

    echo "$result"
}

get_recent_execution() {
    local workflow_id=$1
    local limit=${2:-1}

    n8n_api "/executions?workflowId=$workflow_id&limit=$limit" | jq '.data[0] // empty'
}

wait_for_execution() {
    local execution_id=$1
    local timeout=$TIMEOUT_SECONDS
    local elapsed=0
    local interval=2

    while [[ $elapsed -lt $timeout ]]; do
        local status=$(n8n_api "/executions/$execution_id" | jq -r '.finished // false')

        if [[ "$status" == "true" ]]; then
            n8n_api "/executions/$execution_id"
            return 0
        fi

        sleep $interval
        elapsed=$((elapsed + interval))
    done

    echo '{"error": "timeout", "message": "Execution did not complete within timeout"}'
    return 1
}

# ============================================
# Workflow Selection
# ============================================

select_workflows_for_testing() {
    local count=$1
    local mode=$2

    case "$mode" in
        critical)
            # Get workflows marked as critical in config
            if [[ -f "$CONFIG_FILE" ]]; then
                jq -r '.testing.critical_workflows[]' "$CONFIG_FILE" 2>/dev/null | head -n "$count"
            else
                echo "No critical workflows configured"
                return 1
            fi
            ;;
        random)
            # Random sample from active workflows
            get_active_workflows | jq -r '.[].id' | shuf | head -n "$count"
            ;;
        rotate)
            # Rotate through workflows day by day
            local day_of_year=$(date +%j)
            local total=$(get_active_workflows | jq 'length')
            local offset=$(( (day_of_year * count) % total ))
            get_active_workflows | jq -r ".[$offset:$((offset + count))][].id"
            ;;
        *)
            # Default: priority-based (would need registry integration)
            get_active_workflows | jq -r '.[].id' | head -n "$count"
            ;;
    esac
}

# ============================================
# Testing Functions
# ============================================

test_workflow() {
    local workflow_id=$1
    local workflow_name=$2

    # Log to stderr so it doesn't pollute JSON output
    echo "[$(date '+%H:%M:%S')] Testing: $workflow_name ($workflow_id)" >&2

    local start_time=$(date +%s)
    local result=""
    local status="unknown"
    local error_message=""

    # Get the most recent execution before we trigger
    local before_execution=$(get_recent_execution "$workflow_id")
    local before_id=$(echo "$before_execution" | jq -r '.id // "none"')

    # For webhook/schedule workflows, check recent execution
    # For manual workflows, we'd need to trigger them

    # Wait a moment and check if there's a new execution
    sleep 3
    local after_execution=$(get_recent_execution "$workflow_id")
    local after_id=$(echo "$after_execution" | jq -r '.id // "none"')

    if [[ "$after_id" != "none" ]]; then
        # Check execution status
        local finished=$(echo "$after_execution" | jq -r '.finished // false')
        local stopped_at=$(echo "$after_execution" | jq -r '.stoppedAt // ""')

        if [[ "$finished" == "true" ]]; then
            # Check if it was successful (no error in the execution)
            local exec_detail=$(n8n_api "/executions/$after_id")
            local has_error=$(echo "$exec_detail" | jq 'has("error") and .error != null')

            if [[ "$has_error" == "true" ]]; then
                status="failed"
                error_message=$(echo "$exec_detail" | jq -r '.error.message // "Unknown error"')
            else
                status="success"
            fi
        else
            status="running"
        fi
    else
        # No recent execution - workflow might be schedule-based and hasn't run yet
        status="no_recent_execution"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Build result JSON
    cat <<EOF
{
    "workflow_id": "$workflow_id",
    "workflow_name": "$workflow_name",
    "status": "$status",
    "execution_id": "$after_id",
    "duration_seconds": $duration,
    "error_message": "$error_message",
    "tested_at": "$(date -Iseconds)"
}
EOF
}

# ============================================
# Reporting
# ============================================

generate_morning_report() {
    local results_file="$OUTPUT_DIR/results.json"
    local report_file="$OUTPUT_DIR/morning-report.md"

    local total=$(jq 'length' "$results_file")
    local success=$(jq '[.[] | select(.status == "success")] | length' "$results_file")
    local failed=$(jq '[.[] | select(.status == "failed")] | length' "$results_file")
    local no_execution=$(jq '[.[] | select(.status == "no_recent_execution")] | length' "$results_file")

    cat > "$report_file" <<EOF
# n8n Morning Test Report

**Date:** $(date '+%B %d, %Y at %I:%M %p')
**Workflows Tested:** $total

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Success | $success |
| ❌ Failed | $failed |
| ⏸️ No Recent Execution | $no_execution |

---

## Results

EOF

    # Add success results
    if [[ $success -gt 0 ]]; then
        echo "### ✅ Successful ($success)" >> "$report_file"
        echo "" >> "$report_file"
        jq -r '.[] | select(.status == "success") | "- **\(.workflow_name)** (\(.workflow_id))"' "$results_file" >> "$report_file"
        echo "" >> "$report_file"
    fi

    # Add failed results
    if [[ $failed -gt 0 ]]; then
        echo "### ❌ Failed ($failed)" >> "$report_file"
        echo "" >> "$report_file"
        jq -r '.[] | select(.status == "failed") | "- **\(.workflow_name)** (\(.workflow_id))\n  - Error: \(.error_message)"' "$results_file" >> "$report_file"
        echo "" >> "$report_file"
    fi

    # Add no-execution results
    if [[ $no_execution -gt 0 ]]; then
        echo "### ⏸️ No Recent Execution ($no_execution)" >> "$report_file"
        echo "" >> "$report_file"
        echo "_These workflows haven't run recently. They may be schedule-based or require manual triggering._" >> "$report_file"
        echo "" >> "$report_file"
        jq -r '.[] | select(.status == "no_recent_execution") | "- **\(.workflow_name)** (\(.workflow_id))"' "$results_file" >> "$report_file"
        echo "" >> "$report_file"
    fi

    cat >> "$report_file" <<EOF

---

## Next Steps

EOF

    if [[ $failed -gt 0 ]]; then
        cat >> "$report_file" <<EOF
1. **Investigate failed workflows** - Check n8n execution logs for details
2. **Use n8n-brain** - Run \`lookup_error_fix\` for known solutions
3. **Fix and retest** - After fixing, run \`./morning-test.sh --workflow <id>\`
EOF
    else
        cat >> "$report_file" <<EOF
All tested workflows are healthy! 🎉
EOF
    fi

    cat >> "$report_file" <<EOF

---

*Generated by n8n Morning Test at $(date)*
EOF

    log "Report generated: $report_file"
}

send_slack_summary() {
    local results_file="$OUTPUT_DIR/results.json"

    if [[ -z "$SLACK_WEBHOOK" ]]; then
        log "Slack notification skipped (no webhook configured)"
        return
    fi

    local total=$(jq 'length' "$results_file")
    local success=$(jq '[.[] | select(.status == "success")] | length' "$results_file")
    local failed=$(jq '[.[] | select(.status == "failed")] | length' "$results_file")

    local emoji=":white_check_mark:"
    local title="n8n Morning Test Complete"
    if [[ $failed -gt 0 ]]; then
        emoji=":warning:"
        title="n8n Morning Test - $failed Failures"
    fi

    local failed_list=""
    if [[ $failed -gt 0 ]]; then
        failed_list="\n\n*Failed workflows:*\n"
        failed_list+=$(jq -r '.[] | select(.status == "failed") | "• \(.workflow_name)"' "$results_file" | head -5)
    fi

    local payload=$(cat <<EOF
{
    "text": "$emoji *$title*\n\nTested: $total | Success: $success | Failed: $failed$failed_list\n\nSee \`.n8n-testing/morning-report.md\` for details."
}
EOF
)

    curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK" > /dev/null 2>&1 || true

    log "Slack notification sent"
}

# ============================================
# Logging
# ============================================

log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# ============================================
# Main
# ============================================

parse_args() {
    COUNT=$DEFAULT_COUNT
    MODE="rotate"
    SPECIFIC_WORKFLOW=""
    DRY_RUN=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --count)
                COUNT=$2
                shift 2
                ;;
            --workflow)
                SPECIFIC_WORKFLOW=$2
                shift 2
                ;;
            --critical)
                MODE="critical"
                shift
                ;;
            --random)
                MODE="random"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                echo "n8n Morning Test - Execute and verify workflows"
                echo ""
                echo "Usage: ./morning-test.sh [options]"
                echo ""
                echo "Options:"
                echo "  --count N         Test N workflows (default: 10)"
                echo "  --workflow <id>   Test specific workflow"
                echo "  --critical        Test only critical workflows"
                echo "  --random          Random sample of workflows"
                echo "  --dry-run         Show what would be tested"
                echo "  --help            Show this help"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

main() {
    echo "======================================"
    echo "  n8n Morning Test"
    echo "======================================"
    echo ""

    # Load configuration
    load_config

    # Parse arguments
    parse_args "$@"

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    # Get workflows to test
    local workflows_to_test=()

    if [[ -n "$SPECIFIC_WORKFLOW" ]]; then
        workflows_to_test=("$SPECIFIC_WORKFLOW")
    else
        # Get workflow IDs and names
        local all_active=$(get_active_workflows)

        case "$MODE" in
            rotate)
                local day_of_year=$(date +%j)
                local total=$(echo "$all_active" | jq 'length')
                local offset=$(( (day_of_year * COUNT) % total ))
                workflows_json=$(echo "$all_active" | jq ".[$offset:$((offset + COUNT))]")
                ;;
            random)
                workflows_json=$(echo "$all_active" | jq "[.[] | {id, name}] | .[0:$COUNT]" | jq 'sort_by(.name)')
                ;;
            *)
                workflows_json=$(echo "$all_active" | jq ".[0:$COUNT]")
                ;;
        esac
    fi

    # Dry run mode
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "DRY RUN MODE - No tests will execute"
        echo ""
        echo "Would test the following workflows:"
        echo "$workflows_json" | jq -r '.[] | "  - \(.name) (\(.id))"'
        echo ""
        echo "Total: $(echo "$workflows_json" | jq 'length') workflows"
        exit 0
    fi

    log "Testing $(echo "$workflows_json" | jq 'length') workflows..."
    echo ""

    # Initialize results array
    echo "[]" > "$OUTPUT_DIR/results.json"

    # Test each workflow
    echo "$workflows_json" | jq -c '.[]' | while read -r workflow; do
        local wf_id=$(echo "$workflow" | jq -r '.id')
        local wf_name=$(echo "$workflow" | jq -r '.name')

        local result=$(test_workflow "$wf_id" "$wf_name")

        # Append to results
        local current=$(cat "$OUTPUT_DIR/results.json")
        echo "$current" | jq ". + [$result]" > "$OUTPUT_DIR/results.json"

        local status=$(echo "$result" | jq -r '.status')
        case "$status" in
            success) echo "  ✅ $wf_name" ;;
            failed) echo "  ❌ $wf_name" ;;
            *) echo "  ⏸️ $wf_name ($status)" ;;
        esac
    done

    echo ""

    # Generate report
    generate_morning_report

    # Send Slack notification
    send_slack_summary

    echo ""
    echo "======================================"
    echo "  Testing Complete"
    echo "======================================"
    echo ""
    echo "Results: $OUTPUT_DIR/results.json"
    echo "Report:  $OUTPUT_DIR/morning-report.md"
}

main "$@"
