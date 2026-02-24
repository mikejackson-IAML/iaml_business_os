#!/bin/bash
# ============================================
# Nightly Workflow Testing Script — Full Coverage + Email Summary
# ============================================
# Autonomous testing with full node/branch coverage using /test-workflow-auto:
#   1. Query ALL unverified workflows from Supabase registry
#   2. Run /test-workflow-auto on each (analyze → seed data → execute → coverage → fix → learn)
#   3. Collect results including coverage metrics
#   4. Send HTML email via SendGrid with coverage data and clickable links
#
# Usage:
#   ./scripts/test-workflows-nightly.sh           # Test next 3 workflows
#   ./scripts/test-workflows-nightly.sh 5         # Test next 5 workflows
#   ./scripts/test-workflows-nightly.sh --all     # Test ALL unverified workflows
#
# Run in background:
#   nohup ./scripts/test-workflows-nightly.sh --all > nightly-test.log 2>&1 &

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

# Timeout per workflow (15 minutes — full coverage takes longer than basic testing)
WORKFLOW_TIMEOUT=900

# Email configuration
EMAIL_TO="mike.jackson@iaml.com"
EMAIL_FROM="workflows@iaml.com"
EMAIL_FROM_NAME="Business OS Workflows"

# Supabase connection
ENV_FILE="$PROJECT_ROOT/.env.local"
if [ -f "$ENV_FILE" ]; then
  # shellcheck source=/dev/null
  set -a
  source "$ENV_FILE"
  set +a
fi

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"
SENDGRID_API_KEY="${SENDGRID_API_KEY:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Results tracking (temp file for cross-subshell communication)
RESULTS_JSON_FILE="$RESULTS_DIR/results.json"
echo "[]" > "$RESULTS_JSON_FILE"

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
    log "Add them to .env.local"
    exit 1
  fi
  if [ -z "$SENDGRID_API_KEY" ]; then
    log "${YELLOW}Warning: SENDGRID_API_KEY not set - email summary will be skipped${NC}"
  fi
}

