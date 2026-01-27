#!/bin/bash
#
# Output parsing for Overnight GSD
#
# Parses Claude output to extract status markers

parse_gsd_output() {
    local output=$1

    # Look for status markers in order of priority

    # Check for blocker first (highest priority)
    if echo "$output" | grep -qE "BLOCKER:|blocker:|Blocker:"; then
        local blocker=$(echo "$output" | grep -oE "(BLOCKER|blocker|Blocker):.*" | head -1 | sed 's/^[^:]*://')
        echo "BLOCKER:$blocker"
        return
    fi

    # Check for verification failure
    if echo "$output" | grep -qE "VERIFICATION_FAILED:|verification.*(failed|failure)"; then
        local details=$(echo "$output" | grep -oE "(VERIFICATION_FAILED|Verification.*failed):.*" | head -1 | sed 's/^[^:]*://')
        echo "VERIFICATION_FAILED:${details:-Verification did not pass}"
        return
    fi

    # Check for phase completion
    if echo "$output" | grep -qE "PHASE_COMPLETE:|phase.*complete|Phase.*complete"; then
        local phase=$(echo "$output" | grep -oE "(PHASE_COMPLETE:|Phase [0-9]+.*complete)" | head -1 | grep -oE "[0-9]+" | head -1)
        echo "PHASE_COMPLETE:${phase:-unknown}"
        return
    fi

    # Check for plan completion
    if echo "$output" | grep -qE "PLAN_COMPLETE:|plan.*complete|Plan.*complete|SUMMARY.md"; then
        local plan=$(echo "$output" | grep -oE "(PLAN_COMPLETE:|[0-9]+-[0-9]+-PLAN)" | head -1 | grep -oE "[0-9]+-[0-9]+" | head -1)
        echo "PLAN_COMPLETE:${plan:-unknown}"
        return
    fi

    # Check for errors
    if echo "$output" | grep -qiE "error:|Error:|ERROR:|failed|Failed|FAILED"; then
        # But not if it's about fixing errors or error handling
        if ! echo "$output" | grep -qiE "fix.*error|error.*fix|error.handling"; then
            local error=$(echo "$output" | grep -oE "(error|Error|ERROR):.*" | head -1 | sed 's/^[^:]*://')
            echo "ERROR:${error:-Unknown error occurred}"
            return
        fi
    fi

    # No clear status found
    echo "UNKNOWN:No clear status marker found"
}

parse_n8n_output() {
    local output=$1

    # Check for blocker first
    if echo "$output" | grep -qE "BLOCKER:|blocker:|Blocker:"; then
        local blocker=$(echo "$output" | grep -oE "(BLOCKER|blocker|Blocker):.*" | head -1 | sed 's/^[^:]*://')
        echo "BLOCKER:$blocker"
        return
    fi

    # Check for successful test
    if echo "$output" | grep -qE "WORKFLOW_TESTED:|workflow.*tested|test.*passed|Test.*passed"; then
        local wf_id=$(echo "$output" | grep -oE "WORKFLOW_TESTED:.*" | head -1 | sed 's/^[^:]*://' | tr -d ' ')
        echo "WORKFLOW_TESTED:${wf_id:-unknown}"
        return
    fi

    # Check for fixed workflow
    if echo "$output" | grep -qE "WORKFLOW_FIXED:|workflow.*fixed|fix.*applied"; then
        local wf_id=$(echo "$output" | grep -oE "WORKFLOW_FIXED:.*" | head -1 | sed 's/^[^:]*://' | tr -d ' ')
        echo "WORKFLOW_FIXED:${wf_id:-unknown}"
        return
    fi

    # Check for test failure
    if echo "$output" | grep -qE "TEST_FAILED:|test.*failed|Test.*failed"; then
        local details=$(echo "$output" | grep -oE "(TEST_FAILED|test.*failed|Test.*failed):.*" | head -1 | sed 's/^[^:]*://')
        echo "TEST_FAILED:${details:-Test did not pass}"
        return
    fi

    # No clear status
    echo "UNKNOWN:No clear status marker found"
}

extract_plan_id() {
    local output=$1

    # Look for plan ID patterns like "12-03-PLAN" or "Phase 12 Plan 3"
    local plan_id=$(echo "$output" | grep -oE "[0-9]+-[0-9]+-PLAN" | head -1 | sed 's/-PLAN//')

    if [[ -z "$plan_id" ]]; then
        plan_id=$(echo "$output" | grep -oE "Phase [0-9]+ Plan [0-9]+" | head -1 | sed 's/Phase //' | sed 's/ Plan /-/')
    fi

    echo "${plan_id:-unknown}"
}

extract_workflow_id() {
    local output=$1

    # Look for n8n workflow ID patterns (alphanumeric, 16 chars typically)
    local wf_id=$(echo "$output" | grep -oE "[A-Za-z0-9]{14,20}" | head -1)

    echo "${wf_id:-unknown}"
}
