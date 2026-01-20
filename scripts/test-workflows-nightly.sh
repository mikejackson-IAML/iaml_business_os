#!/bin/bash
# ============================================
# Nightly Workflow Testing Script - RALPH Loop
# ============================================
# Full autonomous testing with diagnosis and repair:
#   1. Check execution history for errors
#   2. Diagnose issues
#   3. Add error handling pattern if missing
#   4. Attempt fixes
#   5. Verify fixes work
#   6. Update registry
#
# Usage:
#   ./scripts/test-workflows-nightly.sh           # Test next 3 workflows
#   ./scripts/test-workflows-nightly.sh 5         # Test next 5 workflows
#   ./scripts/test-workflows-nightly.sh --all     # Test ALL untested workflows
#
# Run in background:
#   nohup ./scripts/test-workflows-nightly.sh > nightly-test.log 2>&1 &

set -e

# ============================================
# Configuration
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M-%S)
RESULTS_DIR="$PROJECT_ROOT/.planning/workflow-tests/results/$DATE"
LOG_FILE="$RESULTS_DIR/nightly-run-$TIME.log"

# How many workflows to test per night (default: 3)
DEFAULT_BATCH_SIZE=3

# Timeout per workflow (10 minutes - enough for full RALPH loop)
WORKFLOW_TIMEOUT=600

# Supabase connection
# Source from .env.local file if not already set
ENV_FILE="$PROJECT_ROOT/.env.local"
if [ -f "$ENV_FILE" ]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
fi

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# Functions
# ============================================

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