# Query Supabase for workflows needing testing (all non-verified)
get_workflows_to_test() {
  local LIMIT=$1

  curl -s "${SUPABASE_URL}/rest/v1/workflow_registry?test_status=neq.verified&order=test_status.asc,is_active.desc,workflow_name.asc&limit=$LIMIT&select=workflow_id,workflow_name,test_status,is_active" \
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

# Append a result to the JSON results file
append_result() {
  local WF_ID="$1"
  local WF_NAME="$2"
  local STATUS="$3"
  local SUMMARY="$4"
  local NODE_COV="$5"
  local BRANCH_COV="$6"
  local EXECUTIONS="$7"
  local FIXES="$8"

  python3 -c "
import json, sys
with open('$RESULTS_JSON_FILE', 'r') as f:
    results = json.load(f)
results.append({
    'workflow_id': '''$WF_ID''',
    'workflow_name': '''$WF_NAME''',
    'url': 'https://n8n.realtyamp.ai/workflow/$WF_ID',
    'status': '''$STATUS''',
    'summary': '''$SUMMARY''',
    'node_coverage': '''$NODE_COV''',
    'branch_coverage': '''$BRANCH_COV''',
    'executions': '''$EXECUTIONS''',
    'fixes': '''$FIXES'''
})
with open('$RESULTS_JSON_FILE', 'w') as f:
    json.dump(results, f, indent=2)
" 2>/dev/null
}

test_workflow() {
  local WF_ID=$1
  local WF_NAME=$2
  local WF_RESULT_FILE="$RESULTS_DIR/$WF_ID.md"

  log ""
  log "${YELLOW}Testing: $WF_NAME${NC}"
  log "ID: $WF_ID"
  log "Started: $(date)"
  log "Mode: /test-workflow-auto full coverage protocol (fresh Claude session)"

  # Mark as in_progress in registry
  mark_testing_started "$WF_ID"

  # Invoke Claude with the /test-workflow-auto command.
  # The command file (.claude/commands/test-workflow-auto.md) is the single source of truth
  # for the testing protocol. Claude reads it automatically when the command is invoked.
  local PROMPT="/test-workflow-auto $WF_ID

This is an unattended nightly test. Execute the full coverage protocol autonomously:
- Run all 8 phases: health check → analyze → seed data → compliance → execute → coverage → learn → report
- Generate seed data for EVERY branch (IF true/false, Switch cases, error handling)
- Execute multiple scenarios to achieve 100% node and branch coverage
- Fix all issues found without asking
- Add error handling if missing
- Validate with strict profile
- Update Supabase registry with coverage numbers
- Store all learnings in n8n-brain
- Do NOT add tags (skip tag addition step)
- Do NOT mark as 'verified' — use 'tested' for passing workflows (human verifies in the morning)
- Do NOT wait for user response

At the very end of your output, include this exact summary block so it can be parsed:

---NIGHTLY-RESULT---
WORKFLOW_ID: $WF_ID
WORKFLOW_NAME: $WF_NAME
STATUS: [tested|needs_review|broken]
NODE_COVERAGE: [X/Y]
BRANCH_COVERAGE: [X/Y]
EXECUTIONS: [N]
FIXES: [N]
SUMMARY: [one-line description of result and any actions taken]
---END-RESULT---"

  # Run Claude as a fresh process (clean context per workflow)
  if timeout $WORKFLOW_TIMEOUT claude --print "$PROMPT" > "$WF_RESULT_FILE" 2>&1; then
    log "${GREEN}Completed${NC}"

    # Parse the structured result block
    local STATUS="unknown"
    local SUMMARY="See full report"
    local NODE_COV="?"
    local BRANCH_COV="?"
    local EXECUTIONS="?"
    local FIXES="?"

    if grep -q "^STATUS:" "$WF_RESULT_FILE" 2>/dev/null; then
      STATUS=$(grep "^STATUS:" "$WF_RESULT_FILE" | head -1 | sed 's/^STATUS: *//' | tr -d '[:space:]')
      SUMMARY=$(grep "^SUMMARY:" "$WF_RESULT_FILE" | head -1 | sed 's/^SUMMARY: *//' | head -c 200)
    fi

    if grep -q "^NODE_COVERAGE:" "$WF_RESULT_FILE" 2>/dev/null; then
      NODE_COV=$(grep "^NODE_COVERAGE:" "$WF_RESULT_FILE" | head -1 | sed 's/^NODE_COVERAGE: *//' | tr -d '[:space:]')
    fi

    if grep -q "^BRANCH_COVERAGE:" "$WF_RESULT_FILE" 2>/dev/null; then
      BRANCH_COV=$(grep "^BRANCH_COVERAGE:" "$WF_RESULT_FILE" | head -1 | sed 's/^BRANCH_COVERAGE: *//' | tr -d '[:space:]')
    fi

    if grep -q "^EXECUTIONS:" "$WF_RESULT_FILE" 2>/dev/null; then
      EXECUTIONS=$(grep "^EXECUTIONS:" "$WF_RESULT_FILE" | head -1 | sed 's/^EXECUTIONS: *//' | tr -d '[:space:]')
    fi

    if grep -q "^FIXES:" "$WF_RESULT_FILE" 2>/dev/null; then
      FIXES=$(grep "^FIXES:" "$WF_RESULT_FILE" | head -1 | sed 's/^FIXES: *//' | tr -d '[:space:]')
    fi

    # Fallback: scan for status keywords if structured block wasn't output
    if [ "$STATUS" = "unknown" ]; then
      if grep -qi "Status.*tested" "$WF_RESULT_FILE" 2>/dev/null; then
        STATUS="tested"
      elif grep -qi "Status.*needs_review" "$WF_RESULT_FILE" 2>/dev/null; then
        STATUS="needs_review"
      elif grep -qi "Status.*broken" "$WF_RESULT_FILE" 2>/dev/null; then
        STATUS="broken"
      elif grep -qi "Status.*verified" "$WF_RESULT_FILE" 2>/dev/null; then
        STATUS="tested"  # Downgrade to tested; human verifies
      fi
    fi

    case $STATUS in
      tested) log "Result: ${GREEN}tested (ready for verification)${NC} | Nodes: $NODE_COV | Branches: $BRANCH_COV" ;;
      needs_review) log "Result: ${YELLOW}needs_review${NC} | Nodes: $NODE_COV | Branches: $BRANCH_COV" ;;
      broken) log "Result: ${RED}broken${NC}" ;;
      *) log "Result: ${YELLOW}$STATUS (check log)${NC}" ;;
    esac

    append_result "$WF_ID" "$WF_NAME" "$STATUS" "$SUMMARY" "$NODE_COV" "$BRANCH_COV" "$EXECUTIONS" "$FIXES"
  else
    log "${RED}Timed out or failed${NC}"
    echo "## $WF_NAME

