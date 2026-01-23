#!/bin/bash
#
# GSD-Supabase Integration Script
# Updates project status in Supabase for the dev-dashboard
#
# Usage:
#   gsd-supabase.sh register <project_key> <project_name> <project_path>
#   gsd-supabase.sh status <project_key> <status> [description]
#   gsd-supabase.sh phase <project_key> <current_phase> <total_phases>
#   gsd-supabase.sh decision <project_key> <decision_type> <decision_text>
#   gsd-supabase.sh resolve-decisions <project_key>
#   gsd-supabase.sh notify <title> <message> [sound]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load environment variables if .env exists
if [ -f "$SCRIPT_DIR/../.env" ]; then
  source "$SCRIPT_DIR/../.env"
fi

# Supabase connection (from environment)
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

# Check required env vars for Supabase operations
check_supabase_env() {
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Supabase operations will be skipped."
    return 1
  fi
  return 0
}

# Register a new project in Supabase
register_project() {
  local project_key="$1"
  local project_name="$2"
  local project_path="$3"

  if ! check_supabase_env; then
    echo "Skipping Supabase registration (env not configured)"
    return 0
  fi

  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/register_dev_project" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"p_project_key\": \"${project_key}\",
      \"p_project_name\": \"${project_name}\",
      \"p_project_path\": \"${project_path}\"
    }" > /dev/null 2>&1 || true

  echo "Registered project: ${project_key}"
}

# Update project status
update_status() {
  local project_key="$1"
  local status="$2"
  local description="${3:-}"

  if ! check_supabase_env; then
    return 0
  fi

  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/update_dev_project_status" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"p_project_key\": \"${project_key}\",
      \"p_status\": \"${status}\",
      \"p_description\": \"${description}\"
    }" > /dev/null 2>&1 || true
}

# Update phase progress
update_phase() {
  local project_key="$1"
  local current_phase="$2"
  local total_phases="$3"

  if ! check_supabase_env; then
    return 0
  fi

  curl -s -X PATCH \
    "${SUPABASE_URL}/rest/v1/dev_projects?project_key=eq.${project_key}" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{
      \"current_phase\": ${current_phase},
      \"total_phases\": ${total_phases},
      \"last_activity_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }" > /dev/null 2>&1 || true
}

# Add a pending decision
add_decision() {
  local project_key="$1"
  local decision_type="$2"
  local question="$3"

  if ! check_supabase_env; then
    return 0
  fi

  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/add_pending_decision" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"p_project_key\": \"${project_key}\",
      \"p_decision_type\": \"${decision_type}\",
      \"p_question\": \"${question}\",
      \"p_options\": [],
      \"p_context\": null
    }" > /dev/null 2>&1 || true
}

# Clear all pending decisions (reset status to idle)
resolve_decisions() {
  local project_key="$1"

  if ! check_supabase_env; then
    return 0
  fi

  # Clear pending decisions array and reset status
  curl -s -X PATCH \
    "${SUPABASE_URL}/rest/v1/dev_projects?project_key=eq.${project_key}" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{
      \"pending_decisions\": [],
      \"status\": \"idle\",
      \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }" > /dev/null 2>&1 || true
}

# Send macOS notification
send_notification() {
  local title="$1"
  local message="$2"
  local sound="${3:-}"

  if [ "$(uname)" != "Darwin" ]; then
    echo "Notifications only supported on macOS"
    return 0
  fi

  # Prefer terminal-notifier if available (more reliable)
  if command -v terminal-notifier &> /dev/null; then
    if [ -n "$sound" ]; then
      terminal-notifier -title "$title" -message "$message" -sound "$sound"
    else
      terminal-notifier -title "$title" -message "$message"
    fi
  else
    # Fall back to osascript
    if [ -n "$sound" ]; then
      osascript -e "display notification \"${message}\" with title \"${title}\" sound name \"${sound}\""
    else
      osascript -e "display notification \"${message}\" with title \"${title}\""
    fi
  fi
}

# Main dispatch
case "${1:-}" in
  register)
    register_project "$2" "$3" "$4"
    ;;
  status)
    update_status "$2" "$3" "${4:-}"
    ;;
  phase)
    update_phase "$2" "$3" "$4"
    ;;
  decision)
    add_decision "$2" "$3" "$4"
    ;;
  resolve-decisions)
    resolve_decisions "$2"
    ;;
  notify)
    send_notification "$2" "$3" "${4:-}"
    ;;
  *)
    echo "Usage: gsd-supabase.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  register <project_key> <project_name> <project_path>"
    echo "  status <project_key> <status> [description]"
    echo "  phase <project_key> <current_phase> <total_phases>"
    echo "  decision <project_key> <decision_type> <decision_text>"
    echo "  resolve-decisions <project_key>"
    echo "  notify <title> <message> [sound]"
    exit 1
    ;;
esac