header() {
  log ""
  log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  log "${BLUE}$1${NC}"
  log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_env() {
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    log "${RED}Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set${NC}"
    log "Add them to your shell profile or .env.local"
    exit 1
  fi
}

# Query Supabase for workflows needing testing
get_workflows_to_test() {
  local LIMIT=$1

  # Query via PostgREST with n8n_brain schema
  # Priority order: broken, needs_review, in_progress, untested
  curl -s "${SUPABASE_URL}/rest/v1/workflow_registry?test_status=in.(untested,needs_review,broken,in_progress)&order=test_status.asc,is_active.desc,workflow_name.asc&limit=$LIMIT&select=workflow_id,workflow_name,test_status,is_active" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Accept-Profile: n8n_brain" 2>/dev/null
}

# Mark workflow as being tested (in_progress)
mark_testing_started() {
  local WF_ID=$1

  curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.${WF_ID}" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Content-Profile: n8n_brain" \
    -H "Prefer: return=minimal" \
    -d "{\"test_status\": \"in_progress\", \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" 2>/dev/null
}

test_workflow_ralph() {
  local WF_ID=$1
  local WF_NAME=$2
  local WF_RESULT_FILE="$RESULTS_DIR/$WF_ID.md"

  log ""
  log "${YELLOW}Testing: $WF_NAME${NC}"
  log "ID: $WF_ID"
  log "Started: $(date)"
  log "Mode: Full RALPH Loop (test → diagnose → fix → verify)"

  # Mark as in_progress in registry
  mark_testing_started "$WF_ID"

  # Build the RALPH loop prompt for Claude
  local PROMPT="You are running an automated RALPH loop test on an n8n workflow.

WORKFLOW: $WF_NAME
ID: $WF_ID

Execute the FULL RALPH loop - test, diagnose, fix, verify, iterate:

## STEP 1: LOAD & ANALYZE
1. Use mcp__n8n__get_workflow to fetch the workflow
2. Identify: trigger type, main nodes, services used

## STEP 2: CHECK EXECUTION HISTORY
1. Use mcp__n8n__list_executions with workflowId=\"$WF_ID\" and limit=5
2. Check for any failed executions
3. If failures exist, use mcp__n8n__get_execution to get error details

## STEP 3: CHECK ERROR HANDLING PATTERN
Look for these nodes (standard Business OS pattern):
- Error Trigger (n8n-nodes-base.errorTrigger)
- Parse Error Details (Code node)
- Log Error to DB (Postgres to n8n_brain)
- Send Error Slack (HTTP Request to Slack webhook)

If ANY are missing, ADD the full error handling pattern:
1. Use mcp__n8n-brain__get_pattern with pattern_id=\"235e56be-d444-4c62-a2c4-9ae3e8db279b\"
2. Merge those nodes into the workflow
3. Use mcp__n8n__update_workflow to add them
4. Replace {{WORKFLOW_NAME}} with \"$WF_NAME\" and {{WORKFLOW_ID}} with \"$WF_ID\"

## STEP 4: DIAGNOSE & FIX ERRORS
If you found execution errors in Step 2:
1. Analyze the error message and failed node
2. Common fixes:
   - Credential errors: Note for manual fix (can't update creds via API)
   - Missing fields: Check node configuration
   - API errors: Check URL, headers, authentication
   - Database errors: Check query syntax, table names
3. Apply fixes using mcp__n8n__update_workflow
4. If you make a fix, note what you changed

## STEP 5: UPDATE REGISTRY
After all checks/fixes, update the registry with results.

Use this curl command (execute via Bash tool):
\`\`\`bash
cd \"/Users/mike/IAML Business OS\" && source .env.local && curl -s -X PATCH \"\${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.$WF_ID\" \\
  -H \"apikey: \${SUPABASE_SERVICE_KEY}\" \\
  -H \"Authorization: Bearer \${SUPABASE_SERVICE_KEY}\" \\
  -H \"Content-Type: application/json\" \\
  -H \"Content-Profile: n8n_brain\" \\
  -d '{
    \"test_status\": \"STATUS_HERE\",
    \"tested_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"tested_by\": \"nightly-ralph\",
    \"test_notes\": \"NOTES_HERE\",
    \"has_error_handling\": BOOL_HERE
  }'
\`\`\`

Set status based on results:
- \"verified\": Working + has error handling
- \"tested\": Working but missing something minor (like tag)
- \"needs_review\": Has issues that need manual attention
- \"broken\": Failed and couldn't fix

## STEP 6: REPORT
At the end, output a summary:

### $WF_NAME

**Status:** [verified/tested/needs_review/broken]

**Checks:**
- [ ] Execution history: [pass/fail - details]
- [ ] Error handling pattern: [present/added/missing]
- [ ] Recent errors: [none/fixed/needs manual fix]

**Actions Taken:**
- [List any fixes applied]

**Manual Steps Needed:**
- [List anything that needs human intervention, like adding business-os tag]

---

IMPORTANT:
- Actually USE the MCP tools - don't just describe what you would do
- If you add error handling, VERIFY the update succeeded
- Be thorough but efficient
- This runs unattended overnight, so fix everything you can"

  # Run Claude with full tool access
  if timeout $WORKFLOW_TIMEOUT claude --print "$PROMPT" > "$WF_RESULT_FILE" 2>&1; then
    log "${GREEN}✓ Completed${NC}"

    # Extract status from the result file
    if grep -q "Status.*verified" "$WF_RESULT_FILE" 2>/dev/null; then
      log "Result: ${GREEN}verified${NC}"
    elif grep -q "Status.*tested" "$WF_RESULT_FILE" 2>/dev/null; then
      log "Result: ${YELLOW}tested${NC}"
    elif grep -q "Status.*needs_review" "$WF_RESULT_FILE" 2>/dev/null; then
      log "Result: ${YELLOW}needs_review${NC}"
    elif grep -q "Status.*broken" "$WF_RESULT_FILE" 2>/dev/null; then
      log "Result: ${RED}broken${NC}"
    else
      log "Result: ${YELLOW}check log${NC}"
    fi
  else
    log "${RED}✗ Timed out or failed${NC}"
    echo "## $WF_NAME

**Status:** broken

Test execution timed out after $WORKFLOW_TIMEOUT seconds or failed to complete.

Manual investigation needed." > "$WF_RESULT_FILE"

    # Update registry as broken
    curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.${WF_ID}" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Content-Profile: n8n_brain" \
      -H "Prefer: return=minimal" \
      -d "{
        \"test_status\": \"broken\",
        \"tested_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"tested_by\": \"nightly-ralph\",
        \"test_notes\": \"RALPH loop timed out or failed - needs manual investigation\"
      }" 2>/dev/null
  fi

  log "Finished: $(date)"
}

generate_summary() {
  header "GENERATING SUMMARY"

  local SUMMARY_FILE="$RESULTS_DIR/SUMMARY.md"

  cat > "$SUMMARY_FILE" << EOF
# Nightly RALPH Loop Test Results

**Date:** $DATE
**Time:** $TIME
**Mode:** Full RALPH Loop (test → diagnose → fix → verify)
**Workflows Tested:** $(ls "$RESULTS_DIR"/*.md 2>/dev/null | grep -v SUMMARY | wc -l | tr -d ' ')

## Results

EOF

  local VERIFIED=0
  local TESTED=0
  local NEEDS_REVIEW=0
  local BROKEN=0

  for result_file in "$RESULTS_DIR"/*.md; do
    if [ -f "$result_file" ] && [ "$(basename "$result_file")" != "SUMMARY.md" ]; then
      local WF_ID=$(basename "$result_file" .md)

      # Extract workflow name from file
      local WF_NAME=$(head -5 "$result_file" | grep -E "^###? " | head -1 | sed 's/^#* //')
      [ -z "$WF_NAME" ] && WF_NAME="$WF_ID"

      # Extract status
      local STATUS=$(grep -E "Status.*:" "$result_file" 2>/dev/null | head -1 | grep -oE "(verified|tested|needs_review|broken)" || echo "unknown")

      case $STATUS in
        verified) ((VERIFIED++)); EMOJI="✅" ;;
        tested) ((TESTED++)); EMOJI="⚠️" ;;
        needs_review) ((NEEDS_REVIEW++)); EMOJI="🔧" ;;
        broken) ((BROKEN++)); EMOJI="❌" ;;
        *) EMOJI="❓" ;;
      esac

      echo "### $EMOJI $WF_NAME" >> "$SUMMARY_FILE"
      echo "" >> "$SUMMARY_FILE"
      echo "**Status:** $STATUS" >> "$SUMMARY_FILE"
      echo "" >> "$SUMMARY_FILE"

      # Extract actions taken if any
      if grep -q "Actions Taken:" "$result_file" 2>/dev/null; then
        echo "**Actions:**" >> "$SUMMARY_FILE"
        sed -n '/Actions Taken:/,/^$/p' "$result_file" | tail -n +2 | head -5 >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
      fi

      # Extract manual steps if any
      if grep -q "Manual Steps Needed:" "$result_file" 2>/dev/null; then
        echo "**Manual Steps:**" >> "$SUMMARY_FILE"
        sed -n '/Manual Steps Needed:/,/^$/p' "$result_file" | tail -n +2 | head -5 >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
      fi

      echo "---" >> "$SUMMARY_FILE"
      echo "" >> "$SUMMARY_FILE"
    fi
  done

  cat >> "$SUMMARY_FILE" << EOF

## Summary

| Status | Count |
|--------|-------|
| ✅ Verified | $VERIFIED |
| ⚠️ Tested | $TESTED |
| 🔧 Needs Review | $NEEDS_REVIEW |
| ❌ Broken | $BROKEN |

## What RALPH Did

The RALPH loop automatically:
- Checked execution history for errors
- Added error handling pattern to workflows missing it
- Attempted fixes for common issues
- Updated the workflow registry with results

## Next Steps

EOF

  if [ $NEEDS_REVIEW -gt 0 ] || [ $BROKEN -gt 0 ]; then
    cat >> "$SUMMARY_FILE" << EOF
**Action Required:**

1. Review workflows marked 🔧 or ❌
2. Check individual result files for details:
   \`ls $RESULTS_DIR/*.md\`
3. For each issue:
   - \`/test-workflows <workflow_id>\` - Re-run with manual oversight
   - \`/mark-tested <workflow_id> verified\` - Mark fixed after manual fix

**Common Manual Fixes:**
- Add \`business-os\` tag in n8n UI (API doesn't support tags)
- Fix credential issues in n8n
- Check API endpoints that may have changed
EOF
  else
    cat >> "$SUMMARY_FILE" << EOF
**All Good!** All tested workflows passed or were fixed automatically.

Continue testing more:
\`\`\`
/test-workflows 5
\`\`\`
EOF
  fi

  log "${GREEN}Summary: $SUMMARY_FILE${NC}"
}

# ============================================
# Main
# ============================================

# Create results directory
mkdir -p "$RESULTS_DIR"

header "NIGHTLY RALPH LOOP TESTING"
log "Date: $DATE"
log "Results: $RESULTS_DIR"

# Check environment
check_env

# Determine batch size
BATCH_SIZE=$DEFAULT_BATCH_SIZE
if [ "$1" = "--all" ]; then
  BATCH_SIZE=100
  log "Mode: Testing ALL untested workflows"
elif [ -n "$1" ] && [ "$1" -eq "$1" ] 2>/dev/null; then
  BATCH_SIZE=$1
  log "Mode: Testing $BATCH_SIZE workflows"
else
  log "Mode: Testing $BATCH_SIZE workflows (default)"
fi

log "Timeout: ${WORKFLOW_TIMEOUT}s per workflow"

# Get workflows from Supabase
log ""
log "Fetching workflows from registry..."

WORKFLOWS_JSON=$(get_workflows_to_test $BATCH_SIZE)

if [ -z "$WORKFLOWS_JSON" ] || [ "$WORKFLOWS_JSON" = "[]" ]; then
  log "${GREEN}No workflows need testing! All caught up.${NC}"

  cat > "$RESULTS_DIR/SUMMARY.md" << EOF
# Nightly RALPH Loop Test Results

**Date:** $DATE

## Status

✅ **All workflows are already tested!**

No untested, broken, or needs_review workflows found in the registry.

Check back tomorrow or add new workflows to the registry.
EOF

  exit 0
fi

# Parse JSON and test each workflow
WORKFLOW_COUNT=$(echo "$WORKFLOWS_JSON" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null || echo "0")

log "Found $WORKFLOW_COUNT workflows to test"
log ""

# Extract workflow IDs and names, then test each
echo "$WORKFLOWS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for w in data:
    # Print tab-separated for reliable parsing
    print(w.get('workflow_id', '') + '\t' + w.get('workflow_name', 'Unknown'))
" 2>/dev/null | while IFS=$'\t' read -r WF_ID WF_NAME; do
  if [ -n "$WF_ID" ]; then
    test_workflow_ralph "$WF_ID" "$WF_NAME"

    # Pause between tests to avoid rate limiting
    log "Pausing 10s before next workflow..."
    sleep 10
  fi
done

# Generate summary
generate_summary

header "TESTING COMPLETE"
log ""
log "Results saved to: $RESULTS_DIR/SUMMARY.md"
log ""
log "View with: /test-results"