**Status:** broken

Test execution timed out after $WORKFLOW_TIMEOUT seconds or failed to complete.
The full coverage protocol may need more time for complex workflows.

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
        \"tested_by\": \"nightly-coverage\",
        \"test_notes\": \"Test timed out after ${WORKFLOW_TIMEOUT}s - full coverage protocol may need more time\"
      }" 2>/dev/null

    append_result "$WF_ID" "$WF_NAME" "broken" "Timed out after ${WORKFLOW_TIMEOUT}s" "?" "?" "0" "0"
  fi

  log "Finished: $(date)"
}

generate_summary() {
  header "GENERATING SUMMARY"

  local SUMMARY_FILE="$RESULTS_DIR/SUMMARY.md"

  cat > "$SUMMARY_FILE" << EOF
# Nightly Full Coverage Test Results

**Date:** $DATE
**Time:** $TIME
**Mode:** Full coverage (analyze → seed data → execute all paths → coverage → fix → learn)
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

      local WF_NAME=$(head -5 "$result_file" | grep -E "^###? " | head -1 | sed 's/^#* //')
      [ -z "$WF_NAME" ] && WF_NAME="$WF_ID"

      local STATUS=$(grep -E "Status.*:" "$result_file" 2>/dev/null | head -1 | grep -oE "(verified|tested|needs_review|broken)" || echo "unknown")

      case $STATUS in
        verified) ((VERIFIED++)) || true; EMOJI="+" ;;
        tested) ((TESTED++)) || true; EMOJI="~" ;;
        needs_review) ((NEEDS_REVIEW++)) || true; EMOJI="!" ;;
        broken) ((BROKEN++)) || true; EMOJI="X" ;;
        *) EMOJI="?" ;;
      esac

      echo "### [$EMOJI] $WF_NAME" >> "$SUMMARY_FILE"
      echo "" >> "$SUMMARY_FILE"
      echo "**Status:** $STATUS" >> "$SUMMARY_FILE"
      echo "**URL:** https://n8n.realtyamp.ai/workflow/$WF_ID" >> "$SUMMARY_FILE"
      echo "" >> "$SUMMARY_FILE"

      # Extract coverage data if present
      if grep -q "Node Coverage" "$result_file" 2>/dev/null; then
        echo "**Coverage:**" >> "$SUMMARY_FILE"
        grep -E "Node Coverage|Branch Coverage" "$result_file" | head -2 >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
      fi

      if grep -q "Fixes Applied" "$result_file" 2>/dev/null; then
        echo "**Fixes Applied:**" >> "$SUMMARY_FILE"
        sed -n '/Fixes Applied/,/^---$/p' "$result_file" | head -10 >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
      fi

      if grep -q "Uncovered Items" "$result_file" 2>/dev/null; then
        echo "**Uncovered:**" >> "$SUMMARY_FILE"
        sed -n '/Uncovered Items/,/^---$/p' "$result_file" | head -5 >> "$SUMMARY_FILE"
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
| Verified | $VERIFIED |
| Tested | $TESTED |
| Needs Review | $NEEDS_REVIEW |
| Broken | $BROKEN |

EOF

  log "${GREEN}Summary: $SUMMARY_FILE${NC}"
}

