#!/bin/bash
#
# Cost estimation and tracking for Overnight GSD
#
# Pricing (as of Jan 2026):
# - Claude Opus:   $15/MTok input, $75/MTok output
# - Claude Sonnet: $3/MTok input, $15/MTok output
# - Claude Haiku:  $0.25/MTok input, $1.25/MTok output

estimate_iteration_cost() {
    local output=$1
    local model=$2

    # Rough token estimation: ~4 chars per token
    local output_length=${#output}
    local estimated_output_tokens=$((output_length / 4))

    # Assume input is roughly 2x output for context-heavy operations
    local estimated_input_tokens=$((estimated_output_tokens * 2))

    # Convert to millions
    local input_mtok=$(echo "scale=6; $estimated_input_tokens / 1000000" | bc)
    local output_mtok=$(echo "scale=6; $estimated_output_tokens / 1000000" | bc)

    local cost
    case "$model" in
        opus)
            cost=$(echo "scale=4; ($input_mtok * 15) + ($output_mtok * 75)" | bc)
            ;;
        sonnet)
            cost=$(echo "scale=4; ($input_mtok * 3) + ($output_mtok * 15)" | bc)
            ;;
        haiku)
            cost=$(echo "scale=4; ($input_mtok * 0.25) + ($output_mtok * 1.25)" | bc)
            ;;
        *)
            # Default to sonnet pricing
            cost=$(echo "scale=4; ($input_mtok * 3) + ($output_mtok * 15)" | bc)
            ;;
    esac

    # Ensure we return at least 0.01 for any non-trivial iteration
    if (( $(echo "$cost < 0.01" | bc -l) )); then
        cost="0.01"
    fi

    echo "$cost"
}

update_cost_report() {
    local iteration=$1
    local cost=$2
    local duration=$3
    local type=$4
    local target=$5

    local report_file="$OUTPUT_DIR/cost-report.json"

    # Read existing report
    local existing=$(cat "$report_file")

    # Create new entry
    local entry=$(cat <<EOF
{
    "iteration": $iteration,
    "timestamp": "$(date -Iseconds)",
    "type": "$type",
    "target": "$target",
    "cost_usd": $cost,
    "duration_sec": $duration,
    "cumulative_cost": $TOTAL_COST
}
EOF
)

    # Append to array
    if [[ "$existing" == "[]" ]]; then
        echo "[$entry]" > "$report_file"
    else
        # Remove trailing ] and append new entry
        echo "${existing%]}, $entry]" > "$report_file"
    fi
}

get_cost_summary() {
    local report_file="$OUTPUT_DIR/cost-report.json"

    if [[ ! -f "$report_file" ]]; then
        echo "No cost data available"
        return
    fi

    local gsd_cost=$(jq '[.[] | select(.type == "gsd") | .cost_usd] | add // 0' "$report_file")
    local n8n_cost=$(jq '[.[] | select(.type == "n8n") | .cost_usd] | add // 0' "$report_file")
    local total=$(jq '[.[] | .cost_usd] | add // 0' "$report_file")

    echo "GSD: \$$gsd_cost | n8n: \$$n8n_cost | Total: \$$total"
}