send_email_summary() {
  if [ -z "$SENDGRID_API_KEY" ]; then
    log "${YELLOW}Skipping email - SENDGRID_API_KEY not set${NC}"
    return
  fi

  header "SENDING EMAIL SUMMARY"

  local SUBJECT="Nightly Workflow Test Results - $DATE"

  # Build HTML email from results JSON using Python
  local SENDGRID_PAYLOAD
  SENDGRID_PAYLOAD=$(python3 << 'PYEOF'
import json, os

results_file = os.environ.get("RESULTS_JSON_FILE", "")
date = os.environ.get("DATE", "")
email_to = os.environ.get("EMAIL_TO", "")
email_from = os.environ.get("EMAIL_FROM", "")
email_from_name = os.environ.get("EMAIL_FROM_NAME", "")
subject = f"Nightly Workflow Test Results - {date}"

try:
    with open(results_file, 'r') as f:
        results = json.load(f)
except:
    results = []

total = len(results)
passed = sum(1 for r in results if r['status'] in ('tested', 'verified'))
needs_attention = sum(1 for r in results if r['status'] in ('needs_review', 'broken'))

ready = [r for r in results if r['status'] in ('tested', 'verified')]
broken_list = [r for r in results if r['status'] in ('needs_review', 'broken')]

html = '<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#333;max-width:700px;margin:0 auto;padding:20px;">'
html += f'<h1 style="color:#1a1a2e;border-bottom:2px solid #16213e;padding-bottom:10px;">Nightly Workflow Test Results</h1>'
html += f'<p style="color:#666;">{date} &mdash; Full Coverage Protocol</p>'
html += f'<p><strong>{total}</strong> tested | <strong style="color:#28a745">{passed}</strong> passed | <strong style="color:#dc3545">{needs_attention}</strong> need attention</p>'

if ready:
    html += '<h2 style="color:#16213e;">Ready for Verification</h2>'
    html += '<table style="width:100%;border-collapse:collapse;">'
    html += '<tr><th style="background:#16213e;color:white;padding:10px;text-align:left;">Workflow</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Status</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Node Cov</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Branch Cov</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Runs</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Summary</th></tr>'
    for r in ready:
        node_cov = r.get('node_coverage', '?')
        branch_cov = r.get('branch_coverage', '?')
        executions = r.get('executions', '?')
        html += f'<tr><td style="padding:10px;border-bottom:1px solid #eee;"><a href="{r["url"]}" style="color:#007bff;">{r["workflow_name"]}</a></td><td style="padding:10px;border-bottom:1px solid #eee;"><span style="background:#d4edda;color:#155724;padding:3px 8px;border-radius:4px;font-size:12px;">{r["status"]}</span></td><td style="padding:10px;border-bottom:1px solid #eee;">{node_cov}</td><td style="padding:10px;border-bottom:1px solid #eee;">{branch_cov}</td><td style="padding:10px;border-bottom:1px solid #eee;">{executions}</td><td style="padding:10px;border-bottom:1px solid #eee;">{r["summary"]}</td></tr>'
    html += '</table>'

if broken_list:
    html += '<h2 style="color:#16213e;">Needs Attention</h2>'
    html += '<table style="width:100%;border-collapse:collapse;">'
    html += '<tr><th style="background:#16213e;color:white;padding:10px;text-align:left;">Workflow</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Status</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Node Cov</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Branch Cov</th><th style="background:#16213e;color:white;padding:10px;text-align:left;">Issue</th></tr>'
    for r in broken_list:
        bg = '#f8d7da' if r['status'] == 'broken' else '#fff3cd'
        fg = '#721c24' if r['status'] == 'broken' else '#856404'
        node_cov = r.get('node_coverage', '?')
        branch_cov = r.get('branch_coverage', '?')
        html += f'<tr><td style="padding:10px;border-bottom:1px solid #eee;"><a href="{r["url"]}" style="color:#007bff;">{r["workflow_name"]}</a></td><td style="padding:10px;border-bottom:1px solid #eee;"><span style="background:{bg};color:{fg};padding:3px 8px;border-radius:4px;font-size:12px;">{r["status"]}</span></td><td style="padding:10px;border-bottom:1px solid #eee;">{node_cov}</td><td style="padding:10px;border-bottom:1px solid #eee;">{branch_cov}</td><td style="padding:10px;border-bottom:1px solid #eee;">{r["summary"]}</td></tr>'
    html += '</table>'

if total == 0:
    html += '<p>No unverified workflows found. All caught up!</p>'

html += '<p style="margin-top:30px;padding-top:15px;border-top:1px solid #eee;font-size:12px;color:#999;">Sent by Business OS Nightly Testing &mdash; Full Coverage Protocol<br>Run <code>/test-results</code> in Claude Code for detailed results.</p>'
html += '</body></html>'

payload = {
    'personalizations': [{'to': [{'email': email_to}]}],
    'from': {'email': email_from, 'name': email_from_name},
    'subject': subject,
    'content': [{'type': 'text/html', 'value': html}]
}
print(json.dumps(payload))
PYEOF
)

  local HTTP_STATUS
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "https://api.sendgrid.com/v3/mail/send" \
    -H "Authorization: Bearer ${SENDGRID_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$SENDGRID_PAYLOAD" 2>/dev/null)

  if [ "$HTTP_STATUS" = "202" ] || [ "$HTTP_STATUS" = "200" ]; then
    log "${GREEN}Email sent successfully to $EMAIL_TO${NC}"
  else
    log "${RED}Email failed (HTTP $HTTP_STATUS)${NC}"
    log "Check SENDGRID_API_KEY in .env.local"
  fi
}

# ============================================
# Main
# ============================================

# Create results directory
mkdir -p "$RESULTS_DIR"

# Init log
touch "$LOG_FILE"

header "NIGHTLY FULL COVERAGE TESTING"
log "Date: $DATE"
log "Results: $RESULTS_DIR"

# Check environment
check_env

# Determine batch size
BATCH_SIZE=$DEFAULT_BATCH_SIZE
if [ "$1" = "--all" ]; then
  BATCH_SIZE=50
  log "Mode: Testing ALL unverified workflows"
elif [ -n "$1" ] && [ "$1" -eq "$1" ] 2>/dev/null; then
  BATCH_SIZE=$1
  log "Mode: Testing $BATCH_SIZE workflows"
else
  log "Mode: Testing $BATCH_SIZE workflows (default)"
fi

log "Timeout: ${WORKFLOW_TIMEOUT}s per workflow (15 min — full coverage)"
log "Protocol: /test-workflow-auto (analyze → seed data → execute all paths → coverage → fix → learn)"

# Get workflows from Supabase
log ""
log "Fetching unverified workflows from registry..."

WORKFLOWS_JSON=$(get_workflows_to_test $BATCH_SIZE)

if [ -z "$WORKFLOWS_JSON" ] || [ "$WORKFLOWS_JSON" = "[]" ]; then
  log "${GREEN}No workflows need testing! All caught up.${NC}"

  cat > "$RESULTS_DIR/SUMMARY.md" << EOF
# Nightly Full Coverage Test Results

**Date:** $DATE

## Status

All workflows are already verified!

No unverified workflows found in the registry.
EOF

  # Still send email to confirm all clear
  echo "[]" > "$RESULTS_JSON_FILE"
  send_email_summary

  exit 0
fi

# Parse JSON and test each workflow
WORKFLOW_COUNT=$(echo "$WORKFLOWS_JSON" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null || echo "0")

log "Found $WORKFLOW_COUNT unverified workflows to test"
log ""

# Extract workflow IDs and names, then test each
echo "$WORKFLOWS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for w in data:
    print(w.get('workflow_id', '') + '\t' + w.get('workflow_name', 'Unknown'))
" 2>/dev/null | while IFS=$'\t' read -r WF_ID WF_NAME; do
  if [ -n "$WF_ID" ]; then
    test_workflow "$WF_ID" "$WF_NAME"

    # Pause between tests to avoid rate limiting
    log "Pausing 10s before next workflow..."
    sleep 10
  fi
done

# Generate markdown summary
generate_summary

# Send email summary
send_email_summary

header "TESTING COMPLETE"
log ""
log "Results saved to: $RESULTS_DIR/SUMMARY.md"
log "Email sent to: $EMAIL_TO"
log ""
log "View detailed results with: /test-results"
